import { describe, it, expect } from 'vitest';
import { buildRoomView } from './view.js';
import { mkRoom } from '../test/factories.js';

const roleOf = (view: ReturnType<typeof buildRoomView>, id: string) =>
  view.players.find((p) => p.id === id)!.role;

describe('buildRoomView — asymmetric role visibility', () => {
  it('lets a Mafia see fellow Mafia but not the town', () => {
    const room = mkRoom(['mafia', 'mafia', 'doctor', 'detective', 'civilian', 'civilian']);
    const view = buildRoomView(room, 'mafia0');

    expect(roleOf(view, 'mafia0')).toBe('mafia'); // self
    expect(roleOf(view, 'mafia1')).toBe('mafia'); // ally
    expect(roleOf(view, 'doctor0')).toBeNull();
    expect(roleOf(view, 'detective0')).toBeNull();
    expect(roleOf(view, 'civilian0')).toBeNull();
  });

  it('shows a Civilian only their own role — everyone else is hidden', () => {
    const room = mkRoom(['mafia', 'doctor', 'detective', 'civilian', 'civilian', 'civilian']);
    const view = buildRoomView(room, 'civilian0');

    expect(roleOf(view, 'civilian0')).toBe('civilian'); // self
    expect(roleOf(view, 'mafia0')).toBeNull();
    expect(roleOf(view, 'doctor0')).toBeNull();
    expect(roleOf(view, 'detective0')).toBeNull();
  });

  it('reveals the roles of other dead players to a dead viewer only', () => {
    const room = mkRoom(['mafia', 'doctor', 'detective', 'civilian', 'civilian', 'civilian']);
    room.players.find((p) => p.id === 'mafia0')!.alive = false;
    room.players.find((p) => p.id === 'civilian0')!.alive = false;

    const view = buildRoomView(room, 'civilian0'); // dead civilian
    expect(roleOf(view, 'mafia0')).toBe('mafia'); // dead → visible
    expect(roleOf(view, 'doctor0')).toBeNull(); // still alive → hidden
    expect(roleOf(view, 'detective0')).toBeNull();
  });

  it('marks isMe / isHost correctly per viewer', () => {
    const room = mkRoom(['mafia', 'doctor', 'detective', 'civilian', 'civilian', 'civilian']);
    const view = buildRoomView(room, 'doctor0');
    expect(view.players.find((p) => p.id === 'doctor0')!.isMe).toBe(true);
    expect(view.players.find((p) => p.id === 'mafia0')!.isMe).toBe(false);
    expect(view.players.find((p) => p.id === 'mafia0')!.isHost).toBe(true); // first player
  });
});

describe('buildRoomView — votes and night slice', () => {
  it('aggregates the public vote tally and the per-viewer myVote', () => {
    const room = mkRoom(['mafia', 'doctor', 'detective', 'civilian', 'civilian', 'civilian']);
    room.phase = 'day_vote';
    room.votes = new Map([
      ['civilian0', 'mafia0'],
      ['civilian1', 'mafia0'],
      ['doctor0', null], // abstain — not counted
    ]);

    const view = buildRoomView(room, 'civilian0');
    expect(view.voteTally).toEqual({ mafia0: 2 });
    expect(view.myVote).toBe('mafia0');

    expect(buildRoomView(room, 'doctor0').myVote).toBeNull(); // abstained
  });

  it('exposes the night slice only to the acting role', () => {
    const room = mkRoom(['mafia', 'doctor', 'detective', 'civilian', 'civilian', 'civilian']);
    room.night.mafiaTarget = 'civilian0';
    room.night.doctorTarget = 'doctor0';

    expect(buildRoomView(room, 'mafia0').night).toEqual({ mafiaTarget: 'civilian0' });
    expect(buildRoomView(room, 'doctor0').night).toEqual({ doctorTarget: 'doctor0' });
    expect(buildRoomView(room, 'detective0').night).toBeNull();
    expect(buildRoomView(room, 'civilian0').night).toBeNull();
  });
});
