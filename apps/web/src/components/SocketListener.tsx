'use client';

import { useEffect } from 'react';
import { getSocket, getStoredSession } from '@/lib/socket';
import { useGame } from '@/lib/store';
import { sfx } from '@/lib/sfx';
import type { Phase } from '@mafia/shared';

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
    socket.on('game:end', (e) => {
      g.setEnding(e);
      sfx.finale();
    });
    socket.on('game:reset', g.clearGame);
    socket.on('error:msg', (msg) => console.error('[server error]', msg));

    // Procedural SFX on phase boundaries. The server already broadcasts
    // phase:start to every socket in the room; we just react locally.
    const handlePhase = ({ phase }: { phase: Phase; endsAt: number }) => {
      if (phase === 'night_mafia') sfx.nightFall();
      else if (phase === 'day_recap') sfx.dayBreak();
      else if (phase === 'day_vote') sfx.gavel();
    };
    socket.on('phase:start', handlePhase);

    // On every (re)connect after the first, try to reclaim the current seat.
    // The first connect is no-op because we haven't joined a room yet. After
    // a wifi blip, socket.io transparently reconnects with a new socket.id —
    // this is what tells the server we're the same player.
    const handleConnect = () => {
      const room = useGame.getState().room;
      if (!room) return;
      const sessionId = getStoredSession(room.code);
      if (!sessionId) return;
      socket.emit('room:resume', { code: room.code, sessionId }, (res) => {
        if (!res.ok) {
          console.warn('[resume] failed:', res.error);
          return;
        }
        useGame.getState().setMe(res.you.id);
      });
    };
    socket.on('connect', handleConnect);

    return () => {
      socket.off('room:state', g.setRoom);
      socket.off('role:assigned', g.setRole);
      socket.off('detective:result', g.addDetectiveResult);
      socket.off('player:died', g.addDeath);
      socket.off('chat:message', g.addChat);
      socket.off('ghost:message', g.addGhostChat);
      socket.off('game:end');
      socket.off('game:reset', g.clearGame);
      socket.off('error:msg');
      socket.off('phase:start', handlePhase);
      socket.off('connect', handleConnect);
    };
  }, []);

  return null;
}
