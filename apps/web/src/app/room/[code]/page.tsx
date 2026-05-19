'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { getSocket } from '@/lib/socket';
import { useGame } from '@/lib/store';
import { Lobby } from '@/components/Lobby';
import { InGame } from '@/components/InGame';
import { RoleReveal } from '@/components/RoleReveal';

interface Props {
  params: Promise<{ code: string }>;
}

const REVEAL_MS = 6_000;

export default function RoomPage({ params }: Props) {
  const { code } = use(params);
  const router = useRouter();
  const room = useGame((s) => s.room);
  const setRoom = useGame((s) => s.setRoom);
  const myId = useGame((s) => s.myId);
  const myRole = useGame((s) => s.myRole);
  const setRole = useGame((s) => s.setRole);

  const addDetectiveResult = useGame((s) => s.addDetectiveResult);
  const addDeath = useGame((s) => s.addDeath);
  const addChat = useGame((s) => s.addChat);

  const [waiting, setWaiting] = useState(!room);
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    socket.on('room:state', (state) => {
      setRoom(state);
      setWaiting(false);
    });

    socket.on('role:assigned', (role) => {
      setRole(role);
      setShowReveal(true);
      setTimeout(() => setShowReveal(false), REVEAL_MS);
    });

    socket.on('detective:result', (r) => addDetectiveResult(r));
    socket.on('player:died', (d) => addDeath(d));
    socket.on('chat:message', (m) => addChat(m));
    socket.on('phase:start', () => {
      // The authoritative state arrives via room:state right after; we just react to the
      // transition signal here (could trigger SFX/animations later).
    });

    socket.on('error:msg', (msg) => {
      console.error('[server error]', msg);
    });

    if (!room) {
      const t = setTimeout(() => {
        if (!useGame.getState().room) router.replace('/');
      }, 800);
      return () => {
        clearTimeout(t);
        socket.off('room:state');
        socket.off('role:assigned');
        socket.off('detective:result');
        socket.off('player:died');
        socket.off('chat:message');
        socket.off('phase:start');
        socket.off('error:msg');
      };
    }

    return () => {
      socket.off('room:state');
      socket.off('role:assigned');
      socket.off('detective:result');
      socket.off('player:died');
      socket.off('phase:start');
      socket.off('error:msg');
    };
  }, [room, router, setRoom, setRole, addDetectiveResult, addDeath, addChat]);

  if (waiting || !room) {
    return (
      <main className="flex min-h-screen items-center justify-center text-stone-400">
        Connecting to room <span className="ml-2 font-display tracking-widest">{code}</span>…
      </main>
    );
  }

  return (
    <>
      {room.phase === 'lobby' ? (
        <Lobby room={room} myId={myId} />
      ) : (
        <InGame room={room} myId={myId} myRole={myRole} />
      )}
      <AnimatePresence>{showReveal && myRole && <RoleReveal role={myRole} />}</AnimatePresence>
    </>
  );
}
