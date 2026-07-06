# 产品设计与原型文档

## 1. 产品定位

AI Character Platform 是一个开源 AI 角色平台，帮助用户创建、管理和运行 AI Character。角色可以拥有形象、声音、人格、知识库、记忆体系、工作流和不同运行场景。

一句话定位：

> An open source AI Character Platform for creating, managing and running AI characters with memory, knowledge, voice, appearance and workflows.

## 2. 目标用户

| 用户 | 诉求 |
| --- | --- |
| AI 应用开发者 | 快速学习和复用 AI 角色平台架构 |
| 前端开发者 | 通过完整项目掌握 AI 应用开发能力 |
| 企业 Demo 制作者 | 快速搭建客服、导购、培训类 AI 角色原型 |
| 内容创作者 | 创建主播、陪伴、知识助手等可运行角色 |
| 开源贡献者 | 基于 Provider 接口扩展模型、语音、外观或工具能力 |

## 3. 产品边界

### MVP 要做

- AI 角色平台首页
- 文本输入与流式回复
- LLM Provider 接入
- TTS Provider 接入
- 音频播放
- 角色基础状态：idle、thinking、speaking
- 会话消息列表
- 基础配置页

### MVP 不做

- 复杂多租户
- 商业化计费
- 视频级真人生成
- 完整后台管理系统
- Dify/Coze 工作流复刻
- 企业级权限体系

## 4. 核心场景

### 场景 1：文本对话角色

用户输入问题，系统以流式文本返回答案，并驱动角色进入思考和说话状态。

流程：

```text
用户输入
-> 创建会话消息
-> 调用 LLM
-> 流式返回文本
-> 更新聊天 UI
-> 生成 TTS
-> 播放音频
-> 角色进入 speaking
```

### 场景 2：语音问答

用户点击麦克风说话，系统识别语音后进入同样的对话链路。

流程：

```text
用户语音
-> ASR 转文本
-> LLM 生成回答
-> TTS 合成语音
-> 角色播放说话动画
```

### 场景 3：知识库问答

用户上传文档，系统完成切片、向量化、检索和增强回答。

流程：

```text
上传文档
-> 文档解析
-> Chunk 切片
-> Embedding
-> 向量入库
-> 用户提问
-> 检索 + Rerank
-> LLM 基于上下文回答
```

### 场景 4：工具调用

用户提出需要外部能力的问题，系统通过 Tool Calling 调用工具。

示例：

```text
查询天气
查询订单
生成日报
调用 CRM 查询客户
```

## 5. 页面原型

### 5.1 Landing Page 项目官网首页

- 项目定位与能力介绍
- AI 角色平台视觉展示
- Get Started / GitHub / Docs 入口
- 角色生成、统一角色库、场景运行、记忆与工作流能力卡片

### 5.2 Login Page 登录页

- GitHub 登录
- Google 登录
- Email + Password 登录
- MVP 可暂时使用默认用户跳过真实登录

### 5.3 Dashboard 仪表盘首页

- Conversations、Knowledge Docs、Avg. Latency、Tokens Today 指标
- Runtime Status：LLM、TTS、ASR、Embedding Provider 状态
- Recent Conversations
- Token Usage 趋势
- System Info

### 5.4 Conversation 角色运行页面

核心区域：

- 左侧：会话列表、搜索、历史入口
- 中间：角色展示区
- 右侧或底部：聊天消息区
- 底部：文本输入、语音输入、发送按钮
- 顶部：状态、工具、设置入口

关键状态：

| 状态 | 说明 |
| --- | --- |
| idle | 等待用户输入 |
| listening | 正在听用户说话 |
| thinking | LLM 正在生成 |
| speaking | TTS 播放中，角色说话 |
| interrupted | 用户打断当前播报 |
| error | 模型、语音或网络调用失败 |

### 5.5 History 会话历史页

- 展示历史会话
- 支持新建会话
- 支持删除会话
- 支持继续上下文对话
- 支持收藏、归档、过滤

### 5.6 Character Library 角色库

- AI 角色列表
- 角色档案
- 角色资产
- 外观：Static 角色图、ComfyUI 生成资产、历史兼容 Avatar Runtime
- Voice、Language、Persona、Background 配置

### 5.7 Character Studio 角色工坊

- 文本创建角色
- 参考图创建角色
- ComfyUI workflow 生成角色图
- 角色设定生成
- 形象资产绑定
- 声音与表现层配置

### 5.8 Scene 场景页

- 知识库助手
- 主播角色
- 闲聊陪伴助手
- 业务工作流助手
- 场景 Prompt、Knowledge、Workflow 权限配置

### 5.9 Memory 角色记忆页

- 长期记忆
- 会话摘要
- 用户偏好
- 关系事实
- 记忆来源、删除、禁用

### 5.10 Workflow 工作流页

- 工具列表
- 触发条件
- 权限控制
- 执行日志
- 失败重试

### 5.11 Knowledge 知识库页

- 文档上传
- 文档列表
- 解析状态
- 切片数量
- 向量化状态
- 检索测试入口

### 5.12 Prompt 提示词管理页

- System Prompt
- Chat Prompt
- Summary Prompt
- Translate Prompt
- Custom Prompt
- 变量管理
- 版本管理和测试面板

### 5.13 Providers 服务商管理页

- LLM Provider
- Embedding Provider
- TTS Provider
- ASR Provider
- Image Generation Provider

每个 Provider 支持：

- 启用 / 禁用
- API Key 配置
- 模型名称
- 基础连通性测试

### 5.14 Playground 调试中心

- Chat 调试
- Runtime Events
- Logs
- Metrics
- 参数调节
- Token / Latency 统计

### 5.15 Settings 系统设置页

- General Settings
- API Keys
- Providers
- Workspace
- Members
- Billing
- Security
- System
- Data Export
- Danger Zone

### 5.16 About 关于页

- 项目信息
- Version
- License
- Repository
- Website

### 5.17 Provider / Tool 工具页

- 工具列表
- 工具启用状态
- 工具参数 Schema
- 调用日志

## 6. 信息架构

```text
AI Character Platform
├── Landing
├── Login
├── Dashboard
├── Character Library
├── Character Studio
├── Scenes
├── Conversation Runtime
├── Memory
├── Workflows
├── Knowledge
├── Prompt
├── Providers
│   ├── LLM
│   ├── Embedding
│   ├── TTS
│   ├── Image Generation
│   └── ASR
├── Playground
├── Settings
├── About
└── GitHub
```

## 7. 优先级

| 优先级 | 能力 |
| --- | --- |
| P0 | Character Library、Conversation Runtime、文本聊天、流式输出、基础角色状态、TTS 播放 |
| P1 | Character Studio、Knowledge、Providers、ASR、RAG、角色资产 |
| P2 | Memory、Scenes、Prompt、Playground、Tool Calling、Barge-in |
| P3 | Workflow、权限、商业化、复杂场景、多角色协作 |

## 8. 成功标准

- 用户可以创建和管理 AI 角色。
- 用户输入问题后能获得流式回答。
- 回答完成后能播放语音。
- 角色能根据状态变化做基础表现。
- 角色可以绑定知识库、记忆和场景。
- Provider 可以替换，不和具体厂商强绑定。
- 项目结构清晰，适合作为 GitHub 开源项目长期维护。
