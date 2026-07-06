# AI Character Platform Redesign

## 1. Product Positioning

项目主定位调整为：

```text
AI Character Platform
一个用于创建、管理、运行 AI Character 的平台。
```

核心不再是“数字人运行时框架”，而是“AI 角色平台”。Live2D、TTS、ASR、RAG、Workflow 都是角色运行能力的一部分，不能反过来成为产品中心。

## 2. Product Definition

平台要解决的问题：

- 用户可以通过文生图、图生图创建 AI 角色。
- 每个角色拥有统一的角色档案、形象资产、声音、人格提示词和运行配置。
- 角色可以被放入不同场景运行，例如知识库助手、主播、闲聊陪伴、客服、教学角色。
- 每个角色拥有独立记忆体系，能沉淀长期偏好、关系、历史事实和业务上下文。
- 角色可以绑定工作流，在对话中触发查询、生成、通知、审核、发布等动作。

一句话版本：

```text
先创建角色，再为角色配置能力，最后让角色在不同场景中持续运行。
```

## 3. Core Objects

| 对象 | 定义 | 当前项目对应 |
| --- | --- | --- |
| Character | AI 角色主实体，承载身份、人格、用途和运行配置 | AvatarProfile 需要升级为 CharacterProfile |
| Character Asset | 角色图像、Live2D、VRM、声音、背景等资产 | AvatarAsset |
| Scene | 角色运行场景，例如知识库、主播、闲聊助手 | Conversation / Knowledge 后续抽象 |
| Memory | 单角色记忆，包括长期记忆、会话摘要、偏好、关系 | 后续新增 |
| Workflow | 角色可调用的任务流和工具链 | 后续新增 |
| Runtime | LLM、TTS、ASR、Avatar 渲染、事件流 | 现有 runtime 能力 |
| Provider | imagegen、LLM、TTS、ASR、Embedding 等服务商 | ProviderConfig |

## 4. Main Product Loop

### Create Character

```text
文本描述 / 参考图
-> imagegen 生成角色形象
-> 保存 Character Asset
-> 创建 Character Profile
-> 绑定声音 / 人格 / 场景 / 记忆策略
```

### Run Character

```text
用户进入某个场景
-> 选择 Character
-> 加载 Character Profile + Memory + Scene Context
-> LLM 生成回复
-> TTS 输出语音
-> Avatar Runtime 表现口型、状态、表情
-> 写入会话历史和角色记忆
```

### Extend Character

```text
角色绑定 Workflow
-> 对话中识别意图
-> 执行工具 / 任务流
-> 将结果回写回复、记忆或外部系统
```

## 5. Information Architecture

后续工作台主导航建议调整为：

| 导航 | 目的 |
| --- | --- |
| 平台概览 | 查看角色数量、场景数量、运行状态、成本和近期会话 |
| 角色库 | 统一管理所有 AI Character |
| 角色工坊 | 文生图、图生图、角色设定、声音与表现生成 |
| 场景 | 管理知识库助手、主播、闲聊助手等应用场景 |
| 对话 | 运行并测试某个角色在某个场景下的表现 |
| 记忆 | 查看和编辑角色长期记忆、会话摘要、偏好 |
| 工作流 | 管理角色可调用的工具、任务流和触发条件 |
| 知识库 | 给角色或场景绑定 RAG 内容 |
| Provider | 管理 LLM、TTS、ASR、imagegen、Embedding 服务商 |

当前阶段不需要一次性新建所有页面，但所有新增能力都应该归入这个结构。

## 6. Runtime Reframe

现有 v0.2-v0.4 的能力保留，但重新定位：

- TTS：角色声音输出能力。
- ASR：角色语音输入能力。
- Live2D：角色表现层的一种渲染驱动。
- Realtime Session：角色运行时事件通道。
- Knowledge：角色或场景的上下文来源。
- Prompt：角色人格和场景约束的一部分。

因此后续文档和 UI 文案应避免把“数字人”当成唯一产品对象，统一转向“AI 角色”。

## 7. v0.5 Direction Reset

原 v0.5 Realtime Transport 仍然有价值，但优先级下调。新的 v0.5 建议改为 Character Platform Core：

### C1 Product Shell Repositioning

- Landing、工作台导航、Dashboard、角色管理页改为 AI Character Platform 文案。
- Avatar 页面在 UI 上改为“角色库 / AI 角色管理”。
- 旧 Avatar Runtime 作为角色外观与表现层存在。

### C2 Character Data Model

- 评估是否引入 `CharacterProfile`，或先在 `AvatarProfile` 上补充 character 字段。
- 字段建议：`roleType`、`personaPromptId`、`sceneBindings`、`memoryPolicy`、`workflowBindings`、`assetIds`。
- 保持向后兼容，避免一次性破坏已完成的 Avatar runtime。

### C3 Character Studio

- 角色创建支持文生图。
- 角色创建支持图生图。
- 生成结果进入 Character Asset 库。
- 允许从资产一键创建角色或绑定到已有角色。

### C4 Scene Binding

- 新增场景类型：知识库助手、主播、闲聊助手。
- 每个场景定义输入方式、上下文来源、输出形式和工作流权限。
- Conversation 运行时必须能明确当前 `characterId` 和 `sceneId`。

### C5 Character Memory

- 每个角色独立记忆空间。
- 第一版支持会话摘要、用户偏好、角色事实。
- 记忆写入需要可追踪、可删除、可禁用。

### C6 Workflow Runtime

- 工作流先做平台内置轻量版，不急于接入复杂编排器。
- 第一版支持 query knowledge、summarize session、generate post、webhook notify。
- Workflow 执行结果要进入角色上下文或会话事件。

## 8. Visual Generation Status

暂时不调用 `image_gen` 或其他图片生成工具。
图像生成能力仍然是 AI Character Platform 的长期能力，但当前阶段只把它作为未来 Provider 接口和角色工坊能力设计，不依赖真实图片生成结果推进开发。

## 9. Acceptance

进入下一阶段前，至少满足：

- 用户第一眼能看出这是 AI Character Platform，而不是单一数字人 Demo。
- 角色库是核心入口，Avatar/Live2D 只是角色表现能力。
- 文档明确 Character、Scene、Memory、Workflow 的边界。
- 后续所有开发任务能归入 Character Platform Core，而不是继续围绕单点 runtime 发散。
