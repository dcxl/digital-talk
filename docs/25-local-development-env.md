# 本地开发与环境变量

## 1. 必需服务

v0.5 本地开发至少需要：

| 服务 | 必需 | 用途 |
| --- | --- | --- |
| PostgreSQL | 是 | Prisma 主数据库 |
| Redis | 可选 | Realtime session 缓存 |
| ComfyUI | 可选 | 角色外观生成 |
| DeepSeek / OpenAI Compatible | 可选 | LLM |
| Bailian CosyVoice | 可选 | TTS |
| Bailian / OpenAI Compatible ASR | 可选 | ASR |

未配置 LLM/TTS/ASR 时，系统应回退 mock provider。

## 2. Docker

当前 `docker-compose.yml` 应至少包含：

```text
postgres
redis
```

启动：

```bash
docker compose up -d postgres redis
```

检查：

```bash
docker compose ps
```

## 3. Database

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/digital_talk?schema=public"
```

常用命令：

```bash
npx prisma generate
npx prisma migrate dev
npm run build
```

## 4. Redis

```env
REDIS_URL=redis://localhost:6379
```

Redis 只作为加速和 session store，不应成为普通文本对话的硬依赖。

## 5. LLM

推荐 OpenAI Compatible 形式：

```env
LLM_PROVIDER=openai-compatible
DEFAULT_LLM_BASE_URL=
DEFAULT_LLM_API_KEY=
DEFAULT_LLM_MODEL=
```

DeepSeek 示例：

```env
LLM_PROVIDER=openai-compatible
DEFAULT_LLM_BASE_URL=https://api.deepseek.com
DEFAULT_LLM_MODEL=deepseek-chat
```

API Key 只写本地 `.env`，不要写入文档和提交。

## 6. TTS

Mock：

```env
TTS_PROVIDER=mock
```

百炼 CosyVoice：

```env
TTS_PROVIDER=bailian-cosyvoice
DEFAULT_TTS_BASE_URL=wss://dashscope.aliyuncs.com/api-ws/v1/inference
DEFAULT_TTS_API_KEY=
DEFAULT_TTS_MODEL=cosyvoice-v3-flash
DEFAULT_TTS_VOICE=
DEFAULT_TTS_FORMAT=mp3
DEFAULT_TTS_SAMPLE_RATE=22050
TTS_CACHE_ENABLED=true
```

缓存策略：

- 开发阶段默认开启 TTS cache。
- 同一段文本、voice、model 命中缓存时不重复调用 TTS。
- 缓存固定写入 `storage/tts-cache`，不再通过 env 覆盖目录，避免 Next build 文件追踪范围扩大。

## 7. ASR

Mock：

```env
ASR_PROVIDER=mock
```

百炼实时 ASR：

```env
ASR_PROVIDER=dashscope-asr
DEFAULT_ASR_BASE_URL=wss://dashscope.aliyuncs.com/api-ws/v1/inference
DEFAULT_ASR_API_KEY=
DEFAULT_ASR_MODEL=fun-asr-realtime
DEFAULT_ASR_LANGUAGE=zh
DEFAULT_ASR_FORMAT=wav
DEFAULT_ASR_SAMPLE_RATE=16000
```

## 8. ComfyUI

未启用：

```env
COMFYUI_PROVIDER=disabled
COMFYUI_MOCK=false
```

Mock：

```env
COMFYUI_PROVIDER=mock
COMFYUI_MOCK=true
COMFYUI_WORKFLOW_ID=mock-character-appearance
```

远端或本地 ComfyUI：

```env
COMFYUI_PROVIDER=remote
COMFYUI_MOCK=false
COMFYUI_BASE_URL=http://127.0.0.1:8188
COMFYUI_API_KEY=
COMFYUI_WORKFLOW_ID=default-character-appearance
```

约束：

- ComfyUI 不是必需服务。
- 未启用时 UI 只显示配置入口。
- 真实调用只允许后端使用受控 workflow 模板。

## 9. .env.example 更新规则

每新增一个 env：

1. 更新 `.env.example`。
2. 更新本文件。
3. 默认值必须可本地启动。
4. 不提交真实 API Key。

## 10. 本地验收命令

```bash
npm run test
npm run lint
npm run build
```

如果涉及数据库：

```bash
npx prisma migrate dev
```
