# 页面级原型细节

## 1. 页面总览

原型图覆盖 12 个页面。产品实现按阶段推进：MVP 先保证核心对话闭环，P1 补齐工作台与知识库，P2 再完善官网、Prompt、模型与调试中心。

| 页面 | 路由 | 目标 |
| --- | --- | --- |
| Landing Page 项目官网首页 | `/` 或 `/landing` | 对外介绍项目能力，引导登录或 GitHub |
| Login Page 登录页面 | `/login` | 登录工作区 |
| Dashboard 仪表盘首页 | `/dashboard` | 展示会话、知识库、模型、延迟、Token 等运行概览 |
| Conversation 对话页面 | `/conversation` | 核心数字人对话与 RAG/ASR/TTS 闭环 |
| History 会话历史 | `/history` | 管理历史会话、收藏、归档、删除 |
| Avatar 数字人配置 | `/avatar` | 管理数字人形象、语音、场景和预览 |
| Knowledge 知识库管理 | `/knowledge` | 上传文档、查看切片和向量化状态、检索测试 |
| Prompt 提示词管理 | `/prompts` | 管理系统 Prompt、Chat Prompt 和变量 |
| Models 模型管理 | `/models` | 管理 LLM、Embedding、TTS、ASR Provider |
| Playground 调试中心 | `/playground` | 调试 Prompt、模型参数、事件、日志和指标 |
| Settings 系统设置 | `/settings` | 工作区、API Key、导出、安全和系统配置 |
| About 关于页面 | `/about` | 项目信息、版本、License、仓库链接 |

### 1.1 阶段优先级

| 阶段 | 页面 |
| --- | --- |
| MVP | Conversation、History、Knowledge 基础入口、Models/Provider 基础配置、Settings 基础环境配置 |
| P1 | Dashboard、Avatar、Knowledge 完整管理、Playground 基础调试 |
| P2 | Landing、Login、Prompt、About、Models 多 Provider 标签 |

## 2. Landing Page 项目官网首页

### 2.1 页面目标

对外介绍项目定位，承接 GitHub、Docs、Playground、登录入口。

### 2.2 首屏内容

- 项目名称：Next Digital Human
- 标语：Build Production-Ready AI Digital Humans
- 主按钮：Get Started
- 次按钮：Star on GitHub
- 右侧数字人视觉
- 能力卡片：AI Native、Real-time、Extensible、Production Ready
- 技术栈入口：Next.js、LangChain、Live2D、Tailwind CSS、Prisma

### 2.3 交互

- Get Started：未登录进入 Login，已登录进入 Dashboard。
- Star on GitHub：打开 GitHub 仓库。
- Docs / Blog / Playground：进入对应文档或调试页面。

## 3. Login Page 登录页

### 3.1 页面目标

让用户进入工作区，后续可接 Auth。MVP 可先保留默认用户。

### 3.2 登录方式

- GitHub OAuth
- Google OAuth
- Email + Password

### 3.3 表单状态

| 状态 | 表现 |
| --- | --- |
| idle | 表单可输入 |
| loading | Sign in 按钮 loading |
| error | 展示登录失败 |
| success | 跳转 Dashboard |

## 4. Dashboard 仪表盘首页

### 4.1 页面目标

提供运行态总览，让用户快速看到项目是否可用、最近会话是否正常、模型和知识库是否在线。

### 4.2 布局

```text
┌─────────────────────────────────────────────────────────────┐
│ Sidebar                                                     │
│ ├ Dashboard           ┌────────┬────────┬────────┬────────┐ │
│ ├ Conversation        │ Conv.  │ Docs   │ Latency│ Tokens │ │
│ ├ History             └────────┴────────┴────────┴────────┘ │
│ ├ Avatar              ┌────────────────┬──────────────────┐ │
│ ├ Knowledge           │ Runtime Status │ Recent Conv.     │ │
│ ├ Prompt              └────────────────┴──────────────────┘ │
│ ├ Models              ┌────────────────┬──────────────────┐ │
│ └ Settings            │ Token Usage    │ System Info      │ │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 指标卡片

| 指标 | 说明 |
| --- | --- |
| Conversations | 总会话数与趋势 |
| Knowledge Docs | 已上传文档数与变化 |
| Avg. Latency | 平均响应耗时 |
| Tokens Today | 当日 Token 使用量 |

### 4.4 Runtime Status

展示 Provider 健康状态：

- LLM Provider：如 DeepSeek V3
- TTS Provider：如 CosyVoice
- ASR Provider：如 Whisper
- Embedding Provider：如 BAAI/bge-m3

状态值：

- Online
- Degraded
- Offline

## 5. Conversation 对话页面

### 5.1 页面目标

让用户一进入页面就能完成一次数字人对话闭环：输入问题、看到流式回复、听到语音、看到 Avatar 状态变化。

### 5.2 桌面布局

```text
┌─────────────────────────────────────────────────────────────┐
│ Sidebar / Conversation List        │ Avatar + Chat Panel    │
│ - New Conversation                 │ - Avatar Preview       │
│ - Search conversations             │ - Status toolbar       │
│ - Session list                     │ - Message stream       │
│ - View all history                 │ - Composer             │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 核心交互

| 区域 | 交互 |
| --- | --- |
| 会话栏 | 新建会话、搜索会话、切换会话、进入全部历史 |
| Avatar 区 | 显示 speaking/listening/thinking 状态，可切换全屏或预览模式 |
| 消息区 | 用户消息、Assistant 消息、流式输出、RAG 引用状态 |
| Composer | 文本输入、语音输入、发送、停止生成 |

### 5.4 状态与交互

| 状态 | UI 表现 | 可操作项 |
| --- | --- | --- |
| idle | Avatar 待机，输入框可用 | 输入、录音、切换模型 |
| listening | 麦克风高亮，显示录音波形 | 停止录音 |
| thinking | 输入框禁用，显示生成中 | 停止生成 |
| streaming | 消息逐字出现 | 停止生成 |
| speaking | Avatar 说话，显示音频波形 | 打断播报 |
| interrupted | 当前音频停止，进入新请求 | 等待下一状态 |
| error | 展示错误提示 | 重试、修改配置 |

## 6. History 会话历史页

### 6.1 页面目标

管理历史会话，支持用户恢复上下文。

### 6.2 布局

```text
┌────────────────────────────────────────┐
│ Header: Conversations / New            │
├────────────────────────────────────────┤
│ Search                                 │
├────────────────────────────────────────┤
│ Conversation List                      │
│ - Title                                │
│ - Last Message                         │
│ - Updated Time                         │
│ - Delete                               │
└────────────────────────────────────────┘
```

### 6.3 字段展示

| 字段 | 说明 |
| --- | --- |
| 会话标题 | 默认取第一条用户消息 |
| 最近消息 | 最近一条 assistant 或 user 消息 |
| 更新时间 | 最近消息时间 |
| 消息数量 | 可选展示 |
| 收藏状态 | Starred 会话标记 |
| 状态 | Active、Archived、Deleted |

### 6.4 交互

- 新建会话：跳转首页并创建空会话
- 点击会话：恢复该会话上下文
- 搜索：按标题和消息摘要过滤
- 删除：二次确认后删除
- 收藏：将常用会话加入 Starred
- 归档：不删除但从默认列表隐藏

## 7. Avatar 数字人配置页

### 7.1 页面目标

管理数字人角色、渲染类型、声音、语言和背景场景。

### 7.2 布局

```text
┌─────────────────────────────────────────────────────────────┐
│ Avatar List │ Preview Stage              │ Configuration   │
│ - Emily     │ - Avatar preview           │ - Driver        │
│ - Luna      │ - Preview button           │ - Voice         │
│ - Noah      │ - Camera/action controls   │ - Language      │
│ - Add       │                            │ - Background    │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 配置项

| 字段 | 说明 |
| --- | --- |
| Driver | Static、Live2D、VRM |
| Voice | 绑定 TTS 声音 |
| Language | 默认语言 |
| Animation | idle、thinking、speaking 基础动作 |
| Background | 工作区、客厅、纯色等场景 |

## 8. Knowledge 知识库页

### 8.1 页面目标

让用户完成文档上传、解析、向量化和检索测试。

### 8.2 布局

```text
┌────────────────────────────────────────┐
│ Header: Knowledge Base / Upload        │
├────────────────────────────────────────┤
│ Upload Area                            │
├────────────────────────────────────────┤
│ Document Table                         │
├────────────────────────────────────────┤
│ Retrieval Test                         │
└────────────────────────────────────────┘
```

### 8.3 文档表格

| 列 | 说明 |
| --- | --- |
| 文件名 | 原始文件名 |
| 类型 | pdf、txt、md、docx |
| 大小 | 文件大小 |
| 状态 | uploaded、parsing、embedded、failed |
| Chunk 数 | 切片数量 |
| 更新时间 | 最后处理时间 |
| 操作 | 重新处理、删除、检索测试 |

### 8.4 底部指标

| 指标 | 说明 |
| --- | --- |
| Total Files | 文档总数 |
| Total Chunks | 切片总数 |
| Embedding Model | 当前向量模型 |
| Embedding Progress | 处理进度 |

### 8.5 检索测试

输入一个问题，展示：

- 命中的文档
- 命中的 Chunk
- Score
- Rerank 后顺序
- 最终注入 Prompt 的上下文

## 9. Prompt 提示词管理页

### 9.1 页面目标

管理系统提示词、业务提示词和变量，支持版本化与测试。

### 9.2 布局

```text
┌─────────────────────────────────────────────────────────────┐
│ Prompt List      │ Editor                       │ Test Panel │
│ - System Prompt  │ - version                    │ - user msg │
│ - Chat Prompt    │ - prompt body                │ - AI output│
│ - Summary Prompt │ - variables                  │            │
└─────────────────────────────────────────────────────────────┘
```

### 9.3 核心能力

- 新建 Prompt
- 新建版本
- 设置默认版本
- 变量声明与校验
- 输入测试消息并查看输出

### 9.4 内置变量

| 变量 | 说明 |
| --- | --- |
| `char_name` | 数字人名称 |
| `user_name` | 当前用户名称 |
| `knowledge_context` | RAG 注入上下文 |
| `conversation_summary` | 会话摘要 |

## 10. Models 模型管理页

### 10.1 页面目标

用统一方式配置 LLM、Embedding、TTS、ASR Provider。

### 10.2 布局

```text
┌─────────────────────────────────────────────────────────────┐
│ Tabs: LLM / Embedding / TTS / ASR                           │
├─────────────────────────────┬───────────────────────────────┤
│ Model List                  │ Config Form                   │
│ - DeepSeek V3               │ - API Key                     │
│ - Qwen2.5-72B               │ - Base URL                    │
│ - GPT-4o                    │ - Model                       │
│ - Claude                    │ - Temperature                 │
└─────────────────────────────┴───────────────────────────────┘
```

### 10.3 配置项

| 字段 | 说明 |
| --- | --- |
| enabled | 是否启用 |
| provider | openai、deepseek、qwen、azure、custom |
| baseUrl | OpenAI Compatible 接口地址 |
| apiKey | 密钥，后端加密存储 |
| model | 模型名称 |
| options | JSON 扩展配置 |

### 10.4 测试能力

- LLM：发送一句测试 prompt
- TTS：合成一句测试语音
- ASR：上传短音频测试转写
- Embedding：输入文本查看向量维度

## 11. Playground 调试中心

### 11.1 页面目标

用于调试模型、Prompt、事件流、日志和指标。

### 11.2 布局

```text
┌─────────────────────────────────────────────────────────────┐
│ Tabs: Chat / Events / Logs / Metrics                        │
├──────────────────────┬──────────────────────────────────────┤
│ Input                │ Output                               │
│ - System Prompt      │ - Streaming result                   │
│ - User message       │ - Tokens / Latency                   │
│ - Parameters         │                                      │
└──────────────────────┴──────────────────────────────────────┘
```

### 11.3 调试项

| 项 | 说明 |
| --- | --- |
| Chat | 直接测试 Prompt + Provider 输出 |
| Events | 查看 Runtime 事件流 |
| Logs | 查看 API 调用和错误 |
| Metrics | 查看 Token、延迟、成功率 |

## 12. Settings 系统设置页

### 12.1 页面目标

管理应用级配置，不做复杂后台。

### 12.2 配置项

| 配置 | 说明 |
| --- | --- |
| Workspace Name | 工作区名称 |
| Theme | Dark、Light、System |
| Language | zh-CN、en-US |
| Time Zone | 默认时区 |
| Auto Save | 是否自动保存 |
| Export Conversations | 导出会话 |
| Export Knowledge | 导出知识库 |
| Delete Workspace | 删除工作区 |

## 13. About 关于页

### 13.1 页面目标

展示项目信息、版本、License、仓库和社交链接。

### 13.2 字段

| 字段 | 说明 |
| --- | --- |
| Version | 当前版本 |
| License | MIT |
| Repository | GitHub 地址 |
| Website | 官网地址 |

## 14. 全局导航

### 14.1 Sidebar 菜单

```text
Dashboard
Conversation
History
Avatar
Knowledge
Prompt
Models
Playground
Settings
About
GitHub
```

### 14.2 顶部状态

- 当前用户头像
- 通知
- 系统状态
- 快捷设置

## 15. 响应式规则

| 断点 | 行为 |
| --- | --- |
| Desktop | Sidebar 固定，主内容双栏或三栏 |
| Tablet | Sidebar 收起为 icon rail，主内容自适应 |
| Mobile | Sidebar 进入 drawer，核心页面单列 |

## 16. MVP 页面裁剪

MVP 仍然不需要一次性实现 12 个完整页面。实现顺序建议：

1. Conversation：当前核心页继续完善。
2. History：从当前会话 chip 演进为独立页面。
3. Knowledge：从当前内嵌控件演进为独立管理页。
4. Models：从 Provider Drawer 演进为独立页面。
5. Dashboard：汇总已有运行数据。
6. Playground：复用 `/api/chat` 与 Runtime 事件。
7. Avatar、Prompt、Settings、About。
8. Landing、Login。

## 17. 全局错误设计

| 错误 | 处理 |
| --- | --- |
| Provider 未配置 | 引导到 Models 或 Provider 配置 |
| LLM 调用失败 | 展示错误并允许重试 |
| TTS 失败 | 文本仍保留，只提示语音失败 |
| ASR 失败 | 保留录音失败提示，可重新录音 |
| RAG 无结果 | 降级为普通 LLM 回答 |
| Avatar 加载失败 | 降级为静态头像 |

## 18. 旧页面映射

| 旧名称 | 新名称 |
| --- | --- |
| Provider 配置页 | Models 模型管理页 |
| 会话列表页 | History 会话历史页 |
| 数字人对话页 | Conversation 对话页面 |
| 设置页 | Settings 系统设置页 |
