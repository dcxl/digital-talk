# Runtime 状态机

## 1. 目标

状态机用于约束一次数字人对话的生命周期，避免出现多路请求、音频叠加、Avatar 状态错乱等问题。

## 2. 核心状态

```ts
export type RuntimeState =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'thinking'
  | 'streaming'
  | 'synthesizing'
  | 'speaking'
  | 'interrupted'
  | 'error';
```

MVP 必须实现：

- `idle`
- `thinking`
- `streaming`
- `synthesizing`
- `speaking`
- `interrupted`
- `error`

P1 再实现：

- `listening`
- `transcribing`

## 3. 状态说明

| 状态 | 说明 |
| --- | --- |
| idle | 空闲，可接收输入 |
| listening | 正在录音 |
| transcribing | 正在 ASR 转写 |
| thinking | 已提交请求，等待 LLM 首包 |
| streaming | LLM 正在流式输出 |
| synthesizing | 文本完成，正在 TTS |
| speaking | 正在播放语音，Avatar 说话 |
| interrupted | 当前流程被打断，等待清理 |
| error | 当前流程失败 |

## 4. 状态转换图

```text
idle
  -> thinking
  -> streaming
  -> synthesizing
  -> speaking
  -> idle

idle
  -> listening
  -> transcribing
  -> thinking

thinking | streaming | synthesizing | speaking
  -> interrupted
  -> idle

任意状态
  -> error
  -> idle
```

## 5. 事件驱动转换

| 当前状态 | 事件 | 下一个状态 |
| --- | --- | --- |
| idle | `message.created(user)` | thinking |
| thinking | `llm.stream.delta` | streaming |
| thinking | `llm.request.failed` | error |
| streaming | `llm.request.completed` | synthesizing |
| streaming | `llm.request.failed` | error |
| synthesizing | `tts.request.completed` | speaking |
| synthesizing | `tts.request.failed` | idle |
| speaking | `audio.play.ended` | idle |
| speaking | `audio.play.failed` | error |
| any active | `conversation.interrupted` | interrupted |
| interrupted | cleanup completed | idle |
| error | user retry / dismiss | idle |

说明：

- TTS 失败不应该让文本回答失败，默认降级为 `idle`。
- Audio 播放失败属于体验失败，可进入 `error` 或提示后回到 `idle`。
- 中断需要清理所有未完成任务后再回到 `idle`。

## 6. 用户操作权限

| 状态 | 输入文本 | 发送 | 录音 | 停止生成 | 打断语音 | 切换模型 |
| --- | --- | --- | --- | --- | --- | --- |
| idle | 是 | 是 | 是 | 否 | 否 | 是 |
| listening | 否 | 否 | 是 | 否 | 否 | 否 |
| transcribing | 否 | 否 | 否 | 是 | 否 | 否 |
| thinking | 否 | 否 | 否 | 是 | 否 | 否 |
| streaming | 否 | 否 | 否 | 是 | 否 | 否 |
| synthesizing | 否 | 否 | 否 | 是 | 否 | 否 |
| speaking | 是 | 是 | 是 | 否 | 是 | 否 |
| interrupted | 否 | 否 | 否 | 否 | 否 | 否 |
| error | 是 | 是 | 是 | 否 | 否 | 是 |

## 7. 中断策略

### 7.1 用户点击停止生成

适用状态：

- thinking
- streaming
- synthesizing

动作：

```text
AbortController.abort()
标记 assistant message = interrupted
停止 TTS
停止 audio
Avatar -> interrupted -> idle
```

### 7.2 用户在 speaking 时发送新问题

动作：

```text
停止当前 audio
当前 assistant message 保持 completed
Avatar -> interrupted
创建新 user message
进入 thinking
```

### 7.3 用户在 streaming 时发送新问题

默认不允许直接发送。用户必须先停止生成。

原因：

- 避免两个 LLM 请求并发污染同一会话。
- 避免消息顺序不确定。

## 8. 错误恢复

| 错误来源 | 处理 |
| --- | --- |
| LLM 失败 | assistant 消息标记 failed，展示重试 |
| TTS 失败 | 文本保留，提示语音失败，回到 idle |
| ASR 失败 | 保留录音失败提示，回到 idle |
| Audio 失败 | 停止播放，回到 idle |
| Avatar 失败 | 降级静态头像，回到 idle |
| Provider 未配置 | 跳转或提示 Provider 配置 |

## 9. Runtime 上下文

```ts
export interface RuntimeContext {
  state: RuntimeState;
  conversationId?: string;
  activeUserMessageId?: string;
  activeAssistantMessageId?: string;
  abortController?: AbortController;
  activeAudioUrl?: string;
  error?: RuntimeError;
}
```

## 10. Runtime 方法

```ts
export interface ConversationRuntime {
  getState(): RuntimeState;
  sendText(input: string): Promise<void>;
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  interrupt(reason?: string): Promise<void>;
  retry(messageId: string): Promise<void>;
  reset(): void;
}
```

## 11. MVP 状态机验收

必须验证：

- 空闲时可以发送消息。
- 生成中不能重复发送。
- 流式输出可停止。
- TTS 失败不影响文本展示。
- 播放语音时可打断。
- 打断后不会继续播放旧音频。
- 任意错误都能回到可继续使用状态。

## 12. 后续增强

- 支持并发预加载 TTS。
- 支持音频分片播放。
- 支持 ASR 边说边识别。
- 支持工具调用期间的独立状态。
- 支持 Debug Timeline 回放状态变化。

