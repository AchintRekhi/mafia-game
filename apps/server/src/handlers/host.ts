import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@mafia/shared';
import { getRoomBySocket, setPhase, startGame } from '../rooms/store.js';
import { assignRoles } from '../game/roles.js';
import { broadcastRoom } from './lobby.js';

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type S = Socket<ClientToServerEvents, ServerToClientEvents>;

const ROLE_REVEAL_MS = 6_000;

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

    // Assign roles in place and flip phase.
    assignRoles(guard.room.players);
    const endsAt = Date.now() + ROLE_REVEAL_MS;
    setPhase(guard.room.code, 'role_assign', endsAt);

    // Tell each player their own role privately.
    for (const p of guard.room.players) {
      if (p.role) io.to(p.id).emit('role:assigned', p.role);
    }
    // Then broadcast the new personalized room state (asymmetric visibility kicks in here).
    broadcastRoom(io, guard.room.code);

    // After the reveal window, we'd transition into the first NIGHT phase.
    // That FSM lives in feature/game-fsm-night — for now we just stay in role_assign
    // so the user can verify role visibility on the player grid.
  });
}
