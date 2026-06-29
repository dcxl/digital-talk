# 技术架构草案

## 1. 技术选型

个人开源版优先使用 Next.js 全栈架构，降低项目复杂度。

| 模块 | 选型 |
| --- | --- |
| Web 框架 | Next.js + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| AI 编排 | LangChain / LangGraph 可选 |
| 数据库 | PostgreSQL |
| ORM | Prisma |
| 向量能力 | pgvector 起步 |
| LLM | OpenAI compatible / DeepSeek / 通义千问 |
| TTS | OpenAI compatible / CosyVoice / Azure TTS |
| ASR | Whisper compatible / FunASR |
| Avatar | Live2D 起步，后续支持 VRM + Three.js |
| 流式通信 | SSE 起步，必要时 WebSocket |

## 2. 为什么先不用 monorepo

MVP 阶段不需要 monorepo。Next.js 已经能承载页面、API、服务层、AI 编排和数据访问。

推荐先采用单仓库模块化目录：

```text
app/
components/
features/
  avatar/
  chat/
  conversation/
  knowledge/
  models/
  prompt/
core/
  runtime/
  pipeline/
  events/
providers/
  llm/
  tts/
  asr/
  avatar/
services/
  vector/
  storage/
  database/
docs/
examples/
scripts/
```

未来满足以下条件再升级 monorepo：

- Provider 需要独立发布 npm 包
- Avatar Runtime 需要被其他项目复用
- 文档站、示例项目、核心包需要独立构建
- 贡献者规模扩大，模块边界稳定

## 3. 运行时架构

```text
User
-> UI Layer
-> Conversation Runtime
-> Pipeline
   -> ASR Provider
   -> RAG Retriever
   -> LLM Provider
   -> TTS Provider
   -> Avatar Runtime
-> Event Bus
-> UI State
```

## 4. 核心模块

### Conversation Runtime

负责一次对话的完整生命周期：

- 接收用户输入
- 创建消息
- 管理上下文
- 触发 RAG
- 调用 LLM
- 处理流式响应
- 触发 TTS
- 通知 Avatar 状态变化

### Provider Layer

所有外部服务都通过 Provider 接口接入：

```ts
export interface LLMProvider {
  id: string;
  name: string;
  chat(input: ChatInput): AsyncIterable<ChatChunk>;
}

export interface TTSProvider {
  id: string;
  name: string;
  synthesize(input: TTSInput): Promise<TTSResult>;
}

export interface ASRProvider {
  id: string;
  name: string;
  transcribe(input: ASRInput): Promise<ASRResult>;
}
```

### Avatar Runtime

Avatar 不直接关心 LLM、TTS、ASR，只接收状态事件：

```text
avatar.idle
avatar.thinking
avatar.speaking.start
avatar.speaking.end
avatar.interrupted
avatar.error
```

第一阶段可用 Live2D 或静态 Avatar + CSS 动画实现，先保证状态驱动架构正确。

## 5. 状态机

```text
idle
-> listening
-> thinking
-> speaking
-> idle

任意状态
-> interrupted
-> thinking

任意状态
-> error
-> idle
```

## 6. 数据模型草案

核心表：

- User
- Conversation
- Message
- KnowledgeBase
- Document
- DocumentChunk
- ProviderConfig
- Tool
- ToolCall

关系：

```text
User 1--n Conversation
Conversation 1--n Message
KnowledgeBase 1--n Document
Document 1--n DocumentChunk
Message 0--n ToolCall
```

## 7. API 草案

| API | 说明 |
| --- | --- |
| `POST /api/chat` | 创建对话请求，返回流式文本 |
| `POST /api/tts` | 文本转语音 |
| `POST /api/asr` | 语音转文本 |
| `POST /api/knowledge/documents` | 上传知识库文档 |
| `POST /api/knowledge/search` | 检索知识库 |
| `GET /api/providers` | 获取 Provider 配置 |
| `POST /api/providers/test` | 测试 Provider 连通性 |

## 8. MVP 开发顺序

1. 搭建 Next.js 项目与 UI 框架。
2. 完成首页布局：Avatar 区、聊天区、输入区。
3. 实现 `/api/chat` 流式返回。
4. 实现 Conversation Runtime。
5. 接入一个 LLM Provider。
6. 接入一个 TTS Provider。
7. 实现 Avatar 状态驱动。
8. 保存会话与消息。
9. 补充 README、示例配置和部署说明。

## 9. 暂缓事项

- Dify / Coze 集成：先作为竞品参考，不作为核心依赖。
- MCP：等 Tool Calling 模块稳定后再考虑。
- WebRTC：MVP 用不到，除非做低延迟实时语音。
- 复杂后台：先用配置页替代。
- 多租户：开源框架稳定后再设计。

