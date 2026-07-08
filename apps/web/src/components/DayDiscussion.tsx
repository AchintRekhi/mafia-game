'use client';

import type { RoomView } from '@mafia/shared';
import { VideoRoom } from './VideoRoom';
import { TopBar } from './TopBar';
import { ChatPanel } from './ChatPanel';
import { RoleChip } from './RoleChip';

interface Props {
  room: RoomView;
  myId: string | null;
}

export function DayDiscussion({ room, myId }: Props) {
  const me = room.players.find((p) => p.id === myId);
  const alive = room.players.filter((p) => p.alive).length;
  return (
    <main className="flex min-h-screen flex-col">
      <TopBar
        code={room.code}
        phaseLabel="Day · discussion"
        aliveCount={alive}
        endsAt={room.phaseEndsAt}
      />

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-6 py-6">
        <VideoRoom />

        <div className="grid gap-5 md:grid-cols-[1fr_300px]">
          <section>
            <h2 className="mb-3 text-xs uppercase tracking-[0.32em] text-parchment/55">
              The town
            </h2>
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

          <section>
            <ChatPanel
              channel={me?.alive ? 'public' : 'ghost'}
              placeholder={me?.alive ? 'Make your case…' : 'Whisper to the dead…'}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
