import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@mafia/shared';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomByCode,
  resumeRoom,
  markDisconnected,
} from '../rooms/store.js';
import { buildRoomView } from '../rooms/view.js';

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type S = Socket<ClientToServerEvents, ServerToClientEvents>;

/** How long we hold a disconnected player's seat before evicting them. */
const RECONNECT_GRACE_MS = 60_000;

// socketId → eviction timer. Cancelled when the same socket resumes.
const evictionTimers = new Map<string, NodeJS.Timeout>();

export function registerLobbyHandlers(io: IO, socket: S) {
  socket.on('room:create', ({ name }, ack) => {
    try {
      const { room, sessionId } = createRoom({ hostSocketId: socket.id, hostName: name });
      socket.join(room.code);
      broadcastRoom(io, room.code);
      ack({ ok: true, you: { id: socket.id, sessionId }, code: room.code });
    } catch (err) {
      ack({ ok: false, error: err instanceof Error ? err.message : 'create failed' });
    }
  });

  socket.on('room:join', ({ code, name }, ack) => {
    const result = joinRoom({ code, socketId: socket.id, name });
    if (!result.ok) {
      ack(result);
      return;
    }
    socket.join(result.room.code);
    broadcastRoom(io, result.room.code);
    ack({
      ok: true,
      you: { id: socket.id, sessionId: result.sessionId },
      code: result.room.code,
    });
  });

  socket.on('room:resume', ({ code, sessionId }, ack) => {
    const result = resumeRoom({ sessionId, newSocketId: socket.id });
    if (!result.ok) {
      ack(result);
      return;
    }
    // Cancel any pending eviction for the OLD socket.id; the seat is alive again.
    const oldTimer = evictionTimers.get(result.oldSocketId);
    if (oldTimer) {
      clearTimeout(oldTimer);
      evictionTimers.delete(result.oldSocketId);
    }
    socket.join(result.room.code);
    if (result.room.code !== code.toUpperCase()) {
      // Defensive: client should never disagree, but if it does, prefer the server view.
    }
    broadcastRoom(io, result.room.code);
    ack({ ok: true, you: { id: socket.id }, code: result.room.code });
  });

  socket.on('room:leave', () => {
    handleExplicitLeave(io, socket);
  });

  socket.on('disconnect', () => {
    handleDisconnect(io, socket);
  });
}

/** Explicit leave button — no grace period, evict immediately. */
function handleExplicitLeave(io: IO, socket: S) {
  const r = leaveRoom(socket.id);
  if (!r) return;
  socket.leave(r.room.code);
  if (getRoomByCode(r.room.code)) {
    broadcastRoom(io, r.room.code);
  }
}

/**
 * Transport-level disconnect (refresh, network blip, tab close). Mark the
 * player disconnected and schedule eviction after RECONNECT_GRACE_MS. If the
 * same session re-binds in time, room:resume cancels the timer.
 */
function handleDisconnect(io: IO, socket: S) {
  const marked = markDisconnected(socket.id);
  if (!marked) return;
  broadcastRoom(io, marked.room.code);

  const timer = setTimeout(() => {
    evictionTimers.delete(socket.id);
    const r = leaveRoom(socket.id);
    if (r && getRoomByCode(r.room.code)) {
      broadcastRoom(io, r.room.code);
    }
  }, RECONNECT_GRACE_MS);
  evictionTimers.set(socket.id, timer);
}

/**
 * Emit a personalized `room:state` to every socket in the room.
 * Each socket gets a view computed from its own perspective.
 */
export function broadcastRoom(io: IO, code: string) {
  const room = getRoomByCode(code);
  if (!room) return;
  for (const player of room.players) {
    if (!player.connected) continue;
    io.to(player.id).emit('room:state', buildRoomView(room, player.id));
  }
}
