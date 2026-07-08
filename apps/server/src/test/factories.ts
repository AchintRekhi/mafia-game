import type { Role } from '@mafia/shared';
import type { Player, Room } from '../rooms/store.js';

let seq = 0;

export function mkPlayer(overrides: Partial<Player> = {}): Player {
  seq += 1;
  const id = overrides.id ?? `sock_${seq}`;
  return {
    id,
    sessionId: overrides.sessionId ?? `sess_${seq}`,
    name: overrides.name ?? `P${seq}`,
    isHost: overrides.isHost ?? false,
    alive: overrides.alive ?? true,
    role: overrides.role ?? null,
    connected: overrides.connected ?? true,
  };
}

/**
 * Build a room from a compact role list. Each entry becomes a living player
 * whose id is its role + index (e.g. `mafia0`, `civilian2`) for easy assertions.
 */
export function mkRoom(roles: Role[], overrides: Partial<Room> = {}): Room {
  const counts: Record<string, number> = {};
  const players: Player[] = roles.map((role) => {
    const n = counts[role] ?? 0;
    counts[role] = n + 1;
    const id = `${role}${n}`;
    return mkPlayer({ id, sessionId: `sess_${id}`, name: id, role });
  });
  if (players[0]) players[0].isHost = true;
  return {
    code: overrides.code ?? 'TEST01',
    hostId: overrides.hostId ?? players[0]?.id ?? 'host',
    players,
    phase: overrides.phase ?? 'night_mafia',
    preset: overrides.preset ?? 'normal',
    phaseEndsAt: overrides.phaseEndsAt ?? null,
    createdAt: overrides.createdAt ?? Date.now(),
    night: overrides.night ?? { mafiaTarget: null, doctorTarget: null, detectiveTarget: null },
    votes: overrides.votes ?? new Map(),
  };
}
