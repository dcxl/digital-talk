# 部署指南

## 1. 推荐部署形态

MVP 推荐：

- Web：Vercel
- Database：Supabase Postgres 或 Neon Postgres
- Provider：DeepSeek / OpenAI Compatible

本项目依赖 PostgreSQL，生产环境不要使用本地 Docker 数据库。

## 2. 环境变量

生产环境至少配置：

```env
DATABASE_URL=
PROVIDER_SECRET_KEY=
LLM_PROVIDER=openai-compatible
DEFAULT_LLM_BASE_URL=
DEFAULT_LLM_API_KEY=
DEFAULT_LLM_MODEL=
NEXT_PUBLIC_APP_URL=
```

要求：

- `PROVIDER_SECRET_KEY` 至少 32 个字符。
- `DEFAULT_LLM_API_KEY` 只能配置在服务端环境变量中。
- 不要提交 `.env`。

## 3. Vercel 步骤

1. 导入 GitHub 仓库。
2. Build Command 使用 `npm run build`。
3. Install Command 使用 `npm install`。
4. 配置上面的环境变量。
5. 首次部署前或部署后执行数据库 migration。

## 4. 数据库 Migration

本地连接生产数据库后执行：

```bash
npm run db:migrate
```

如果使用 CI/CD，后续可以改成 `prisma migrate deploy`。

## 5. 发布前检查

- `.env` 未提交。
- `.env.example` 不含真实密钥。
- `npm run lint` 通过。
- `npm run test` 通过。
- `npm run build` 通过。
- `/` Landing Page 可打开。
- `/login` 可进入 Dashboard。
- `/api/chat` 可流式返回。
- Provider 测试接口可用。
