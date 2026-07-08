'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket, setStoredSession } from '@/lib/socket';
import { useGame } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const setMe = useGame((s) => s.setMe);

  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Pre-warm the socket so the first action is instant.
    getSocket();
  }, []);

  const create = () => {
    if (!name.trim()) return setError('Pick a name first.');
    setBusy(true);
    setError(null);
    getSocket().emit('room:create', { name: name.trim() }, (res) => {
      setBusy(false);
      if (!res.ok) return setError(res.error);
      setMe(res.you.id);
      setStoredSession(res.code, res.you.sessionId);
      router.push(`/room/${res.code}`);
    });
  };

  const join = () => {
    if (!name.trim()) return setError('Pick a name first.');
    if (!joinCode.trim()) return setError('Enter a room code.');
    setBusy(true);
    setError(null);
    getSocket().emit(
      'room:join',
      { code: joinCode.trim().toUpperCase(), name: name.trim() },
      (res) => {
        setBusy(false);
        if (!res.ok) return setError(res.error);
        setMe(res.you.id);
        setStoredSession(res.code, res.you.sessionId);
        router.push(`/room/${res.code}`);
      },
    );
  };

  return (
    <main className="flex min-h-screen animate-fade-up flex-col items-center justify-center px-6 py-12">
      <div className="mb-[18px] font-display text-[15px] uppercase tracking-[0.55em] text-gold">
        Est. 1932
      </div>
      <h1 className="font-display text-[clamp(64px,11vw,128px)] leading-none tracking-[0.12em] text-parchment [text-shadow:0_0_40px_rgba(232,169,79,0.30),0_4px_24px_rgba(0,0,0,0.8)]">
        MAFIA
      </h1>
      <div className="mb-11 mt-5 flex items-center gap-3.5">
        <div className="h-px w-14 bg-gradient-to-r from-transparent to-gold" />
        <div className="text-[13px] uppercase tracking-[0.42em] text-parchment/70">
          Trust no one
        </div>
        <div className="h-px w-14 bg-gradient-to-r from-gold to-transparent" />
      </div>

      <div className="flex w-[min(400px,88vw)] flex-col gap-4 border border-gold/[0.28] bg-[rgba(16,11,7,0.78)] px-8 pb-7 pt-8 shadow-[0_30px_80px_rgba(0,0,0,0.6)] backdrop-blur-lg">
        <label className="flex flex-col gap-2">
          <span className="text-[11px] uppercase tracking-[0.3em] text-parchment/55">
            Your name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder="e.g. Corleone"
            className="border border-parchment/[0.18] bg-ink/70 px-3.5 py-[13px] text-base tracking-[0.04em] text-parchment outline-none focus:border-gold/60"
          />
        </label>

        <button
          onClick={create}
          disabled={busy}
          className="mt-2.5 bg-gold p-4 text-sm font-bold uppercase tracking-[0.22em] text-[#160f08] transition hover:bg-gold-bright hover:shadow-[0_0_26px_rgba(232,169,79,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Create a room
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-parchment/10" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-parchment/40">
            or join one
          </span>
          <div className="h-px flex-1 bg-parchment/10" />
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-[11px] uppercase tracking-[0.3em] text-parchment/55">
            Room code
          </span>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="ABC123"
            className="border border-parchment/[0.18] bg-ink/70 px-3.5 py-[13px] text-lg uppercase tracking-[0.35em] text-gold outline-none placeholder:text-parchment/25 focus:border-gold/60"
          />
        </label>
        <button
          onClick={join}
          disabled={busy}
          className="border border-parchment/[0.22] bg-transparent px-4 py-[13px] text-xs uppercase tracking-[0.22em] text-parchment/65 transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Join room
        </button>

        {error && (
          <p className="border border-noir/35 bg-noir/10 p-3 text-center text-[13px] tracking-[0.08em] text-blush">
            {error}
          </p>
        )}
      </div>

      <div className="mt-[26px] text-xs tracking-[0.14em] text-parchment/40">
        12 seats · roles dealt in the dark · one truth
      </div>
    </main>
  );
}
