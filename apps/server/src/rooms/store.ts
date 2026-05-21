import { randomUUID } from 'node:crypto';
import type { Phase, Role, TimingPreset } from '@mafia/shared';
import { generateRoomCode } from './code.js';

export interface Player {
  /** Current socket.id. Mutated on reconnect via resumeRoom(). */
  id: string;
  /** Stable identifier across reconnects. Never changes for the life of the seat. */
  sessionId: string;
  name: string;
  isHost: boolean;
  alive: boolean;
  role: Role | null;
  /** False while the socket is dropped but we're still holding the seat. */
  connected: boolean;
}

export interface NightActions {
  mafiaTarget: string | null;
  doctorTarget: string | null;
  detectiveTarget: string | null;
}

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  phase: Phase;
  preset: TimingPreset;
  phaseEndsAt: number | null;
  createdAt: number;
  night: NightActions;
  /** voterId → targetId (null = abstain). Cleared at end of day_vote. */
  votes: Map<string, string | null>;
}

// In-memory store for v1. Swap for Redis when we go multi-instance.
const rooms = new Map<string, Room>();
const socketToRoom = new Map<string, string>();
// sessionId → room code. Lets us resume a dropped socket back to its seat.
const sessionToRoom = new Map<string, string>();

const MAX_PLAYERS = 12;
const NAME_MAX = 24;

function sanitizeName(name: string): string {
  return name.trim().slice(0, NAME_MAX);
}

export function createRoom(opts: { hostSocketId: string; hostName: string }): {
  room: Room;
  sessionId: string;
} {
  const name = sanitizeName(opts.hostName);
  if (!name) throw new Error('Name required');

  let code = generateRoomCode();
  while (rooms.has(code)) code = generateRoomCode();

  const sessionId = randomUUID();
  const room: Room = {
    code,
    hostId: opts.hostSocketId,
    players: [
      {
        id: opts.hostSocketId,
        sessionId,
        name,
        isHost: true,
        alive: true,
        role: null,
        connected: true,
      },
    ],
    phase: 'lobby',
    preset: 'normal',
    phaseEndsAt: null,
    createdAt: Date.now(),
    night: { mafiaTarget: null, doctorTarget: null, detectiveTarget: null },
    votes: new Map(),
  };
  rooms.set(code, room);
  socketToRoom.set(opts.hostSocketId, code);
  sessionToRoom.set(sessionId, code);
  return { room, sessionId };
}

export function joinRoom(opts: { code: string; socketId: string; name: string }):
  | { ok: true; room: Room; sessionId: string }
  | { ok: false; error: string } {
  const code = opts.code.toUpperCase();
  const room = rooms.get(code);
  if (!room) return { ok: false, error: 'Room not found' };
  if (room.phase !== 'lobby') return { ok: false, error: 'Game already started' };
  if (room.players.length >= MAX_PLAYERS) return { ok: false, error: 'Room is full' };

  const name = sanitizeName(opts.name);
  if (!name) return { ok: false, error: 'Name required' };
  if (room.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: 'Name already taken in this room' };
  }

  const sessionId = randomUUID();
  room.players.push({
    id: opts.socketId,
    sessionId,
    name,
    isHost: false,
    alive: true,
    role: null,
    connected: true,
  });
  socketToRoom.set(opts.socketId, code);
  sessionToRoom.set(sessionId, code);
  return { ok: true, room, sessionId };
}

/**
 * Re-bind a stored session to a fresh socket.id. Used when a client refreshes
 * or briefly drops and reconnects. Mutates the player's `id` and walks every
 * in-memory structure that keyed off the old socket.id so refs stay consistent.
 */
export function resumeRoom(opts: { sessionId: string; newSocketId: string }):
  | { ok: true; room: Room; player: Player; oldSocketId: string }
  | { ok: false; error: string } {
  const code = sessionToRoom.get(opts.sessionId);
  if (!code) return { ok: false, error: 'Session not found' };
  const room = rooms.get(code);
  if (!room) {
    sessionToRoom.delete(opts.sessionId);
    return { ok: false, error: 'Room no longer exists' };
  }
  const player = room.players.find((p) => p.sessionId === opts.sessionId);
  if (!player) return { ok: false, error: 'Seat lost' };

  const oldSocketId = player.id;
  if (oldSocketId === opts.newSocketId) {
    player.connected = true;
    return { ok: true, room, player, oldSocketId };
  }

  // Rewrite every reference that keyed off the old socket.id.
  player.id = opts.newSocketId;
  player.connected = true;
  if (room.hostId === oldSocketId) room.hostId = opts.newSocketId;
  if (room.night.mafiaTarget === oldSocketId) room.night.mafiaTarget = opts.newSocketId;
  if (room.night.doctorTarget === oldSocketId) room.night.doctorTarget = opts.newSocketId;
  if (room.night.detectiveTarget === oldSocketId) room.night.detectiveTarget = opts.newSocketId;

  // votes: keys are voter socket.ids, values are target socket.ids.
  const newVotes = new Map<string, string | null>();
  for (const [voter, target] of room.votes) {
    const k = voter === oldSocketId ? opts.newSocketId : voter;
    const v = target === oldSocketId ? opts.newSocketId : target;
    newVotes.set(k, v);
  }
  room.votes = newVotes;

  socketToRoom.delete(oldSocketId);
  socketToRoom.set(opts.newSocketId, code);
  return { ok: true, room, player, oldSocketId };
}

/**
 * Mark a player as disconnected without removing them. Returns the player + room
 * so the caller can schedule the grace-period eviction or broadcast updated state.
 */
export function markDisconnected(socketId: string): { room: Room; player: Player } | null {
  const code = socketToRoom.get(socketId);
  if (!code) return null;
  const room = rooms.get(code);
  if (!room) return null;
  const player = room.players.find((p) => p.id === socketId);
  if (!player) return null;
  player.connected = false;
  return { room, player };
}

export function getRoomBySocket(socketId: string): Room | undefined {
  const code = socketToRoom.get(socketId);
  return code ? rooms.get(code) : undefined;
}

export function getRoomByCode(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function startGame(code: string, byHostSocketId: string):
  | { ok: true; room: Room }
  | { ok: false; error: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { ok: false, error: 'Room not found' };
  if (room.hostId !== byHostSocketId) return { ok: false, error: 'Only the host can start' };
  if (room.phase !== 'lobby') return { ok: false, error: 'Game already started' };
  if (room.players.length < 6) return { ok: false, error: 'Need at least 6 players' };
  return { ok: true, room };
}

export function setPhase(code: string, phase: Room['phase'], endsAt: number | null = null): Room | null {
  const room = rooms.get(code.toUpperCase());
  if (!room) return null;
  room.phase = phase;
  room.phaseEndsAt = endsAt;
  return room;
}

export function resetNightActions(code: string) {
  const room = rooms.get(code.toUpperCase());
  if (!room) return;
  room.night = { mafiaTarget: null, doctorTarget: null, detectiveTarget: null };
}

export function resetVotes(code: string) {
  const room = rooms.get(code.toUpperCase());
  if (!room) return;
  room.votes = new Map();
}

export function resetForRematch(code: string): Room | null {
  const room = rooms.get(code.toUpperCase());
  if (!room) return null;
  for (const p of room.players) {
    p.alive = true;
    p.role = null;
  }
  room.phase = 'lobby';
  room.phaseEndsAt = null;
  room.night = { mafiaTarget: null, doctorTarget: null, detectiveTarget: null };
  room.votes = new Map();
  return room;
}

export function leaveRoom(socketId: string): { room: Room; wasHost: boolean } | null {
  const code = socketToRoom.get(socketId);
  if (!code) return null;
  socketToRoom.delete(socketId);
  const room = rooms.get(code);
  if (!room) return null;

  const idx = room.players.findIndex((p) => p.id === socketId);
  if (idx === -1) return { room, wasHost: false };
  const player = room.players[idx]!;
  const wasHost = player.isHost;
  sessionToRoom.delete(player.sessionId);
  room.players.splice(idx, 1);

  if (room.players.length === 0) {
    rooms.delete(code);
    return { room, wasHost };
  }

  if (wasHost) {
    const newHost = room.players[0]!;
    newHost.isHost = true;
    room.hostId = newHost.id;
  }
  return { room, wasHost };
}
