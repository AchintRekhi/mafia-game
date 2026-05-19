export const ROLES = ['mafia', 'doctor', 'detective', 'civilian'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_COLOR: Record<Role, string> = {
  mafia: '#B91C1C',
  doctor: '#059669',
  detective: '#4F46E5',
  civilian: '#6B7280',
};

export const DEAD_COLOR = '#3F3F46';

/** Server picks a role distribution from this table at game start. */
export const BALANCE_TABLE: Record<number, Record<Role, number>> = {
  6: { mafia: 1, doctor: 1, detective: 1, civilian: 3 },
  7: { mafia: 2, doctor: 1, detective: 1, civilian: 3 },
  8: { mafia: 2, doctor: 1, detective: 1, civilian: 4 },
  9: { mafia: 2, doctor: 1, detective: 1, civilian: 5 },
  10: { mafia: 3, doctor: 1, detective: 1, civilian: 5 },
  11: { mafia: 3, doctor: 1, detective: 1, civilian: 6 },
  12: { mafia: 3, doctor: 1, detective: 1, civilian: 7 },
};
