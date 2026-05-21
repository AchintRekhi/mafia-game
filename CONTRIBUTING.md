# Contributing

## Branching

Default workflow is **commit directly to `main`**. Create a feature branch only when explicitly asked, or when a change is risky enough that you'd want a PR for review.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(lobby): add room code generator
fix(server): prevent double-vote on day phase
chore: bump tailwind to 4.0
docs(architecture): add SFU diagram
```

Scopes generally match the workspace or area touched (`web`, `server`, `shared`, `lobby`, `night`, `day`, `chat`, etc.). Add a `docs/CHANGELOG.md` entry under `Unreleased` in the same commit as the feature.

## Code style

- TypeScript strict mode is on across the monorepo.
- No `any` in shared types.
- Prettier formats on save (see `.prettierrc`).
- `pnpm lint` and `pnpm typecheck` must pass before pushing.

## Architectural decisions

Any non-trivial choice (new dependency, new infra, change to a core invariant) gets an ADR in [`docs/DECISIONS/`](docs/DECISIONS/). Use the existing files as templates. The current rules-of-the-road live in [`CLAUDE.md`](CLAUDE.md) — read that first.

## Secrets

- Never commit `.env` files. Only `.env.example` is checked in.
- Never use `git add -A` or `git add .` in this repo — list specific paths. A wildcard add previously swept real LiveKit credentials into history.
