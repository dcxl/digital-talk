import type { ASRProvider, StreamingASRProvider } from "@/core/providers/types";
import { listProviderConfigs } from "@/services/conversations/repository";
import { isDatabaseConfigured } from "@/services/database/prisma";
import { decryptSecret } from "@/services/security/secret-crypto";
import { mockASRProvider } from "./mock-asr-provider";
import { createOpenAICompatibleASRProvider } from "./openai-compatible-asr-provider";

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

function getStringOption(options: unknown, key: string) {
  if (!options || typeof options !== "object") return undefined;

  const value = (options as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function createEnvASRProvider(): StreamingASRProvider {
  const provider = env("ASR_PROVIDER") ?? "mock";
  if (provider === "mock" || provider === "local") return mockASRProvider;

  if (isOpenAICompatible(provider)) {
    const apiKey = env("DEFAULT_ASR_API_KEY");
    const baseUrl = env("DEFAULT_ASR_BASE_URL");
    const model = env("DEFAULT_ASR_MODEL");

    if (!apiKey || !baseUrl || !model) {
      throw new Error(
        "Missing DEFAULT_ASR_BASE_URL, DEFAULT_ASR_API_KEY or DEFAULT_ASR_MODEL",
      );
    }

    return createOpenAICompatibleASRProvider({
      apiKey,
      baseUrl,
      defaultLanguage: env("DEFAULT_ASR_LANGUAGE"),
      model,
    });
  }

  return mockASRProvider;
}

export async function getASRProvider(): Promise<ASRProvider> {
  return getStreamingASRProvider();
}

export async function getStreamingASRProvider(): Promise<StreamingASRProvider> {
  if (!isDatabaseConfigured()) return createEnvASRProvider();

  const [provider] = await listProviderConfigs({
    enabled: true,
    type: "asr",
  }).catch(() => []);

  if (!provider) return createEnvASRProvider();
  if (provider.provider === "mock" || provider.provider === "local") {
    return mockASRProvider;
  }

  if (isOpenAICompatible(provider.provider)) {
    const apiKey = provider.apiKeyEncrypted
      ? decryptSecret(provider.apiKeyEncrypted)
      : undefined;

    if (!apiKey || !provider.baseUrl || !provider.model) {
      throw new Error("baseUrl, apiKey and model are required for ASR");
    }

    return createOpenAICompatibleASRProvider({
      apiKey,
      baseUrl: provider.baseUrl,
      defaultLanguage:
        getStringOption(provider.options, "language") ??
        env("DEFAULT_ASR_LANGUAGE"),
      model: provider.model,
      name: provider.name,
    });
  }

  return createEnvASRProvider();
}
