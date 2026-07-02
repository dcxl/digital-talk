import { randomUUID } from "node:crypto";
import WebSocket, { type RawData } from "ws";
import type {
  ASRChunk,
  ASRInput,
  ASRResult,
  ASRSegment,
  StreamingASRProvider,
} from "@/core/providers/types";

const DEFAULT_ENDPOINT = "wss://dashscope.aliyuncs.com/api-ws/v1/inference";
const DEFAULT_SAMPLE_RATE = 16000;
const SEND_FRAME_BYTES = 3200;
const SEND_FRAME_DELAY_MS = 100;

export interface BailianRealtimeASRProviderOptions {
  apiKey: string;
  defaultFormat?: string;
  defaultLanguage?: string;
  endpoint?: string;
  model: string;
  name?: string;
  sampleRate?: number;
}

interface BailianRealtimeASRMessage {
  header?: {
    error_code?: string;
    error_message?: string;
    event?: string;
    task_id?: string;
  };
  payload?: {
    output?: {
      sentence?: {
        begin_time?: number;
        end_time?: number;
        text?: string;
      };
    };
    usage?: {
      duration?: number;
    };
  };
}

interface BuildTaskInput {
  format: string;
  model: string;
  sampleRate: number;
  taskId: string;
}

function getEndpoint(endpoint?: string) {
  return endpoint?.trim() || DEFAULT_ENDPOINT;
}

function getTaskHeader(
  action: "finish-task" | "run-task",
  taskId: string,
) {
  return {
    action,
    streaming: "duplex",
    task_id: taskId,
  };
}

export function createBailianASRStartMessage(input: BuildTaskInput) {
  return {
    header: getTaskHeader("run-task", input.taskId),
      payload: {
        task_group: "audio",
        task: "asr",
      function: "recognition",
        model: input.model,
      parameters: {
        format: input.format,
        sample_rate: input.sampleRate,
      },
      input: {},
    },
  };
}

export function createBailianASRFinishMessage(taskId: string) {
  return {
    header: getTaskHeader("finish-task", taskId),
    payload: {
      input: {},
    },
  };
}

function sendJson(socket: WebSocket, value: unknown) {
  socket.send(JSON.stringify(value));
}

function wait(ms: number, signal?: AbortSignal) {
  if (signal?.aborted) return Promise.reject(new Error("ASR request aborted"));

  return new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      globalThis.clearTimeout(timeout);
      reject(new Error("ASR request aborted"));
    };
    const timeout = globalThis.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function toBuffer(data: RawData) {
  if (Buffer.isBuffer(data)) return data;
  if (Array.isArray(data)) return Buffer.concat(data);
  return Buffer.from(data);
}

function parseMessage(data: RawData) {
  try {
    return JSON.parse(toBuffer(data).toString("utf8")) as BailianRealtimeASRMessage;
  } catch {
    return null;
  }
}

function getTaskErrorMessage(message: BailianRealtimeASRMessage) {
  return (
    message.header?.error_message ??
    message.header?.error_code ??
    "Bailian realtime ASR task failed"
  );
}

function normalizeSegment(message: BailianRealtimeASRMessage): ASRSegment | null {
  const sentence = message.payload?.output?.sentence;
  if (!sentence) return null;

  const text = sentence.text?.trim();
  if (!text) return null;

  return {
    endMs:
      typeof sentence.end_time === "number"
        ? Math.max(0, sentence.end_time)
        : Math.max(300, text.length * 120),
    startMs:
      typeof sentence.begin_time === "number"
        ? Math.max(0, sentence.begin_time)
        : 0,
    text,
  };
}

function getDurationMs(segments: ASRSegment[], usageDuration?: number) {
  if (typeof usageDuration === "number" && Number.isFinite(usageDuration)) {
    return Math.max(0, Math.round(usageDuration * 1000));
  }

  return segments.reduce((max, segment) => Math.max(max, segment.endMs), 0);
}

async function sendAudioBuffer(input: {
  audio: Buffer;
  signal?: AbortSignal;
  socket: WebSocket;
}) {
  for (let offset = 0; offset < input.audio.length; offset += SEND_FRAME_BYTES) {
    if (input.signal?.aborted) throw new Error("ASR request aborted");

    const frame = input.audio.subarray(offset, offset + SEND_FRAME_BYTES);
    input.socket.send(frame);
    await wait(SEND_FRAME_DELAY_MS, input.signal);
  }
}

function recognizeViaWebSocket(input: {
  apiKey: string;
  audio: Buffer;
  endpoint?: string;
  format: string;
  language?: string;
  model: string;
  sampleRate: number;
  signal?: AbortSignal;
}) {
  return new Promise<{ chunks: ASRChunk[]; result: ASRResult }>(
    (resolve, reject) => {
      const taskId = randomUUID();
      const chunks: ASRChunk[] = [];
      let lastSegment: ASRSegment | null = null;
      let sequence = 0;
      let settled = false;
      let usageDuration: number | undefined;

      const socket = new WebSocket(getEndpoint(input.endpoint), {
        headers: {
          Authorization: `bearer ${input.apiKey}`,
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

        const finalSegments = lastSegment ? [lastSegment] : [];

        const text = finalSegments.map((segment) => segment.text).join("");
        if (!text) {
          reject(new Error("Bailian realtime ASR returned empty transcript"));
          return;
        }

        const durationMs = getDurationMs(finalSegments, usageDuration);
        const result = {
          durationMs,
          language: input.language,
          segments: finalSegments,
          text,
        };
        chunks.push({
          durationMs,
          language: input.language,
          segments: finalSegments,
          text,
          type: "final",
        });
        resolve({ chunks, result });
      }

      function onAbort() {
        settle(new Error("ASR request aborted"));
      }

      if (input.signal?.aborted) {
        settle(new Error("ASR request aborted"));
        return;
      }

      input.signal?.addEventListener("abort", onAbort, { once: true });

      socket.on("open", () => {
        sendJson(
          socket,
          createBailianASRStartMessage({
            format: input.format,
            model: input.model,
            sampleRate: input.sampleRate,
            taskId,
          }),
        );
      });

      socket.on("message", (data, isBinary) => {
        if (isBinary) return;

        const message = parseMessage(data);
        if (!message) return;

        const event = message.header?.event;
        if (event === "task-started") {
          void sendAudioBuffer({
            audio: input.audio,
            signal: input.signal,
            socket,
          })
            .then(() => {
              sendJson(socket, createBailianASRFinishMessage(taskId));
            })
            .catch((error) => {
              settle(error instanceof Error ? error : new Error("ASR send failed"));
            });
          return;
        }

        if (event === "result-generated") {
          const segment = normalizeSegment(message);
          if (!segment) return;

          lastSegment = segment;
          sequence += 1;

          chunks.push({
            endMs: segment.endMs,
            sequence,
            startMs: segment.startMs,
            text: segment.text,
            type: "partial",
          });
          return;
        }

        if (event === "task-finished") {
          usageDuration = message.payload?.usage?.duration;
          settle();
          return;
        }

        if (event === "task-failed") {
          settle(new Error(getTaskErrorMessage(message)));
        }
      });

      socket.on("error", (error) => {
        settle(error instanceof Error ? error : new Error("ASR socket error"));
      });

      socket.on("unexpected-response", (_request, response) => {
        settle(new Error(`Bailian realtime ASR handshake failed: ${response.statusCode}`));
      });

      socket.on("close", () => {
        if (!settled) {
          settle(new Error("Bailian realtime ASR socket closed before task finished"));
        }
      });
    },
  );
}

async function audioToBuffer(audio: Blob) {
  return Buffer.from(await audio.arrayBuffer());
}

export function createBailianRealtimeASRProvider(
  options: BailianRealtimeASRProviderOptions,
): StreamingASRProvider {
  const format = options.defaultFormat ?? "wav";
  const sampleRate = options.sampleRate ?? DEFAULT_SAMPLE_RATE;

  return {
    id: "bailian-realtime-asr",
    name: options.name ?? "Bailian Realtime ASR Provider",
    capability: "asr",
    health: "ready",

    async transcribe(input: ASRInput) {
      const { result } = await recognizeViaWebSocket({
        apiKey: options.apiKey,
        audio: await audioToBuffer(input.audio),
        endpoint: options.endpoint,
        format,
        language: input.language ?? options.defaultLanguage,
        model: options.model,
        sampleRate,
        signal: input.signal,
      });

      return result;
    },

    async *stream(input) {
      const audioParts: Blob[] = [];
      let mimeType = "";

      for await (const chunk of input.chunks) {
        if (input.signal?.aborted) throw new Error("ASR request aborted");
        audioParts.push(chunk.audio);
        mimeType = mimeType || chunk.mimeType || chunk.audio.type;
      }

      const { chunks } = await recognizeViaWebSocket({
        apiKey: options.apiKey,
        audio: await audioToBuffer(new Blob(audioParts, { type: mimeType })),
        endpoint: options.endpoint,
        format,
        language: input.language ?? options.defaultLanguage,
        model: options.model,
        sampleRate,
        signal: input.signal,
      });

      for (const chunk of chunks) {
        yield chunk;
      }
    },
  };
}
