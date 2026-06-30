import type {
  LLMChatChunk,
  LLMChatInput,
  LLMProvider,
} from "@/core/providers/types";

export interface OpenAICompatibleProviderOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
  name?: string;
}

interface OpenAIStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
    finish_reason?: string | null;
  }>;
  error?: {
    message?: string;
  };
  usage?: {
    completion_tokens?: number;
    prompt_tokens?: number;
    total_tokens?: number;
  };
}

function chatCompletionsUrl(baseUrl: string) {
  const normalized = baseUrl.replace(/\/+$/, "");
  if (normalized.endsWith("/chat/completions")) return normalized;
  return `${normalized}/chat/completions`;
}

function normalizeFinishReason(
  reason?: string | null,
): Extract<LLMChatChunk, { type: "done" }>["finishReason"] {
  if (
    reason === "length" ||
    reason === "tool_call" ||
    reason === "tool_calls" ||
    reason === "error"
  ) {
    return reason;
  }

  return "stop";
}

function parseSSEData(block: string) {
  return block
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");
}

async function* readOpenAIStream(
  response: Response,
): AsyncIterable<LLMChatChunk> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Provider response body is empty");

  const decoder = new TextDecoder();
  let buffer = "";
  let doneSent = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    buffer = buffer.replaceAll("\r\n", "\n");

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const data = parseSSEData(block);
      if (!data) continue;

      if (data === "[DONE]") {
        if (!doneSent) {
          doneSent = true;
          yield { type: "done", finishReason: "stop" };
        }
        continue;
      }

      const chunk = JSON.parse(data) as OpenAIStreamChunk;
      if (chunk.error?.message) throw new Error(chunk.error.message);

      const text =
        chunk.choices
          ?.map((choice) => choice.delta?.content ?? "")
          .join("") ?? "";

      if (text) {
        yield {
          type: "text.delta",
          text,
        };
      }

      if (chunk.usage) {
        yield {
          type: "usage",
          usage: {
            completionTokens: chunk.usage.completion_tokens ?? 0,
            promptTokens: chunk.usage.prompt_tokens ?? 0,
            totalTokens: chunk.usage.total_tokens ?? 0,
          },
        };
      }

      const finishReason = chunk.choices?.find(
        (choice) => choice.finish_reason,
      )?.finish_reason;
      if (finishReason && !doneSent) {
        doneSent = true;
        yield {
          type: "done",
          finishReason: normalizeFinishReason(finishReason),
        };
      }
    }
  }

  if (!doneSent) {
    yield {
      type: "done",
      finishReason: "stop",
    };
  }
}

export function createOpenAICompatibleProvider(
  options: OpenAICompatibleProviderOptions,
): LLMProvider {
  return {
    id: "openai-compatible",
    name: options.name ?? "OpenAI-compatible Provider",
    capability: "llm",
    health: "ready",

    async *chat(input: LLMChatInput) {
      const response = await fetch(chatCompletionsUrl(options.baseUrl), {
        body: JSON.stringify({
          messages: input.messages,
          model: options.model,
          stream: true,
        }),
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: input.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `Provider request failed: ${response.status} ${errorText}`.trim(),
        );
      }

      yield* readOpenAIStream(response);
    },
  };
}
