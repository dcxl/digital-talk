# Provider 接口设计

## 1. 设计目标

Provider 是 Next Digital Human 的核心扩展点。所有外部 AI 能力都必须通过统一接口接入，避免业务代码绑定具体厂商。

目标：

- OpenAI Compatible 优先
- Provider 可替换
- 配置统一
- 错误统一
- 可测试
- 可扩展到 npm package

## 2. Provider 类型

```ts
export type ProviderType =
  | 'llm'
  | 'tts'
  | 'asr'
  | 'embedding'
  | 'avatar';
```

## 3. 通用配置

```ts
export interface ProviderConfig {
  id: string;
  type: ProviderType;
  provider: string;
  name: string;
  enabled: boolean;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  options?: Record<string, unknown>;
}
```

注意：

- 前端永远不直接持有明文 `apiKey`。
- `apiKey` 只在服务端解密并注入 Provider。
- `options` 用于温度、声音、采样率、超时等厂商差异配置。

## 4. 通用结果

```ts
export interface ProviderTestResult {
  ok: boolean;
  latencyMs?: number;
  message?: string;
  error?: ProviderError;
}

export interface ProviderError {
  code:
    | 'unauthorized'
    | 'rate_limited'
    | 'invalid_config'
    | 'timeout'
    | 'network_error'
    | 'provider_error'
    | 'unknown';
  message: string;
  retryable: boolean;
  cause?: unknown;
}
```

## 5. LLM Provider

### 5.1 接口

```ts
export interface LLMProvider {
  id: string;
  name: string;
  models(): Promise<LLMModel[]>;
  chat(input: ChatInput): AsyncIterable<ChatChunk>;
  test(): Promise<ProviderTestResult>;
}
```

### 5.2 类型

```ts
export interface LLMModel {
  id: string;
  name: string;
  contextWindow?: number;
  supportsTools?: boolean;
  supportsVision?: boolean;
}

export interface ChatInput {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export type ChatChunk =
  | { type: 'text.delta'; text: string }
  | { type: 'tool.call'; toolCall: ToolCallDelta }
  | { type: 'usage'; usage: TokenUsage }
  | { type: 'done' };

export interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}
```

### 5.3 MVP 实现

第一版实现一个 OpenAI Compatible Provider，支持：

- OpenAI
- DeepSeek
- 通义千问 OpenAI Compatible
- 其他自定义 `baseUrl`

## 6. TTS Provider

### 6.1 接口

```ts
export interface TTSProvider {
  id: string;
  name: string;
  voices(): Promise<TTSVoice[]>;
  synthesize(input: TTSInput): Promise<TTSResult>;
  test(): Promise<ProviderTestResult>;
}
```

### 6.2 类型

```ts
export interface TTSVoice {
  id: string;
  name: string;
  language?: string;
  gender?: 'male' | 'female' | 'neutral';
  previewUrl?: string;
}

export interface TTSInput {
  text: string;
  voice?: string;
  format?: 'mp3' | 'wav' | 'ogg';
  speed?: number;
  pitch?: number;
  signal?: AbortSignal;
}

export interface TTSResult {
  audioUrl?: string;
  audioBuffer?: ArrayBuffer;
  mimeType: string;
  durationMs?: number;
  marks?: SpeechMark[];
}

export interface SpeechMark {
  type: 'word' | 'viseme' | 'sentence';
  value: string;
  startMs: number;
  endMs?: number;
}
```

### 6.3 MVP 实现

第一版可先返回完整音频，不做音频流。

后续再支持：

- 分片音频
- 字级时间戳
- viseme 口型标记

## 7. ASR Provider

### 7.1 接口

```ts
export interface ASRProvider {
  id: string;
  name: string;
  transcribe(input: ASRInput): Promise<ASRResult>;
  test(): Promise<ProviderTestResult>;
}
```

### 7.2 类型

```ts
export interface ASRInput {
  audio: Blob | ArrayBuffer;
  mimeType: string;
  language?: string;
  signal?: AbortSignal;
}

export interface ASRResult {
  text: string;
  language?: string;
  durationMs?: number;
  segments?: ASRSegment[];
}

export interface ASRSegment {
  text: string;
  startMs: number;
  endMs: number;
  confidence?: number;
}
```

### 7.3 MVP 实现

ASR 可放到 P1，MVP 先保留接口和页面入口。

## 8. Embedding Provider

### 8.1 接口

```ts
export interface EmbeddingProvider {
  id: string;
  name: string;
  embed(input: EmbedInput): Promise<EmbedResult>;
  embedBatch(input: EmbedBatchInput): Promise<EmbedBatchResult>;
  test(): Promise<ProviderTestResult>;
}
```

### 8.2 类型

```ts
export interface EmbedInput {
  text: string;
  model?: string;
  signal?: AbortSignal;
}

export interface EmbedResult {
  embedding: number[];
  dimensions: number;
}

export interface EmbedBatchInput {
  texts: string[];
  model?: string;
  signal?: AbortSignal;
}

export interface EmbedBatchResult {
  embeddings: number[][];
  dimensions: number;
}
```

## 9. Avatar Provider

Avatar Provider 不生成文本，也不处理语音。它只消费 Avatar 事件和状态。

### 9.1 接口

```ts
export interface AvatarProvider {
  id: string;
  name: string;
  load(config: AvatarConfig): Promise<void>;
  dispatch(event: AvatarEvent): void;
  dispose(): void;
  test(): Promise<ProviderTestResult>;
}
```

### 9.2 类型

```ts
export interface AvatarConfig {
  type: 'static' | 'live2d' | 'vrm';
  modelUrl?: string;
  options?: Record<string, unknown>;
}

export type AvatarEvent =
  | { type: 'avatar.idle' }
  | { type: 'avatar.listening' }
  | { type: 'avatar.thinking' }
  | { type: 'avatar.speaking.start'; audioUrl?: string; marks?: SpeechMark[] }
  | { type: 'avatar.speaking.end' }
  | { type: 'avatar.interrupted' }
  | { type: 'avatar.error'; error: ProviderError };
```

### 9.3 MVP 实现

第一版建议实现：

- `StaticAvatarProvider`
- CSS 动画表达状态
- 不做真实口型

P1 再实现：

- Live2D Provider
- 基于音频能量的嘴型模拟

## 10. Tool 接口

Tool Calling 先设计，MVP 可不实现。

```ts
export interface ToolDefinition {
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
}

export interface ToolHandler<TArgs = unknown, TResult = unknown> {
  name: string;
  description?: string;
  schema: Record<string, unknown>;
  execute(args: TArgs, context: ToolContext): Promise<TResult>;
}

export interface ToolContext {
  userId?: string;
  conversationId?: string;
  messageId?: string;
  signal?: AbortSignal;
}

export interface ToolCallDelta {
  id: string;
  name: string;
  argumentsDelta?: string;
}
```

## 11. Provider Registry

```ts
export interface ProviderRegistry {
  register(provider: AnyProvider): void;
  get<T extends AnyProvider>(type: ProviderType, id: string): T | undefined;
  list(type?: ProviderType): AnyProvider[];
}

export type AnyProvider =
  | LLMProvider
  | TTSProvider
  | ASRProvider
  | EmbeddingProvider
  | AvatarProvider;
```

## 12. 调用约定

- 所有长任务必须支持 `AbortSignal`。
- Provider 内部错误必须转换为 `ProviderError`。
- Provider 不直接读写数据库。
- Provider 不直接操作 UI。
- Runtime 负责串联 Provider。
- UI 只消费 Runtime 事件。

## 13. 第一批 Provider

| 类型 | Provider | 优先级 |
| --- | --- | --- |
| LLM | OpenAI Compatible | P0 |
| TTS | OpenAI Compatible / 自定义 HTTP | P0 |
| Avatar | Static Avatar | P0 |
| ASR | Whisper Compatible | P1 |
| Embedding | OpenAI Compatible / BGE | P1 |
| Avatar | Live2D | P1 |

