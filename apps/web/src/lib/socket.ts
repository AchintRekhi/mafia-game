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

// --- Reconnect session storage ---
// We persist a per-room sessionId in localStorage so a hard refresh /
// network blip can reclaim the same seat via room:resume.

const SESSION_KEY_PREFIX = 'mafia:session:';

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function setStoredSession(code: string, sessionId: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(SESSION_KEY_PREFIX + code.toUpperCase(), sessionId);
}

export function getStoredSession(code: string): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(SESSION_KEY_PREFIX + code.toUpperCase());
}

export function clearStoredSession(code: string) {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_KEY_PREFIX + code.toUpperCase());
}
