# 安全与部署约束

## 1. 安全目标

MVP 虽然是个人开源项目，也必须避免以下风险：

- API Key 泄露
- 用户上传危险文件
- Tool Calling 执行危险操作
- Provider 被恶意刷成本
- 前端暴露服务端密钥
- 部署环境不支持长连接导致流式能力异常

## 2. API Key 管理

### 2.1 存储原则

- API Key 只能在服务端保存。
- 前端接口只返回 `hasApiKey: true/false`。
- 数据库中保存加密后的 `apiKeyEncrypted`。
- `.env` 只保存本地默认 Provider 或加密密钥。

### 2.2 加密建议

MVP 可使用对称加密：

```text
PROVIDER_SECRET_KEY=...
```

约束：

- `PROVIDER_SECRET_KEY` 不能提交到 Git。
- `.env.example` 只给字段名，不给真实值。
- 如果密钥丢失，已保存 Provider API Key 无法解密，应提示用户重新配置。

## 3. 环境变量

`.env.example` 至少包含：

```bash
DATABASE_URL=
PROVIDER_SECRET_KEY=
DEFAULT_LLM_BASE_URL=
DEFAULT_LLM_API_KEY=
DEFAULT_LLM_MODEL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

规则：

- `NEXT_PUBLIC_` 前缀变量才允许进入浏览器。
- 任何 API Key 都不能使用 `NEXT_PUBLIC_`。
- 文档必须明确提醒不要提交 `.env`。

## 4. 文件上传安全

### 4.1 文件限制

| 限制 | MVP 建议 |
| --- | --- |
| 单文件大小 | 10MB |
| 单次上传数量 | 5 |
| 支持类型 | txt、md、pdf |
| 暂不支持 | docx、xlsx、图片 OCR |

### 4.2 校验规则

- 校验 MIME Type。
- 校验扩展名。
- 文件名规范化，避免路径穿越。
- 不直接信任浏览器传来的文件类型。
- 上传后存储为内部 `storageKey`，不使用原始文件名作为路径。

### 4.3 文档解析安全

- PDF 解析放在服务端。
- 解析失败要记录错误，不阻塞其他文档。
- 不执行文档中的任何脚本或宏。

## 5. Tool Calling 安全

Tool Calling 不进入 MVP，但设计时必须保留边界。

### 5.1 白名单

只允许注册过的工具被调用：

```ts
const allowedTools = ['weather.search', 'document.search'];
```

### 5.2 参数校验

每个工具必须有 JSON Schema。

调用前：

- 校验参数类型
- 校验必填字段
- 校验长度
- 校验枚举值

### 5.3 禁止能力

默认禁止：

- 执行任意 shell
- 读取任意本地文件
- 发送邮件
- 删除云端数据
- 修改权限
- 发起支付

如果未来支持高风险工具，必须加入人工确认。

## 6. 成本控制

### 6.1 请求限制

MVP 建议：

| 项 | 限制 |
| --- | --- |
| 单次输入长度 | 4000 字符 |
| 单次输出上限 | 2000 tokens |
| LLM 超时 | 60 秒 |
| TTS 超时 | 30 秒 |
| 连续请求间隔 | 1 秒 |

### 6.2 用量记录

Message metadata 记录：

```json
{
  "provider": "deepseek",
  "model": "deepseek-chat",
  "inputTokens": 100,
  "outputTokens": 200,
  "durationMs": 1800
}
```

后续可扩展：

- 每日 token 统计
- 每日 TTS 字符数
- Provider 成本估算

## 7. RAG 安全

RAG P1 实现时注意：

- 删除文档必须同步删除 chunks 和 vectors。
- 检索结果必须限制 topK。
- Prompt 注入文档内容时要标记为 untrusted context。
- 不允许知识库文档覆盖系统指令。

建议 Prompt 结构：

```text
System Instruction

User Question

Retrieved Context (untrusted)
```

## 8. 前端安全

- 渲染 Markdown 时禁用原始 HTML。
- 外链默认 `target="_blank"` + `rel="noreferrer"`.
- 不在 localStorage 保存 API Key。
- 错误提示不展示完整 Provider 响应体，避免泄露密钥。
- 音频 URL 如需鉴权，不使用永久公开地址。

## 9. 部署约束

## 9.1 Vercel

Vercel 适合 MVP，但要注意：

- Serverless 函数有执行时长限制。
- SSE 可以用，但长时间连接不稳定时要降级。
- 文件上传不能长期存在本地文件系统。
- 生产环境建议接对象存储。

适合：

- 文本流式聊天
- Provider 配置
- 小文件上传
- 文档站

不适合：

- 长时间音频流
- 重型文档解析
- 长任务后台队列

## 9.2 数据库

推荐：

- Supabase Postgres
- Neon Postgres
- 本地 Docker Postgres

pgvector 要求：

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 9.3 文件存储

MVP 本地开发：

```text
storage/uploads
storage/audio
```

生产建议：

- S3
- R2
- Supabase Storage

## 10. 流式能力部署

### 10.1 SSE

MVP 使用 SSE，原因：

- 简单
- 浏览器原生支持
- 适合 LLM 单向输出

限制：

- 不适合双向实时语音
- 移动网络断开需要重试
- Serverless 环境可能受时长限制

### 10.2 WebSocket

P1 或 v1.0 再考虑 WebSocket。

适用：

- 实时语音
- Barge-in
- Avatar 实时动作同步
- Debug Timeline

## 11. 降级策略

| 能力 | 失败时降级 |
| --- | --- |
| LLM | 展示错误，允许重试 |
| TTS | 保留文本，不播放语音 |
| Avatar | 静态头像 |
| RAG | 普通 LLM 回答 |
| ASR | 回到文本输入 |
| Tool | 跳过工具，提示失败 |

## 12. MVP 发布检查清单

- `.env` 未提交。
- `.env.example` 完整。
- README 有启动步骤。
- Provider API Key 不出现在前端。
- 上传文件有限制。
- `/api/chat` 支持中断。
- Provider 调用有超时。
- 错误信息不会泄露密钥。
- 数据库 migration 可执行。
- Vercel 部署说明可用。

