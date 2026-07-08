import { describe, it, expect } from 'vitest';
import { BALANCE_TABLE, type Role } from '@mafia/shared';
import { rolesForCount, assignRoles } from './roles.js';
import { mkPlayer } from '../test/factories.js';

function tally(roles: Role[]): Record<string, number> {
  return roles.reduce<Record<string, number>>((acc, r) => {
    acc[r] = (acc[r] ?? 0) + 1;
    return acc;
  }, {});
}

describe('rolesForCount', () => {
  for (const count of Object.keys(BALANCE_TABLE).map(Number)) {
    it(`matches the balance table for ${count} players`, () => {
      const roles = rolesForCount(count);
      expect(roles).toHaveLength(count);
      expect(tally(roles)).toEqual(BALANCE_TABLE[count]);
    });
  }

  it('throws for an unsupported player count', () => {
    expect(() => rolesForCount(5)).toThrow(/No balance entry/);
    expect(() => rolesForCount(13)).toThrow(/No balance entry/);
  });
});

describe('assignRoles', () => {
  it('assigns every player a role and returns a matching id→role map', () => {
    const players = Array.from({ length: 8 }, () => mkPlayer());
    const map = assignRoles(players);

    expect(Object.keys(map)).toHaveLength(8);
    for (const p of players) {
      expect(p.role).not.toBeNull();
      expect(map[p.id]).toBe(p.role);
    }
    // Distribution must still match the 8-player balance row.
    expect(tally(players.map((p) => p.role!))).toEqual(BALANCE_TABLE[8]);
  });

  it('throws below the minimum player count', () => {
    const players = Array.from({ length: 5 }, () => mkPlayer());
    expect(() => assignRoles(players)).toThrow(/at least 6/);
  });
});
