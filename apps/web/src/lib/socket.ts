'use client';

import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@mafia/shared';

type MafiaSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let singleton: MafiaSocket | null = null;

export function getSocket(): MafiaSocket {
  if (singleton) return singleton;
  const url = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000';
  singleton = io(url, {
    autoConnect: true,
    transports: ['websocket'],
    withCredentials: true,
  });
  return singleton;
}

export function disconnectSocket() {
  singleton?.disconnect();
  singleton = null;
}
