'use client';

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

export function InGame({ room, myId, myRole }: Props) {
  const isNight =
    room.phase === 'night_mafia' ||
    room.phase === 'night_doctor' ||
    room.phase === 'night_detective';

  if (isNight) {
    return <NightPhase room={room} myId={myId} myRole={myRole} />;
  }

  if (room.phase === 'day_recap') {
    return <DayRecap room={room} />;
  }

  if (room.phase === 'day_discussion') {
    return <DayDiscussion room={room} myId={myId} />;
  }

  if (room.phase === 'day_vote') {
    return <DayVote room={room} myId={myId} />;
  }

  if (room.phase === 'end') {
    return <GameEnd room={room} myId={myId} />;
  }

  // role_assign + (future) day_discussion / day_vote — generic in-game shell.
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
