'use client';

import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useGame } from '@/lib/store';

/**
 * Mounted once in the root layout. Owns every server→client socket subscription
 * so events aren't lost during page transitions (e.g. between Create and the
 * room page). All server state flows through Zustand.
 */
export function SocketListener() {
  useEffect(() => {
    const socket = getSocket();
    const g = useGame.getState();

    socket.on('room:state', g.setRoom);
    socket.on('role:assigned', g.setRole);
    socket.on('detective:result', g.addDetectiveResult);
    socket.on('player:died', g.addDeath);
    socket.on('chat:message', g.addChat);
    socket.on('ghost:message', g.addGhostChat);
    socket.on('game:end', g.setEnding);
    socket.on('game:reset', g.clearGame);
    socket.on('error:msg', (msg) => console.error('[server error]', msg));

    return () => {
      socket.off('room:state', g.setRoom);
      socket.off('role:assigned', g.setRole);
      socket.off('detective:result', g.addDetectiveResult);
      socket.off('player:died', g.addDeath);
      socket.off('chat:message', g.addChat);
      socket.off('ghost:message', g.addGhostChat);
      socket.off('game:end', g.setEnding);
      socket.off('game:reset', g.clearGame);
      socket.off('error:msg');
    };
  }, []);

  return null;
}
