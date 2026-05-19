'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
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
        router.push(`/room/${res.code}`);
      },
    );
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-12">
      <h1 className="font-display text-7xl tracking-widest text-mafia drop-shadow-[0_0_24px_rgba(185,28,28,0.55)]">
        MAFIA
      </h1>
      <p className="max-w-md text-center text-stone-300">
        The narrator is the app. Roles are secret. The town decides who hangs.
      </p>

      <div className="w-full max-w-sm space-y-3">
        <label className="block text-xs uppercase tracking-widest text-stone-400">
          Your name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          placeholder="e.g. Achint"
          className="w-full rounded border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100 outline-none focus:border-mafia"
        />
      </div>

      <div className="grid w-full max-w-sm gap-6">
        <section className="space-y-2 rounded-lg border border-stone-800 bg-stone-950/70 p-5">
          <h2 className="font-display text-xl text-stone-100">Create a room</h2>
          <p className="text-sm text-stone-400">
            You become the host. Share the 6-char code with friends.
          </p>
          <button
            onClick={create}
            disabled={busy}
            className="w-full rounded bg-mafia px-4 py-2 font-display tracking-wider text-stone-50 disabled:opacity-50"
          >
            Create
          </button>
        </section>

        <section className="space-y-2 rounded-lg border border-stone-800 bg-stone-950/70 p-5">
          <h2 className="font-display text-xl text-stone-100">Join a room</h2>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="ABC123"
            className="w-full rounded border border-stone-700 bg-stone-900 px-3 py-2 text-center font-display text-2xl tracking-[0.4em] text-stone-100 outline-none focus:border-mafia"
          />
          <button
            onClick={join}
            disabled={busy}
            className="w-full rounded border border-mafia px-4 py-2 font-display tracking-wider text-stone-50 disabled:opacity-50"
          >
            Join
          </button>
        </section>

        {error && (
          <p className="rounded border border-mafia/60 bg-mafia/10 p-2 text-center text-sm text-mafia">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
