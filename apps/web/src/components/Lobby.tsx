'use client';

import type { RoomView, TimingPreset } from '@mafia/shared';
import { VideoRoom } from './VideoRoom';
import { TopBar } from './TopBar';
import { getSocket } from '@/lib/socket';

const PRESET_DESC: Record<TimingPreset, string> = {
  fast: '90s talk · 30s vote',
  normal: '3min talk · 45s vote',
  long: '5min talk · 60s vote',
};

interface Props {
  room: RoomView;
  myId: string | null;
}

const MIN_PLAYERS = 6;
const MAX_PLAYERS = 12;

export function Lobby({ room, myId }: Props) {
  const me = room.players.find((p) => p.id === myId);
  const iAmHost = me?.isHost ?? false;
  const canStart = iAmHost && room.players.length >= MIN_PLAYERS;

  return (
    <main className="flex min-h-screen flex-col">
      <TopBar code={room.code} phaseLabel="Lobby · waiting" />

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-6">
        <VideoRoom />

        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs uppercase tracking-[0.32em] text-parchment/55">
              At the table · {room.players.length}/{MAX_PLAYERS}
            </h2>
            <span className="text-xs tracking-[0.14em] text-parchment/40">
              Need {MIN_PLAYERS}+ to deal
            </span>
          </div>

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {room.players.map((p) => (
              <li
                key={p.id}
                className={`border bg-gradient-to-br from-[#1a120a] to-[#0e0906] px-3.5 py-2.5 text-parchment ${
                  p.isMe ? 'border-gold/70' : 'border-gold/[0.16]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-[13px] tracking-[0.1em]">{p.name}</span>
                  {p.isHost && (
                    <span className="text-[9px] uppercase tracking-[0.3em] text-gold">Host</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="flex flex-col items-center gap-4 border-t border-gold/[0.18] bg-ink/60 px-[26px] py-4 backdrop-blur">
        {iAmHost ? (
          <>
            <PresetPicker current={room.preset} />
            <button
              onClick={() => getSocket().emit('host:start')}
              disabled={!canStart}
              className="bg-gold px-10 py-3.5 text-[13px] font-bold uppercase tracking-[0.24em] text-[#160f08] transition hover:bg-gold-bright hover:shadow-[0_0_26px_rgba(232,169,79,0.4)] disabled:cursor-not-allowed disabled:opacity-40"
              title={canStart ? 'Start the game' : `Need at least ${MIN_PLAYERS} players`}
            >
              Deal the cards
            </button>
          </>
        ) : (
          <>
            <p className="text-[11px] uppercase tracking-[0.3em] text-parchment/40">
              Pace · {room.preset} · {PRESET_DESC[room.preset]}
            </p>
            <p className="text-sm font-light text-parchment/60">
              Waiting for the host to deal the cards…
            </p>
          </>
        )}
      </footer>
    </main>
  );
}

function PresetPicker({ current }: { current: TimingPreset }) {
  const set = (p: TimingPreset) => getSocket().emit('host:setPreset', p);
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[11px] uppercase tracking-[0.3em] text-parchment/40">Pace</p>
      <div className="flex gap-2">
        {(['fast', 'normal', 'long'] as TimingPreset[]).map((p) => (
          <button
            key={p}
            onClick={() => set(p)}
            className={`border px-3 py-1.5 text-xs uppercase tracking-[0.22em] transition ${
              current === p
                ? 'border-gold/50 bg-gold/15 text-gold'
                : 'border-parchment/[0.22] text-parchment/50 hover:border-gold hover:text-gold'
            }`}
            title={PRESET_DESC[p]}
          >
            {p}
          </button>
        ))}
      </div>
      <p className="text-[10px] tracking-[0.14em] text-parchment/40">{PRESET_DESC[current]}</p>
    </div>
  );
}
