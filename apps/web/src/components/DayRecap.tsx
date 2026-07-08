'use client';

import { motion } from 'framer-motion';
import type { RoomView } from '@mafia/shared';
import { useGame } from '@/lib/store';

/**
 * Styled like the design's full-screen transition overlay: near-black wash,
 * one Limelight line, quiet caption.
 */
export function DayRecap({ room }: { room: RoomView }) {
  const deaths = useGame((s) => s.recentDeaths);
  // Take the most-recent death (or two, if multi-kill ever lands).
  const latest = deaths.at(-1);
  const victim = latest && room.players.find((p) => p.id === latest.id);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-[rgba(4,3,2,0.96)] px-5 text-center"
    >
      <p className="text-xs uppercase tracking-[0.45em] text-parchment/55">Dawn breaks</p>
      {victim ? (
        <h2 className="animate-fade-up font-display text-[clamp(28px,4.5vw,46px)] tracking-[0.14em] text-parchment [animation-delay:0.2s]">
          {victim.name} didn&apos;t survive the night.
        </h2>
      ) : (
        <h2 className="animate-fade-up font-display text-[clamp(28px,4.5vw,46px)] tracking-[0.14em] text-parchment [animation-delay:0.2s]">
          No one died.
        </h2>
      )}
      <p className="text-sm font-light tracking-[0.08em] text-parchment/60">
        {victim ? 'The town wakes to bad news.' : 'The doctor earned their keep.'}
      </p>
    </motion.main>
  );
}
