'use client';

import { motion } from 'framer-motion';
import type { RoomView } from '@mafia/shared';
import { useGame } from '@/lib/store';
import { getSocket } from '@/lib/socket';
import { RoleChip } from './RoleChip';
import { GameTable } from './GameTable';

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
      <main className="flex min-h-screen items-center justify-center text-sm font-light tracking-[0.08em] text-parchment/50">
        Tallying the final blow…
      </main>
    );
  }

  const mafiaWon = ending.winner === 'mafia';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl animate-fade-in flex-col items-center gap-7 px-6 py-10 [animation-duration:1.2s]">
      <p className="text-xs uppercase tracking-[0.45em] text-parchment/55">
        The town falls silent
      </p>
      <motion.h1
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 14 }}
        className={`font-display text-[clamp(48px,8vw,92px)] leading-none tracking-[0.1em] ${
          mafiaWon
            ? 'text-noir [text-shadow:0_0_50px_rgba(184,64,46,0.45)]'
            : 'text-gold [text-shadow:0_0_50px_rgba(232,169,79,0.45)]'
        }`}
      >
        {mafiaWon ? 'MAFIA WINS' : 'TOWN WINS'}
      </motion.h1>
      <p className="text-[15px] font-light tracking-[0.06em] text-parchment/75">
        {mafiaWon ? 'The family runs this town now.' : 'The streets are clean — for tonight.'}
      </p>

      <section className="w-full">
        <GameTable players={room.players} myId={myId} showControls />
      </section>

      <section className="w-full">
        <h2 className="mb-3 text-center text-xs uppercase tracking-[0.32em] text-parchment/55">
          The truth
        </h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {room.players.map((p) => {
            const trueRole = ending.reveal[p.id] ?? null;
            return (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 border border-gold/[0.16] bg-gradient-to-br from-[#1a120a] to-[#0e0906] px-3.5 py-2.5"
              >
                <span className="truncate text-[13px] tracking-[0.1em] text-parchment">
                  {p.alive ? p.name : `✝ ${p.name}`}
                </span>
                <RoleChip role={trueRole} />
              </li>
            );
          })}
        </ul>
      </section>

      {iAmHost ? (
        <button
          onClick={() => getSocket().emit('host:rematch')}
          className="mt-3.5 border border-gold/50 bg-transparent px-11 py-[15px] text-[13px] font-bold uppercase tracking-[0.24em] text-gold transition hover:bg-gold/10"
        >
          Play again
        </button>
      ) : (
        <p className="text-sm font-light text-parchment/60">Waiting for the host to rematch…</p>
      )}
    </main>
  );
}
