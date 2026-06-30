# API 契约

## 1. 通用约定

### 1.1 Base URL

```text
/api
```

### 1.2 JSON 响应格式

成功：

```json
{
  "data": {},
  "requestId": "req_xxx"
}
```

失败：

```json
{
  "error": {
    "code": "provider_error",
    "message": "LLM provider failed",
    "retryable": true,
    "details": {}
  },
  "requestId": "req_xxx"
}
```

### 1.3 错误码

| code | 说明 |
| --- | --- |
| `bad_request` | 请求参数错误 |
| `unauthorized` | 未授权 |
| `forbidden` | 无权限 |
| `not_found` | 资源不存在 |
| `rate_limited` | 请求过于频繁 |
| `provider_not_configured` | Provider 未配置 |
| `provider_error` | Provider 调用失败 |
| `timeout` | 超时 |
| `network_error` | 网络错误 |
| `internal_error` | 服务端未知错误 |

## 2. `POST /api/chat`

### 2.1 目标

创建一次对话请求，返回流式 assistant 消息。

### 2.2 Request

```json
{
  "conversationId": "conv_xxx",
  "message": "你好，介绍一下你自己",
  "modelProviderId": "provider_xxx",
  "knowledgeBaseId": "kb_xxx",
  "enableTTS": true,
  "metadata": {}
}
```

字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| conversationId | 否 | 不传则创建新会话 |
| message | 是 | 用户输入 |
| modelProviderId | 否 | 不传使用默认 LLM |
| knowledgeBaseId | 否 | RAG 阶段使用 |
| enableTTS | 否 | 是否在文本完成后生成语音 |
| metadata | 否 | 扩展字段 |

### 2.3 Response

`Content-Type: text/event-stream`

### 2.4 SSE 事件

#### `message.created`

```text
event: message.created
data: {"message":{"id":"msg_user","role":"user","content":"你好"}}
```

#### `assistant.created`

```text
event: assistant.created
data: {"message":{"id":"msg_assistant","role":"assistant","content":"","status":"streaming"}}
```

#### `text.delta`

```text
event: text.delta
data: {"messageId":"msg_assistant","text":"你好"}
```

#### `text.done`

```text
event: text.done
data: {"messageId":"msg_assistant","content":"你好，我是 Next Digital Human。"}
```

#### `tts.done`

```text
event: tts.done
data: {"messageId":"msg_assistant","audioUrl":"/api/audio/audio_xxx.mp3","durationMs":3200}
```

#### `usage`

```text
event: usage
data: {"inputTokens":120,"outputTokens":80,"totalTokens":200}
```

#### `error`

```text
event: error
data: {"code":"provider_error","message":"LLM provider failed","retryable":true}
```

#### `done`

```text
event: done
data: {"conversationId":"conv_xxx","messageId":"msg_assistant"}
```

### 2.5 前端处理规则

- 收到 `assistant.created` 后插入空 assistant 消息。
- 收到 `text.delta` 后追加内容。
- 收到 `text.done` 后标记消息文本完成。
- 收到 `tts.done` 后播放音频。
- 收到 `error` 后停止当前流。
- 收到 `done` 后关闭流。

## 3. `POST /api/chat/interrupt`

### 3.1 Request

```json
{
  "conversationId": "conv_xxx",
  "messageId": "msg_assistant",
  "reason": "user_interrupt"
}
```

### 3.2 Response

```json
{
  "data": {
    "interrupted": true
  },
  "requestId": "req_xxx"
}
```

说明：

- 用于显式通知服务端中断。
- 如果 LLM 请求已经通过客户端断开终止，服务端仍应标记消息状态。

## 4. `POST /api/tts`

### 4.1 Request

```json
{
  "text": "你好，我是 Next Digital Human。",
  "providerId": "provider_tts",
  "voice": "default",
  "format": "mp3"
}
```

### 4.2 Response

```json
{
  "data": {
    "audioUrl": "/api/audio/audio_xxx.mp3",
    "mimeType": "audio/mpeg",
    "durationMs": 3200,
    "marks": []
  },
  "requestId": "req_xxx"
}
```

## 5. `POST /api/asr`

P1 阶段实现。

### 5.1 Request

`Content-Type: multipart/form-data`

字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| audio | 是 | 音频文件 |
| providerId | 否 | ASR Provider |
| language | 否 | 语言 |

### 5.2 Response

```json
{
  "data": {
    "text": "你好",
    "language": "zh",
    "durationMs": 1200,
    "segments": []
  },
  "requestId": "req_xxx"
}
```

## 6. Provider API

### 6.1 `GET /api/providers`

```json
{
  "data": {
    "providers": [
      {
        "id": "provider_xxx",
        "type": "llm",
        "provider": "openai-compatible",
        "name": "DeepSeek",
        "enabled": true,
        "baseUrl": "https://api.deepseek.com",
        "model": "deepseek-chat",
        "hasApiKey": true,
        "lastTestStatus": "success"
      }
    ]
  },
  "requestId": "req_xxx"
}
```

注意：不返回明文 API Key。

### 6.2 `POST /api/providers`

```json
{
  "type": "llm",
  "provider": "openai-compatible",
  "name": "DeepSeek",
  "enabled": true,
  "baseUrl": "https://api.deepseek.com",
  "apiKey": "sk-xxx",
  "model": "deepseek-chat",
  "options": {}
}
```

### 6.3 `PATCH /api/providers/:id`

```json
{
  "enabled": true,
  "model": "deepseek-chat"
}
```

### 6.4 `POST /api/providers/:id/test`

```json
{
  "input": "Hello"
}
```

Response：

```json
{
  "data": {
    "ok": true,
    "latencyMs": 820,
    "message": "Provider is available"
  },
  "requestId": "req_xxx"
}
```

## 7. Conversation API

### 7.1 `GET /api/conversations`

Query：

| 参数 | 说明 |
| --- | --- |
| q | 搜索关键词 |
| cursor | 分页游标 |
| limit | 数量 |

### 7.2 Response

```json
{
  "data": {
    "items": [
      {
        "id": "conv_xxx",
        "title": "介绍一下你自己",
        "summary": "用户询问数字人介绍",
        "lastMessageAt": "2026-06-30T10:00:00.000Z"
      }
    ],
    "nextCursor": null
  },
  "requestId": "req_xxx"
}
```

### 7.3 `GET /api/conversations/:id/messages`

返回会话消息。

### 7.4 `DELETE /api/conversations/:id`

软删除会话。

## 8. Knowledge API

P1 阶段实现。

| API | 说明 |
| --- | --- |
| `GET /api/knowledge-bases` | 知识库列表 |
| `POST /api/knowledge-bases` | 创建知识库 |
| `POST /api/knowledge-bases/:id/documents` | 上传文档 |
| `GET /api/knowledge-bases/:id/documents` | 文档列表 |
| `POST /api/knowledge-bases/:id/search` | 检索测试 |

## 9. 请求取消

前端必须用 `AbortController` 取消 `/api/chat` 请求。

```ts
const controller = new AbortController();

fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify(payload),
  signal: controller.signal,
});

controller.abort();
```

服务端检测连接关闭后：

- 停止 LLM Provider
- 停止 TTS
- 标记消息为 `interrupted`
- 发出 `conversation.interrupted`

## 10. 版本策略

MVP 不引入 `/v1` 前缀。公开 API 稳定后再考虑：

```text
/api/v1/chat
/api/v1/providers
```

