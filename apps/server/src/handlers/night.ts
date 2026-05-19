import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@mafia/shared';
import { getRoomBySocket } from '../rooms/store.js';
import { broadcastRoom } from './lobby.js';

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type S = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerNightHandlers(io: IO, socket: S) {
  socket.on('mafia:pickTarget', (targetId) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.phase !== 'night_mafia') return;
    const me = room.players.find((p) => p.id === socket.id);
    if (!me || !me.alive || me.role !== 'mafia') return;
    if (!isLivingPlayer(room, targetId)) return;
    room.night.mafiaTarget = targetId;
    // Let other living Mafia see the current pick so they can coordinate.
    for (const m of room.players.filter((p) => p.role === 'mafia' && p.alive)) {
      io.to(m.id).emit('room:state', buildView(room, m.id));
    }
    // No public broadcast — only Mafia know.
  });

  socket.on('doctor:protect', (targetId) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.phase !== 'night_doctor') return;
    const me = room.players.find((p) => p.id === socket.id);
    if (!me || !me.alive || me.role !== 'doctor') return;
    if (!isLivingPlayer(room, targetId)) return;
    room.night.doctorTarget = targetId;
    // Private confirmation only — re-broadcast personalized state to the doctor.
    io.to(me.id).emit('room:state', buildView(room, me.id));
  });

  socket.on('detective:investigate', (targetId) => {
    const room = getRoomBySocket(socket.id);
    if (!room || room.phase !== 'night_detective') return;
    const me = room.players.find((p) => p.id === socket.id);
    if (!me || !me.alive || me.role !== 'detective') return;
    if (!isLivingPlayer(room, targetId)) return;
    room.night.detectiveTarget = targetId;
    // Result is delivered at end-of-phase from the resolver.
  });
}

function isLivingPlayer(room: ReturnType<typeof getRoomBySocket>, id: string): boolean {
  if (!room) return false;
  const p = room.players.find((x) => x.id === id);
  return Boolean(p?.alive);
}

// Imported here to avoid a circular import at the top of the file.
import { buildRoomView as buildView } from '../rooms/view.js';
