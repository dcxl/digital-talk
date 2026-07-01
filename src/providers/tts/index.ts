import type { TTSProvider } from "@/core/providers/types";
import { listProviderConfigs } from "@/services/conversations/repository";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { decryptSecret } from "@/services/security/secret-crypto";
import { mockTTSProvider } from "./mock-tts-provider";
import { createOpenAICompatibleTTSProvider } from "./openai-compatible-tts-provider";

function env(name: string) {
  return process.env[name]?.trim() || undefined;
}

function isOpenAICompatible(provider?: string) {
  return (
    provider === "openai" ||
    provider === "openai-compatible" ||
    provider === "custom" ||
    provider === "custom-http"
  );
}

function createEnvTTSProvider(): TTSProvider {
  const provider = env("TTS_PROVIDER") ?? "mock";
  if (provider === "mock" || provider === "local") return mockTTSProvider;

  if (isOpenAICompatible(provider)) {
    const apiKey = env("DEFAULT_TTS_API_KEY");
    const baseUrl = env("DEFAULT_TTS_BASE_URL");
    const model = env("DEFAULT_TTS_MODEL");
    const voice = env("DEFAULT_TTS_VOICE");
    const format = env("DEFAULT_TTS_FORMAT");

    if (!apiKey || !baseUrl || !model || !voice) {
      throw new Error(
        "Missing DEFAULT_TTS_BASE_URL, DEFAULT_TTS_API_KEY, DEFAULT_TTS_MODEL or DEFAULT_TTS_VOICE",
      );
    }

    return createOpenAICompatibleTTSProvider({
      apiKey,
      baseUrl,
      defaultFormat: format === "wav" ? "wav" : "mp3",
      model,
      voice,
    });
  }

  return mockTTSProvider;
}

function getStringOption(options: unknown, key: string) {
  if (!options || typeof options !== "object") return undefined;

  const value = (options as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function getTTSProvider(): Promise<TTSProvider> {
  if (!isDatabaseConfigured()) return createEnvTTSProvider();

  const [provider] = await listProviderConfigs({
    enabled: true,
    type: "tts",
  });

  if (!provider) return createEnvTTSProvider();
  if (provider.provider === "mock" || provider.provider === "local") {
    return mockTTSProvider;
  }

  if (isOpenAICompatible(provider.provider)) {
    const apiKey = provider.apiKeyEncrypted
      ? decryptSecret(provider.apiKeyEncrypted)
      : undefined;
    const voice = getStringOption(provider.options, "voice") ?? env("DEFAULT_TTS_VOICE");
    const format = getStringOption(provider.options, "format") ?? env("DEFAULT_TTS_FORMAT");

    if (!apiKey || !provider.baseUrl || !provider.model || !voice) {
      throw new Error("baseUrl, apiKey, model and voice are required for TTS");
    }

    return createOpenAICompatibleTTSProvider({
      apiKey,
      baseUrl: provider.baseUrl,
      defaultFormat: format === "wav" ? "wav" : "mp3",
      model: provider.model,
      name: provider.name,
      voice,
    });
  }

  return createEnvTTSProvider();
}
