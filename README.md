# Next Digital Human

Next Digital Human is an open source AI digital human framework.

It is designed for building AI applications with digital avatars, streaming conversations, TTS, ASR, RAG, Tool Calling, and pluggable providers.

## Documentation

- [Architecture Series](./docs/README.md)
- [Product Design](./docs/01-product-design.md)
- [Technical Architecture](./docs/02-technical-architecture.md)
- [Page Prototypes](./docs/03-page-prototypes.md)
- [Data Model](./docs/04-data-model.md)
- [Provider Interfaces](./docs/05-provider-interfaces.md)
- [MVP Task Breakdown](./docs/06-mvp-task-breakdown.md)
- [Event Model](./docs/07-event-model.md)
- [Runtime State Machine](./docs/08-state-machine.md)
- [API Contracts](./docs/09-api-contracts.md)
- [Security and Deployment Constraints](./docs/10-security-deployment.md)
- [Deployment Guide](./docs/11-deployment.md)

## Current Status

This repository is in MVP implementation. The current app includes streaming chat, DeepSeek/OpenAI-compatible Provider support, mock TTS playback, static Avatar state, Prisma persistence, and conversation history.

## Quick Start

```bash
npm install
cp .env.example .env
npm run db:generate
docker compose up -d postgres
npm run db:migrate
npm run dev
```

Open http://127.0.0.1:3000.

Use this local database URL in `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/digital_talk?schema=public"
```

Generate a Provider encryption key:

```bash
openssl rand -base64 32
```

Put the value into:

```env
PROVIDER_SECRET_KEY="replace_with_generated_value"
```

For DeepSeek:

```env
LLM_PROVIDER=openai-compatible
DEFAULT_LLM_BASE_URL="https://api.deepseek.com/v1"
DEFAULT_LLM_API_KEY="your_deepseek_key"
DEFAULT_LLM_MODEL="deepseek-chat"
```

## Scripts

- `npm run dev`: start local development server
- `npm run build`: create production build
- `npm run lint`: run ESLint
- `npm run format`: format files with Prettier
- `npm run db:generate`: generate Prisma client
- `npm run db:migrate`: apply local Prisma migrations
- `npm run db:studio`: open Prisma Studio
- `npm run test`: run unit tests

## Local Services

```bash
docker compose up -d postgres
docker compose stop postgres
docker compose start postgres
```

## Environment Variables

| Name | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PROVIDER_SECRET_KEY` | Yes | 32+ character secret for encrypting Provider API keys |
| `LLM_PROVIDER` | No | `mock` or `openai-compatible` |
| `DEFAULT_LLM_BASE_URL` | For real LLM | OpenAI-compatible chat completions base URL |
| `DEFAULT_LLM_API_KEY` | For real LLM | LLM API key, never expose to client |
| `DEFAULT_LLM_MODEL` | For real LLM | Model name, for example `deepseek-chat` |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL |

Do not commit `.env`.

## Deployment

See [Deployment Guide](./docs/11-deployment.md).
