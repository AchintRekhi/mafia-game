# ADR-0001: LiveKit Cloud over self-hosted mediasoup

- Status: Accepted
- Date: 2026-05-19

## Context

Mafia is a 6–12 player game with simultaneous video + audio. A WebRTC mesh degrades hard past ~6 participants, so we need an SFU. Options:

1. **LiveKit Cloud** — managed SFU, server-side mute API, React SDK, generous free tier.
2. **Daily.co** — similar managed SFU.
3. **mediasoup** (self-host) — full control, much more ops work.
4. **Plain mesh** — no infra, but breaks at our target player count.

## Decision

Use **LiveKit Cloud**.

## Rationale

- Server-side `mutePublishedTrack` is exactly what we need for dead-player handling — a tampered client cannot re-enable.
- Mature React SDK (`@livekit/components-react`) shortens UI work.
- Self-hosting an SFU is its own product; we want to ship a game, not run media infra.
- Free tier easily covers v1 testing.

## Consequences

- Vendor dependency. Mitigated by keeping the integration thin and behind `apps/server/src/livekit/`.
- We must mint tokens server-side and never expose the API secret to the client.
