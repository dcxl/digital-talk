import type { RuntimeState } from "@/core/runtime/events";
import type {
  AvatarRuntimeMotionDirective,
  AvatarRuntimeMotionMap,
} from "@/core/avatar-runtime/motion-map";
import type {
  AvatarRuntimeMotionAssetDirective,
  AvatarRuntimeMotionAssetMap,
} from "@/core/avatar-runtime/motion-assets";

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

export interface TTSChunk {
  audio: Uint8Array;
  durationMs?: number;
  marks?: Array<{
    timeMs: number;
    value: string;
  }>;
  mimeType: string;
  sequence: number;
}

export interface TTSProvider extends ProviderDescriptor {
  capability: "tts";
  synthesize(input: TTSInput): Promise<TTSResult>;
}

export interface StreamingTTSProvider extends TTSProvider {
  stream(input: TTSInput): AsyncIterable<TTSChunk>;
}

export interface AvatarStateInput {
  state: RuntimeState;
  reason?: string;
}

export interface AvatarStateResult {
  state: RuntimeState;
  updatedAt: string;
}

export type AvatarRuntimeDriver = "live2d" | "static" | "vrm";

export interface AvatarRuntimeInput {
  assetPackageId?: string;
  driver?: AvatarRuntimeDriver;
  mouthOpen?: number;
  motionAssets?: AvatarRuntimeMotionAssetMap;
  motionMap?: AvatarRuntimeMotionMap;
  reason?: string;
  state: RuntimeState;
}

export interface AvatarRuntimeResult {
  adapterId: string;
  adapterName: string;
  capabilities: {
    image: boolean;
    live2d: boolean;
    motions: boolean;
    expressions: boolean;
    viseme: boolean;
    vrm: boolean;
  };
  asset?: {
    entrypoint: string;
    files?: Array<{
      mimeType: string;
      path: string;
      url: string;
    }>;
    id: string;
    manifestUrl?: string;
    type: "image" | "live2d" | "vrm";
  };
  diagnostics?: {
    errors: string[];
    warnings: string[];
  };
  driver: AvatarRuntimeDriver;
  fallbackDriver?: AvatarRuntimeDriver;
  loadLatencyMs: number;
  mouth: {
    openness: number;
    source: "audio-volume" | "none" | "speech-mark" | "viseme";
  };
  motion: AvatarRuntimeMotionDirective;
  motionAsset?: AvatarRuntimeMotionAssetDirective;
  motionAssets?: AvatarRuntimeMotionAssetMap;
  motionMap?: AvatarRuntimeMotionMap;
  reason?: string;
  status: "degraded" | "error" | "placeholder" | "ready";
  state: RuntimeState;
  updatedAt: string;
}

export interface AvatarProvider extends ProviderDescriptor {
  capability: "avatar";
  getRuntime(input: AvatarRuntimeInput): Promise<AvatarRuntimeResult>;
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

export interface AudioChunk {
  audio: Blob;
  mimeType?: string;
  sequence: number;
  timestampMs?: number;
}

export interface StreamingASRInput {
  chunks: AsyncIterable<AudioChunk>;
  language?: string;
  signal?: AbortSignal;
}

export type ASRChunk =
  | {
      type: "partial";
      text: string;
      sequence: number;
      startMs?: number;
      endMs?: number;
    }
  | {
      type: "final";
      text: string;
      durationMs?: number;
      language?: string;
      segments: ASRSegment[];
    };

export interface StreamingASRProvider extends ASRProvider {
  stream(input: StreamingASRInput): AsyncIterable<ASRChunk>;
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
