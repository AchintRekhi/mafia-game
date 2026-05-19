# Game States (FSM)

The game server runs a single finite-state machine per room. Clients only render; they cannot drive transitions.

```
                    ┌─────────┐
                    │  LOBBY  │
                    └────┬────┘
                         │ host:start
                         ▼
                  ┌──────────────┐
                  │ ROLE_ASSIGN  │   (server picks roles, emits per-socket)
                  └──────┬───────┘
                         │ auto (after reveal screen timeout)
                         ▼
         ┌─────────────────────────────────────┐
         │              NIGHT                  │
         │  NIGHT_MAFIA → NIGHT_DOCTOR →       │
         │  NIGHT_DETECTIVE                    │
         └──────────────┬──────────────────────┘
                        │ auto (resolver runs)
                        ▼
                 ┌────────────┐
                 │ DAY_RECAP  │   (announce deaths)
                 └─────┬──────┘
                       │ auto
                       ▼
                 ┌──────────────────┐
                 │ DAY_DISCUSSION   │   (timed, voice + chat)
                 └─────┬────────────┘
                       │ timer
                       ▼
                 ┌────────────┐
                 │  DAY_VOTE  │
                 └─────┬──────┘
                       │ timer or unanimous
                       ▼
                 ┌────────────┐
                 │  RESOLVE   │   (lynch, win check)
                 └─────┬──────┘
              win? │       │ no win
                   ▼       └─────► back to NIGHT
              ┌───────┐
              │  END  │
              └───────┘
```

## Per-state contract

| State | Duration (Normal preset) | Who can talk (voice) | Who can chat | Allowed actions |
|---|---|---|---|---|
| `LOBBY` | unbounded | everyone | public | `lobby:ready`, `host:start` |
| `ROLE_ASSIGN` | 10s | nobody | nobody | (server only) |
| `NIGHT_MAFIA` | 30s | Mafia only (private audio room) | Mafia only | `mafia:pickTarget` |
| `NIGHT_DOCTOR` | 20s | nobody | nobody | `doctor:protect` |
| `NIGHT_DETECTIVE` | 20s | nobody | nobody | `detective:investigate` |
| `DAY_RECAP` | 8s | nobody | nobody | (server announces) |
| `DAY_DISCUSSION` | 180s | all living | public + dead see public | (chat) |
| `DAY_VOTE` | 45s | all living | public | `day:vote` |
| `RESOLVE` | 10s | nobody | nobody | (server) |
| `END` | unbounded | all | all | `room:rematch` |

### Mafia private voice during night

During `NIGHT_MAFIA`, the server promotes Mafia members into a sub-room (LiveKit can do this via separate rooms or via track subscription filtering). Everyone else is muted globally. This lets Mafia coordinate aloud — which is part of the experience the app is meant to recreate.

### Ghost chat

A separate Socket.IO channel `ghost:<roomId>` is joined by players the moment they die. Public chat is read-only for them. Their video + audio tracks are server-muted via LiveKit.

## Timing presets

Set by the host in the lobby.

| Preset | Discussion | Vote | Night per role |
|---|---|---|---|
| Fast | 90s | 30s | 15s |
| Normal | 180s | 45s | 20–30s |
| Long | 300s | 60s | 30–45s |
