'use client';

import type { RoomView } from '@mafia/shared';
import { VideoRoom } from './VideoRoom';
import { RoleChip } from './RoleChip';

interface Props {
  room: RoomView;
  myId: string | null;
}

export function InGame({ room, myId }: Props) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-6">
      <header className="flex items-baseline justify-between">
        <p className="font-display text-2xl tracking-widest text-stone-100">{room.code}</p>
        <p className="text-xs uppercase tracking-widest text-stone-400">
          Phase · {room.phase.replace('_', ' ')}
        </p>
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
                p.alive ? 'border-stone-800 bg-stone-950/60' : 'border-stone-900 bg-stone-950/40 opacity-50'
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

      <p className="text-center text-xs text-stone-500">
        Night phase lands next. For now, verify that role chips match expectations.
      </p>
    </main>
  );
}
