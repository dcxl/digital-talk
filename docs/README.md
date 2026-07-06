# AI Character Platform Architecture Series

AI Character Platform 是一个面向个人开发者的开源 AI 角色平台。

它不是单纯的数字人聊天 Demo，而是一个用于创建、管理、运行 AI Character 的平台。角色可以通过文生图、图生图创建，并绑定记忆、知识库、工作流、语音、表现层和不同运行场景。

## 文档目录

- [01 产品设计与原型文档](./01-product-design.md)
- [02 技术架构草案](./02-technical-architecture.md)
- [03 页面级原型细节](./03-page-prototypes.md)
- [04 数据表字段设计](./04-data-model.md)
- [05 Provider 接口设计](./05-provider-interfaces.md)
- [06 MVP 任务拆分](./06-mvp-task-breakdown.md)
- [07 事件模型](./07-event-model.md)
- [08 Runtime 状态机](./08-state-machine.md)
- [09 API 契约](./09-api-contracts.md)
- [10 安全与部署约束](./10-security-deployment.md)
- [11 部署指南](./11-deployment.md)
- [12 v0.2 Digital Human Core 阶段文档](./12-v0.2-digital-human-core.md)
- [13 v0.3 Realtime Digital Human 路线](./13-v0.3-realtime-roadmap.md)
- [14 v0.4 Avatar Runtime 路线](./14-v0.4-avatar-runtime-roadmap.md)
- [15 v0.5 Realtime Transport 路线](./15-v0.5-realtime-transport-roadmap.md)
- [16 AI Character Platform 产品重构](./16-ai-character-platform-redesign.md)

## 当前设计原则

1. 个人开发优先：先做可完成、可演示、可开源的核心闭环。
2. 角色优先于运行时：Live2D、TTS、ASR、RAG、Workflow 都服务于 Character。
3. 文档先行：先完成产品与架构设计，再进入开发。
4. 不过度工程化：Next.js 全栈单仓库起步，后续有真实复用需求再拆 monorepo。
5. 不依赖 Dify/Coze 作为核心：可以作为竞品与能力参考，但项目核心要自己沉淀框架能力。

## 阶段目标

| 阶段 | 目标 |
| --- | --- |
| v0.1 MVP | 角色对话页面、文本聊天、流式 LLM、Mock TTS、基础角色状态 |
| v0.2 Character Runtime Core | 真实 TTS、角色资产、角色形象生成、口型/音频同步 |
| v0.3 Realtime Character | ASR 语音输入、Realtime Session、低延迟 TTS、barge-in |
| v0.4 Character Appearance Runtime | Live2D 资产、真实角色渲染、口型同步、runtime fallback |
| v0.5 Character Platform Core | AI 角色库、角色工坊、场景绑定、角色记忆、工作流基础 |
| Beta | VRM、WebRTC、RAG 增强、Tool Calling |
| v1.0 | 插件化工具、文档站、示例应用、生产部署基线 |
