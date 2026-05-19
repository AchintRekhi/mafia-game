# Roles

v1 ships the **Classic 4**.

| Role | Side | Power | Acts at night? | Color |
|---|---|---|---|---|
| Mafia | Mafia | Group picks one player to kill | Yes (1st) | `#B91C1C` |
| Doctor | Town | Picks one player to protect from the night kill | Yes (2nd) | `#059669` |
| Detective | Town | Investigates one player; learns "Mafia / Not Mafia" | Yes (3rd) | `#4F46E5` |
| Civilian | Town | Discusses + votes by day | No | `#6B7280` |

The **Narrator** is the app itself and is never a player.

## Night action order

1. **Mafia** (collective pick — needs majority of living Mafia to lock in a target)
2. **Doctor** (may pick self at most once per game — configurable)
3. **Detective** (gets a private "Mafia / Not Mafia" answer)

Resolver logic (server-side):

```
if mafia.target == doctor.target: nobody dies
else: mafia.target dies
detective.result := isMafia(detective.target)
```

## Win conditions

- **Town wins** when all Mafia are dead.
- **Mafia wins** when `mafia_alive >= non_mafia_alive`.

Checked after every death.

## Balance table

The server picks the role distribution from this table based on player count.

| Players | Mafia | Doctor | Detective | Civilians |
|---|---|---|---|---|
| 6 | 1 | 1 | 1 | 3 |
| 7 | 2 | 1 | 1 | 3 |
| 8 | 2 | 1 | 1 | 4 |
| 9 | 2 | 1 | 1 | 5 |
| 10 | 3 | 1 | 1 | 5 |
| 11 | 3 | 1 | 1 | 6 |
| 12 | 3 | 1 | 1 | 7 |

## Asymmetric visibility

Each connected socket gets a *personalized* projection of `players[]`:

- A **Mafia** sees other Mafia tagged as Mafia and the rest as Civilian.
- A **Doctor / Detective / Civilian** sees everyone as Civilian until reveal.
- A **dead player** sees the true role of other **dead** players only.

Roles are revealed publicly when the game ends.
