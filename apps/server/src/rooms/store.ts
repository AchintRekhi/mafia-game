import type { Phase, Role, TimingPreset } from '@mafia/shared';
import { generateRoomCode } from './code.js';

export interface Player {
  id: string; // socket.id
  name: string;
  isHost: boolean;
  alive: boolean;
  role: Role | null;
}

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  phase: Phase;
  preset: TimingPreset;
  phaseEndsAt: number | null;
  createdAt: number;
}

// In-memory store for v1. Swap for Redis when we go multi-instance.
const rooms = new Map<string, Room>();
const socketToRoom = new Map<string, string>();

const MAX_PLAYERS = 12;
const NAME_MAX = 24;

function sanitizeName(name: string): string {
  return name.trim().slice(0, NAME_MAX);
}

export function createRoom(opts: { hostSocketId: string; hostName: string }): Room {
  const name = sanitizeName(opts.hostName);
  if (!name) throw new Error('Name required');

  let code = generateRoomCode();
  while (rooms.has(code)) code = generateRoomCode();

  const room: Room = {
    code,
    hostId: opts.hostSocketId,
    players: [
      {
        id: opts.hostSocketId,
        name,
        isHost: true,
        alive: true,
        role: null,
      },
    ],
    phase: 'lobby',
    preset: 'normal',
    phaseEndsAt: null,
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  socketToRoom.set(opts.hostSocketId, code);
  return room;
}

export function joinRoom(opts: { code: string; socketId: string; name: string }):
  | { ok: true; room: Room }
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

  room.players.push({
    id: opts.socketId,
    name,
    isHost: false,
    alive: true,
    role: null,
  });
  socketToRoom.set(opts.socketId, code);
  return { ok: true, room };
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

export function leaveRoom(socketId: string): { room: Room; wasHost: boolean } | null {
  const code = socketToRoom.get(socketId);
  if (!code) return null;
  socketToRoom.delete(socketId);
  const room = rooms.get(code);
  if (!room) return null;

  const idx = room.players.findIndex((p) => p.id === socketId);
  if (idx === -1) return { room, wasHost: false };
  const wasHost = room.players[idx]!.isHost;
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
