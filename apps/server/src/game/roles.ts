import { BALANCE_TABLE, type Role } from '@mafia/shared';
import type { Player } from '../rooms/store.js';

const MIN_PLAYERS = 6;

/** Fisher-Yates in place. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function rolesForCount(playerCount: number): Role[] {
  const distribution = BALANCE_TABLE[playerCount];
  if (!distribution) {
    throw new Error(`No balance entry for ${playerCount} players (supported: 6-12)`);
  }
  const roles: Role[] = [];
  for (const [role, count] of Object.entries(distribution) as [Role, number][]) {
    for (let i = 0; i < count; i++) roles.push(role);
  }
  return roles;
}

/**
 * Mutates `players` in place: assigns each a role drawn from the balance table.
 * Returns the role map keyed by player id for logging / reveal at end of game.
 */
export function assignRoles(players: Player[]): Record<string, Role> {
  if (players.length < MIN_PLAYERS) {
    throw new Error(`Need at least ${MIN_PLAYERS} players, have ${players.length}`);
  }
  const roles = shuffle(rolesForCount(players.length));
  const map: Record<string, Role> = {};
  players.forEach((p, i) => {
    const role = roles[i]!;
    p.role = role;
    map[p.id] = role;
  });
  return map;
}
