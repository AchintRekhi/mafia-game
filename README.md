# Mafia Game

A web-based [Mafia (party game)](https://en.wikipedia.org/wiki/Mafia_(party_game)) clone where the app itself is the Narrator. Built for 6–12 players with live video, voice, and text chat.

## Tech stack

- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v3 + Framer Motion + Zustand
- **Backend:** Node.js + Socket.IO (authoritative game server)
- **Media:** LiveKit Cloud (video + voice, with server-side mute)
- **Packaging:** pnpm workspaces, three packages — `apps/web`, `apps/server`, `packages/shared`

## Status

v1 playable: lobby, role assignment, night/day FSM, voting, win conditions, end-of-game reveal, rematch. See [`docs/CHANGELOG.md`](docs/CHANGELOG.md) for the full feature log and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the system design.

## Local development

```bash
pnpm install                 # installs all workspaces
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env.local
# fill apps/server/.env with LiveKit creds — see below
pnpm dev                     # runs web (:3000) and server (:4000) in parallel
```

Open http://localhost:3000.

### LiveKit setup

Video and voice run through [LiveKit Cloud](https://cloud.livekit.io). Create a free project, then copy the URL, API key, and API secret into `apps/server/.env`:

```env
LIVEKIT_URL=wss://<your-project>.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
```

Without these the lobby still works, but the `<VideoRoom />` panel shows a config hint instead of camera tiles.

## Scripts

```bash
pnpm dev          # web + server in parallel
pnpm typecheck    # all packages
pnpm lint         # all packages
pnpm test         # all packages
pnpm format       # prettier
```

## Deployment

The two apps deploy separately. Config files at the repo root (`vercel.json`, `railway.json`) pin the build/install/start commands so the platform UIs need almost no manual setup.

- **`apps/web` → Vercel.** Import the repo with **Root Directory = repo root** (let `vercel.json` route the build into `apps/web`). Add env var `NEXT_PUBLIC_SERVER_URL` pointing at your deployed server URL.
- **`apps/server` → Railway** (or Fly.io / Render). Needs persistent WebSocket connections — won't run on Vercel. Import the repo; `railway.json` pins the build + start. Set env vars `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `WEB_ORIGIN` (your Vercel URL). The server runs via `tsx` in production; no compile step.

Also add your Vercel domains to the allowed origins in your LiveKit Cloud project.

## Project layout

```
apps/
  web/        — Next.js client (rooms, lobby, video, chat UI)
  server/     — Node + Socket.IO authoritative game server
packages/
  shared/     — Shared TypeScript types and event contracts
docs/         — Architecture, game states, role spec, ADRs
```

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CLAUDE.md`](CLAUDE.md).
