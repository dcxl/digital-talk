import { randomUUID } from "node:crypto";
import WebSocket, { type RawData } from "ws";
import type { TTSInput, TTSProvider } from "@/core/providers/types";
import { readTTSCache, writeTTSCache } from "@/services/tts-cache/storage";

const DEFAULT_ENDPOINT = "wss://dashscope.aliyuncs.com/api-ws/v1/inference";
const DEFAULT_SAMPLE_RATE = 22050;

export interface BailianCosyVoiceTTSProviderOptions {
  apiKey: string;
  defaultFormat?: "mp3" | "wav";
  endpoint?: string;
  model: string;
  name?: string;
  sampleRate?: number;
  voice?: string;
}

interface CosyVoiceTaskHeader {
  action?: string;
  error_code?: string;
  error_message?: string;
  event?: string;
  streaming?: "duplex" | "out";
  task_id?: string;
}

interface CosyVoiceTaskMessage {
  header?: CosyVoiceTaskHeader;
  payload?: {
    output?: {
      audio?: string;
      audio_data?: string;
      error_message?: string;
      message?: string;
    };
  };
}

interface BuildTaskInput {
  format: "mp3" | "wav";
  model: string;
  sampleRate: number;
  taskId: string;
  text?: string;
  voice: string;
}

function getEndpoint(endpoint?: string) {
  return endpoint?.trim() || DEFAULT_ENDPOINT;
}

function getMimeType(format: "mp3" | "wav") {
  return format === "mp3" ? "audio/mpeg" : "audio/wav";
}

function estimateDurationMs(text: string) {
  return Math.min(60_000, Math.max(650, text.length * 95));
}

function toBuffer(data: RawData) {
  if (Buffer.isBuffer(data)) return data;
  if (Array.isArray(data)) return Buffer.concat(data);
  return Buffer.from(data);
}

function parseTaskMessage(data: RawData) {
  try {
    return JSON.parse(toBuffer(data).toString("utf8")) as CosyVoiceTaskMessage;
  } catch {
    return null;
  }
}

function createTaskHeader(
  action: "continue-task" | "finish-task" | "run-task",
  taskId: string,
) {
  return {
    action,
    streaming: "duplex",
    task_id: taskId,
  };
}

export function createCosyVoiceStartMessage(input: BuildTaskInput) {
  return {
    header: createTaskHeader("run-task", input.taskId),
    payload: {
      task_group: "audio",
      task: "tts",
      function: "SpeechSynthesizer",
      model: input.model,
      parameters: {
        text_type: "PlainText",
        voice: input.voice,
        format: input.format,
        sample_rate: input.sampleRate,
      },
      input: {},
    },
  };
}

export function createCosyVoiceContinueMessage(input: BuildTaskInput) {
  return {
    header: createTaskHeader("continue-task", input.taskId),
    payload: {
      input: {
        text: input.text ?? "",
      },
    },
  };
}

export function createCosyVoiceFinishMessage(taskId: string) {
  return {
    header: createTaskHeader("finish-task", taskId),
    payload: {
      input: {},
    },
  };
}

function sendJson(socket: WebSocket, value: unknown) {
  socket.send(JSON.stringify(value));
}

function getPayloadAudio(message: CosyVoiceTaskMessage) {
  const audio =
    message.payload?.output?.audio ?? message.payload?.output?.audio_data;
  return typeof audio === "string" && audio
    ? Buffer.from(audio, "base64")
    : null;
}

function getTaskErrorMessage(message: CosyVoiceTaskMessage) {
  return (
    message.header?.error_message ??
    message.payload?.output?.error_message ??
    message.payload?.output?.message ??
    message.header?.error_code ??
    "CosyVoice task failed"
  );
}

function synthesizeViaWebSocket(input: {
  apiKey: string;
  endpoint?: string;
  format: "mp3" | "wav";
  model: string;
  sampleRate: number;
  signal?: AbortSignal;
  text: string;
  voice: string;
}) {
  return new Promise<Buffer>((resolve, reject) => {
    const taskId = randomUUID();
    const audioChunks: Buffer[] = [];
    let settled = false;
    let textSent = false;

    const socket = new WebSocket(getEndpoint(input.endpoint), {
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "X-DashScope-DataInspection": "enable",
      },
    });

    function settle(error?: Error) {
      if (settled) return;
      settled = true;
      input.signal?.removeEventListener("abort", onAbort);
      socket.removeAllListeners();
      if (
        socket.readyState === WebSocket.CONNECTING ||
        socket.readyState === WebSocket.OPEN
      ) {
        socket.close();
      }

      if (error) {
        reject(error);
        return;
      }

      if (audioChunks.length === 0) {
        reject(new Error("CosyVoice returned empty audio"));
        return;
      }

      resolve(Buffer.concat(audioChunks));
    }

    function onAbort() {
      settle(new Error("TTS request aborted"));
    }

    function sendTextAndFinish() {
      if (textSent) return;
      textSent = true;
      const taskInput = {
        format: input.format,
        model: input.model,
        sampleRate: input.sampleRate,
        taskId,
        text: input.text,
        voice: input.voice,
      };
      sendJson(socket, createCosyVoiceContinueMessage(taskInput));
      sendJson(socket, createCosyVoiceFinishMessage(taskId));
    }

    if (input.signal?.aborted) {
      settle(new Error("TTS request aborted"));
      return;
    }

    input.signal?.addEventListener("abort", onAbort, { once: true });

    socket.on("open", () => {
      sendJson(
        socket,
        createCosyVoiceStartMessage({
          format: input.format,
          model: input.model,
          sampleRate: input.sampleRate,
          taskId,
          voice: input.voice,
        }),
      );
    });

    socket.on("message", (data, isBinary) => {
      if (isBinary) {
        audioChunks.push(toBuffer(data));
        return;
      }

      const message = parseTaskMessage(data);
      if (!message) return;

      const payloadAudio = getPayloadAudio(message);
      if (payloadAudio) audioChunks.push(payloadAudio);

      const event = message.header?.event;
      if (event === "task-started") {
        sendTextAndFinish();
        return;
      }

      if (event === "task-finished") {
        settle();
        return;
      }

      if (event === "task-failed") {
        settle(new Error(getTaskErrorMessage(message)));
      }
    });

    socket.on("error", (error) => {
      settle(
        error instanceof Error ? error : new Error("CosyVoice socket error"),
      );
    });

    socket.on("unexpected-response", (_request, response) => {
      settle(new Error(`CosyVoice handshake failed: ${response.statusCode}`));
    });

    socket.on("close", () => {
      if (!settled)
        settle(new Error("CosyVoice socket closed before task finished"));
    });
  });
}

export function createBailianCosyVoiceTTSProvider(
  options: BailianCosyVoiceTTSProviderOptions,
): TTSProvider {
  return {
    id: "bailian-cosyvoice-tts",
    name: options.name ?? "Bailian CosyVoice TTS Provider",
    capability: "tts",
    health: "ready",

    async synthesize(input: TTSInput) {
      const format = input.format ?? options.defaultFormat ?? "mp3";
      const voice = input.voice ?? options.voice;
      const sampleRate = options.sampleRate ?? DEFAULT_SAMPLE_RATE;

      if (!voice) throw new Error("voice is required");

      const cacheKey = {
        format,
        model: options.model,
        provider: "bailian-cosyvoice",
        sampleRate,
        text: input.text,
        voice,
      };
      const cached = await readTTSCache(cacheKey);
      if (cached) {
        return {
          audioUrl: `data:${cached.mimeType};base64,${cached.audio.toString("base64")}`,
          durationMs: cached.durationMs,
          mimeType: cached.mimeType,
          marks: [],
        };
      }

      const audio = await synthesizeViaWebSocket({
        apiKey: options.apiKey,
        endpoint: options.endpoint,
        format,
        model: options.model,
        sampleRate,
        signal: input.signal,
        text: input.text,
        voice,
      });
      const mimeType = getMimeType(format);
      const durationMs = estimateDurationMs(input.text);

      await writeTTSCache({
        ...cacheKey,
        audio,
        durationMs,
        mimeType,
      }).catch(() => undefined);

      return {
        audioUrl: `data:${mimeType};base64,${audio.toString("base64")}`,
        durationMs,
        mimeType,
        marks: [],
      };
    },
  };
}
