'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { Role, RoomView } from '@mafia/shared';
import { VideoRoom } from './VideoRoom';
import { RoleChip } from './RoleChip';
import { TopBar } from './TopBar';
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
  const alive = room.players.filter((p) => p.alive).length;
  return (
    <main className="flex min-h-screen flex-col">
      <TopBar
        code={room.code}
        phaseLabel={room.phase.replace('_', ' ')}
        aliveCount={alive}
        endsAt={room.phaseEndsAt}
      />

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-6">
        <VideoRoom />

        <section>
          <h2 className="mb-3 text-xs uppercase tracking-[0.32em] text-parchment/55">The town</h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {room.players.map((p) => (
              <li
                key={p.id}
                className={`flex items-center justify-between gap-2 border bg-gradient-to-br from-[#1a120a] to-[#0e0906] px-3.5 py-2.5 ${
                  p.alive ? 'border-gold/[0.16]' : 'border-parchment/10 opacity-55 grayscale'
                } ${p.id === myId ? 'border-gold/70' : ''}`}
              >
                <span className="truncate text-[13px] tracking-[0.1em] text-parchment">
                  {p.alive ? p.name : `✝ ${p.name}`}
                </span>
                <RoleChip role={p.role} hidden={p.role === null} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
