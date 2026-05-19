import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@mafia/shared';
import { PRESET_TIMINGS } from '@mafia/shared';
import { getRoomBySocket, setPhase, startGame } from '../rooms/store.js';
import { assignRoles } from '../game/roles.js';
import { broadcastRoom } from './lobby.js';
import { scheduleAdvance } from '../game/fsm.js';

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type S = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerHostHandlers(io: IO, socket: S) {
  socket.on('host:start', () => {
    const room = getRoomBySocket(socket.id);
    if (!room) {
      socket.emit('error:msg', 'Not in a room');
      return;
    }
    const guard = startGame(room.code, socket.id);
    if (!guard.ok) {
      socket.emit('error:msg', guard.error);
      return;
    }

    assignRoles(guard.room.players);

    const revealMs = (PRESET_TIMINGS[guard.room.preset].role_assign ?? 10) * 1000;
    const endsAt = Date.now() + revealMs;
    setPhase(guard.room.code, 'role_assign', endsAt);

    // Tell each player their own role privately.
    for (const p of guard.room.players) {
      if (p.role) io.to(p.id).emit('role:assigned', p.role);
    }
    io.to(guard.room.code).emit('phase:start', { phase: 'role_assign', endsAt });
    broadcastRoom(io, guard.room.code);

    // Kick off the FSM — after the reveal window the server auto-advances to night.
    scheduleAdvance(io, guard.room.code);
  });
}
