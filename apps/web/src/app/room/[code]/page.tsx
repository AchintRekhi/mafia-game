'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useGame } from '@/lib/store';
import { Lobby } from '@/components/Lobby';
import { InGame } from '@/components/InGame';
import { RoleReveal } from '@/components/RoleReveal';
import { clearStoredSession, getSocket, getStoredSession } from '@/lib/socket';

interface Props {
  params: Promise<{ code: string }>;
}

const REVEAL_MS = 6_000;
const RESUME_TIMEOUT_MS = 4_000;

export default function RoomPage({ params }: Props) {
  const { code } = use(params);
  const router = useRouter();
  const room = useGame((s) => s.room);
  const myId = useGame((s) => s.myId);
  const myRole = useGame((s) => s.myRole);
  const setMe = useGame((s) => s.setMe);

  const [showReveal, setShowReveal] = useState(false);

  // If we have no room state yet, try to resume via stored sessionId. If the
  // server doesn't recognize the session (room expired, evicted past grace),
  // bounce home. Otherwise wait for room:state to arrive.
  useEffect(() => {
    if (room) return;
    const sessionId = getStoredSession(code);
    if (!sessionId) {
      router.replace('/');
      return;
    }

    let timedOut = false;
    const socket = getSocket();
    const attempt = () => {
      socket.emit('room:resume', { code, sessionId }, (res) => {
        if (timedOut) return;
        if (!res.ok) {
          clearStoredSession(code);
          router.replace('/');
          return;
        }
        setMe(res.you.id);
      });
    };

    if (socket.connected) {
      attempt();
    } else {
      socket.once('connect', attempt);
    }

    const t = setTimeout(() => {
      timedOut = true;
      if (!useGame.getState().room) {
        router.replace('/');
      }
    }, RESUME_TIMEOUT_MS);

    return () => {
      clearTimeout(t);
      socket.off('connect', attempt);
    };
  }, [room, code, router, setMe]);

  // Trigger role reveal animation whenever myRole goes from null → set.
  useEffect(() => {
    if (!myRole) return;
    setShowReveal(true);
    const t = setTimeout(() => setShowReveal(false), REVEAL_MS);
    return () => clearTimeout(t);
  }, [myRole]);

  if (!room) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm font-light tracking-[0.08em] text-parchment/50">
        Connecting to room <span className="ml-2 font-display tracking-widest text-gold">{code}</span>…
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
