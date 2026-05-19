'use client';

import { motion } from 'framer-motion';
import type { Role, RoomView } from '@mafia/shared';
import { getSocket } from '@/lib/socket';
import { useGame } from '@/lib/store';

interface Props {
  room: RoomView;
  myId: string | null;
  myRole: Role | null;
}

const COPY: Record<Role, { title: string; prompt: string }> = {
  mafia: { title: 'Mafia, awake.', prompt: 'Choose your kill.' },
  doctor: { title: 'Doctor, awake.', prompt: 'Save one person tonight.' },
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

  // Current pick (only visible to actor's role).
  const currentPick = currentTargetFor(room);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-10 text-stone-200"
    >
      <header className="flex items-baseline justify-between">
        <h2 className="font-display text-3xl tracking-widest">{copy.title}</h2>
      </header>

      <p className="text-stone-400">{isMyTurn ? copy.prompt : 'The town sleeps.'}</p>

      {isMyTurn ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                  className={`w-full rounded border px-3 py-2 text-left text-sm ${
                    picked
                      ? 'border-mafia bg-mafia/15 text-stone-50'
                      : 'border-stone-800 bg-stone-950/60 hover:border-stone-600'
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {p.name}
                  {isSelf && <span className="ml-2 text-[10px] text-stone-500">(you)</span>}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-center text-sm text-stone-500">Eyes closed. Mics muted, please.</p>
      )}
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
