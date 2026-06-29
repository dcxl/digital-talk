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

### 5.1 首页 / 数字人对话页

核心区域：

- 左侧或中间：Avatar 展示区
- 右侧或底部：聊天消息区
- 底部：文本输入、语音输入、发送按钮
- 顶部：模型选择、会话选择、设置入口

关键状态：

| 状态 | 说明 |
| --- | --- |
| idle | 等待用户输入 |
| listening | 正在听用户说话 |
| thinking | LLM 正在生成 |
| speaking | TTS 播放中，Avatar 说话 |
| interrupted | 用户打断当前播报 |
| error | 模型、语音或网络调用失败 |

### 5.2 会话页

- 展示历史会话
- 支持新建会话
- 支持删除会话
- 支持继续上下文对话

### 5.3 知识库页

- 文档上传
- 文档列表
- 解析状态
- 切片数量
- 向量化状态
- 检索测试入口

### 5.4 Provider 配置页

- LLM Provider
- TTS Provider
- ASR Provider
- Embedding Provider
- Avatar Provider

每个 Provider 支持：

- 启用 / 禁用
- API Key 配置
- 模型名称
- 基础连通性测试

### 5.5 工具页

- 工具列表
- 工具启用状态
- 工具参数 Schema
- 调用日志

## 6. 信息架构

```text
Next Digital Human
├── Home
│   ├── Avatar
│   ├── Chat
│   └── Input
├── Conversations
├── Knowledge Base
├── Providers
│   ├── LLM
│   ├── TTS
│   ├── ASR
│   ├── Embedding
│   └── Avatar
├── Tools
├── Settings
└── Docs
```

## 7. 优先级

| 优先级 | 能力 |
| --- | --- |
| P0 | 文本聊天、流式输出、基础 Avatar、TTS 播放 |
| P1 | ASR、RAG、会话历史、Provider 配置 |
| P2 | Tool Calling、Barge-in、口型同步、文档站 |
| P3 | 多租户、权限、商业化、复杂工作流 |

## 8. 成功标准

- 访问首页即可看到可交互数字人。
- 用户输入问题后能获得流式回答。
- 回答完成后能播放语音。
- Avatar 能根据状态变化做基础动画。
- Provider 可以替换，不和具体厂商强绑定。
- 项目结构清晰，适合作为 GitHub 开源项目长期维护。

