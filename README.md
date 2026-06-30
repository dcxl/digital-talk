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

This repository is entering the MVP implementation stage. The current app includes a first interactive digital human conversation prototype with mock streaming, TTS state, and avatar state transitions.

## Quick Start

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3000.

## Scripts

- `npm run dev`: start local development server
- `npm run build`: create production build
- `npm run lint`: run ESLint
- `npm run format`: format files with Prettier
