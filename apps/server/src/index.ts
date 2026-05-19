import 'dotenv/config';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import type { ClientToServerEvents, ServerToClientEvents } from '@mafia/shared';
import { registerLobbyHandlers } from './handlers/lobby.js';

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
  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected ${socket.id} (${reason})`);
  });
});

http.listen(PORT, () => {
  console.log(`[server] listening on :${PORT} (CORS origin: ${WEB_ORIGIN})`);
});
