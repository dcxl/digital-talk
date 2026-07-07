import type { TTSProvider } from "@/core/providers/types";
import { getTTSProvider } from "@/providers/tts";
import { createBailianCosyVoiceTTSProvider } from "@/providers/tts/bailian-cosyvoice-tts-provider";
import { mockTTSProvider } from "@/providers/tts/mock-tts-provider";
import { createOpenAICompatibleTTSProvider } from "@/providers/tts/openai-compatible-tts-provider";

export interface TestTTSProviderInput {
  apiKey?: string;
  baseUrl?: string;
  format?: "mp3" | "wav";
  model?: string;
  name?: string;
  provider?: string;
  text?: string;
  voice?: string;
}

function isOpenAICompatible(provider?: string) {
  return (
    provider === "openai" ||
    provider === "openai-compatible" ||
    provider === "custom" ||
    provider === "custom-http"
  );
}

function isBailianCosyVoice(provider?: string) {
  return (
    provider === "bailian-cosyvoice" ||
    provider === "dashscope-cosyvoice" ||
    provider === "aliyun-cosyvoice" ||
    provider === "cosyvoice"
  );
}

async function createTestProvider(
  input: TestTTSProviderInput,
): Promise<TTSProvider> {
  if (!input.provider && !input.apiKey && !input.baseUrl && !input.model) {
    return getTTSProvider();
  }

  if (input.provider === "mock" || input.provider === "local") {
    return mockTTSProvider;
  }

  if (isBailianCosyVoice(input.provider)) {
    if (!input.apiKey || !input.model || !input.voice) {
      throw new Error("apiKey, model and voice are required for CosyVoice TTS");
    }

    return createBailianCosyVoiceTTSProvider({
      apiKey: input.apiKey,
      cache: false,
      defaultFormat: input.format ?? "mp3",
      endpoint: input.baseUrl,
      model: input.model,
      name: input.name ?? "Bailian CosyVoice TTS Provider Test",
      voice: input.voice,
    });
  }

  if (isOpenAICompatible(input.provider)) {
    if (!input.apiKey || !input.baseUrl || !input.model || !input.voice) {
      throw new Error("baseUrl, apiKey, model and voice are required");
    }

    return createOpenAICompatibleTTSProvider({
      apiKey: input.apiKey,
      baseUrl: input.baseUrl,
      defaultFormat: input.format ?? "mp3",
      model: input.model,
      name: input.name ?? "TTS Provider Test",
      voice: input.voice,
    });
  }

  throw new Error("Unsupported TTS provider");
}

export async function testTTSProvider(input: TestTTSProviderInput) {
  const provider = await createTestProvider(input);
  const startedAt = Date.now();
  const result = await provider.synthesize({
    format: input.format,
    text: input.text ?? "TTS provider test ok",
    voice: input.voice,
    signal: AbortSignal.timeout(20_000),
  });

  return {
    audioUrl: result.audioUrl,
    durationMs: result.durationMs,
    latencyMs: Date.now() - startedAt,
    mimeType: result.mimeType,
    providerId: provider.id,
    providerName: provider.name,
    success: Boolean(result.audioUrl),
  };
}
