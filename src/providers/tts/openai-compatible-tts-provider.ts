import type { TTSInput, TTSProvider } from "@/core/providers/types";

export interface OpenAICompatibleTTSProviderOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
  defaultFormat?: "mp3" | "wav";
  name?: string;
  voice?: string;
}

interface ProviderErrorPayload {
  error?: {
    message?: string;
  };
}

function speechUrl(baseUrl: string) {
  const normalized = baseUrl.replace(/\/+$/, "");
  if (normalized.endsWith("/audio/speech")) return normalized;
  return `${normalized}/audio/speech`;
}

function getMimeType(format: "mp3" | "wav") {
  return format === "mp3" ? "audio/mpeg" : "audio/wav";
}

function estimateDurationMs(text: string) {
  return Math.min(60_000, Math.max(650, text.length * 95));
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

export function createOpenAICompatibleTTSProvider(
  options: OpenAICompatibleTTSProviderOptions,
): TTSProvider {
  return {
    id: "openai-compatible-tts",
    name: options.name ?? "OpenAI-compatible TTS Provider",
    capability: "tts",
    health: "ready",

    async synthesize(input: TTSInput) {
      const format = input.format ?? options.defaultFormat ?? "mp3";
      const voice = input.voice ?? options.voice;

      if (!voice) throw new Error("voice is required");

      const response = await fetch(speechUrl(options.baseUrl), {
        body: JSON.stringify({
          input: input.text,
          model: options.model,
          response_format: format,
          voice,
        }),
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: input.signal,
      });

      if (!response.ok) {
        throw new Error(await readProviderError(response));
      }

      const audio = await response.arrayBuffer();
      const mimeType = getMimeType(format);
      const base64 = Buffer.from(audio).toString("base64");

      return {
        audioUrl: `data:${mimeType};base64,${base64}`,
        durationMs: estimateDurationMs(input.text),
        mimeType,
        marks: [],
      };
    },
  };
}
