# 数据表字段设计

## 1. 设计原则

- MVP 使用 PostgreSQL + Prisma。
- 向量检索优先使用 pgvector，减少额外基础设施。
- API Key 等敏感字段后端加密存储。
- 先支持单用户/本地开发模式，但字段保留 `userId`，方便后续扩展。

## 2. 表关系总览

```text
User
├── Conversation
│   └── Message
│       └── ToolCall
├── KnowledgeBase
│   └── Document
│       └── DocumentChunk
├── ProviderConfig
└── AppSetting
```

## 3. User

MVP 可先内置默认用户，后续再接入 Auth。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 主键，cuid/uuid |
| name | string | 否 | 用户名 |
| email | string | 否 | 邮箱 |
| avatarUrl | string | 否 | 头像 |
| createdAt | DateTime | 是 | 创建时间 |
| updatedAt | DateTime | 是 | 更新时间 |

## 4. Conversation

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 主键 |
| userId | string | 是 | 所属用户 |
| title | string | 是 | 会话标题 |
| summary | string | 否 | 会话摘要 |
| status | enum | 是 | active、archived、deleted |
| modelProviderId | string | 否 | 使用的 LLM Provider |
| knowledgeBaseId | string | 否 | 绑定知识库 |
| lastMessageAt | DateTime | 否 | 最近消息时间 |
| createdAt | DateTime | 是 | 创建时间 |
| updatedAt | DateTime | 是 | 更新时间 |

索引：

- `userId`
- `lastMessageAt`
- `status`

## 5. Message

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 主键 |
| conversationId | string | 是 | 所属会话 |
| role | enum | 是 | user、assistant、system、tool |
| content | text | 是 | 文本内容 |
| status | enum | 是 | pending、streaming、completed、failed、interrupted |
| metadata | json | 否 | token、耗时、模型等扩展信息 |
| parentMessageId | string | 否 | 分支对话预留 |
| audioUrl | string | 否 | TTS 音频地址 |
| createdAt | DateTime | 是 | 创建时间 |
| updatedAt | DateTime | 是 | 更新时间 |

索引：

- `conversationId`
- `role`
- `createdAt`

## 6. KnowledgeBase

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 主键 |
| userId | string | 是 | 所属用户 |
| name | string | 是 | 知识库名称 |
| description | string | 否 | 描述 |
| status | enum | 是 | active、disabled、deleted |
| documentCount | int | 是 | 文档数量缓存 |
| chunkCount | int | 是 | 切片数量缓存 |
| createdAt | DateTime | 是 | 创建时间 |
| updatedAt | DateTime | 是 | 更新时间 |

## 7. Document

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 主键 |
| knowledgeBaseId | string | 是 | 所属知识库 |
| name | string | 是 | 展示名称 |
| originalName | string | 是 | 原始文件名 |
| mimeType | string | 是 | MIME 类型 |
| size | int | 是 | 文件大小 |
| storageKey | string | 是 | 本地或对象存储路径 |
| status | enum | 是 | uploaded、parsing、chunked、embedded、failed |
| errorMessage | string | 否 | 失败原因 |
| chunkCount | int | 是 | 切片数量 |
| createdAt | DateTime | 是 | 创建时间 |
| updatedAt | DateTime | 是 | 更新时间 |

索引：

- `knowledgeBaseId`
- `status`

## 8. DocumentChunk

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 主键 |
| documentId | string | 是 | 所属文档 |
| knowledgeBaseId | string | 是 | 所属知识库，方便检索 |
| content | text | 是 | 切片文本 |
| tokenCount | int | 否 | token 数 |
| chunkIndex | int | 是 | 文档内序号 |
| embedding | vector | 否 | pgvector 向量 |
| metadata | json | 否 | 页码、标题、来源等 |
| createdAt | DateTime | 是 | 创建时间 |
| updatedAt | DateTime | 是 | 更新时间 |

索引：

- `documentId`
- `knowledgeBaseId`
- `embedding vector_cosine_ops`

## 9. ProviderConfig

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 主键 |
| userId | string | 是 | 所属用户 |
| type | enum | 是 | llm、tts、asr、embedding、avatar |
| provider | string | 是 | openai、deepseek、qwen、azure、custom |
| name | string | 是 | 展示名称 |
| enabled | boolean | 是 | 是否启用 |
| baseUrl | string | 否 | 接口地址 |
| apiKeyEncrypted | string | 否 | 加密后的 API Key |
| model | string | 否 | 默认模型 |
| options | json | 否 | 扩展配置 |
| lastTestStatus | enum | 否 | success、failed |
| lastTestAt | DateTime | 否 | 最近测试时间 |
| createdAt | DateTime | 是 | 创建时间 |
| updatedAt | DateTime | 是 | 更新时间 |

索引：

- `userId`
- `type`
- `enabled`

## 10. Tool

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 主键 |
| name | string | 是 | 工具名称 |
| description | string | 否 | 描述 |
| enabled | boolean | 是 | 是否启用 |
| schema | json | 是 | 参数 JSON Schema |
| handler | string | 是 | 工具处理器标识 |
| createdAt | DateTime | 是 | 创建时间 |
| updatedAt | DateTime | 是 | 更新时间 |

## 11. ToolCall

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 主键 |
| messageId | string | 是 | 关联 assistant 消息 |
| toolId | string | 否 | 关联工具 |
| name | string | 是 | 工具名称 |
| arguments | json | 是 | 调用参数 |
| result | json | 否 | 调用结果 |
| status | enum | 是 | pending、running、success、failed |
| errorMessage | string | 否 | 失败原因 |
| startedAt | DateTime | 否 | 开始时间 |
| finishedAt | DateTime | 否 | 结束时间 |
| createdAt | DateTime | 是 | 创建时间 |

## 12. AppSetting

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 主键 |
| userId | string | 是 | 所属用户 |
| key | string | 是 | 配置键 |
| value | json | 是 | 配置值 |
| createdAt | DateTime | 是 | 创建时间 |
| updatedAt | DateTime | 是 | 更新时间 |

唯一索引：

- `userId + key`

## 13. 枚举建议

```ts
type ConversationStatus = 'active' | 'archived' | 'deleted';
type MessageRole = 'user' | 'assistant' | 'system' | 'tool';
type MessageStatus = 'pending' | 'streaming' | 'completed' | 'failed' | 'interrupted';
type ProviderType = 'llm' | 'tts' | 'asr' | 'embedding' | 'avatar';
type TestStatus = 'success' | 'failed';
type DocumentStatus = 'uploaded' | 'parsing' | 'chunked' | 'embedded' | 'failed';
type ToolCallStatus = 'pending' | 'running' | 'success' | 'failed';
```

## 14. MVP 最小表集合

第一版可只实现：

- User
- Conversation
- Message
- ProviderConfig
- AppSetting

RAG 阶段再加入：

- KnowledgeBase
- Document
- DocumentChunk

Tool Calling 阶段再加入：

- Tool
- ToolCall

