import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@mafia/shared';
import { getRoomBySocket } from '../rooms/store.js';
import { buildRoomView } from '../rooms/view.js';

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type S = Socket<ClientToServerEvents, ServerToClientEvents>;

const CHAT_MAX = 280;

export function registerDayHandlers(io: IO, socket: S) {
  socket.on('day:vote', (targetId) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.phase !== 'day_vote') return;
    const me = room.players.find((p) => p.id === socket.id);
    if (!me || !me.alive) return;

    if (targetId === null) {
      room.votes.set(socket.id, null);
    } else {
      const target = room.players.find((p) => p.id === targetId);
      if (!target || !target.alive) return;
      room.votes.set(socket.id, targetId);
    }
    // Broadcast tally so the room can see vote counts as they come in.
    const tally = tallyVotes(room.votes);
    io.to(room.code).emit('vote:tally', tally);
    // Refresh personalized state for each player too.
    for (const p of room.players) {
      io.to(p.id).emit('room:state', buildRoomView(room, p.id));
    }
  });

  socket.on('chat:send', (raw) => {
    const text = sanitize(raw);
    if (!text) return;
    const room = getRoomBySocket(socket.id);
    if (!room) return;
    const me = room.players.find((p) => p.id === socket.id);
    if (!me) return;

    // Public chat allowed during day_discussion + day_vote for living players.
    const isDay = room.phase === 'day_discussion' || room.phase === 'day_vote';
    if (isDay && me.alive) {
      io.to(room.code).emit('chat:message', { from: me.name, text, at: Date.now() });
      return;
    }

    // Mafia private chat during night_mafia for living Mafia.
    if (room.phase === 'night_mafia' && me.alive && me.role === 'mafia') {
      const targets = room.players.filter((p) => p.role === 'mafia' && p.alive);
      for (const t of targets) {
        io.to(t.id).emit('chat:message', {
          from: `🕵 ${me.name}`,
          text,
          at: Date.now(),
        });
      }
      return;
    }
    // Otherwise drop silently (dead-player ghost chat lands in death-handling milestone).
  });
}

function tallyVotes(votes: Map<string, string | null>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [, target] of votes) {
    if (!target) continue;
    out[target] = (out[target] ?? 0) + 1;
  }
  return out;
}

function sanitize(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, CHAT_MAX);
}
