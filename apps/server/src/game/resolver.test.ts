import { describe, it, expect } from 'vitest';
import { resolveNight, checkWinner, resolveVote } from './resolver.js';
import { mkRoom } from '../test/factories.js';

describe('resolveNight — kill vs doctor save', () => {
  it('kills the Mafia target when the Doctor protects someone else', () => {
    const room = mkRoom(['mafia', 'doctor', 'detective', 'civilian', 'civilian', 'civilian']);
    room.night.mafiaTarget = 'civilian0';
    room.night.doctorTarget = 'civilian1';

    const out = resolveNight(room);

    expect(out.deaths).toEqual([{ id: 'civilian0', cause: 'mafia' }]);
    expect(room.players.find((p) => p.id === 'civilian0')!.alive).toBe(false);
  });

  it('saves the victim when the Doctor protects the Mafia target (no death)', () => {
    const room = mkRoom(['mafia', 'doctor', 'detective', 'civilian', 'civilian', 'civilian']);
    room.night.mafiaTarget = 'civilian0';
    room.night.doctorTarget = 'civilian0';

    const out = resolveNight(room);

    expect(out.deaths).toEqual([]);
    expect(room.players.find((p) => p.id === 'civilian0')!.alive).toBe(true);
  });

  it('produces no death when Mafia made no pick', () => {
    const room = mkRoom(['mafia', 'doctor', 'detective', 'civilian', 'civilian', 'civilian']);
    room.night.mafiaTarget = null;

    expect(resolveNight(room).deaths).toEqual([]);
  });

  it("returns the Detective's result reflecting whether the target is Mafia", () => {
    const room = mkRoom(['mafia', 'doctor', 'detective', 'civilian', 'civilian', 'civilian']);

    room.night.detectiveTarget = 'mafia0';
    expect(resolveNight(room).detective).toMatchObject({
      detectiveId: 'detective0',
      targetId: 'mafia0',
      isMafia: true,
    });

    room.night.detectiveTarget = 'civilian0';
    expect(resolveNight(room).detective!.isMafia).toBe(false);
  });
});

describe('checkWinner', () => {
  it('town wins when no Mafia remain alive', () => {
    const room = mkRoom(['mafia', 'doctor', 'civilian', 'civilian', 'civilian', 'civilian']);
    room.players.find((p) => p.id === 'mafia0')!.alive = false;
    expect(checkWinner(room)).toBe('town');
  });

  it('mafia wins when Mafia reach parity with the town', () => {
    // 2 mafia vs 4 town; kill 2 town → 2 vs 2 → mafia parity.
    const room = mkRoom(['mafia', 'mafia', 'doctor', 'detective', 'civilian', 'civilian']);
    room.players.find((p) => p.id === 'civilian0')!.alive = false;
    room.players.find((p) => p.id === 'civilian1')!.alive = false;
    expect(checkWinner(room)).toBe('mafia');
  });

  it('returns null while the town still outnumbers the Mafia', () => {
    const room = mkRoom(['mafia', 'doctor', 'detective', 'civilian', 'civilian', 'civilian']);
    expect(checkWinner(room)).toBeNull();
  });
});

describe('resolveVote', () => {
  it('lynches the plurality target and marks them dead', () => {
    const room = mkRoom(['mafia', 'doctor', 'detective', 'civilian', 'civilian', 'civilian']);
    room.votes = new Map([
      ['doctor0', 'mafia0'],
      ['detective0', 'mafia0'],
      ['civilian0', 'civilian1'],
    ]);

    const out = resolveVote(room);

    expect(out.lynched).toBe('mafia0');
    expect(out.tally).toEqual({ mafia0: 2, civilian1: 1 });
    expect(room.players.find((p) => p.id === 'mafia0')!.alive).toBe(false);
  });

  it('lynches no one on a tie', () => {
    const room = mkRoom(['mafia', 'doctor', 'detective', 'civilian', 'civilian', 'civilian']);
    room.votes = new Map([
      ['doctor0', 'mafia0'],
      ['detective0', 'civilian0'],
    ]);

    const out = resolveVote(room);

    expect(out.lynched).toBeNull();
    expect(room.players.every((p) => p.alive)).toBe(true);
  });

  it('ignores abstentions and lynches no one when everyone abstains', () => {
    const room = mkRoom(['mafia', 'doctor', 'detective', 'civilian', 'civilian', 'civilian']);
    room.votes = new Map([
      ['doctor0', null],
      ['detective0', null],
    ]);

    const out = resolveVote(room);

    expect(out.tally).toEqual({});
    expect(out.lynched).toBeNull();
  });
});
