import 'dotenv/config';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import type { ClientToServerEvents, ServerToClientEvents } from '@mafia/shared';

const PORT = Number(process.env.PORT ?? 4000);

const http = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(http, {
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000', credentials: true },
});

io.on('connection', (socket) => {
  console.log(`[socket] connected ${socket.id}`);
  socket.on('disconnect', () => console.log(`[socket] disconnected ${socket.id}`));
});

http.listen(PORT, () => {
  console.log(`[server] listening on :${PORT}`);
});
