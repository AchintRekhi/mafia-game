'use client';

import type { Role } from '@mafia/shared';
import { ROLE_COLOR } from '@mafia/shared';

const LABEL: Record<Role, string> = {
  mafia: 'MAFIA',
  doctor: 'DOCTOR',
  detective: 'DETECTIVE',
  civilian: 'CIVILIAN',
};

interface Props {
  role: Role | null;
  /** If the viewer isn't allowed to see this role, render a muted "?" chip. */
  hidden?: boolean;
  size?: 'sm' | 'md';
}

export function RoleChip({ role, hidden, size = 'sm' }: Props) {
  const text = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const pad = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1';

  if (hidden || !role) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-sm border border-stone-700 bg-stone-900 font-display tracking-widest text-stone-500 ${text} ${pad}`}
      >
        ???
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm font-display tracking-widest text-stone-50 ${text} ${pad}`}
      style={{ backgroundColor: ROLE_COLOR[role] }}
    >
      {LABEL[role]}
    </span>
  );
}
