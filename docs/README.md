# Next Digital Human Architecture Series

Next Digital Human 是一个面向个人开发者的开源 AI 数字人框架。

它不是单纯的数字人聊天 Demo，而是一个可渐进扩展的 AI Digital Human Framework。第一阶段重点验证文本对话、流式输出、语音播放和基础 Avatar 表现；后续再逐步加入 ASR、RAG、Tool Calling、Provider 插件化和更完整的数字人驱动能力。

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

## 当前设计原则

1. 个人开发优先：先做可完成、可演示、可开源的核心闭环。
2. 框架优先于应用：业务示例可以简单，但底层能力要可替换、可扩展。
3. 文档先行：先完成产品与架构设计，再进入开发。
4. 不过度工程化：Next.js 全栈单仓库起步，后续有真实复用需求再拆 monorepo。
5. 不依赖 Dify/Coze 作为核心：可以作为竞品与能力参考，但项目核心要自己沉淀框架能力。

## 阶段目标

| 阶段 | 目标 |
| --- | --- |
| MVP | 数字人页面、文本聊天、流式 LLM、TTS 播放、基础 Avatar 状态 |
| Beta | ASR 语音输入、RAG 知识库、会话历史、Provider 抽象 |
| v1.0 | Tool Calling、插件化工具、状态机、文档站、示例应用 |
