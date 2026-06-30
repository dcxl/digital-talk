# 事件模型

## 1. 目标

事件模型用于统一 Runtime、UI、Provider、Audio、Avatar 之间的通信。

设计目标：

- UI 不直接耦合具体 Provider。
- Avatar 只消费状态事件。
- 流式输出、中断、错误、音频播放都有统一事件。
- 后续可扩展到 WebSocket、日志回放和调试面板。

## 2. 事件命名规范

采用 `domain.action[.phase]` 格式。

示例：

```text
conversation.created
message.created
llm.stream.delta
tts.started
audio.play.started
avatar.speaking.start
runtime.error
```

## 3. 通用事件结构

```ts
export interface RuntimeEvent<TType extends string = string, TPayload = unknown> {
  id: string;
  type: TType;
  conversationId?: string;
  messageId?: string;
  timestamp: number;
  payload: TPayload;
}
```

约定：

- `id` 用于日志去重和调试。
- `timestamp` 使用毫秒时间戳。
- `conversationId` 和 `messageId` 能填就填。
- `payload` 保持结构化，不放拼接后的自然语言日志。

## 4. Conversation 事件

| 事件 | 触发时机 | Payload |
| --- | --- | --- |
| `conversation.created` | 新建会话 | `{ conversationId, title }` |
| `conversation.selected` | 切换会话 | `{ conversationId }` |
| `conversation.updated` | 标题或摘要更新 | `{ conversationId, patch }` |
| `conversation.archived` | 归档会话 | `{ conversationId }` |
| `conversation.deleted` | 删除会话 | `{ conversationId }` |
| `conversation.interrupted` | 用户打断当前流程 | `{ conversationId, reason }` |

## 5. Message 事件

| 事件 | 触发时机 | Payload |
| --- | --- | --- |
| `message.created` | 创建用户或 assistant 消息 | `{ message }` |
| `message.updated` | 消息内容或状态更新 | `{ messageId, patch }` |
| `message.completed` | assistant 消息完成 | `{ messageId }` |
| `message.failed` | 消息生成失败 | `{ messageId, error }` |
| `message.interrupted` | 消息被打断 | `{ messageId }` |

## 6. LLM 事件

| 事件 | 触发时机 | Payload |
| --- | --- | --- |
| `llm.request.started` | 开始调用 LLM | `{ providerId, model }` |
| `llm.stream.delta` | 收到文本增量 | `{ text }` |
| `llm.tool.call` | 模型请求工具调用 | `{ toolCall }` |
| `llm.usage` | 收到 token 用量 | `{ inputTokens, outputTokens, totalTokens }` |
| `llm.request.completed` | LLM 完成 | `{ durationMs }` |
| `llm.request.failed` | LLM 失败 | `{ error }` |

## 7. TTS 与 Audio 事件

| 事件 | 触发时机 | Payload |
| --- | --- | --- |
| `tts.request.started` | 开始合成语音 | `{ providerId, voice }` |
| `tts.request.completed` | 合成完成 | `{ audioUrl, durationMs, marks }` |
| `tts.request.failed` | 合成失败 | `{ error }` |
| `audio.play.started` | 开始播放 | `{ audioUrl }` |
| `audio.play.ended` | 播放结束 | `{ audioUrl }` |
| `audio.play.interrupted` | 播放被中断 | `{ audioUrl, reason }` |
| `audio.play.failed` | 播放失败 | `{ error }` |

## 8. Avatar 事件

| 事件 | 触发时机 | Payload |
| --- | --- | --- |
| `avatar.idle` | 回到待机 | `{}` |
| `avatar.listening` | 录音中 | `{}` |
| `avatar.thinking` | LLM 生成中 | `{}` |
| `avatar.speaking.start` | 开始说话 | `{ audioUrl, marks }` |
| `avatar.speaking.end` | 说话结束 | `{}` |
| `avatar.interrupted` | 被打断 | `{ reason }` |
| `avatar.error` | Avatar 异常 | `{ error }` |

## 9. RAG 事件

RAG 不进入 MVP，但事件先预留。

| 事件 | 触发时机 | Payload |
| --- | --- | --- |
| `rag.retrieve.started` | 开始检索 | `{ query, knowledgeBaseId }` |
| `rag.retrieve.completed` | 检索完成 | `{ chunks }` |
| `rag.retrieve.empty` | 无命中 | `{ query }` |
| `rag.retrieve.failed` | 检索失败 | `{ error }` |

## 10. Tool 事件

Tool Calling 不进入 MVP，但事件先预留。

| 事件 | 触发时机 | Payload |
| --- | --- | --- |
| `tool.call.started` | 工具开始调用 | `{ toolCallId, name, arguments }` |
| `tool.call.completed` | 工具调用成功 | `{ toolCallId, result }` |
| `tool.call.failed` | 工具调用失败 | `{ toolCallId, error }` |

## 11. Runtime 事件流

一次文本对话的标准事件流：

```text
message.created(user)
message.created(assistant)
avatar.thinking
llm.request.started
llm.stream.delta
message.updated
llm.stream.delta
message.updated
llm.request.completed
message.completed
tts.request.started
tts.request.completed
avatar.speaking.start
audio.play.started
audio.play.ended
avatar.speaking.end
avatar.idle
```

## 12. 中断事件流

```text
conversation.interrupted
llm.request.cancelled
tts.request.cancelled
audio.play.interrupted
message.interrupted
avatar.interrupted
avatar.idle
```

如果用户马上发送新问题：

```text
conversation.interrupted
message.created(user)
avatar.thinking
llm.request.started
```

## 13. 事件消费方

| 消费方 | 关注事件 |
| --- | --- |
| Chat UI | `message.*`、`llm.stream.delta` |
| Avatar UI | `avatar.*` |
| Audio Player | `tts.request.completed`、`audio.*` |
| Debug Panel | 所有事件 |
| Persistence | `message.*`、`conversation.*`、`tool.call.*` |

## 14. MVP 实现建议

MVP 不需要复杂事件总线，先实现一个轻量 `RuntimeEmitter`：

```ts
export interface RuntimeEmitter {
  emit(event: RuntimeEvent): void;
  subscribe(listener: (event: RuntimeEvent) => void): () => void;
}
```

后续可升级为：

- Zustand store bridge
- Server event log
- WebSocket event stream
- Debug timeline

