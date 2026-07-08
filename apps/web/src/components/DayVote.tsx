'use client';

import type { RoomView } from '@mafia/shared';
import { getSocket } from '@/lib/socket';
import { TopBar } from './TopBar';
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
  const alive = room.players.filter((p) => p.alive).length;

  const submit = (targetId: string | null) => {
    getSocket().emit('day:vote', targetId);
  };

  return (
    <main className="flex min-h-screen flex-col">
      <TopBar
        code={room.code}
        phaseLabel="Day · the vote"
        aliveCount={alive}
        endsAt={room.phaseEndsAt}
      />

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-6 py-6">
        <VideoRoom />

        <div className="grid gap-5 md:grid-cols-[1fr_300px]">
          <section>
            <h2 className="mb-3 text-xs uppercase tracking-[0.32em] text-blush">
              Who takes the fall?
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
                      className={`flex w-full items-center justify-between gap-2 border bg-gradient-to-br from-[#1a120a] to-[#0e0906] px-3.5 py-2.5 text-left transition ${
                        picked
                          ? 'border-gold shadow-[0_0_0_2px_rgba(217,156,74,0.85),0_0_30px_rgba(217,156,74,0.25)]'
                          : 'border-gold/[0.16] hover:border-gold/70'
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      <span className="truncate text-[13px] tracking-[0.1em] text-parchment">
                        {p.alive ? p.name : `✝ ${p.name}`}
                      </span>
                      {count > 0 && (
                        <span className="flex h-[26px] min-w-[26px] animate-fade-in items-center justify-center rounded-full bg-noir px-1.5 text-[13px] font-bold text-white shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
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
      </div>
    </main>
  );
}
