import type { LLMProvider } from "@/core/providers/types";
import { mockLLMProvider } from "./mock-llm-provider";
import { createOpenAICompatibleProvider } from "./openai-compatible-provider";

function env(name: string) {
  return process.env[name]?.trim() || undefined;
}

export function getLLMProvider(): LLMProvider {
  const provider = env("LLM_PROVIDER") ?? "mock";

  if (provider === "openai" || provider === "openai-compatible") {
    const apiKey = env("DEFAULT_LLM_API_KEY");
    const baseUrl = env("DEFAULT_LLM_BASE_URL");
    const model = env("DEFAULT_LLM_MODEL");

    if (!apiKey || !baseUrl || !model) {
      throw new Error(
        "Missing DEFAULT_LLM_BASE_URL, DEFAULT_LLM_API_KEY or DEFAULT_LLM_MODEL",
      );
    }

    return createOpenAICompatibleProvider({
      apiKey,
      baseUrl,
      model,
    });
  }

  return mockLLMProvider;
}
