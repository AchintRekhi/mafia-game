# Changelog

All notable changes to this project will be documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- **Testing phase 2 — regression test suite:**
  - **`vitest` unit tests (39, server, always in CI)** covering the pure game logic: `resolver` (Mafia kill vs Doctor save, no-pick, Detective result, win checks, vote plurality/tie/abstain), `roles` (balance table 6–12 + throws + `assignRoles`), `rooms/view` asymmetric visibility — the anti-cheat core (Mafia see Mafia, town see nothing, dead see the dead, per-viewer `myVote` + night slice), `rooms/code` (length/alphabet/uniqueness), and `rooms/store` (join gating, name collision, `startGame` gating, host migration, and the reconnect identity rewrite of votes/night/host). Added `vitest.config.ts` with a small pre-resolver so NodeNext `.js` imports resolve to their `.ts` source.
  - **Playwright e2e (real LiveKit + fake media):** `grid.spec` asserts every player gets their own tile at a 4:3 ratio on both laptop and phone (regression guard for the reported video bug); `flow.spec` drives a real 6-player game from the deal through all three night sub-phases, the dawn recap, and discussion to the day vote, exercising the FSM + resolver end-to-end. Shared `e2e/helpers.ts` seats N players and drives night/vote actions.
  - `playwright.config.ts` now launches Chromium with fake-media flags and documents that specs use real LiveKit when configured (never mocked) and degrade to the static grid otherwise.

### Fixed
- **Role-reveal card overflow:** the role name spilled past the card's edges for the longest word ("DETECTIVE" — "CIVILIAN" only just fit at the old fixed 54px). The title now scales to the card via container-query units (`15cqw` on a `container-type: inline-size` card) with `whitespace-nowrap`, so every role word fits inside the card on any viewport, phones included.
- **Testing phase 1 — full-game bug sweep (drove a real 6-player game through every FSM step on mixed phone/laptop viewports):**
  - Video tiles rendered solid black when a camera track was published-but-not-yet-subscribed (or frameless). `GameTable` now requires an attached `publication.track` before showing `<VideoTrack>`, so such tiles fall back to the avatar / "CAMERA OFF" state instead of painting black.
  - Dead ("spectating") players were still shown the mic/camera control bar. Controls are now hidden for the dead in day discussion/vote (server already blocked publishing; this fixes the misleading UI).
  - `TopBar` overflowed on a 390px phone — the room code was clipped off the right edge and the phase label cramped. It now wraps responsively (timer drops to its own centered row, smaller brand/label/padding on mobile) so nothing is clipped.
  - Added test affordances used by the sweep and the upcoming e2e suite: `data-player-id` / `data-selectable` / `data-selected` / `data-dead` on each `PlayerTile`, and `data-phase` / `data-my-role` on the room shell.
  - Verified end-to-end: reveal → night (mafia/doctor/detective) → recap → discussion → vote → resolve → loop → win, including a natural TOWN WINS with a correct role-reveal grid. Lobby e2e still green.

### Added
- **Unified per-player video grid (testing phase 0 — fixes the phone/laptop tile-ratio bug):**
  - Replaced the two-grid split (a separate LiveKit `GridLayout` at `h-[60vh]` + a video-less name-card grid) with ONE grid where each player is a fixed `aspect-[4/3]` tile holding their own video, name bar, role/ally tag, live vote badge, and mic/speaking indicator — the layout the imported design specifies.
  - New `PlayerTile` (presentational tile chrome) and `GameTable` (LiveKit wrapper: matches `participant.identity` → `player.id`, renders each participant's `<VideoTrack>` with `object-cover` so the aspect ratio is identical on every device; falls back to a video-less static grid when LiveKit is unavailable so the game stays playable). Removed `VideoRoom`.
  - Rewired Lobby, InGame shell, DayDiscussion, DayVote, NightPhase, and GameEnd onto `GameTable`. Night selection, day-vote tally badges, Mafia ally tags, and dead/dim states are driven by per-phase config props.
  - Verified with a 6-browser fake-media smoke: identical 4:3 tiles on a 1440px laptop and a 390px phone; each participant's video stays within their own tile. Lobby e2e still green.
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
