# CLAUDE.md — Project Rules for Claude Code

This file is the source of truth for how Claude Code should behave in this repo. Read it at the start of every session.

---

## 🔒 Branching & Commit Rule

**Default: commit directly to `main`.** No PR is required for normal work.

**Only create a branch when the user explicitly asks for one** — e.g. "put this on a branch", "make a feature branch for X". That's the signal for experimental, risky, or reviewable work the user wants gated.

### Default flow
```bash
# edit, then:
git add -A
git commit -m "feat(scope): short summary"  # Conventional Commits still in force
```

### When the user asks for a branch
```bash
git checkout main && git pull
git checkout -b feature/<short-name>
# work, commit
# wait for "merge it" before merging
git checkout main && git merge --no-ff feature/<short-name> && git branch -d feature/<short-name>
```

### Always
- Keep commits small and well-described — they're individually revertable.
- Update `docs/CHANGELOG.md` under `Unreleased` in the same commit as the change.
- **Never push to `origin` without explicit instruction.** The user handles pushes.

---

## 📐 Architecture (at a glance)

- **Monorepo** (pnpm workspaces): `apps/web` (Next.js), `apps/server` (Node + Socket.IO), `packages/shared` (TS types).
- **Server is authoritative.** Roles, phases, votes, and win conditions are computed on the server. Clients only render what the server pushes.
- **Asymmetric info:** server emits a *personalized* `players[]` payload per socket so Mafia sees fellow Mafia while everyone else sees "CIVILIAN".
- **Media:** LiveKit Cloud handles all video/voice. Server mints tokens and mutes tracks server-side when a player dies.

Full design: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Phase contract: [`docs/GAME_STATES.md`](docs/GAME_STATES.md). Roles: [`docs/ROLES.md`](docs/ROLES.md).

---

## 🎨 UI Conventions

- Display font for headings + role chips (e.g. `Cinzel` / `Special Elite`). Body: Inter.
- Role colors (constants — keep in sync with `packages/shared/src/roles.ts`):
  - Mafia → `#B91C1C` (blood red)
  - Detective → `#4F46E5` (indigo)
  - Doctor → `#059669` (emerald)
  - Civilian → `#6B7280` (neutral grey)
  - Dead → desaturated, ✝ icon
- Role chip renders directly under each player's video tile (and beside the name in the player list).

---

## 🧪 What "done" means

A feature PR is done when:
- [ ] Code lands on its branch
- [ ] `pnpm lint && pnpm typecheck` pass
- [ ] Unit tests pass (`pnpm test`), e2e if applicable (`pnpm e2e`)
- [ ] `docs/CHANGELOG.md` updated
- [ ] Manual smoke test described in PR body
- [ ] User approves the merge

---

## 🚫 Don't

- Don't commit directly to `main`.
- Don't compute role outcomes on the client.
- Don't add backwards-compat shims for code that isn't shipped yet.
- Don't introduce a new dependency without an ADR (`docs/DECISIONS/`).
- Don't mock LiveKit or Socket.IO in integration tests — use real instances.
