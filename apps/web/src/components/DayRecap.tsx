'use client';

import { motion } from 'framer-motion';
import type { RoomView } from '@mafia/shared';
import { useGame } from '@/lib/store';

export function DayRecap({ room }: { room: RoomView }) {
  const deaths = useGame((s) => s.recentDeaths);
  // Take the most-recent death (or two, if multi-kill ever lands).
  const latest = deaths.at(-1);
  const victim = latest && room.players.find((p) => p.id === latest.id);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <p className="text-xs uppercase tracking-[0.4em] text-stone-500">Dawn breaks</p>
      {victim ? (
        <>
          <h2 className="font-display text-5xl tracking-wider text-stone-100">
            {victim.name}
          </h2>
          <p className="text-stone-400">was found dead this morning.</p>
        </>
      ) : (
        <>
          <h2 className="font-display text-4xl tracking-wider text-stone-100">
            No one died.
          </h2>
          <p className="text-stone-400">The doctor earned their keep.</p>
        </>
      )}
      <p className="mt-10 text-xs text-stone-600">
        Discussion + voting arrive in the next milestone.
      </p>
    </motion.main>
  );
}
