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
| status | active、archived、deleted |
| starred | true 时只返回收藏 |

### 7.2 Response

```json
{
  "data": {
    "items": [
      {
        "id": "conv_xxx",
        "title": "介绍一下你自己",
        "summary": "用户询问数字人介绍",
        "messageCount": 12,
        "isStarred": true,
        "status": "active",
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

### 7.5 `PATCH /api/conversations/:id`

用于 History 页收藏、归档、恢复、重命名。

```json
{
  "title": "新的会话标题",
  "isStarred": true,
  "status": "archived"
}
```

## 8. Knowledge API

P1 阶段实现。

| API | 说明 |
| --- | --- |
| `GET /api/knowledge-bases` | 知识库列表 |
| `POST /api/knowledge-bases` | 创建知识库 |
| `POST /api/knowledge-bases/:id/documents` | 上传文档 |
| `GET /api/knowledge-bases/:id/documents` | 文档列表 |
| `POST /api/knowledge-bases/:id/search` | 检索测试 |

## 9. Dashboard API

### 9.1 `GET /api/dashboard/summary`

Dashboard 页聚合接口，优先从现有表实时聚合；有 `UsageDailyStat` 后再读统计表。

Response：

```json
{
  "data": {
    "metrics": {
      "conversationCount": 1233,
      "knowledgeDocumentCount": 32,
      "avgLatencyMs": 382,
      "tokensToday": 128600
    },
    "runtimeStatus": [
      {
        "type": "llm",
        "name": "DeepSeek V3",
        "status": "online",
        "lastTestAt": "2026-07-01T10:00:00.000Z"
      }
    ],
    "recentConversations": [
      {
        "id": "conv_xxx",
        "title": "关于数字人项目的问题",
        "lastMessageAt": "2026-07-01T09:30:00.000Z"
      }
    ],
    "tokenUsage": [
      {
        "date": "2026-07-01",
        "totalTokens": 128600
      }
    ],
    "systemInfo": {
      "version": "v1.0.0",
      "environment": "development",
      "uptimeSeconds": 633600
    }
  },
  "requestId": "req_xxx"
}
```

## 10. Avatar API

### 10.1 `GET /api/avatar-profiles`

返回 Avatar 配置列表。

```json
{
  "data": {
    "items": [
      {
        "id": "avatar_xxx",
        "name": "Emily",
        "driver": "static",
        "voice": "cosyvoice-female",
        "language": "zh-CN",
        "background": "living-room",
        "isDefault": true,
        "status": "active"
      }
    ]
  },
  "requestId": "req_xxx"
}
```

### 10.2 `POST /api/avatar-profiles`

```json
{
  "name": "Emily",
  "driver": "static",
  "voiceProviderId": "provider_tts",
  "voice": "cosyvoice-female",
  "language": "zh-CN",
  "background": "living-room",
  "config": {}
}
```

### 10.3 `PATCH /api/avatar-profiles/:id`

同创建接口，支持局部更新。

### 10.4 `POST /api/avatar-profiles/:id/preview`

用于配置页预览，不写入会话。

```json
{
  "text": "你好，我是 Emily",
  "state": "speaking"
}
```

## 11. Prompt API

### 11.1 `GET /api/prompts`

Query：

| 参数 | 说明 |
| --- | --- |
| type | system、chat、summary、translate、custom |

### 11.2 `POST /api/prompts`

```json
{
  "type": "system",
  "name": "System Prompt",
  "description": "默认系统提示词",
  "variables": [
    {
      "name": "char_name",
      "required": true
    }
  ],
  "content": "你是 {{char_name}}。"
}
```

说明：创建 Prompt 时同时创建第一个 `PromptVersion`。

### 11.3 `POST /api/prompts/:id/versions`

```json
{
  "content": "新的 prompt 内容",
  "variables": [],
  "changelog": "优化角色约束",
  "setCurrent": true
}
```

### 11.4 `POST /api/prompts/:id/test`

```json
{
  "versionId": "prompt_ver_xxx",
  "variables": {
    "char_name": "Emily",
    "user_name": "Jack"
  },
  "message": "你是谁？",
  "providerId": "provider_llm"
}
```

Response：

```json
{
  "data": {
    "renderedPrompt": "你是 Emily。",
    "output": "你好，我是 Emily。",
    "usage": {
      "totalTokens": 128
    },
    "latencyMs": 820
  },
  "requestId": "req_xxx"
}
```

## 12. Models API

Models 页本质上是 `ProviderConfig` 的聚合视图。

### 12.1 `GET /api/models`

Query：

| 参数 | 说明 |
| --- | --- |
| type | llm、embedding、tts、asr |

Response：

```json
{
  "data": {
    "items": [
      {
        "id": "provider_xxx",
        "type": "llm",
        "provider": "openai-compatible",
        "name": "DeepSeek",
        "model": "deepseek-chat",
        "enabled": true,
        "hasApiKey": true,
        "lastTestStatus": "success",
        "capabilities": {
          "streaming": true,
          "tools": false
        }
      }
    ],
    "presets": [
      {
        "provider": "deepseek",
        "displayName": "DeepSeek V3",
        "model": "deepseek-chat",
        "type": "llm"
      }
    ]
  },
  "requestId": "req_xxx"
}
```

### 12.2 `POST /api/models/test`

统一测试入口，内部转发到具体 Provider。

```json
{
  "providerId": "provider_xxx",
  "type": "llm",
  "input": "Hello"
}
```

## 13. Playground API

### 13.1 `POST /api/playground/chat`

用于调试中心，不创建正式会话；可选择保存为 `PlaygroundRun`。

```json
{
  "providerId": "provider_llm",
  "systemPrompt": "你是测试助手",
  "message": "测试一下",
  "parameters": {
    "temperature": 0.7,
    "maxTokens": 2048
  },
  "saveRun": true
}
```

Response：

- 默认可复用 `/api/chat` 的 SSE 事件格式。
- 非 streaming 模式返回 `output`、`usage`、`latencyMs`。

### 13.2 `GET /api/playground/runs`

返回历史调试记录。

### 13.3 `GET /api/runtime-metrics`

Query：

| 参数 | 说明 |
| --- | --- |
| type | chat、tts、asr、embedding、rag |
| from | 开始时间 |
| to | 结束时间 |

## 14. Settings API

### 14.1 `GET /api/settings`

返回工作区设置。

```json
{
  "data": {
    "workspaceName": "Next Digital Human",
    "theme": "dark",
    "language": "zh-CN",
    "timeZone": "Asia/Shanghai",
    "autoSave": true
  },
  "requestId": "req_xxx"
}
```

### 14.2 `PATCH /api/settings`

```json
{
  "workspaceName": "Next Digital Human",
  "theme": "dark",
  "language": "zh-CN",
  "timeZone": "Asia/Shanghai",
  "autoSave": true
}
```

### 14.3 `POST /api/settings/export`

```json
{
  "type": "conversations",
  "format": "json"
}
```

Response：

```json
{
  "data": {
    "jobId": "export_xxx",
    "downloadUrl": "/api/settings/export/export_xxx/download"
  },
  "requestId": "req_xxx"
}
```

### 14.4 `DELETE /api/settings/workspace`

危险操作。MVP 本地模式可先禁用，只保留接口契约和二次确认。

```json
{
  "confirm": "DELETE"
}
```

## 15. About API

### 15.1 `GET /api/about`

```json
{
  "data": {
    "name": "Next Digital Human",
    "version": "v1.0.0",
    "license": "MIT",
    "repository": "https://github.com/dcxl/digital-talk",
    "website": "https://nextdigitalhuman.dev"
  },
  "requestId": "req_xxx"
}
```

## 16. 请求取消

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

## 17. 版本策略

MVP 不引入 `/v1` 前缀。公开 API 稳定后再考虑：

```text
/api/v1/chat
/api/v1/providers
```
