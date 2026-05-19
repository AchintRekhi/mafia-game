# CLAUDE.md — Project Rules for Claude Code

This file is the source of truth for how Claude Code should behave in this repo. Read it at the start of every session.

---

## 🔒 Branching Rule (MUST FOLLOW)

**Never commit to `main` directly. Every change reaches `main` through a reviewed PR.**

But — **branch by milestone, not by every tiny edit.** Avoid branch sprawl.

### When to open a new branch
- A new milestone from the plan (e.g. `feature/lobby`, `feature/livekit-integration`).
- A meaningful refactor or experimental spike.
- A bug fix or dependency bump that needs its own review (`fix/*`, `chore/*`).

### When NOT to open a new branch
- Small tweaks to docs/config that belong to an already-open feature branch — just add a commit there.
- Iterative commits within the same milestone — keep them on the existing feature branch and squash later if needed.

### Flow
```bash
git checkout main && git pull
git checkout -b feature/<short-kebab-name>
# commit as many times as needed for the milestone
gh pr create   # uses .github/PULL_REQUEST_TEMPLATE.md
# wait for user to say "merge it" / "ready to merge" → then merge
```

### Rules
- **Wait for explicit user approval before merging.** Never self-merge.
- After merging, delete the local branch and `git pull` main.
- Branch prefixes: `feature/*`, `fix/*`, `chore/*`, `refactor/*`.
- Every PR must add a `docs/CHANGELOG.md` entry under `Unreleased`.

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
