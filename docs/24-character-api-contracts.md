# Character API 详细契约

## 1. 通用约定

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
    "code": "bad_request",
    "message": "请求参数错误",
    "retryable": false,
    "details": {}
  },
  "requestId": "req_xxx"
}
```

通用错误码：

| code | 说明 |
| --- | --- |
| `bad_request` | 参数错误 |
| `unauthorized` | 未登录 |
| `forbidden` | 无权限 |
| `not_found` | 资源不存在 |
| `conflict` | 状态冲突 |
| `provider_not_configured` | Provider 未配置 |
| `provider_error` | Provider 调用失败 |
| `timeout` | 超时 |
| `database_error` | 数据库错误 |
| `internal_error` | 未知错误 |

## 2. Character

### 2.1 `GET /api/characters`

Query：

| 参数 | 说明 |
| --- | --- |
| q | 搜索名称、简介、标签 |
| roleType | 角色类型 |
| status | draft / active / disabled / deleted |
| cursor | 分页游标 |
| limit | 默认 20，最大 100 |

Response：

```json
{
  "data": {
    "items": [
      {
        "id": "char_xxx",
        "name": "小夏",
        "roleType": "chat_companion",
        "description": "温和的闲聊陪伴角色",
        "tags": ["陪伴", "中文"],
        "status": "active",
        "appearance": {
          "profileId": "avatar_xxx",
          "previewImageUrl": "/api/avatar-assets/asset_xxx/content"
        },
        "voice": {
          "voiceProviderId": "provider_tts",
          "voice": "longhua_v3",
          "language": "zh"
        },
        "defaultScene": {
          "id": "scene_xxx",
          "name": "闲聊"
        },
        "updatedAt": "2026-07-07T10:00:00.000Z"
      }
    ],
    "nextCursor": null
  },
  "requestId": "req_xxx"
}
```

### 2.2 `POST /api/characters`

Request：

```json
{
  "name": "小夏",
  "roleType": "chat_companion",
  "description": "温和的闲聊陪伴角色",
  "tags": ["陪伴", "中文"],
  "personaPromptId": "prompt_xxx",
  "appearanceProfileId": "avatar_xxx",
  "voiceProviderId": "provider_tts",
  "voice": "longhua_v3",
  "language": "zh",
  "memoryPolicy": {
    "enabled": true,
    "manualOnly": true
  },
  "workflowPolicy": {
    "manualOnly": true
  },
  "runtimeConfig": {},
  "comfyWorkflowConfig": {},
  "status": "draft"
}
```

校验：

- `name` 必填，1-60 字。
- `roleType` 不传则为 `custom`。
- `status` 不传则为 `draft`。
- `appearanceProfileId` 必须属于当前用户。
- `voiceProviderId` 必须是 TTS provider。

### 2.3 `GET /api/characters/:characterId`

Response 包含：

- character profile
- appearance
- sceneBindings
- memory count
- workflow count

### 2.4 `PATCH /api/characters/:characterId`

支持局部更新。

不可更新：

- `id`
- `userId`
- `createdAt`
- `updatedAt`

### 2.5 `DELETE /api/characters/:characterId`

软删除：

```text
status = deleted
```

不会删除：

- AvatarProfile
- AvatarAsset
- Conversation
- Message

## 3. Scene

### 3.1 `GET /api/scenes`

Query：

| 参数 | 说明 |
| --- | --- |
| type | 场景类型 |
| status | active / disabled / deleted |

### 3.2 `POST /api/scenes`

Request：

```json
{
  "name": "知识库助手",
  "type": "knowledge_assistant",
  "description": "基于知识库回答问题",
  "promptTemplateId": "prompt_xxx",
  "knowledgeBaseId": "kb_xxx",
  "inputMode": "text",
  "outputMode": "text",
  "workflowPolicy": {
    "allowManualRun": true
  }
}
```

### 3.3 `PATCH /api/scenes/:sceneId`

支持局部更新，删除用 `status = deleted`。

## 4. Scene Binding

### 4.1 `POST /api/characters/:characterId/scenes/:sceneId/bind`

Request：

```json
{
  "isDefault": true,
  "enabled": true,
  "config": {}
}
```

规则：

- 如果 `isDefault = true`，同一角色其他 binding 自动改为 false。
- 重复绑定返回已有 binding，并应用 patch。

### 4.2 `DELETE /api/characters/:characterId/scenes/:sceneId/bind`

删除绑定，不删除 Character 和 Scene。

## 5. Memory

### 5.1 `GET /api/characters/:characterId/memories`

Query：

| 参数 | 说明 |
| --- | --- |
| type | 记忆类型 |
| status | active / disabled / deleted |

### 5.2 `POST /api/characters/:characterId/memories`

Request：

```json
{
  "type": "user_preference",
  "content": "用户喜欢简洁直接的回答",
  "source": "manual",
  "sourceConversationId": "conv_xxx",
  "confidence": 0.9,
  "metadata": {},
  "expiresAt": null
}
```

校验：

- `content` 必填，最大 2000 字。
- `source = manual` 是 v0.5 默认来源。
- `confidence` 范围 0-1。

### 5.3 `PATCH /api/characters/:characterId/memories/:memoryId`

可更新：

- `content`
- `status`
- `confidence`
- `metadata`
- `expiresAt`

### 5.4 `DELETE /api/characters/:characterId/memories/:memoryId`

软删除：

```text
status = deleted
```

## 6. Workflow

### 6.1 `GET /api/characters/:characterId/workflows`

返回 workflow 定义和最近执行状态。

### 6.2 `POST /api/characters/:characterId/workflows`

Request：

```json
{
  "name": "总结当前会话",
  "description": "把当前会话总结为长期记忆候选",
  "trigger": {
    "type": "manual"
  },
  "steps": [
    {
      "id": "summarize",
      "type": "llm",
      "input": {
        "prompt": "总结当前会话"
      }
    }
  ],
  "permission": {
    "requiresConfirmation": true
  },
  "status": "active"
}
```

### 6.3 `POST /api/characters/:characterId/workflows/:workflowId/run`

Request：

```json
{
  "conversationId": "conv_xxx",
  "input": {
    "message": "请总结这段对话"
  },
  "confirm": false
}
```

Response：

```json
{
  "data": {
    "executionId": "exec_xxx",
    "status": "waiting_confirmation",
    "requiresConfirmation": true
  },
  "requestId": "req_xxx"
}
```

## 7. Appearance Generation

### 7.1 `POST /api/characters/:characterId/appearance-generations`

Request：

```json
{
  "mode": "text_to_image",
  "prompt": "银发中文 AI 主播，半身像，干净背景",
  "negativePrompt": "low quality, blurry",
  "referenceAssetId": "asset_xxx",
  "workflowKey": "default-character-t2i",
  "variables": {
    "width": 768,
    "height": 1024,
    "seed": 123456
  }
}
```

Response：

```json
{
  "data": {
    "jobId": "job_xxx",
    "status": "pending"
  },
  "requestId": "req_xxx"
}
```

### 7.2 `GET /api/characters/:characterId/appearance-generations/:jobId`

Response：

```json
{
  "data": {
    "id": "job_xxx",
    "status": "completed",
    "asset": {
      "id": "asset_xxx",
      "publicUrl": "/api/avatar-assets/asset_xxx/content"
    },
    "errorMessage": null
  },
  "requestId": "req_xxx"
}
```

## 8. Chat / Conversation 影响

### 8.1 `POST /api/conversations`

新增可选字段：

```json
{
  "title": "和小夏聊天",
  "characterId": "char_xxx",
  "sceneId": "scene_xxx"
}
```

### 8.2 `POST /api/chat`

新增可选字段：

```json
{
  "conversationId": "conv_xxx",
  "characterId": "char_xxx",
  "sceneId": "scene_xxx",
  "message": "你好"
}
```

规则：

- 已存在会话以会话绑定的 `characterId` 为准。
- 请求传入的 `characterId` 与会话不一致时返回 `bad_request`。
- 历史无角色会话仍可继续。

