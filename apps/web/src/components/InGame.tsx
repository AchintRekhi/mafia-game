'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { Role, RoomView } from '@mafia/shared';
import { VideoRoom } from './VideoRoom';
import { RoleChip } from './RoleChip';
import { PhaseTimer } from './PhaseTimer';
import { NightPhase } from './NightPhase';
import { DayRecap } from './DayRecap';
import { DayDiscussion } from './DayDiscussion';
import { DayVote } from './DayVote';
import { GameEnd } from './GameEnd';

interface Props {
  room: RoomView;
  myId: string | null;
  myRole: Role | null;
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.35 },
};

export function InGame({ room, myId, myRole }: Props) {
  const isNight =
    room.phase === 'night_mafia' ||
    room.phase === 'night_doctor' ||
    room.phase === 'night_detective';

  // We key on a coarse "scene" so transitions only fire when the visible
  // component actually changes — flipping between night_mafia/doctor/detective
  // shouldn't re-trigger a fade since NightPhase stays mounted.
  const scene = isNight
    ? 'night'
    : room.phase === 'day_recap'
      ? 'recap'
      : room.phase === 'day_discussion'
        ? 'discussion'
        : room.phase === 'day_vote'
          ? 'vote'
          : room.phase === 'end'
            ? 'end'
            : 'shell';

  let content: React.ReactNode;
  if (isNight) {
    content = <NightPhase room={room} myId={myId} myRole={myRole} />;
  } else if (room.phase === 'day_recap') {
    content = <DayRecap room={room} />;
  } else if (room.phase === 'day_discussion') {
    content = <DayDiscussion room={room} myId={myId} />;
  } else if (room.phase === 'day_vote') {
    content = <DayVote room={room} myId={myId} />;
  } else if (room.phase === 'end') {
    content = <GameEnd room={room} myId={myId} />;
  } else {
    content = <GenericShell room={room} myId={myId} />;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={scene} {...fade}>
        {content}
      </motion.div>
    </AnimatePresence>
  );
}

function GenericShell({ room, myId }: { room: RoomView; myId: string | null }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-6">
      <header className="flex items-baseline justify-between">
        <p className="font-display text-2xl tracking-widest text-stone-100">{room.code}</p>
        <div className="flex items-center gap-4">
          <p className="text-xs uppercase tracking-widest text-stone-400">
            {room.phase.replace('_', ' ')}
          </p>
          <PhaseTimer endsAt={room.phaseEndsAt} />
        </div>
      </header>

      <VideoRoom />

      <section>
        <h2 className="mb-3 font-display text-lg tracking-wider text-stone-100">
          Players ({room.players.filter((p) => p.alive).length} alive)
        </h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {room.players.map((p) => (
            <li
              key={p.id}
              className={`flex items-center justify-between gap-2 rounded border px-3 py-2 ${
                p.alive
                  ? 'border-stone-800 bg-stone-950/60'
                  : 'border-stone-900 bg-stone-950/40 opacity-50'
              } ${p.id === myId ? 'ring-1 ring-mafia' : ''}`}
            >
              <span className="truncate text-stone-100">
                {p.alive ? p.name : `✝ ${p.name}`}
              </span>
              <RoleChip role={p.role} hidden={p.role === null} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
