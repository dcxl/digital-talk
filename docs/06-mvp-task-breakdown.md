# MVP 任务拆分

## 1. MVP 目标

MVP 只验证一个核心闭环：

```text
用户输入文本
-> LLM 流式回答
-> TTS 生成语音
-> Avatar 根据状态变化
-> 保存会话消息
```

不追求企业完整功能，先保证项目可运行、可演示、可开源。

## 2. 里程碑

| 里程碑 | 目标 | 交付物 |
| --- | --- | --- |
| M0 | 项目初始化 | Next.js、规范、基础 UI |
| M1 | 对话闭环 | 流式聊天、消息列表 |
| M2 | Provider 抽象 | LLM/TTS/Avatar Provider |
| M3 | 数字人体验 | Avatar 状态、语音播放 |
| M4 | 数据持久化 | 会话、消息、配置 |
| M5 | 开源完善 | README、示例配置、部署文档 |
| M6 | 页面体系扩展 | Dashboard、History、Knowledge、Models 独立页面 |
| M7 | 高级工作台 | Avatar、Prompt、Playground、Settings、About |
| M8 | 官网与登录 | Landing、Login、文档站入口 |

## 3. M0 项目初始化

### 任务 0.1 初始化 Next.js

交付物：

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint
- Prettier

验收：

- `pnpm dev` 可启动
- 首页可访问
- 基础 lint 通过

### 任务 0.2 初始化 UI 系统

交付物：

- shadcn/ui
- 基础 layout
- Button、Input、Textarea、Dialog、Tabs、Toast

验收：

- 首页能渲染基础布局
- 明暗主题可选，非必须持久化

### 任务 0.3 目录结构

交付物：

```text
app/
components/
features/
core/
providers/
services/
types/
```

验收：

- 页面、业务模块、Provider、Runtime 边界清晰

## 4. M1 对话闭环

### 任务 1.1 聊天 UI

交付物：

- `ChatMessageList`
- `ChatMessageItem`
- `Composer`
- 空状态建议问题

验收：

- 用户可输入并发送消息
- 用户消息立即展示
- assistant 消息支持流式追加

### 任务 1.2 `/api/chat` 流式接口

交付物：

- `POST /api/chat`
- SSE 或 ReadableStream
- 支持中断

验收：

- 前端能逐字接收回答
- 请求失败有错误提示
- 停止按钮能中断生成

### 任务 1.3 Conversation Runtime

交付物：

- `ConversationRuntime`
- 消息生命周期
- Runtime 事件

验收：

- Runtime 可串联 UI、LLM、TTS、Avatar
- UI 不直接调用具体 Provider

## 5. M2 Provider 抽象

### 任务 2.1 Provider 类型定义

交付物：

- `LLMProvider`
- `TTSProvider`
- `AvatarProvider`
- `ProviderError`

验收：

- 类型能覆盖 MVP 调用链路
- 具体 Provider 可替换

### 任务 2.2 OpenAI Compatible LLM Provider

交付物：

- 支持 `baseUrl`
- 支持 `apiKey`
- 支持 `model`
- 支持 streaming

验收：

- 可接入 OpenAI Compatible 接口
- 可接入 DeepSeek 或通义兼容接口

### 任务 2.3 TTS Provider

交付物：

- 文本转音频
- 返回 `audioUrl` 或 `audioBuffer`

验收：

- assistant 完成回答后可播放语音
- TTS 失败不影响文本回答展示

### 任务 2.4 Static Avatar Provider

交付物：

- idle
- thinking
- speaking
- error

验收：

- Avatar 状态随 Runtime 事件变化
- 没有真实模型也能展示数字人体验

## 6. M3 数字人体验

### 任务 3.1 Avatar Stage

交付物：

- Avatar 展示区
- 状态徽标
- 基础动画

验收：

- 首页第一屏能看到数字人
- thinking 和 speaking 状态有明显变化

### 任务 3.2 音频播放

交付物：

- `AudioPlayer`
- 播放状态管理
- 停止播放

验收：

- TTS 返回后自动播放
- 用户可打断播放
- 打断后 Avatar 回到 idle 或 thinking

### 任务 3.3 Barge-in 基础版

交付物：

- 用户输入新问题时停止当前播放
- 停止当前生成

验收：

- 连续提问不会出现多个音频叠加
- 被打断消息状态标记为 interrupted

## 7. M4 数据持久化

### 任务 4.1 Prisma 初始化

交付物：

- Prisma
- PostgreSQL 连接
- 初始 schema

验收：

- migration 可执行
- 本地数据库可连接

### 任务 4.2 会话与消息表

交付物：

- User
- Conversation
- Message

验收：

- 新会话可保存
- 消息可保存
- 刷新页面后可恢复历史会话

### 任务 4.3 Provider 配置表

交付物：

- ProviderConfig
- 配置读写 API
- Provider 测试 API

验收：

- 页面可保存 baseUrl、model 等配置
- API Key 不暴露到前端

## 8. M5 开源完善

### 任务 5.1 README

交付物：

- 项目介绍
- 功能列表
- 快速开始
- 环境变量说明

验收：

- 新用户能按 README 启动项目

### 任务 5.2 示例配置

交付物：

- `.env.example`
- 示例 Provider 配置

验收：

- 不提交真实密钥
- 配置项说明清晰

### 任务 5.3 部署文档

交付物：

- Vercel 部署说明
- 数据库配置说明
- 常见问题

验收：

- 用户能按文档部署基础版本

## 9. M6 页面体系扩展

### 任务 6.1 App Shell 与 Sidebar

交付物：

- 全局 Sidebar
- 页面标题区
- GitHub / About / Settings 入口
- 当前路由高亮

验收：

- Dashboard、Conversation、History、Knowledge、Models 可通过 Sidebar 切换。
- 移动端 Sidebar 可收起或进入 Drawer。

### 任务 6.2 Dashboard 仪表盘

交付物：

- Conversations 指标
- Knowledge Docs 指标
- Avg. Latency 指标
- Tokens Today 指标
- Runtime Status
- Recent Conversations

验收：

- 能从已有数据库读取会话数、文档数。
- Provider 状态可基于配置和测试结果展示。

### 任务 6.3 History 会话历史独立页

交付物：

- 会话表格
- 搜索
- 收藏
- 归档
- 删除

验收：

- 支持打开会话进入 Conversation。
- 删除使用软删除。

### 任务 6.4 Knowledge 知识库独立页

交付物：

- 知识库列表
- 文档上传
- 文档表格
- Chunk 数与处理状态
- 检索测试面板

验收：

- 上传文本类文档后可检索。
- 检索结果可被 `/api/chat` 注入 RAG 上下文。

### 任务 6.5 Models 模型管理独立页

交付物：

- LLM / Embedding / TTS / ASR Tabs
- Provider 列表
- 配置表单
- Test Connection

验收：

- 能替代当前 Provider Drawer。
- API Key 仍只在服务端加密保存。

## 10. M7 高级工作台

### 任务 7.1 Avatar 数字人配置页

交付物：

- Avatar 列表
- 预览区
- Driver / Voice / Language / Background 配置

验收：

- Static Avatar 可配置。
- Live2D / VRM 先作为禁用选项保留。

### 任务 7.2 Prompt 提示词管理页

交付物：

- Prompt 列表
- Prompt 编辑器
- 版本管理
- Variables 面板
- Test Panel

验收：

- System Prompt 可保存并参与 `/api/chat`。
- 变量缺失时有校验提示。

### 任务 7.3 Playground 调试中心

交付物：

- Chat 调试
- Runtime Events
- Logs
- Metrics
- 参数调节

验收：

- 可复用现有 `/api/chat`。
- 能显示 streaming 事件、Token、Latency。

### 任务 7.4 Settings / About

交付物：

- General Settings
- Data Export
- Danger Zone
- About 项目信息

验收：

- 可导出 conversations 和 knowledge metadata。
- About 展示版本、License、Repository。

## 11. M8 官网与登录

### 任务 8.1 Landing Page

交付物：

- Hero
- 数字人视觉
- 能力卡片
- GitHub / Docs / Get Started 入口

验收：

- 未登录用户默认进入 Landing。
- Get Started 进入 Login 或 Dashboard。

### 任务 8.2 Login Page

交付物：

- GitHub OAuth 按钮
- Google OAuth 按钮
- Email / Password 表单

验收：

- MVP 可保持默认用户。
- 后续接入 Auth 时不影响现有数据模型。

## 12. 建议 Issue 拆分

| Issue | 标题 | 优先级 |
| --- | --- | --- |
| 1 | Initialize Next.js project | P0 |
| 2 | Add base UI layout | P0 |
| 3 | Build chat message UI | P0 |
| 4 | Implement streaming chat API | P0 |
| 5 | Add Conversation Runtime | P0 |
| 6 | Define Provider interfaces | P0 |
| 7 | Implement OpenAI Compatible LLM Provider | P0 |
| 8 | Implement basic TTS Provider | P0 |
| 9 | Implement Static Avatar Provider | P0 |
| 10 | Add audio playback and interrupt | P0 |
| 11 | Add Prisma and database schema | P1 |
| 12 | Persist conversations and messages | P1 |
| 13 | Add Provider config page | P1 |
| 14 | Add README quick start | P1 |
| 15 | Add deployment guide | P1 |
| 16 | Add app shell and sidebar navigation | P1 |
| 17 | Add dashboard overview page | P1 |
| 18 | Add standalone history page | P1 |
| 19 | Add standalone knowledge page | P1 |
| 20 | Add standalone models page | P1 |
| 21 | Add avatar configuration page | P2 |
| 22 | Add prompt management page | P2 |
| 23 | Add playground debug center | P2 |
| 24 | Add settings and about pages | P2 |
| 25 | Add landing and login pages | P3 |

## 13. 不进入 MVP 的任务

- Tool Calling
- Live2D
- VRM / Three.js
- 多租户
- 权限系统
- 复杂管理后台

这些能力进入 Beta 或 v1.0。

## 14. MVP 完成定义

MVP 完成时必须满足：

- 可以从 README 启动项目。
- 首页有数字人展示。
- 用户能发送文本问题。
- LLM 能流式回答。
- 回答能生成并播放语音。
- Avatar 能根据 idle、thinking、speaking 切换状态。
- 会话和消息能保存。
- 至少支持一个 OpenAI Compatible LLM Provider。
- 代码结构足够清晰，能继续扩展 ASR、RAG、Tool Calling。
