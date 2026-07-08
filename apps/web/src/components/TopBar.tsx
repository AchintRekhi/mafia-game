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
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-gold/[0.18] bg-ink/55 px-4 py-3 backdrop-blur sm:px-[26px] sm:py-4">
      <div className="flex items-baseline gap-2 sm:gap-4">
        <div className="font-display text-xl tracking-[0.14em] text-parchment sm:text-2xl">
          MAFIA
        </div>
        <div
          className={`text-[10px] uppercase tracking-[0.2em] sm:text-xs sm:tracking-[0.3em] ${
            phaseTone === 'blush' ? 'text-blush' : 'text-gold'
          }`}
        >
          {phaseLabel}
        </div>
      </div>
      {endsAt != null && (
        <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1 sm:text-center">
          <span className="inline-flex sm:justify-center">
            <PhaseTimer endsAt={endsAt} />
          </span>
        </div>
      )}
      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
        {aliveCount != null && (
          <div className="text-xs tracking-[0.12em] text-parchment/55">{aliveCount} alive</div>
        )}
        <button
          onClick={copyCode}
          title="Copy room code"
          className="flex items-center gap-2 border border-gold/40 bg-gold/10 px-3 py-1.5 text-[13px] tracking-[0.26em] text-gold transition hover:bg-gold/20 sm:px-3.5 sm:py-2"
        >
          {copied ? 'Copied' : code}
        </button>
      </div>
    </div>
  );
}
