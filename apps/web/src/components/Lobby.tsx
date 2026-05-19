'use client';

import { useState } from 'react';
import type { RoomView } from '@mafia/shared';

interface Props {
  room: RoomView;
  myId: string | null;
}

const MIN_PLAYERS = 6;
const MAX_PLAYERS = 12;

export function Lobby({ room, myId }: Props) {
  const [copied, setCopied] = useState(false);
  const me = room.players.find((p) => p.id === myId);
  const iAmHost = me?.isHost ?? false;
  const canStart = iAmHost && room.players.length >= MIN_PLAYERS;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col items-center gap-2">
        <p className="text-xs uppercase tracking-widest text-stone-400">Room code</p>
        <button
          onClick={copyCode}
          className="font-display text-5xl tracking-[0.4em] text-stone-100 transition hover:text-mafia"
          title="Click to copy"
        >
          {room.code}
        </button>
        <p className="text-xs text-stone-500">
          {copied ? 'Copied!' : 'Tap to copy — share with your friends.'}
        </p>
      </header>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl tracking-wider text-stone-100">
            Players ({room.players.length}/{MAX_PLAYERS})
          </h2>
          <span className="text-xs text-stone-500">Need {MIN_PLAYERS}+ to start</span>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {room.players.map((p) => (
            <li
              key={p.id}
              className={`rounded border bg-stone-950/60 px-3 py-2 text-stone-100 ${
                p.isMe ? 'border-mafia' : 'border-stone-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate font-medium">{p.name}</span>
                {p.isHost && (
                  <span className="text-[10px] uppercase tracking-widest text-stone-400">
                    Host
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="flex flex-col items-center gap-3">
        {iAmHost ? (
          <button
            disabled={!canStart}
            className="rounded bg-mafia px-10 py-3 font-display text-lg tracking-widest text-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
            title={canStart ? 'Start the game' : `Need at least ${MIN_PLAYERS} players`}
          >
            Start Game
          </button>
        ) : (
          <p className="text-sm text-stone-400">Waiting for the host to start…</p>
        )}
        <p className="text-xs text-stone-500">
          Role assignment + the night phase land in <code>feature/role-assignment</code>.
        </p>
      </footer>
    </main>
  );
}
