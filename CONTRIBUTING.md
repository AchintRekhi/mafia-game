# Contributing

## Branching

All work happens on a feature branch. **Never push to `main` directly.**

```bash
git checkout main && git pull
git checkout -b feature/<short-name>
# work, commit
gh pr create
```

Branch prefixes: `feature/`, `fix/`, `chore/`, `refactor/`.

## Commits

We use [Conventional Commits](https://www.conventionalcommits.org/).

```
feat(lobby): add room code generator
fix(server): prevent double-vote on day phase
chore: bump tailwind to 4.0
docs(architecture): add SFU diagram
```

## Code style

- TypeScript strict mode on.
- Prettier formats on save.
- ESLint must pass before opening a PR.
- No `any` in shared types.

## PRs

- Open against `main`.
- Fill in the PR template.
- Add a `docs/CHANGELOG.md` entry under `Unreleased`.
- Wait for review and explicit approval before merging.

## Decisions

Any architectural choice (new dependency, new pattern, infra change) gets an ADR in [`docs/DECISIONS/`](docs/DECISIONS/). Use the existing files as templates.
