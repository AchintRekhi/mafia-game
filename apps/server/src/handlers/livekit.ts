import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@mafia/shared';
import { getRoomBySocket } from '../rooms/store.js';
import { getLiveKitUrl, isLiveKitConfigured, mintAccessToken } from '../livekit/admin.js';

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type S = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerLiveKitHandlers(_io: IO, socket: S) {
  socket.on('livekit:requestToken', async (ack) => {
    if (!isLiveKitConfigured()) {
      ack({ ok: false, error: 'LiveKit not configured on server' });
      return;
    }
    const room = getRoomBySocket(socket.id);
    if (!room) {
      ack({ ok: false, error: 'Not in a room' });
      return;
    }
    const me = room.players.find((p) => p.id === socket.id);
    if (!me) {
      ack({ ok: false, error: 'Player not found in room' });
      return;
    }
    try {
      const token = await mintAccessToken({
        roomCode: room.code,
        identity: socket.id,
        displayName: me.name,
        canPublish: me.alive,
      });
      ack({ ok: true, token, url: getLiveKitUrl(), identity: socket.id });
    } catch (err) {
      console.error('[livekit] token mint failed', err);
      ack({ ok: false, error: 'Token mint failed' });
    }
  });
}
