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
    <span className="flex items-center gap-2.5">
      <span className="h-2 w-2 animate-glow-pulse rounded-full bg-gold" />
      <span className="text-[22px] font-semibold tracking-[0.12em] text-parchment tabular-nums">
        {m}:{s.toString().padStart(2, '0')}
      </span>
    </span>
  );
}

function calc(endsAt: number | null): number | null {
  if (endsAt == null) return null;
  return Math.max(0, Math.round((endsAt - Date.now()) / 1000));
}
