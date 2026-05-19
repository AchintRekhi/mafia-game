export const PHASES = [
  'lobby',
  'role_assign',
  'night_mafia',
  'night_doctor',
  'night_detective',
  'day_recap',
  'day_discussion',
  'day_vote',
  'resolve',
  'end',
] as const;

export type Phase = (typeof PHASES)[number];

export type TimingPreset = 'fast' | 'normal' | 'long';

export const PRESET_TIMINGS: Record<TimingPreset, Record<Phase, number>> = {
  fast: {
    lobby: 0,
    role_assign: 8,
    night_mafia: 20,
    night_doctor: 15,
    night_detective: 15,
    day_recap: 6,
    day_discussion: 90,
    day_vote: 30,
    resolve: 8,
    end: 0,
  },
  normal: {
    lobby: 0,
    role_assign: 10,
    night_mafia: 30,
    night_doctor: 20,
    night_detective: 20,
    day_recap: 8,
    day_discussion: 180,
    day_vote: 45,
    resolve: 10,
    end: 0,
  },
  long: {
    lobby: 0,
    role_assign: 12,
    night_mafia: 45,
    night_doctor: 30,
    night_detective: 30,
    day_recap: 10,
    day_discussion: 300,
    day_vote: 60,
    resolve: 10,
    end: 0,
  },
};
