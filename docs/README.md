# AI Character Platform Architecture Series

AI Character Platform 是一个面向个人开发者的开源 AI 角色平台。

它不是单纯的数字人聊天 Demo，而是一个用于创建、管理、运行 AI Character 的平台。角色后续通过 ComfyUI 文生图、图生图创建，并绑定记忆、知识库、工作流、语音、表现层和不同运行场景。

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
- [17 AI Character Platform 产品理念与北极星](./17-product-philosophy-and-north-star.md)
- [18 v0.5 Character Platform Core](./18-v0.5-character-platform-core.md)
- [19 Character 数据模型与迁移设计](./19-character-data-model-and-migration.md)
- [20 ComfyUI Provider 接入设计](./20-comfyui-provider-integration.md)
- [21 Character Studio 页面级原型](./21-character-studio-page-prototype.md)
- [22 Character Runtime、Memory 与 Workflow 规则](./22-character-runtime-memory-workflow.md)
- [23 v0.5 开发落地拆分](./23-v0.5-development-breakdown.md)
- [24 Character API 详细契约](./24-character-api-contracts.md)
- [25 本地开发与环境变量](./25-local-development-env.md)
- [26 v0.5 测试与验收](./26-v0.5-test-acceptance.md)
- [27 Avatar / Live2D 退场计划](./27-avatar-live2d-deprecation.md)
- [28 v0.6 Character Motion Runtime](./28-v0.6-character-motion-runtime.md)
- [29 v0.7 Expression Asset Runtime](./29-v0.7-expression-asset-runtime.md)

## 当前设计原则

1. 个人开发优先：先做可完成、可演示、可开源的核心闭环。
2. 角色优先于运行时：ComfyUI、TTS、ASR、RAG、Workflow 都服务于 Character。
3. 文档先行：先完成产品与架构设计，再进入开发。
4. 不过度工程化：Next.js 全栈单仓库起步，后续有真实复用需求再拆 monorepo。
5. 不依赖 Dify/Coze 作为核心：可以作为竞品与能力参考，但项目核心要自己沉淀框架能力。

## 阶段目标

| 阶段 | 目标 |
| --- | --- |
| v0.1 MVP | 角色对话页面、文本聊天、流式 LLM、Mock TTS、基础角色状态 |
| v0.2 Character Runtime Core | 真实 TTS、角色资产、角色形象生成、口型/音频同步 |
| v0.3 Realtime Character | ASR 语音输入、Realtime Session、低延迟 TTS、barge-in |
| v0.4 Character Appearance Runtime | 历史 Live2D 验证、真实角色渲染、口型同步、runtime fallback |
| v0.5 Character Platform Core | AI 角色库、ComfyUI 角色工坊、场景绑定、角色记忆、工作流基础 |
| v0.6 Character Motion Runtime | 静态角色状态动作、口型/音量联动、表现层 adapter 边界 |
| v0.7 Expression Asset Runtime | 状态表情图/短视频资产、运行时资产选择、ComfyUI 资产绑定 |
| Beta | ComfyUI 工作流增强、WebRTC、RAG 增强、Tool Calling |
| v1.0 | 插件化工具、文档站、示例应用、生产部署基线 |

## 文档状态

- 当前产品北极星：`17-product-philosophy-and-north-star.md`
- 当前开发主线：`29-v0.7-expression-asset-runtime.md`
- v0.5 执行规格：`19` 到 `27`
- v0.6 执行规格：`28`
- v0.7 执行规格：`29`
- `02` 到 `11` 为历史基线架构文档，可能保留 Avatar / 数字人术语；后续实现时以 Character 作为产品对象进行解释和迁移。
- `12` 到 `15` 为历史运行时路线，保留用于追溯 TTS、ASR、Live2D、Realtime 设计。Live2D 不再作为后续主线；外观生成改为 ComfyUI Provider / Workflow。
