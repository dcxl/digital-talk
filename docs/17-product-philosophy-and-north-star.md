# AI Character Platform 产品理念与北极星

## 1. 核心理念

这个项目不是“数字人 Demo”，也不是“聊天机器人套壳”，而是：

```text
AI Character Platform
一个用于创建、管理、运行 AI Character 的平台。
```

平台的核心对象是 `Character`。
ComfyUI 角色外观生成、声音合成、知识库、记忆、工作流、模型 Provider 都只是让 Character 更完整、更可运行的能力。

最终产品应该让用户完成三件事：

1. 创建角色：通过文本、图片、设定、声音和人格创建 AI Character。
2. 管理角色：统一管理角色资产、设定、记忆、知识、工作流和运行权限。
3. 运行角色：让角色在知识库助手、主播、闲聊助手、客服、教学等场景中工作。

## 2. 一句话产品定位

面向开发者和创作者的 AI Character Platform，用于把一个角色从“设定”变成“可对话、可记忆、可执行任务、可在不同场景运行”的 AI 应用单元。

更短版本：

```text
Create once, run anywhere as an AI Character.
```

## 3. 为什么不是单纯数字人

“数字人”容易把产品焦点带到形象、口型、动画、Live2D、WebRTC。
这些能力重要，但它们不是产品本体。

后续主线不再继续投入 Live2D。Live2D 只作为历史兼容能力保留；角色外观生成和资产生产改为围绕 ComfyUI 工作流设计。

真正的产品本体是角色：

| 能力 | 在平台中的定位 |
| --- | --- |
| ComfyUI 文生图 / 图生图 | 角色外观生成方式 |
| 静态图 / 序列帧 / 后续视频资产 | 角色表现层 |
| TTS / ASR | 角色语音输入输出 |
| LLM | 角色大脑 |
| Prompt | 角色人格和行为边界 |
| Knowledge | 角色可访问的知识 |
| Memory | 角色长期沉淀的上下文 |
| Workflow | 角色可执行的任务能力 |
| Scene | 角色运行的应用场景 |

判断标准：

```text
如果一个能力不能增强 Character 的创建、管理或运行，它就不是当前阶段核心。
```

## 4. Character 的定义

一个 AI Character 至少由以下部分组成：

| 模块 | 说明 |
| --- | --- |
| Identity | 名称、角色类型、简介、标签、用途 |
| Appearance | 头像、静态图、ComfyUI 生成资产、背景、视觉风格 |
| Voice | TTS Provider、音色、语言、语速、情绪策略 |
| Persona | 系统提示词、说话风格、边界、禁忌、角色目标 |
| Knowledge | 绑定的知识库、文档、检索策略 |
| Memory | 长期记忆、会话摘要、用户偏好、关系事实 |
| Workflow | 可调用任务、触发条件、权限、执行日志 |
| Runtime | 当前运行状态、会话、事件流、表现状态 |
| Provider | LLM、TTS、ASR、Embedding、图像生成等服务配置 |

角色不是一张图，也不是一个 prompt，而是这些能力的组合体。

## 5. 核心用户

### 开发者

诉求：

- 快速搭建 AI 角色应用。
- 复用角色、记忆、知识库、工作流能力。
- 清楚理解 Provider、Runtime、Workflow 的工程边界。

### 内容创作者 / 主播运营者

诉求：

- 创建具有固定人格和外观的 AI 主播或陪伴角色。
- 能够配置话术、声音、直播场景和任务。
- 能持续沉淀粉丝互动记忆。

### 企业 Demo / 业务应用制作者

诉求：

- 创建知识库助手、客服、导购、培训角色。
- 角色能访问业务知识并执行工作流。
- 可演示、可扩展、可替换 Provider。

## 6. 核心场景

### 场景 A：知识库助手

角色绑定某个知识库，用固定人格回答问题。

```text
Character + Persona + Knowledge + Memory
-> 面向用户提供知识问答
```

关键点：

- 回答不只是检索结果，而是角色用自己的表达方式解释。
- 角色记住用户的偏好和历史问题。
- 支持把常见问题沉淀为记忆或知识补充建议。

### 场景 B：主播角色

角色拥有外观、声音、话术和场景任务。

```text
Character + Appearance + Voice + Scene + Workflow
-> 进行播报、互动、商品介绍、脚本生成
```

关键点：

- 主播不是只会说话的 Avatar，而是有目标和任务的角色。
- 可绑定脚本生成、评论总结、商品查询、话题续写等工作流。

### 场景 C：闲聊陪伴助手

角色以长期陪伴为目标，重视记忆和关系。

```text
Character + Persona + Memory + Conversation
-> 形成持续互动体验
```

关键点：

- 记忆是核心，不只是聊天历史。
- 角色需要记住用户偏好、重要事件、关系状态。
- 记忆必须可查看、可删除、可禁用。

### 场景 D：业务工作流角色

角色通过对话触发任务。

```text
Character + Workflow + Provider + Permission
-> 查询、生成、通知、审核、发布
```

关键点：

- 工作流是角色能力，不是孤立自动化。
- 每个工作流要有触发条件、权限边界和执行日志。

## 7. 产品原则

### 原则 1：角色优先

所有功能都必须回答一个问题：

```text
它如何帮助用户创建、管理或运行一个 Character？
```

### 原则 2：能力模块化

角色能力要可插拔：

- 外观优先通过 ComfyUI 生成或上传静态资产，Live2D 不再作为后续主线。
- TTS Provider 可以替换。
- LLM Provider 可以替换。
- 场景可以切换。
- 工作流可以增删。

### 原则 3：场景驱动

不要只做“聊天页”。
同一个角色在不同场景下应该有不同上下文、权限和输出形式。

### 原则 4：记忆可治理

记忆不能是黑盒。

必须支持：

- 查看记忆来源。
- 删除错误记忆。
- 禁用某类记忆。
- 区分会话记忆、长期记忆、用户偏好、角色事实。

### 原则 5：工作流有边界

工作流不能无限自动执行。
必须有权限、确认、日志和失败回滚策略。

### 原则 6：运行时服务于体验

ASR、TTS、ComfyUI 外观生成、Realtime 都是体验层能力。
它们要服务角色运行，而不是主导产品路线。

## 8. 当前不做什么

MVP 阶段不做：

- 不做完整图像生成平台。
- 不继续建设 Live2D 编辑、上传、驱动主线。
- 不做 Dify / Coze 工作流复刻。
- 不做复杂多租户和商业计费。
- 不做本地大模型管理平台。
- 不做视频级真人数字人生成。
- 不做角色社区和交易市场。

这些方向可以未来扩展，但当前会稀释核心闭环。

## 9. 产品结构

建议后续产品主结构：

```text
AI Character Platform
├── Character Library
│   ├── Character Profile
│   ├── Character Assets
│   ├── Persona
│   └── Voice / Appearance
├── Character Studio
│   ├── Text-to-Character
│   ├── Image-to-Character
│   └── Asset Binding
├── Scenes
│   ├── Knowledge Assistant
│   ├── Host / Live
│   ├── Chat Companion
│   └── Business Assistant
├── Memory
│   ├── Long-term Memory
│   ├── Session Summary
│   ├── User Preference
│   └── Relationship Facts
├── Workflows
│   ├── Tools
│   ├── Triggers
│   ├── Permissions
│   └── Execution Logs
└── Runtime
    ├── Conversation
    ├── LLM
    ├── TTS / ASR
    ├── Static Appearance Runtime
    └── Realtime Events
```

## 10. 后续版本路线

### v0.5 Character Platform Core

目标：把产品对象从 Avatar 迁移到 Character。

交付：

- Character Profile 数据模型设计。
- 角色库页面升级。
- 角色创建流程。
- 角色与场景绑定。
- 角色运行时明确 `characterId`。

### v0.6 Character Memory

目标：建立单角色记忆体系。

交付：

- 长期记忆表。
- 会话摘要。
- 记忆写入策略。
- 记忆管理 UI。
- 对话时注入角色记忆。

### v0.7 Scene Runtime

目标：角色可以进入不同场景运行。

交付：

- Scene 数据模型。
- 知识库助手场景。
- 主播场景。
- 闲聊助手场景。
- 每个场景独立 prompt、knowledge、workflow 权限。

### v0.8 Workflow Runtime

目标：角色具备可控任务执行能力。

交付：

- Workflow 定义。
- Tool 调用。
- 执行日志。
- 用户确认机制。
- 失败状态和重试。

### Beta

目标：打磨角色体验。

交付：

- 更稳定的 realtime transport。
- 更完整的 ComfyUI 角色资产生成和静态表现。
- 更细的 provider 插件化。
- 示例角色和示例场景。

## 11. 成功标准

一个版本是否符合理念，看这些问题：

- 用户是否能清楚创建一个 AI Character？
- 角色是否能被统一管理，而不是散落在对话、prompt、资产中？
- 角色是否有独立记忆？
- 角色是否能绑定不同场景？
- 角色是否能执行有限、可追踪的工作流？
- 运行时能力是否服务于角色，而不是压过角色？

如果这些问题答案是否定的，就说明产品又偏回了“技术能力堆叠”。

## 12. 当前执行约束

暂时不调用 `image_gen`。
图像生成能力后续以 ComfyUI Provider / Workflow 方式接入；当前开发先支持上传图片和手动角色设定。

当前优先级：

1. 明确产品理念。
2. 修正旧文档定位。
3. 设计 Character 数据模型。
4. 再进入 v0.5 Character Platform Core 开发。
