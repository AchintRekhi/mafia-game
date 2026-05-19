'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { useGame } from '@/lib/store';
import { Lobby } from '@/components/Lobby';

interface Props {
  params: Promise<{ code: string }>;
}

export default function RoomPage({ params }: Props) {
  const { code } = use(params);
  const router = useRouter();
  const room = useGame((s) => s.room);
  const setRoom = useGame((s) => s.setRoom);
  const myId = useGame((s) => s.myId);

  const [waiting, setWaiting] = useState(!room);

  useEffect(() => {
    const socket = getSocket();

    socket.on('room:state', (state) => {
      setRoom(state);
      setWaiting(false);
    });

    socket.on('error:msg', (msg) => {
      console.error('[server error]', msg);
    });

    // If we landed here without a current room (e.g. refresh), the server doesn't know us.
    // For v1 we bounce back home — reconnection tokens are a later milestone.
    if (!room) {
      const t = setTimeout(() => {
        if (!useGame.getState().room) router.replace('/');
      }, 800);
      return () => {
        clearTimeout(t);
        socket.off('room:state');
        socket.off('error:msg');
      };
    }

    return () => {
      socket.off('room:state');
      socket.off('error:msg');
    };
  }, [room, router, setRoom]);

  if (waiting || !room) {
    return (
      <main className="flex min-h-screen items-center justify-center text-stone-400">
        Connecting to room <span className="ml-2 font-display tracking-widest">{code}</span>…
      </main>
    );
  }

  return <Lobby room={room} myId={myId} />;
}
