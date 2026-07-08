# Changelog

All notable changes to this project will be documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- **Speakeasy-noir theme (imported claude.ai/design "MAFIA Game" project):**
  - Global restyle to a 1932 speakeasy look: `Limelight` display + `Josefin Sans` body fonts, ink `#0b0805` / parchment `#efe6d3` / gold `#d99c4a` / noir-red `#b8402e` palette, sharp corners, uppercase letter-spaced labels.
  - `Ambience` component: full-viewport blurred photo backdrop (`apps/web/public/ambience.png`, the Gemini image from the design) + flickering lamp-glow vignette + animated film grain, rendered behind every screen via the root layout.
  - `TopBar` component: shared in-game header (MAFIA brand, phase label, glow-pulse timer, alive count, copy-code button) used by Lobby, day/night phases, and the generic shell.
  - Landing rebuilt per the design: "Est. 1932" kicker, glowing MAFIA title, "Trust no one" divider, single noir panel with name input, gold "Create a room", and room-code join.
  - Role reveal restyled as the design's dealt card (gradient card, gold border, role-colored Limelight title); Mafia now see their associates' names on the card.
  - Day vote tally now renders as the design's round red vote badges; chat panel restyled as "Table talk" (ghost variant: "Beyond the grave"); game end restyled ("The town falls silent" + red/gold winner title); night phase, recap overlay, and LiveKit tiles/controls skinned to match.
  - `CLAUDE.md` UI conventions updated to the new fonts/palette; e2e lobby spec updated for the new landing copy ("e.g. Corleone", "Create a room" / "Join room").
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

- **Night phase + FSM kernel:**
  - `game/fsm.ts`: timer-driven phase advancement (`role_assign → night_mafia → night_doctor → night_detective → day_recap`). One timer per room; cleared on transition.
  - `game/resolver.ts`: night resolution (Mafia kill blocked by Doctor save) + `checkWinner()` (town wins when 0 Mafia; Mafia wins when Mafia ≥ Town).
  - `handlers/night.ts`: socket events `mafia:pickTarget`, `doctor:protect`, `detective:investigate`. Validated by phase + role + alive. Mafia's pick is shared among Mafia for coordination; Doctor's pick is private; Detective gets a private `detective:result` at end of phase.
  - Server-side LiveKit mute fires on death; `game:end` fires when a win condition triggers mid-night.
- **Night UI:**
  - `NightPhase`: per-role target picker (greyed for non-actors and the dead). Mafia sees the team's current pick; Doctor sees their own; Detective acts blind until results.
  - `PhaseTimer`: 1Hz countdown from `room.phaseEndsAt`.
  - `DayRecap`: dawn-breaks screen announcing the most-recent victim (or "no one died" if the Doctor saved them).
  - Room page now persists detective results and death events in Zustand.

- **Day phase + chat:**
  - FSM extended: `day_recap → day_discussion → day_vote → resolve → night_mafia` (game loops until a win).
  - `resolveVote()`: plurality wins; ties = no lynch.
  - `handlers/day.ts`: `day:vote` (can re-vote during the phase, including abstain); `chat:send` is public during day phases, scoped to living Mafia during `night_mafia`.
  - `RoomView` now carries per-viewer `myVote` and a public `voteTally`.
  - `DayDiscussion`: video + player list + chat panel.
  - `DayVote`: target picker with live tally chips + abstain. Self-vote disabled.
  - `ChatPanel` (reusable): muted for dead players (ghost chat lands in the next milestone).
- **End game + rematch:**
  - `game:end` event reveals every player's true role.
  - `GameEnd`: full-screen winner banner (red for Mafia, green for Town) + reveal grid.
  - Host-only "Play again" → `host:rematch` resets the room to lobby; `unsilenceParticipant()` restores LiveKit publishing for previously-killed players. `game:reset` clears all client-side game state.
- **Ghost chat (dead players):** `chat:send` is server-routed — dead players' messages go out as `ghost:message` only to other dead players. `ChatPanel` accepts a `channel` prop and styles the ghost variant distinctly with a "only the dead can read this" header.
- **Host-configurable timing presets:** `host:setPreset` event accepts `fast` / `normal` / `long`; only the host, only in lobby phase. `PresetPicker` in the Lobby shows the three options with a one-line description of each.

### Changed
- `CLAUDE.md` trimmed to current project rules (branching default switched to direct-to-`main`).
- `RoomView` now carries a per-viewer `night` slice (Mafia / Doctor only) so role-only UI doesn't have to wait for separate events.
