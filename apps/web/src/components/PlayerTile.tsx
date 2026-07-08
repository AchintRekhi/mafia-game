'use client';

import type { ReactNode } from 'react';

export interface PlayerTileProps {
  name: string;
  isMe: boolean;
  /** The live <VideoTrack> element, or null to fall back to the avatar / cam-off state. */
  videoSlot?: ReactNode;
  /** When there's no video: show the animated cam-off state instead of the initials avatar. */
  camOff?: boolean;
  speaking?: boolean;
  micOff?: boolean;
  dead?: boolean;
  deadLabel?: string;
  hostBadge?: boolean;
  /** Small chip rendered top-left (e.g. a RoleChip the viewer is allowed to see). */
  roleChip?: ReactNode;
  /** Red "Mafia" ally tag (shown to Mafia during the night). */
  allyTag?: boolean;
  /** Live vote count badge (day vote). */
  voteCount?: number;
  selectable?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  onSelect?: () => void;
}

function initialsOf(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export function PlayerTile({
  name,
  isMe,
  videoSlot,
  camOff,
  speaking,
  micOff,
  dead,
  deadLabel = 'Out · Spectating',
  hostBadge,
  roleChip,
  allyTag,
  voteCount,
  selectable,
  selected,
  dimmed,
  onSelect,
}: PlayerTileProps) {
  const showVideo = !dead && !!videoSlot;
  const showCamOff = !dead && !videoSlot && camOff;
  const showAvatar = !dead && !videoSlot && !camOff;

  return (
    <div
      onClick={selectable ? onSelect : undefined}
      className={`group relative aspect-[4/3] select-none overflow-hidden border bg-gradient-to-br from-[#1a120a] to-[#0e0906] transition ${
        selectable ? 'cursor-pointer' : 'cursor-default'
      }`}
      style={{
        borderColor: selected
          ? '#d99c4a'
          : allyTag
            ? 'rgba(184,64,46,0.6)'
            : 'rgba(217,156,74,0.16)',
        opacity: dead ? 0.55 : dimmed ? 0.7 : 1,
        filter: dead ? 'grayscale(1)' : dimmed ? 'brightness(0.7) saturate(0.8)' : 'none',
        boxShadow: selected
          ? '0 0 0 2px rgba(217,156,74,0.85), 0 0 30px rgba(217,156,74,0.25)'
          : '0 10px 30px rgba(0,0,0,0.45)',
      }}
    >
      {showVideo && <div className="absolute inset-0">{videoSlot}</div>}

      {showAvatar && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 70% at 50% 42%, rgba(232,169,79,0.13), rgba(11,8,5,0) 70%)',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/45 bg-gold/[0.08] font-display text-2xl text-gold">
              {initialsOf(name)}
            </div>
          </div>
        </>
      )}

      {showCamOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[rgba(8,5,3,0.6)]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(239,230,211,0.4)" strokeWidth="1.5">
            <path d="M3 3l18 18M15 10l5-3v10l-2.2-1.3M15 13.5V17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h2" />
          </svg>
          <div className="text-[10px] uppercase tracking-[0.3em] text-parchment/40">Camera off</div>
        </div>
      )}

      {dead && (
        <div className="absolute inset-0 flex items-center justify-center bg-[rgba(6,4,2,0.62)]">
          <div className="border border-parchment/30 px-3.5 py-[7px] text-[11px] uppercase tracking-[0.4em] text-parchment/55">
            {deadLabel}
          </div>
        </div>
      )}

      {!dead && typeof voteCount === 'number' && voteCount > 0 && (
        <div className="absolute right-2 top-2 flex h-[26px] min-w-[26px] animate-fade-in items-center justify-center rounded-full bg-noir px-1.5 text-[13px] font-bold text-white shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
          {voteCount}
        </div>
      )}

      {!dead && allyTag && (
        <div className="absolute left-2 top-2 border border-noir/50 bg-noir/25 px-2 py-1 text-[9px] uppercase tracking-[0.3em] text-blush">
          Mafia
        </div>
      )}
      {!dead && !allyTag && roleChip && <div className="absolute left-2 top-2">{roleChip}</div>}
      {hostBadge && (
        <div className="absolute right-2 top-2 border border-gold/40 bg-gold/10 px-2 py-1 text-[9px] uppercase tracking-[0.3em] text-gold">
          Host
        </div>
      )}

      {/* name bar */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-[rgba(6,4,2,0.85)] to-transparent px-2.5 py-2">
        <div className="truncate text-[13px] tracking-[0.1em] text-parchment">
          {name}
          {isMe && <span className="ml-1.5 text-[10px] text-parchment/45">(you)</span>}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {speaking && (
            <div className="flex h-3 items-end gap-0.5">
              <span className="w-[3px] bg-gold" style={{ height: 6 }} />
              <span className="w-[3px] bg-gold" style={{ height: 12 }} />
              <span className="w-[3px] bg-gold" style={{ height: 8 }} />
            </div>
          )}
          {micOff && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(184,64,46,0.9)" strokeWidth="2">
              <path d="M3 3l18 18M9 9v3a3 3 0 0 0 5.1 2.1M15 9.3V6a3 3 0 0 0-6-.3M19 11a7 7 0 0 1-9.9 6.4M5 11a7 7 0 0 0 .8 3.2" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
