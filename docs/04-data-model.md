# 数据表字段设计

## 1. 设计原则

- MVP 使用 PostgreSQL + Prisma。
- 向量检索优先使用 pgvector，减少额外基础设施。
- API Key 等敏感字段后端加密存储。
- 先支持单用户/本地开发模式，但字段保留 `userId`，方便后续扩展。
- 本文同时记录已落库表和页面原型需要的规划表；规划表后续按任务拆 migration。

## 2. 表关系总览

```text
User
├── Conversation
│   └── Message
│       └── ToolCall
├── KnowledgeBase
│   └── Document
│       └── DocumentChunk
├── AvatarProfile
├── PromptTemplate
│   └── PromptVersion
├── ProviderConfig
├── PlaygroundRun
├── RuntimeMetric
├── UsageDailyStat
├── ExportJob
└── AppSetting

ModelPreset（全局可选预设）
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

History 独立页建议追加字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| messageCount | int | 否 | 消息数量缓存 |
| isStarred | boolean | 否 | 是否收藏 |
| archivedAt | DateTime | 否 | 归档时间 |
| deletedAt | DateTime | 否 | 软删除时间 |

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

## 13. 页面扩展表（规划）

以下表服务 Dashboard、Avatar、Prompt、Playground、Settings 等页面。它们不是当前最小 Prisma schema 的阻塞项，按页面开发节奏追加。

### 13.1 AvatarProfile

用于 Avatar 配置页，管理数字人角色、驱动、声音和场景。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 主键 |
| userId | string | 是 | 所属用户 |
| name | string | 是 | Avatar 名称 |
| driver | enum | 是 | static、live2d、vrm |
| providerConfigId | string | 否 | 绑定 avatar provider |
| voiceProviderId | string | 否 | 绑定 TTS provider |
| voice | string | 否 | 声音标识 |
| language | string | 否 | 默认语言，如 zh-CN |
| background | string | 否 | 场景标识 |
| previewImageUrl | string | 否 | 预览图 |
| config | json | 否 | 模型、动作、摄像机等扩展配置 |
| isDefault | boolean | 是 | 是否默认 Avatar |
| status | enum | 是 | active、disabled、deleted |
| createdAt | DateTime | 是 | 创建时间 |
| updatedAt | DateTime | 是 | 更新时间 |

索引：

- `userId`
- `driver`
- `status`

### 13.2 PromptTemplate

用于 Prompt 管理页，表示一个提示词槽位。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 主键 |
| userId | string | 是 | 所属用户 |
| type | enum | 是 | system、chat、summary、translate、custom |
| name | string | 是 | 展示名称 |
| description | string | 否 | 描述 |
| currentVersionId | string | 否 | 当前默认版本 |
| variables | json | 否 | 变量声明和默认值 |
| status | enum | 是 | active、disabled、deleted |
| createdAt | DateTime | 是 | 创建时间 |
| updatedAt | DateTime | 是 | 更新时间 |

唯一索引：

- `userId + type + name`

### 13.3 PromptVersion

用于 Prompt 版本化和回滚。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 主键 |
| promptTemplateId | string | 是 | 所属 Prompt |
| version | int | 是 | 版本号 |
| content | text | 是 | Prompt 内容 |
| variables | json | 否 | 当前版本变量快照 |
| changelog | string | 否 | 修改说明 |
| createdByUserId | string | 否 | 创建人 |
| createdAt | DateTime | 是 | 创建时间 |

唯一索引：

- `promptTemplateId + version`

### 13.4 ModelPreset

Models 页优先复用 `ProviderConfig`。如果需要展示推荐模型、能力标签和默认参数，再加入该表。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 主键 |
| providerConfigId | string | 否 | 绑定 ProviderConfig |
| type | enum | 是 | llm、embedding、tts、asr |
| provider | string | 是 | deepseek、qwen、openai-compatible 等 |
| displayName | string | 是 | 展示名称 |
| model | string | 是 | 模型名 |
| capabilities | json | 否 | context、vision、tools、streaming 等能力 |
| defaultParams | json | 否 | temperature、maxTokens 等默认参数 |
| isRecommended | boolean | 是 | 是否推荐 |
| status | enum | 是 | active、disabled |
| createdAt | DateTime | 是 | 创建时间 |
| updatedAt | DateTime | 是 | 更新时间 |

### 13.5 RuntimeMetric

用于 Dashboard、Playground Metrics 和排障。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 主键 |
| userId | string | 是 | 所属用户 |
| requestId | string | 是 | 请求 ID |
| conversationId | string | 否 | 关联会话 |
| messageId | string | 否 | 关联消息 |
| providerConfigId | string | 否 | 关联 Provider |
| type | enum | 是 | chat、tts、asr、embedding、rag |
| status | enum | 是 | success、failed、interrupted |
| latencyMs | int | 否 | 总耗时 |
| inputTokens | int | 否 | 输入 token |
| outputTokens | int | 否 | 输出 token |
| totalTokens | int | 否 | 总 token |
| errorCode | string | 否 | 错误码 |
| errorMessage | string | 否 | 错误摘要 |
| metadata | json | 否 | 扩展指标 |
| createdAt | DateTime | 是 | 创建时间 |

索引：

- `userId + createdAt`
- `type + status`
- `requestId`

### 13.6 UsageDailyStat

用于 Dashboard Token Usage 趋势，避免每次从明细实时聚合。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 主键 |
| userId | string | 是 | 所属用户 |
| date | Date | 是 | 统计日期 |
| providerType | enum | 否 | llm、embedding、tts、asr |
| providerConfigId | string | 否 | 关联 Provider |
| requestCount | int | 是 | 请求次数 |
| successCount | int | 是 | 成功次数 |
| failedCount | int | 是 | 失败次数 |
| inputTokens | int | 是 | 输入 token |
| outputTokens | int | 是 | 输出 token |
| totalTokens | int | 是 | 总 token |
| avgLatencyMs | int | 否 | 平均耗时 |
| createdAt | DateTime | 是 | 创建时间 |
| updatedAt | DateTime | 是 | 更新时间 |

唯一索引：

- `userId + date + providerConfigId`

### 13.7 PlaygroundRun

用于保留调试中心输入、输出、参数和运行结果。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 主键 |
| userId | string | 是 | 所属用户 |
| type | enum | 是 | chat、events、logs、metrics |
| providerConfigId | string | 否 | 使用的 Provider |
| promptVersionId | string | 否 | 使用的 Prompt 版本 |
| input | json | 是 | 输入参数 |
| output | json | 否 | 输出结果 |
| events | json | 否 | Runtime 事件快照 |
| status | enum | 是 | running、success、failed、interrupted |
| latencyMs | int | 否 | 耗时 |
| tokenUsage | json | 否 | token 用量 |
| errorMessage | string | 否 | 错误摘要 |
| createdAt | DateTime | 是 | 创建时间 |

索引：

- `userId + createdAt`
- `status`

### 13.8 ExportJob

用于 Settings 的数据导出，MVP 也可先同步返回文件，后续再落表。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | 是 | 主键 |
| userId | string | 是 | 所属用户 |
| type | enum | 是 | conversations、knowledge、all |
| status | enum | 是 | pending、running、completed、failed |
| format | enum | 是 | json、zip |
| storageKey | string | 否 | 导出文件路径 |
| errorMessage | string | 否 | 失败原因 |
| createdAt | DateTime | 是 | 创建时间 |
| finishedAt | DateTime | 否 | 完成时间 |

## 14. 枚举建议

```ts
type ConversationStatus = 'active' | 'archived' | 'deleted';
type MessageRole = 'user' | 'assistant' | 'system' | 'tool';
type MessageStatus = 'pending' | 'streaming' | 'completed' | 'failed' | 'interrupted';
type ProviderType = 'llm' | 'tts' | 'asr' | 'embedding' | 'avatar';
type TestStatus = 'success' | 'failed';
type DocumentStatus = 'uploaded' | 'parsing' | 'chunked' | 'embedded' | 'failed';
type ToolCallStatus = 'pending' | 'running' | 'success' | 'failed';
type AvatarDriver = 'static' | 'live2d' | 'vrm';
type ResourceStatus = 'active' | 'disabled' | 'deleted';
type PromptType = 'system' | 'chat' | 'summary' | 'translate' | 'custom';
type RuntimeMetricType = 'chat' | 'tts' | 'asr' | 'embedding' | 'rag';
type RuntimeMetricStatus = 'success' | 'failed' | 'interrupted';
type PlaygroundRunType = 'chat' | 'events' | 'logs' | 'metrics';
type JobStatus = 'pending' | 'running' | 'completed' | 'failed';
```

## 15. 实现阶段

已完成或当前 MVP 必须保留：

- User
- Conversation
- Message
- ProviderConfig
- AppSetting
- KnowledgeBase
- Document
- DocumentChunk

P1 页面扩展：

- RuntimeMetric
- UsageDailyStat
- AvatarProfile
- PlaygroundRun

P2 管理能力：

- PromptTemplate
- PromptVersion
- ModelPreset
- ExportJob

Tool Calling 阶段：

- Tool
- ToolCall
