'use client';

import type { RoomView } from '@mafia/shared';
import { GameTable } from './GameTable';
import { TopBar } from './TopBar';
import { ChatPanel } from './ChatPanel';

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

      <div className="mx-auto grid w-full max-w-5xl flex-1 gap-5 px-6 py-6 md:grid-cols-[1fr_300px]">
        <section className="flex flex-col gap-4">
          <h2 className="text-xs uppercase tracking-[0.32em] text-parchment/55">The town</h2>
          <GameTable
            players={room.players}
            myId={myId}
            showRoleChip
            showControls={!!me?.alive}
          />
        </section>

        <section>
          <ChatPanel
            channel={me?.alive ? 'public' : 'ghost'}
            placeholder={me?.alive ? 'Make your case…' : 'Whisper to the dead…'}
          />
        </section>
      </div>
    </main>
  );
}
