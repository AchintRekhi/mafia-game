# ADR-0003: Redis-only persistence in v1 (no SQL database)

- Status: Accepted
- Date: 2026-05-19

## Context

A Mafia game session is ephemeral — start, play 20 minutes, end. v1 has no user accounts, no stats, no history. Adding a SQL database now would add migrations, a connection pool, an ORM, and seed scripts — all for data we aren't storing yet.

## Decision

Use **Redis only** for v1. Room state is stored under `room:<code>` with a ~6h TTL.

## Rationale

- Redis is the only fast, simple shared store we need today.
- Less infra to keep alive in local dev.
- When we add accounts/stats (v2), we will add Postgres and write ADR-0004.

## Consequences

- A server restart loses in-flight games. Acceptable for v1.
- No persistent leaderboards. Acceptable for v1.
- Migration to Postgres later is a deliberate, scoped effort, not an accident.
