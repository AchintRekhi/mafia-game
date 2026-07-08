'use client';

import { useState } from 'react';
import { PhaseTimer } from './PhaseTimer';

interface Props {
  code: string;
  phaseLabel: string;
  /** 'gold' for lobby/day, 'blush' for night. */
  phaseTone?: 'gold' | 'blush';
  aliveCount?: number;
  endsAt?: number | null;
}

export function TopBar({ code, phaseLabel, phaseTone = 'gold', aliveCount, endsAt }: Props) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <div className="flex items-center justify-between gap-[18px] border-b border-gold/[0.18] bg-ink/55 px-[26px] py-4 backdrop-blur">
      <div className="flex items-baseline gap-4">
        <div className="font-display text-2xl tracking-[0.14em] text-parchment">MAFIA</div>
        <div
          className={`text-xs uppercase tracking-[0.3em] ${
            phaseTone === 'blush' ? 'text-blush' : 'text-gold'
          }`}
        >
          {phaseLabel}
        </div>
      </div>
      {endsAt != null && <PhaseTimer endsAt={endsAt} />}
      <div className="flex items-center gap-3">
        {aliveCount != null && (
          <div className="text-xs tracking-[0.12em] text-parchment/55">{aliveCount} alive</div>
        )}
        <button
          onClick={copyCode}
          title="Copy room code"
          className="flex items-center gap-2 border border-gold/40 bg-gold/10 px-3.5 py-2 text-[13px] tracking-[0.26em] text-gold transition hover:bg-gold/20"
        >
          {copied ? 'Copied' : code}
        </button>
      </div>
    </div>
  );
}
