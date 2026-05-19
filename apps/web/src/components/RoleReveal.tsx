'use client';

import { motion } from 'framer-motion';
import type { Role } from '@mafia/shared';
import { ROLE_COLOR } from '@mafia/shared';

const LABEL: Record<Role, string> = {
  mafia: 'MAFIA',
  doctor: 'DOCTOR',
  detective: 'DETECTIVE',
  civilian: 'CIVILIAN',
};

const FLAVOR: Record<Role, string> = {
  mafia: 'You hunt by night. Trust only your own kind.',
  doctor: 'You can save one life each night. Choose wisely.',
  detective: 'You see through lies. One name per night.',
  civilian: 'You have only your voice and your vote. Use them well.',
};

export function RoleReveal({ role }: { role: Role }) {
  const color = ROLE_COLOR[role];
  return (
    <main className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotateY: -90 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 14 }}
        className="flex w-[90%] max-w-md flex-col items-center gap-6 rounded-xl border bg-stone-950 p-10 text-center shadow-[0_0_60px_rgba(0,0,0,0.8)]"
        style={{ borderColor: color, boxShadow: `0 0 80px ${color}55` }}
      >
        <p className="text-xs uppercase tracking-[0.4em] text-stone-400">Your role</p>
        <h1
          className="font-display text-6xl tracking-[0.2em] drop-shadow-[0_0_18px_currentColor]"
          style={{ color }}
        >
          {LABEL[role]}
        </h1>
        <p className="max-w-xs text-sm leading-relaxed text-stone-300">{FLAVOR[role]}</p>
        <p className="text-[10px] uppercase tracking-widest text-stone-500">
          Keep this to yourself.
        </p>
      </motion.div>
    </main>
  );
}
