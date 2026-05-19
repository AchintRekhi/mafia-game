'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
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
  const myId = useGame((s) => s.myId);
  const myRole = useGame((s) => s.myRole);

  const [showReveal, setShowReveal] = useState(false);

  // If we landed here without state (e.g. hard refresh), bounce home.
  // Reconnect tokens are a later milestone.
  useEffect(() => {
    if (room) return;
    const t = setTimeout(() => {
      if (!useGame.getState().room) router.replace('/');
    }, 800);
    return () => clearTimeout(t);
  }, [room, router]);

  // Trigger role reveal animation whenever myRole goes from null → set.
  useEffect(() => {
    if (!myRole) return;
    setShowReveal(true);
    const t = setTimeout(() => setShowReveal(false), REVEAL_MS);
    return () => clearTimeout(t);
  }, [myRole]);

  if (!room) {
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
