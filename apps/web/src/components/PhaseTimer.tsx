'use client';

import { useEffect, useState } from 'react';

export function PhaseTimer({ endsAt }: { endsAt: number | null }) {
  const [remaining, setRemaining] = useState(() => calc(endsAt));

  useEffect(() => {
    if (endsAt == null) {
      setRemaining(null);
      return;
    }
    setRemaining(calc(endsAt));
    const t = setInterval(() => setRemaining(calc(endsAt)), 250);
    return () => clearInterval(t);
  }, [endsAt]);

  if (remaining == null) return null;
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return (
    <span className="font-display text-lg tracking-widest text-stone-300 tabular-nums">
      {m}:{s.toString().padStart(2, '0')}
    </span>
  );
}

function calc(endsAt: number | null): number | null {
  if (endsAt == null) return null;
  return Math.max(0, Math.round((endsAt - Date.now()) / 1000));
}
