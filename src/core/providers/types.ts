import type { RuntimeState } from "@/core/runtime/events";

export type ProviderCapability =
  | "llm"
  | "tts"
  | "avatar"
  | "asr"
  | "image-generation";

export type ProviderHealth = "unknown" | "ready" | "degraded" | "down";

export interface ProviderDescriptor {
  id: string;
  name: string;
  capability: ProviderCapability;
  version?: string;
  health?: ProviderHealth;
}

export interface ProviderError {
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
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
      finishReason: "stop" | "length" | "tool_call" | "tool_calls" | "error";
    };

export interface LLMProvider extends ProviderDescriptor {
  capability: "llm";
  chat(input: LLMChatInput): AsyncIterable<LLMChatChunk>;
}

export interface TTSInput {
  text: string;
  voice?: string;
  format?: "mp3" | "wav";
  signal?: AbortSignal;
}

export interface TTSResult {
  audioUrl: string;
  mimeType: string;
  durationMs: number;
  marks?: Array<{
    timeMs: number;
    value: string;
  }>;
}

export interface TTSProvider extends ProviderDescriptor {
  capability: "tts";
  synthesize(input: TTSInput): Promise<TTSResult>;
}

export interface AvatarStateInput {
  state: RuntimeState;
  reason?: string;
}

export interface AvatarStateResult {
  state: RuntimeState;
  updatedAt: string;
}

export interface AvatarProvider extends ProviderDescriptor {
  capability: "avatar";
  setState(input: AvatarStateInput): Promise<AvatarStateResult>;
}

export interface ASRInput {
  audio: Blob;
  language?: string;
  signal?: AbortSignal;
}

export interface ASRSegment {
  startMs: number;
  endMs: number;
  text: string;
}

export interface ASRResult {
  text: string;
  language?: string;
  durationMs?: number;
  segments: ASRSegment[];
}

export interface ASRProvider extends ProviderDescriptor {
  capability: "asr";
  transcribe(input: ASRInput): Promise<ASRResult>;
}

export interface ImageGenerationInput {
  height?: number;
  negativePrompt?: string;
  prompt: string;
  signal?: AbortSignal;
  style?: string;
  width?: number;
}

export interface ImageGenerationResult {
  imageBytes?: ArrayBuffer | Buffer | Uint8Array;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  mimeType: string;
  seed?: string;
}

export interface ImageGenerationProvider extends ProviderDescriptor {
  capability: "image-generation";
  generate(input: ImageGenerationInput): Promise<ImageGenerationResult>;
}
