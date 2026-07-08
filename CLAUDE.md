# CLAUDE.md

## Stack
- Monorepo (pnpm workspaces): `apps/web` (Next.js), `apps/server` (Node + Socket.IO), `packages/shared` (TS types)
- Docs: `docs/ARCHITECTURE.md`, `docs/GAME_STATES.md`, `docs/ROLES.md`

## Commands
```bash
pnpm lint        # lint
pnpm typecheck   # type check
pnpm test        # unit tests
pnpm e2e         # e2e tests
```

## Architecture rules
- Server is authoritative. Roles, phases, votes, and win conditions are computed server-side only — never on the client.
- Server emits a personalized `players[]` payload per socket (Mafia sees teammates; everyone else sees "CIVILIAN").
- LiveKit Cloud handles all video/voice. Server mints tokens and mutes tracks when a player dies.

## UI conventions
- Theme: 1932 speakeasy noir (imported claude.ai/design "MAFIA Game" project). Ink `#0b0805` bg, parchment `#efe6d3` text, gold `#d99c4a` accent, noir red `#b8402e`. Sharp corners, uppercase letter-spaced labels, blurred `ambience.png` backdrop on every screen.
- Fonts: `Limelight` for display/headings and role chips. `Josefin Sans` for body.
- Role colors (keep in sync with `packages/shared/src/roles.ts`):
  - Mafia → `#B91C1C`
  - Detective → `#4F46E5`
  - Doctor → `#059669`
  - Civilian → `#6B7280`
  - Dead → desaturated + ✝ icon
- Role chip renders under each player's video tile and beside their name in the player list.

## Don't
- Don't compute role outcomes on the client.
- Don't add a new dependency without an ADR in `docs/DECISIONS/`.
- Don't mock LiveKit or Socket.IO in integration tests — use real instances.
- Don't commit secrets or credentials.