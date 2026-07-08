'use client';

import { motion } from 'framer-motion';
import type { Role, RoomView } from '@mafia/shared';
import { getSocket } from '@/lib/socket';
import { useGame } from '@/lib/store';
import { TopBar } from './TopBar';

interface Props {
  room: RoomView;
  myId: string | null;
  myRole: Role | null;
}

const COPY: Record<Role, { title: string; prompt: string }> = {
  mafia: { title: 'Mafia, awake.', prompt: 'Choose your mark. The town sleeps.' },
  doctor: { title: 'Doctor, awake.', prompt: 'Save one soul tonight.' },
  detective: { title: 'Detective, awake.', prompt: 'Investigate one player.' },
  civilian: { title: 'Night falls.', prompt: 'Stay silent until dawn.' },
};

export function NightPhase({ room, myId, myRole }: Props) {
  const me = room.players.find((p) => p.id === myId);
  const isMyTurn =
    me?.alive &&
    ((room.phase === 'night_mafia' && me.role === 'mafia') ||
      (room.phase === 'night_doctor' && me.role === 'doctor') ||
      (room.phase === 'night_detective' && me.role === 'detective'));

  const copy = myRole ? COPY[myRole] : COPY.civilian;
  const livingTargets = room.players.filter((p) => p.alive);
  const alive = livingTargets.length;

  // Current pick (only visible to actor's role).
  const currentPick = currentTargetFor(room);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen flex-col"
    >
      <TopBar code={room.code} phaseLabel="Night" phaseTone="blush" aliveCount={alive} />

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        <h2 className="font-display text-3xl tracking-[0.14em] text-parchment">{copy.title}</h2>

        <p className="animate-fade-in text-sm uppercase tracking-[0.24em] text-blush">
          {isMyTurn ? copy.prompt : 'The town sleeps.'}
        </p>

        {isMyTurn ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {livingTargets.map((p) => {
              const picked = currentPick === p.id;
              const isSelf = p.id === myId;
              // Mafia can't kill themselves; Detective shouldn't investigate self (no info).
              const allowSelf = me?.role === 'doctor';
              const disabled = isSelf && !allowSelf;
              return (
                <li key={p.id}>
                  <button
                    disabled={disabled}
                    onClick={() => submit(room.phase, p.id)}
                    className={`w-full border bg-gradient-to-br from-[#1a120a] to-[#0e0906] px-3.5 py-3 text-left text-[13px] tracking-[0.1em] text-parchment brightness-[0.85] transition ${
                      picked
                        ? 'border-gold shadow-[0_0_0_2px_rgba(217,156,74,0.85),0_0_30px_rgba(217,156,74,0.25)] brightness-100'
                        : 'border-gold/[0.16] hover:border-gold/70'
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {p.name}
                    {isSelf && (
                      <span className="ml-2 text-[10px] tracking-[0.2em] text-parchment/40">
                        (you)
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-center text-sm font-light tracking-[0.08em] text-parchment/40">
            Eyes closed. Mics muted, please.
          </p>
        )}
      </div>
    </motion.div>
  );
}

function currentTargetFor(room: RoomView): string | null {
  if (!room.night) return null;
  if ('mafiaTarget' in room.night) return room.night.mafiaTarget;
  if ('doctorTarget' in room.night) return room.night.doctorTarget;
  return null;
}

function submit(phase: RoomView['phase'], targetId: string) {
  const s = getSocket();
  if (phase === 'night_mafia') s.emit('mafia:pickTarget', targetId);
  else if (phase === 'night_doctor') s.emit('doctor:protect', targetId);
  else if (phase === 'night_detective') s.emit('detective:investigate', targetId);
}

// Re-export for convenience so consumers don't need to import zustand directly.
export function useLatestDetectiveResult() {
  return useGame((s) => s.detectiveResults.at(-1) ?? null);
}
