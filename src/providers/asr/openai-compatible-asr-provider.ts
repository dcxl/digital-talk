import type {
  ASRInput,
  ASRResult,
  StreamingASRInput,
  StreamingASRProvider,
} from "@/core/providers/types";

export interface OpenAICompatibleASRProviderOptions {
  apiKey: string;
  baseUrl: string;
  defaultLanguage?: string;
  model: string;
  name?: string;
}

interface ProviderErrorPayload {
  error?: {
    message?: string;
  };
}

interface TranscriptionPayload {
  duration?: number;
  language?: string;
  segments?: Array<{
    end?: number;
    start?: number;
    text?: string;
  }>;
  text?: string;
}

function transcriptionsUrl(baseUrl: string) {
  const normalized = baseUrl.replace(/\/+$/, "");
  if (normalized.endsWith("/audio/transcriptions")) return normalized;
  return `${normalized}/audio/transcriptions`;
}

function getFilename(mimeType?: string) {
  if (mimeType?.includes("wav")) return "recording.wav";
  if (mimeType?.includes("mpeg") || mimeType?.includes("mp3")) {
    return "recording.mp3";
  }
  return "recording.webm";
}

async function readProviderError(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) return `Provider request failed: ${response.status}`;

  try {
    const payload = JSON.parse(text) as ProviderErrorPayload;
    return payload.error?.message ?? text;
  } catch {
    return text;
  }
}

function parseTranscriptionPayload(payload: TranscriptionPayload): ASRResult {
  const text = payload.text ?? "";
  const durationMs =
    typeof payload.duration === "number"
      ? Math.max(0, Math.round(payload.duration * 1000))
      : Math.max(300, text.length * 120);
  const segments =
    payload.segments
      ?.filter((segment) => segment.text)
      .map((segment) => ({
        endMs:
          typeof segment.end === "number"
            ? Math.max(0, Math.round(segment.end * 1000))
            : durationMs,
        startMs:
          typeof segment.start === "number"
            ? Math.max(0, Math.round(segment.start * 1000))
            : 0,
        text: segment.text ?? "",
      })) ?? [];

  return {
    durationMs,
    language: payload.language,
    segments: segments.length
      ? segments
      : [
          {
            endMs: durationMs,
            startMs: 0,
            text,
          },
        ],
    text,
  };
}

async function collectStreamingAudio(input: StreamingASRInput) {
  const chunks: Blob[] = [];
  let mimeType: string | undefined;

  for await (const chunk of input.chunks) {
    if (input.signal?.aborted) throw new Error("aborted");
    chunks.push(chunk.audio);
    mimeType = mimeType ?? chunk.mimeType ?? chunk.audio.type;
  }

  return new Blob(chunks, { type: mimeType || "audio/webm" });
}

export function createOpenAICompatibleASRProvider(
  options: OpenAICompatibleASRProviderOptions,
): StreamingASRProvider {
  async function transcribe(input: ASRInput) {
    const formData = new FormData();
    formData.append("file", input.audio, getFilename(input.audio.type));
    formData.append("model", options.model);
    formData.append("response_format", "verbose_json");

    const language = input.language ?? options.defaultLanguage;
    if (language) formData.append("language", language);

    const response = await fetch(transcriptionsUrl(options.baseUrl), {
      body: formData,
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
      },
      method: "POST",
      signal: input.signal,
    });

    if (!response.ok) {
      throw new Error(await readProviderError(response));
    }

    const payload = (await response.json()) as TranscriptionPayload;
    return parseTranscriptionPayload({
      ...payload,
      language: payload.language ?? language,
    });
  }

  return {
    id: "openai-compatible-asr",
    name: options.name ?? "OpenAI-compatible ASR Provider",
    capability: "asr",
    health: "ready",

    async transcribe(input) {
      return transcribe(input);
    },

    async *stream(input) {
      const audio = await collectStreamingAudio(input);
      const result = await transcribe({
        audio,
        language: input.language,
        signal: input.signal,
      });

      yield {
        type: "final",
        durationMs: result.durationMs,
        language: result.language,
        segments: result.segments,
        text: result.text,
      };
    },
  };
}
