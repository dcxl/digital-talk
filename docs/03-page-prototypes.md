# 页面级原型细节

## 1. 页面总览

MVP 阶段只保留最小但完整的产品面：

| 页面 | 路由 | 目标 |
| --- | --- | --- |
| 数字人对话页 | `/` | 核心演示入口 |
| 会话列表页 | `/conversations` | 管理历史对话 |
| 知识库页 | `/knowledge` | 上传文档并查看处理状态 |
| Provider 配置页 | `/providers` | 配置模型、语音、Avatar 能力 |
| 设置页 | `/settings` | 项目基础设置 |

## 2. 数字人对话页

### 2.1 页面目标

让用户一进入页面就能完成一次数字人对话闭环：输入问题、看到流式回复、听到语音、看到 Avatar 状态变化。

### 2.2 桌面布局

```text
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo / Model Select / Session / Settings            │
├───────────────────────────────┬─────────────────────────────┤
│ Avatar Stage                  │ Chat Panel                  │
│ - Avatar                      │ - Message List              │
│ - Current State               │ - Streaming Answer          │
│ - Voice Visualizer            │ - Tool/RAG Context Hint     │
│ - Interrupt Button            │                             │
├───────────────────────────────┴─────────────────────────────┤
│ Composer: Textarea / Mic / Send / Stop                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 移动端布局

```text
┌────────────────────────┐
│ Header                 │
├────────────────────────┤
│ Avatar Stage           │
├────────────────────────┤
│ Chat Message List      │
├────────────────────────┤
│ Composer               │
└────────────────────────┘
```

移动端 Avatar 区域高度固定，避免聊天内容被挤压。

### 2.4 组件清单

| 组件 | 说明 |
| --- | --- |
| `AppHeader` | Logo、模型选择、会话入口、设置入口 |
| `AvatarStage` | Avatar 渲染容器 |
| `AvatarStatusBadge` | 显示 idle、thinking、speaking 等状态 |
| `VoiceVisualizer` | 播放或录音时的音频动效 |
| `ChatMessageList` | 消息流展示 |
| `ChatMessageItem` | 单条消息 |
| `StreamingMessage` | 流式输出中的 assistant 消息 |
| `Composer` | 输入框、语音按钮、发送按钮、停止按钮 |
| `ContextIndicator` | 显示是否使用知识库或工具 |

### 2.5 状态与交互

| 状态 | UI 表现 | 可操作项 |
| --- | --- | --- |
| idle | Avatar 待机，输入框可用 | 输入、录音、切换模型 |
| listening | 麦克风高亮，显示录音波形 | 停止录音 |
| thinking | 输入框禁用，显示生成中 | 停止生成 |
| streaming | 消息逐字出现 | 停止生成 |
| speaking | Avatar 说话，显示音频波形 | 打断播报 |
| interrupted | 当前音频停止，进入新请求 | 等待下一状态 |
| error | 展示错误提示 | 重试、修改配置 |

### 2.6 空状态

首次进入页面展示：

- Avatar 待机
- 3 个建议问题
- Provider 未配置时展示配置引导

建议问题：

```text
介绍一下你自己
如何接入一个新的 LLM Provider？
帮我基于知识库回答问题
```

## 3. 会话列表页

### 3.1 页面目标

管理历史会话，支持用户恢复上下文。

### 3.2 布局

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

### 3.3 字段展示

| 字段 | 说明 |
| --- | --- |
| 会话标题 | 默认取第一条用户消息 |
| 最近消息 | 最近一条 assistant 或 user 消息 |
| 更新时间 | 最近消息时间 |
| 消息数量 | 可选展示 |

### 3.4 交互

- 新建会话：跳转首页并创建空会话
- 点击会话：恢复该会话上下文
- 搜索：按标题和消息摘要过滤
- 删除：二次确认后删除

## 4. 知识库页

### 4.1 页面目标

让用户完成文档上传、解析、向量化和检索测试。

### 4.2 布局

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

### 4.3 文档表格

| 列 | 说明 |
| --- | --- |
| 文件名 | 原始文件名 |
| 类型 | pdf、txt、md、docx |
| 大小 | 文件大小 |
| 状态 | uploaded、parsing、embedded、failed |
| Chunk 数 | 切片数量 |
| 更新时间 | 最后处理时间 |
| 操作 | 重新处理、删除、检索测试 |

### 4.4 检索测试

输入一个问题，展示：

- 命中的文档
- 命中的 Chunk
- Score
- Rerank 后顺序
- 最终注入 Prompt 的上下文

## 5. Provider 配置页

### 5.1 页面目标

用统一方式配置 LLM、TTS、ASR、Embedding、Avatar。

### 5.2 布局

```text
┌────────────────────────────────────────┐
│ Header: Providers                      │
├───────────────┬────────────────────────┤
│ Provider Tabs │ Provider Config Form   │
│ - LLM         │ - Enabled              │
│ - TTS         │ - Base URL             │
│ - ASR         │ - API Key              │
│ - Embedding   │ - Model                │
│ - Avatar      │ - Test Button          │
└───────────────┴────────────────────────┘
```

### 5.3 配置项

| 字段 | 说明 |
| --- | --- |
| enabled | 是否启用 |
| provider | openai、deepseek、qwen、azure、custom |
| baseUrl | OpenAI Compatible 接口地址 |
| apiKey | 密钥，后端加密存储 |
| model | 模型名称 |
| options | JSON 扩展配置 |

### 5.4 测试能力

- LLM：发送一句测试 prompt
- TTS：合成一句测试语音
- ASR：上传短音频测试转写
- Embedding：输入文本查看向量维度
- Avatar：触发 thinking、speaking 状态

## 6. 设置页

### 6.1 页面目标

管理应用级配置，不做复杂后台。

### 6.2 配置项

| 配置 | 说明 |
| --- | --- |
| 默认模型 | 默认 LLM Provider |
| 默认语音 | 默认 TTS Provider |
| Avatar 类型 | static、live2d、vrm |
| 是否自动播放语音 | 默认开启 |
| 是否启用知识库 | 默认关闭 |
| 是否启用工具调用 | 默认关闭 |

## 7. 全局错误设计

| 错误 | 处理 |
| --- | --- |
| Provider 未配置 | 引导到 Provider 配置页 |
| LLM 调用失败 | 展示错误并允许重试 |
| TTS 失败 | 文本仍保留，只提示语音失败 |
| ASR 失败 | 保留录音失败提示，可重新录音 |
| RAG 无结果 | 降级为普通 LLM 回答 |
| Avatar 加载失败 | 降级为静态头像 |

