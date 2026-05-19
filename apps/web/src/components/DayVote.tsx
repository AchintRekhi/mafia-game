'use client';

import type { RoomView } from '@mafia/shared';
import { getSocket } from '@/lib/socket';
import { PhaseTimer } from './PhaseTimer';
import { VideoRoom } from './VideoRoom';
import { ChatPanel } from './ChatPanel';

interface Props {
  room: RoomView;
  myId: string | null;
}

export function DayVote({ room, myId }: Props) {
  const me = room.players.find((p) => p.id === myId);
  const myVote = room.myVote ?? null;
  const tally = room.voteTally ?? {};

  const submit = (targetId: string | null) => {
    getSocket().emit('day:vote', targetId);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-5 px-6 py-6">
      <header className="flex items-baseline justify-between">
        <p className="font-display text-2xl tracking-widest text-stone-100">{room.code}</p>
        <div className="flex items-center gap-4">
          <p className="text-xs uppercase tracking-widest text-mafia">Vote</p>
          <PhaseTimer endsAt={room.phaseEndsAt} />
        </div>
      </header>

      <VideoRoom />

      <div className="grid gap-5 md:grid-cols-[1fr_320px]">
        <section>
          <h2 className="mb-3 font-display text-lg tracking-wider text-stone-100">
            Who hangs today?
          </h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {room.players.map((p) => {
              const count = tally[p.id] ?? 0;
              const picked = myVote === p.id;
              const disabled = !me?.alive || !p.alive || p.id === myId;
              return (
                <li key={p.id}>
                  <button
                    disabled={disabled}
                    onClick={() => submit(p.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded border px-3 py-2 text-left ${
                      picked
                        ? 'border-mafia bg-mafia/15 text-stone-50'
                        : 'border-stone-800 bg-stone-950/60 hover:border-stone-600 text-stone-100'
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    <span className="truncate">{p.alive ? p.name : `✝ ${p.name}`}</span>
                    {count > 0 && (
                      <span className="rounded bg-stone-800 px-1.5 text-xs font-display tracking-wider text-stone-200">
                        {count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => submit(null)}
              disabled={!me?.alive}
              className={`rounded border px-3 py-1.5 text-xs uppercase tracking-widest ${
                myVote === null
                  ? 'border-stone-500 bg-stone-800 text-stone-100'
                  : 'border-stone-800 text-stone-400 hover:border-stone-600'
              } disabled:opacity-40`}
            >
              Abstain
            </button>
          </div>
        </section>

        <section>
          <ChatPanel
            disabled={!me?.alive}
            placeholder={me?.alive ? 'Final words…' : 'Spectating'}
          />
        </section>
      </div>
    </main>
  );
}
