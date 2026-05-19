# Architecture

## High-level diagram

```
 ┌──────────────────────┐         ┌────────────────────────┐
 │  Next.js Client      │ ◀────▶ │  Socket.IO Game Server │
 │  (per player)        │  WS    │  (Node + TS, FSM)      │
 │                      │         │  Redis (room state)    │
 │  - Lobby / Game UI   │         └──────────┬─────────────┘
 │  - LiveKit React SDK │                    │ REST: token mint
 │  - Zustand store     │                    ▼
 │  - Framer Motion     │         ┌────────────────────────┐
 └──────────┬───────────┘         │  LiveKit Cloud (SFU)   │
            │  WebRTC (video/voice)  Server-side mute on death
            └────────────────────────────────────────────────┘
```

## Components

### `apps/web` — Next.js client
- App Router, React 19, TypeScript.
- Tailwind + shadcn/ui for components.
- Zustand for local UI state. Server is the source of truth for game state.
- LiveKit React SDK (`@livekit/components-react`) for video/voice.
- Framer Motion for phase transitions and death reveals.

### `apps/server` — game server
- Node 20 + TypeScript + Socket.IO.
- A **finite-state machine** keyed by `roomId` drives all phase progression. See [`GAME_STATES.md`](GAME_STATES.md).
- Redis stores room state with a TTL (~6h). No SQL in v1.
- Mints LiveKit access tokens. Uses LiveKit Server API to forcibly mute dead players.

### `packages/shared` — shared types
- `Role`, `Phase`, `PlayerView`, socket event payloads. Imported by both `web` and `server` so the wire protocol stays type-safe.

### Media: LiveKit Cloud
- SFU (Selective Forwarding Unit) — scales past mesh limits.
- Server-side track muting (a dead player cannot re-enable their mic from the client).

## Data flow: a typical game tick

1. Client connects WebSocket with `{ roomCode, name }`.
2. Server validates, places socket into a Socket.IO room, and emits the **personalized** `players[]` snapshot.
3. Host clicks **Start** → server transitions FSM `LOBBY → ROLE_ASSIGN`, picks roles from the balance table, and emits a per-socket `role:assigned` event (each socket only sees its own role + allies it's allowed to see).
4. FSM advances through night phases. Each role action is submitted privately. Server resolves at end-of-night and emits a public death announcement.
5. On `DEATH`: server calls LiveKit `RoomServiceClient.mutePublishedTrack()` for that participant's audio + video, then emits `player:died`. Client renders the desaturated tile and the ✝ icon.
6. Day phase: timed discussion → vote → lynch resolution. Win check after every death.
7. On win: server emits the full role map, FSM moves to `END`, room remains open for rematch.

## Anti-cheat by construction

- Roles never leave the server except as personalized projections.
- Clients can be tampered with — they cannot reveal data they were never sent.
- LiveKit grants disable publish-permissions on death, so even a hacked client cannot un-mute.

## Deployment targets

| Component | Host |
|---|---|
| `apps/web` | Vercel |
| `apps/server` | Fly.io or Railway |
| Redis | Upstash or Fly Redis |
| Media | LiveKit Cloud |

See [`DECISIONS/`](DECISIONS/) for the reasoning behind each choice.
