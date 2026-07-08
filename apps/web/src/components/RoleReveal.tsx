'use client';

import { motion } from 'framer-motion';
import type { Role } from '@mafia/shared';
import { ROLE_COLOR } from '@mafia/shared';
import { useGame } from '@/lib/store';

const LABEL: Record<Role, string> = {
  mafia: 'MAFIA',
  doctor: 'DOCTOR',
  detective: 'DETECTIVE',
  civilian: 'CIVILIAN',
};

const FLAVOR: Record<Role, string> = {
  mafia: 'Eliminate the town, one night at a time. Stay calm in daylight. Deny everything.',
  doctor: 'You can save one life each night. Choose wisely.',
  detective: 'You see through lies. One name per night.',
  civilian: 'You have only your voice and your vote. Use them well.',
};

export function RoleReveal({ role }: { role: Role }) {
  const room = useGame((s) => s.room);
  const color = ROLE_COLOR[role];

  // Mafia see their teammates in the personalized players[] payload.
  const associates =
    role === 'mafia' && room
      ? room.players.filter((p) => p.role === 'mafia' && !p.isMe).map((p) => p.name)
      : [];

  return (
    <main className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-[34px] bg-[rgba(4,3,2,0.96)]">
      <p className="animate-fade-in text-xs uppercase tracking-[0.45em] text-parchment/55 [animation-duration:1s]">
        The cards are dealt
      </p>
      <motion.div
        initial={{ scale: 0.92, opacity: 0, rotateY: 92 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 14 }}
        className="w-[min(340px,86vw)] [container-type:inline-size] border border-gold/45 bg-gradient-to-br from-[#1c130b] to-[#120c06] px-9 pb-10 pt-11 text-center shadow-[0_40px_100px_rgba(0,0,0,0.75),inset_0_0_60px_rgba(232,169,79,0.05)]"
      >
        <p className="mb-[22px] text-[11px] uppercase tracking-[0.4em] text-parchment/50">
          Your role
        </p>
        <h1
          // Scale the title to the card so the longest role word ("DETECTIVE")
          // fits on every viewport instead of spilling past the card edges.
          className="whitespace-nowrap font-display text-[15cqw] leading-none tracking-[0.03em]"
          style={{ color, textShadow: `0 0 30px ${color}66` }}
        >
          {LABEL[role]}
        </h1>
        <div className="mx-auto my-5 h-px w-[60px] bg-gold" />
        <p className="text-[15px] font-light leading-[1.65] text-parchment/85">{FLAVOR[role]}</p>
        {associates.length > 0 && (
          <div className="mt-6 border border-noir/35 bg-noir/[0.08] p-3 text-[13px] tracking-[0.08em] text-parchment/80">
            Your {associates.length > 1 ? 'associates' : 'associate'}:{' '}
            <span className="font-semibold text-gold">{associates.join(', ')}</span>
          </div>
        )}
        <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-parchment/40">
          Keep this to yourself.
        </p>
      </motion.div>
    </main>
  );
}
