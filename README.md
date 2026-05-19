# Mafia Game

A web-based [Mafia (party game)](https://en.wikipedia.org/wiki/Mafia_(party_game)) clone where the app itself is the Narrator. Built for 6–12 players with live video, voice, and text chat.

## Tech stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend:** Node.js + Socket.IO + Redis
- **Media:** LiveKit Cloud (video + voice)

## Status

🚧 Pre-alpha. See [`docs/CHANGELOG.md`](docs/CHANGELOG.md) for progress and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the system design.

## Local development

Coming as part of `feature/scaffold`. Will be:

```bash
pnpm install
docker compose up -d        # Redis
pnpm dev                    # web + server in parallel
```

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CLAUDE.md`](CLAUDE.md). All work happens on `feature/*` branches and merges to `main` only on approval.

