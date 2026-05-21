'use client';

import { motion } from 'framer-motion';
import type { RoomView } from '@mafia/shared';
import { ROLE_COLOR } from '@mafia/shared';
import { useGame } from '@/lib/store';
import { getSocket } from '@/lib/socket';
import { RoleChip } from './RoleChip';
import { VideoRoom } from './VideoRoom';

interface Props {
  room: RoomView;
  myId: string | null;
}

export function GameEnd({ room, myId }: Props) {
  const ending = useGame((s) => s.ending);
  const me = room.players.find((p) => p.id === myId);
  const iAmHost = me?.isHost ?? false;

  if (!ending) {
    return (
      <main className="flex min-h-screen items-center justify-center text-stone-400">
        Tallying the final blow…
      </main>
    );
  }

  const winnerLabel = ending.winner === 'mafia' ? 'MAFIA' : 'TOWN';
  const winnerColor = ending.winner === 'mafia' ? ROLE_COLOR.mafia : '#22C55E';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center gap-8 px-6 py-10">
      <motion.h1
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 14 }}
        className="font-display text-7xl tracking-[0.3em] drop-shadow-[0_0_28px_currentColor]"
        style={{ color: winnerColor }}
      >
        {winnerLabel} WINS
      </motion.h1>

      <section className="w-full">
        <VideoRoom />
      </section>

      <section className="w-full">
        <h2 className="mb-3 text-center font-display text-lg tracking-wider text-stone-100">
          The truth
        </h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {room.players.map((p) => {
            const trueRole = ending.reveal[p.id] ?? null;
            return (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 rounded border border-stone-800 bg-stone-950/60 px-3 py-2 text-stone-100"
              >
                <span className="truncate">{p.alive ? p.name : `✝ ${p.name}`}</span>
                <RoleChip role={trueRole} />
              </li>
            );
          })}
        </ul>
      </section>

      {iAmHost ? (
        <button
          onClick={() => getSocket().emit('host:rematch')}
          className="rounded bg-mafia px-10 py-3 font-display text-lg tracking-widest text-stone-50"
        >
          Play again
        </button>
      ) : (
        <p className="text-sm text-stone-400">Waiting for the host to rematch…</p>
      )}
    </main>
  );
}
