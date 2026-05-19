# ADR-0002: Next.js (App Router) for the client

- Status: Accepted
- Date: 2026-05-19

## Context

We need a web client with a landing page, lobby, and game screen. The game screen is heavily interactive (sockets + WebRTC). Options:

1. **Next.js (App Router)** — SSR for landing/lobby, RSC where useful, route handlers for the LiveKit token mint endpoint.
2. **Vite + React (pure SPA)** — lighter, faster dev, but we lose SSR niceties for share-links.
3. **Remix** — similar to Next but smaller ecosystem.

## Decision

Use **Next.js (App Router) + TypeScript**.

## Rationale

- One framework for marketing + app pages.
- Route handlers (`app/api/.../route.ts`) are perfect for small server bits like LiveKit token mint, even though the main game server is separate.
- Best-in-class deploy story on Vercel.
- Strong shadcn/ui integration.

## Consequences

- Slightly heavier than pure Vite, but the team is comfortable with it.
- All game-state logic stays in `apps/server` — Next is **not** the authoritative server.
