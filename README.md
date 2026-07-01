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

## Current Status

This repository is in MVP implementation. The current app includes streaming chat, DeepSeek/OpenAI-compatible Provider support, mock TTS playback, static Avatar state, Prisma persistence, and conversation history.

## Quick Start

```bash
npm install
npm run db:generate
docker compose up -d postgres
npm run db:migrate
npm run dev
```

Open http://127.0.0.1:3000.

Use this local database URL:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/digital_talk?schema=public"
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

## Local Services

```bash
docker compose up -d postgres
docker compose stop postgres
docker compose start postgres
```
