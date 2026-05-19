import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@mafia/shared';
import { createRoom, joinRoom, leaveRoom, getRoomByCode } from '../rooms/store.js';
import { buildRoomView } from '../rooms/view.js';

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type S = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerLobbyHandlers(io: IO, socket: S) {
  socket.on('room:create', ({ name }, ack) => {
    try {
      const room = createRoom({ hostSocketId: socket.id, hostName: name });
      socket.join(room.code);
      broadcastRoom(io, room.code);
      ack({ ok: true, you: { id: socket.id }, code: room.code });
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
    ack({ ok: true, you: { id: socket.id }, code: result.room.code });
  });

  socket.on('room:leave', () => {
    handleLeave(io, socket);
  });

  socket.on('disconnect', () => {
    handleLeave(io, socket);
  });
}

function handleLeave(io: IO, socket: S) {
  const r = leaveRoom(socket.id);
  if (!r) return;
  socket.leave(r.room.code);
  // If the room still exists, broadcast updated state.
  if (getRoomByCode(r.room.code)) {
    broadcastRoom(io, r.room.code);
  }
}

/**
 * Emit a personalized `room:state` to every socket in the room.
 * Each socket gets a view computed from its own perspective.
 */
export function broadcastRoom(io: IO, code: string) {
  const room = getRoomByCode(code);
  if (!room) return;
  for (const player of room.players) {
    io.to(player.id).emit('room:state', buildRoomView(room, player.id));
  }
}
