# Changelog

All notable changes to this project will be documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Initial project scaffold: pnpm monorepo with `apps/web`, `apps/server`, `packages/shared`.
- Project docs: `ARCHITECTURE.md`, `ROLES.md`, `GAME_STATES.md`, three ADRs.
- `CLAUDE.md` with branching rule (PR-review before merge to `main`; branch by milestone).
- GitHub PR template and CI workflow (lint + typecheck + test).
- `docker-compose.yml` for local Redis.
- **Lobby (`feature/lobby`):**
  - Home page with Create Room / Join by 6-char code flows.
  - Server-side in-memory room store with auto-host promotion on leave.
  - Personalized `room:state` broadcast (foundation for asymmetric visibility — currently all roles null in lobby).
  - Lobby UI: copyable room code, player list with host badge, Start button (host-only, gated at 6+ players).
- **LiveKit integration (`feature/livekit-integration`):**
  - Server: `livekit/admin.ts` mints scoped JWTs and exposes a `silenceParticipant()` helper for forced server-side mute (used later on death).
  - Socket event `livekit:requestToken` returns a token + URL for the joined room. `canPublish` is gated on `alive` so dead players get listen-only tokens.
  - Client: `VideoRoom` component mounts `LiveKitRoom` with a grid layout and minimal control bar (mic/cam toggles). Renders a configuration hint if env vars are missing.
  - Video tiles now show in the lobby; server logs a warning at boot if LiveKit env vars aren't set.
- **Role assignment:**
  - `game/roles.ts`: Fisher-Yates shuffle + balance-table distribution (validated against `BALANCE_TABLE`).
  - `host:start` socket event: host-only, gated at ≥6 players. Server assigns roles, emits a private `role:assigned` to each socket, then broadcasts the personalized room state — Mafia now sees other Mafia, everyone else sees `???`.
  - Client: `RoleReveal` component (Framer Motion card flip + role color glow) plays for 6s after assignment.
  - `InGame` view replaces Lobby once `phase !== 'lobby'`; player list shows a `RoleChip` beside each name with asymmetric visibility.

### Changed
- `CLAUDE.md` trimmed to current project rules (branching default switched to direct-to-`main`).
