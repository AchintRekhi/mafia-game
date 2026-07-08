'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { Role, RoomView } from '@mafia/shared';
import { GameTable } from './GameTable';
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

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-6">
        <h2 className="text-xs uppercase tracking-[0.32em] text-parchment/55">The town</h2>
        <GameTable players={room.players} myId={myId} showRoleChip showControls />
      </div>
    </main>
  );
}
