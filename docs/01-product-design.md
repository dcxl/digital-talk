# 产品设计与原型文档

## 1. 产品定位

Next Digital Human 是一个开源 AI 数字人框架，帮助开发者快速构建带有数字人形象、语音交互、知识库问答和工具调用能力的 AI 应用。

一句话定位：

> An open source AI digital human framework built with Next.js, LangChain, RAG, TTS, ASR and Avatar Runtime.

## 2. 目标用户

| 用户 | 诉求 |
| --- | --- |
| AI 应用开发者 | 快速学习和复用数字人应用架构 |
| 前端开发者 | 通过完整项目掌握 AI 应用开发能力 |
| 企业 Demo 制作者 | 快速搭建客服、导购、培训类数字人原型 |
| 开源贡献者 | 基于 Provider 接口扩展模型、语音、Avatar 或工具能力 |

## 3. 产品边界

### MVP 要做

- 数字人首页
- 文本输入与流式回复
- LLM Provider 接入
- TTS Provider 接入
- 音频播放
- Avatar 基础状态：idle、thinking、speaking
- 会话消息列表
- 基础配置页

### MVP 不做

- 复杂多租户
- 商业化计费
- 视频级真人数字人生成
- 完整后台管理系统
- Dify/Coze 工作流复刻
- 企业级权限体系

## 4. 核心场景

### 场景 1：文本对话数字人

用户输入问题，系统以流式文本返回答案，并驱动数字人进入思考和说话状态。

流程：

```text
用户输入
-> 创建会话消息
-> 调用 LLM
-> 流式返回文本
-> 更新聊天 UI
-> 生成 TTS
-> 播放音频
-> Avatar 进入 speaking
```

### 场景 2：语音问答

用户点击麦克风说话，系统识别语音后进入同样的对话链路。

流程：

```text
用户语音
-> ASR 转文本
-> LLM 生成回答
-> TTS 合成语音
-> Avatar 播放说话动画
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
- 数字人视觉展示
- Get Started / GitHub / Docs 入口
- AI Native、Real-time、Extensible、Production Ready 能力卡片

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

### 5.4 Conversation 对话页面

核心区域：

- 左侧：会话列表、搜索、历史入口
- 中间：Avatar 展示区
- 右侧或底部：聊天消息区
- 底部：文本输入、语音输入、发送按钮
- 顶部：状态、工具、设置入口

关键状态：

| 状态 | 说明 |
| --- | --- |
| idle | 等待用户输入 |
| listening | 正在听用户说话 |
| thinking | LLM 正在生成 |
| speaking | TTS 播放中，Avatar 说话 |
| interrupted | 用户打断当前播报 |
| error | 模型、语音或网络调用失败 |

### 5.5 History 会话历史页

- 展示历史会话
- 支持新建会话
- 支持删除会话
- 支持继续上下文对话
- 支持收藏、归档、过滤

### 5.6 Avatar 数字人配置页

- 数字人列表
- Avatar 预览
- Driver：Static、Live2D、VRM
- Voice、Language、Animation、Background 配置

### 5.7 Knowledge 知识库页

- 文档上传
- 文档列表
- 解析状态
- 切片数量
- 向量化状态
- 检索测试入口

### 5.8 Prompt 提示词管理页

- System Prompt
- Chat Prompt
- Summary Prompt
- Translate Prompt
- Custom Prompt
- 变量管理
- 版本管理和测试面板

### 5.9 Models 模型管理页

- LLM Provider
- Embedding Provider
- TTS Provider
- ASR Provider

每个 Provider 支持：

- 启用 / 禁用
- API Key 配置
- 模型名称
- 基础连通性测试

### 5.10 Playground 调试中心

- Chat 调试
- Runtime Events
- Logs
- Metrics
- 参数调节
- Token / Latency 统计

### 5.11 Settings 系统设置页

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

### 5.12 About 关于页

- 项目信息
- Version
- License
- Repository
- Website

### 5.13 工具页

- 工具列表
- 工具启用状态
- 工具参数 Schema
- 调用日志

## 6. 信息架构

```text
Next Digital Human
├── Landing
├── Login
├── Dashboard
├── Conversation
├── History
├── Avatar
├── Knowledge
├── Prompt
├── Models
│   ├── LLM
│   ├── Embedding
│   ├── TTS
│   └── ASR
├── Playground
├── Tools
├── Settings
├── About
└── GitHub
```

## 7. 优先级

| 优先级 | 能力 |
| --- | --- |
| P0 | Conversation、文本聊天、流式输出、基础 Avatar、TTS 播放 |
| P1 | History、Knowledge、Models、ASR、RAG、Provider 配置 |
| P2 | Dashboard、Avatar、Prompt、Playground、Tool Calling、Barge-in |
| P3 | Landing、Login、About、权限、商业化、复杂工作流 |

## 8. 成功标准

- 访问首页即可看到可交互数字人。
- 用户输入问题后能获得流式回答。
- 回答完成后能播放语音。
- Avatar 能根据状态变化做基础动画。
- Provider 可以替换，不和具体厂商强绑定。
- 项目结构清晰，适合作为 GitHub 开源项目长期维护。
