'use client';

import { motion } from 'framer-motion';
import type { Role, RoomView } from '@mafia/shared';
import { getSocket } from '@/lib/socket';
import { useGame } from '@/lib/store';
import { TopBar } from './TopBar';
import { GameTable } from './GameTable';

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
    (me?.alive &&
      ((room.phase === 'night_mafia' && me.role === 'mafia') ||
        (room.phase === 'night_doctor' && me.role === 'doctor') ||
        (room.phase === 'night_detective' && me.role === 'detective'))) ||
    false;

  const copy = myRole ? COPY[myRole] : COPY.civilian;
  const alive = room.players.filter((p) => p.alive).length;
  const currentPick = currentTargetFor(room);

  // The actor picks a living player. Only the Doctor may target self.
  const allowSelf = me?.role === 'doctor';
  const selectableIds = new Set(
    isMyTurn
      ? room.players.filter((p) => p.alive && (allowSelf || p.id !== myId)).map((p) => p.id)
      : [],
  );
  // Mafia see their teammates flagged.
  const allyIds =
    me?.role === 'mafia'
      ? new Set(room.players.filter((p) => p.role === 'mafia').map((p) => p.id))
      : undefined;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-screen flex-col">
      <TopBar code={room.code} phaseLabel="Night" phaseTone="blush" aliveCount={alive} />

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
        <h2 className="font-display text-3xl tracking-[0.14em] text-parchment">{copy.title}</h2>
        <p className="animate-fade-in text-sm uppercase tracking-[0.24em] text-blush">
          {isMyTurn ? copy.prompt : 'The town sleeps.'}
        </p>

        <GameTable
          players={room.players}
          myId={myId}
          selectableIds={selectableIds}
          selectedId={currentPick}
          onSelect={(id) => submit(room.phase, id)}
          allyIds={allyIds}
          dimUnselectable
        />

        {!isMyTurn && (
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
