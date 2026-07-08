'use client';

import type { RoomView } from '@mafia/shared';
import { getSocket } from '@/lib/socket';
import { TopBar } from './TopBar';
import { GameTable } from './GameTable';
import { ChatPanel } from './ChatPanel';

interface Props {
  room: RoomView;
  myId: string | null;
}

export function DayVote({ room, myId }: Props) {
  const me = room.players.find((p) => p.id === myId);
  const myVote = room.myVote ?? null;
  const tally = room.voteTally ?? {};
  const alive = room.players.filter((p) => p.alive).length;

  const submit = (targetId: string | null) => {
    getSocket().emit('day:vote', targetId);
  };

  // You can vote for any living player who isn't you — only while you're alive.
  const selectableIds = new Set(
    me?.alive ? room.players.filter((p) => p.alive && p.id !== myId).map((p) => p.id) : [],
  );

  return (
    <main className="flex min-h-screen flex-col">
      <TopBar
        code={room.code}
        phaseLabel="Day · the vote"
        aliveCount={alive}
        endsAt={room.phaseEndsAt}
      />

      <div className="mx-auto grid w-full max-w-5xl flex-1 gap-5 px-6 py-6 md:grid-cols-[1fr_300px]">
        <section className="flex flex-col gap-4">
          <h2 className="text-xs uppercase tracking-[0.32em] text-blush">Who takes the fall?</h2>
          <GameTable
            players={room.players}
            myId={myId}
            selectableIds={selectableIds}
            selectedId={myVote}
            onSelect={submit}
            voteTally={tally}
            showControls={!!me?.alive}
          />
          <div className="flex justify-end">
            <button
              onClick={() => submit(null)}
              disabled={!me?.alive}
              className={`border px-3.5 py-2 text-xs uppercase tracking-[0.22em] transition ${
                myVote === null
                  ? 'border-gold/50 bg-gold/15 text-gold'
                  : 'border-parchment/[0.22] text-parchment/50 hover:border-gold hover:text-gold'
              } disabled:opacity-40`}
            >
              Abstain
            </button>
          </div>
        </section>

        <section>
          <ChatPanel
            channel={me?.alive ? 'public' : 'ghost'}
            placeholder={me?.alive ? 'Final words…' : 'Whisper to the dead…'}
          />
        </section>
      </div>
    </main>
  );
}
