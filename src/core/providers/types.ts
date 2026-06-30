export type ProviderCapability = "llm" | "tts" | "avatar" | "asr";

export type ProviderHealth = "unknown" | "ready" | "degraded" | "down";

export interface ProviderDescriptor {
  id: string;
  name: string;
  capability: ProviderCapability;
  version?: string;
  health?: ProviderHealth;
}

export type LLMRole = "system" | "user" | "assistant" | "tool";

export interface LLMMessage {
  role: LLMRole;
  content: string;
}

export interface LLMChatInput {
  messages: LLMMessage[];
  conversationId?: string;
  userId?: string;
  signal?: AbortSignal;
  metadata?: Record<string, boolean | number | string>;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export type LLMChatChunk =
  | {
      type: "text.delta";
      text: string;
    }
  | {
      type: "usage";
      usage: TokenUsage;
    }
  | {
      type: "done";
      finishReason: "stop" | "length" | "tool_call" | "error";
    };

export interface LLMProvider extends ProviderDescriptor {
  capability: "llm";
  chat(input: LLMChatInput): AsyncIterable<LLMChatChunk>;
}
