import type { LLMProvider } from "@/core/providers/types";
import { getLLMProvider } from "@/providers/llm";
import { mockLLMProvider } from "@/providers/llm/mock-llm-provider";
import { createOpenAICompatibleProvider } from "@/providers/llm/openai-compatible-provider";

export interface TestLLMProviderInput {
  apiKey?: string;
  baseUrl?: string;
  message?: string;
  model?: string;
  name?: string;
  provider?: string;
}

function createTestProvider(input: TestLLMProviderInput): LLMProvider {
  if (!input.provider && !input.apiKey && !input.baseUrl && !input.model) {
    return getLLMProvider();
  }

  if (input.provider === "mock") return mockLLMProvider;

  if (!input.apiKey || !input.baseUrl || !input.model) {
    throw new Error("baseUrl, apiKey and model are required");
  }

  return createOpenAICompatibleProvider({
    apiKey: input.apiKey,
    baseUrl: input.baseUrl,
    model: input.model,
    name: input.name ?? "Provider Test",
  });
}

export async function testLLMProvider(input: TestLLMProviderInput) {
  const provider = createTestProvider(input);
  const startedAt = Date.now();
  let text = "";

  for await (const chunk of provider.chat({
    messages: [
      {
        role: "user",
        content: input.message ?? "请用一句话回复：provider test ok",
      },
    ],
    signal: AbortSignal.timeout(15000),
  })) {
    if (chunk.type === "text.delta") {
      text += chunk.text;
      if (text.length >= 24) break;
    }
  }

  return {
    latencyMs: Date.now() - startedAt,
    providerId: provider.id,
    providerName: provider.name,
    sample: text,
    success: Boolean(text),
  };
}
