import 'dotenv/config';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import type { ClientToServerEvents, ServerToClientEvents } from '@mafia/shared';
import { registerLobbyHandlers } from './handlers/lobby.js';
import { registerLiveKitHandlers } from './handlers/livekit.js';
import { registerHostHandlers } from './handlers/host.js';
import { registerNightHandlers } from './handlers/night.js';
import { registerDayHandlers } from './handlers/day.js';
import { isLiveKitConfigured } from './livekit/admin.js';

const PORT = Number(process.env.PORT ?? 4000);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:3000';

const http = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(http, {
  cors: { origin: WEB_ORIGIN, credentials: true },
});

io.on('connection', (socket) => {
  console.log(`[socket] connected ${socket.id}`);
  registerLobbyHandlers(io, socket);
  registerLiveKitHandlers(io, socket);
  registerHostHandlers(io, socket);
  registerNightHandlers(io, socket);
  registerDayHandlers(io, socket);
  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected ${socket.id} (${reason})`);
  });
});

http.listen(PORT, () => {
  console.log(`[server] listening on :${PORT} (CORS origin: ${WEB_ORIGIN})`);
  if (!isLiveKitConfigured()) {
    console.warn(
      '[server] LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET not set — video/voice disabled. Sign up at https://cloud.livekit.io and update apps/server/.env',
    );
  }
});
