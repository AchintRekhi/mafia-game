import { describe, it, expect } from 'vitest';
import {
  createRoom,
  joinRoom,
  resumeRoom,
  leaveRoom,
  startGame,
  getRoomByCode,
} from './store.js';

function freshRoom(hostName = 'Host') {
  const { room, sessionId } = createRoom({ hostSocketId: `host_${Math.random()}`, hostName });
  return { room, sessionId };
}

function fill(code: string, n: number) {
  // Add n guests to reach a startable room.
  for (let i = 0; i < n; i++) {
    joinRoom({ code, socketId: `g_${code}_${i}`, name: `Guest${i}` });
  }
}

describe('createRoom / joinRoom', () => {
  it('creates a lobby with the host as the only player', () => {
    const { room } = freshRoom('Vito');
    expect(room.phase).toBe('lobby');
    expect(room.players).toHaveLength(1);
    expect(room.players[0]).toMatchObject({ name: 'Vito', isHost: true, alive: true });
  });

  it('rejects a duplicate name (case-insensitive) in the same room', () => {
    const { room } = freshRoom('Vito');
    const dup = joinRoom({ code: room.code, socketId: 's2', name: 'vito' });
    expect(dup).toEqual({ ok: false, error: expect.stringMatching(/already taken/i) });
  });

  it('rejects joining a room that has already started', () => {
    const { room } = freshRoom();
    fill(room.code, 5);
    room.phase = 'night_mafia';
    const res = joinRoom({ code: room.code, socketId: 'late', name: 'Late' });
    expect(res).toEqual({ ok: false, error: expect.stringMatching(/already started/i) });
  });
});

describe('startGame gating', () => {
  it('refuses to start below 6 players', () => {
    const { room } = freshRoom();
    fill(room.code, 3); // 4 total
    expect(startGame(room.code, room.hostId)).toEqual({
      ok: false,
      error: expect.stringMatching(/at least 6/i),
    });
  });

  it('refuses to start for a non-host', () => {
    const { room } = freshRoom();
    fill(room.code, 5); // 6 total
    expect(startGame(room.code, 'not-the-host')).toEqual({
      ok: false,
      error: expect.stringMatching(/only the host/i),
    });
  });

  it('starts when the host has 6+ players', () => {
    const { room } = freshRoom();
    fill(room.code, 5);
    expect(startGame(room.code, room.hostId)).toMatchObject({ ok: true });
  });
});

describe('resumeRoom — rebinds a session to a new socket id', () => {
  it('rewrites host, night targets, and votes to the new socket id', () => {
    const { room, sessionId } = freshRoom('Host');
    fill(room.code, 5);
    const oldId = room.hostId;

    // Wire up references that key off the host's old socket id.
    room.night.mafiaTarget = oldId;
    room.votes.set('g_' + room.code + '_0', oldId); // someone voted for the host
    room.votes.set(oldId, 'g_' + room.code + '_1'); // host voted for a guest

    const res = resumeRoom({ sessionId, newSocketId: 'brand-new-sock' });
    expect(res.ok).toBe(true);

    const after = getRoomByCode(room.code)!;
    expect(after.hostId).toBe('brand-new-sock');
    expect(after.players.find((p) => p.sessionId === sessionId)!.id).toBe('brand-new-sock');
    expect(after.night.mafiaTarget).toBe('brand-new-sock');
    // The vote FOR the host now points at the new id...
    expect(after.votes.get('g_' + room.code + '_0')).toBe('brand-new-sock');
    // ...and the host's own vote is re-keyed under the new id.
    expect(after.votes.get('brand-new-sock')).toBe('g_' + room.code + '_1');
    expect(after.votes.has(oldId)).toBe(false);
  });

  it('fails for an unknown session', () => {
    const res = resumeRoom({ sessionId: 'nope', newSocketId: 'x' });
    expect(res).toEqual({ ok: false, error: expect.stringMatching(/not found/i) });
  });
});

describe('leaveRoom — host migration', () => {
  it('promotes the next player to host when the host leaves', () => {
    const { room } = freshRoom('Host');
    fill(room.code, 5);
    const oldHost = room.hostId;

    const res = leaveRoom(oldHost);
    expect(res!.wasHost).toBe(true);

    const after = getRoomByCode(room.code)!;
    expect(after.players.some((p) => p.id === oldHost)).toBe(false);
    expect(after.hostId).toBe(after.players[0]!.id);
    expect(after.players[0]!.isHost).toBe(true);
  });

  it('deletes the room when the last player leaves', () => {
    const { room } = freshRoom('Solo');
    leaveRoom(room.hostId);
    expect(getRoomByCode(room.code)).toBeUndefined();
  });
});
