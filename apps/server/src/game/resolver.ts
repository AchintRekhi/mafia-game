import type { Room } from '../rooms/store.js';

export interface NightOutcome {
  deaths: { id: string; cause: 'mafia' }[];
  detective: { detectiveId: string; targetId: string; isMafia: boolean } | null;
}

export function resolveNight(room: Room): NightOutcome {
  const { mafiaTarget, doctorTarget, detectiveTarget } = room.night;
  const deaths: NightOutcome['deaths'] = [];

  if (mafiaTarget && mafiaTarget !== doctorTarget) {
    const victim = room.players.find((p) => p.id === mafiaTarget);
    if (victim && victim.alive) {
      victim.alive = false;
      deaths.push({ id: victim.id, cause: 'mafia' });
    }
  }

  let detectiveResult: NightOutcome['detective'] = null;
  if (detectiveTarget) {
    const detective = room.players.find((p) => p.role === 'detective' && p.alive);
    const target = room.players.find((p) => p.id === detectiveTarget);
    if (detective && target) {
      detectiveResult = {
        detectiveId: detective.id,
        targetId: target.id,
        isMafia: target.role === 'mafia',
      };
    }
  }

  return { deaths, detective: detectiveResult };
}

export function checkWinner(room: Room): 'town' | 'mafia' | null {
  const alive = room.players.filter((p) => p.alive);
  const mafia = alive.filter((p) => p.role === 'mafia').length;
  const town = alive.length - mafia;
  if (mafia === 0) return 'town';
  if (mafia >= town) return 'mafia';
  return null;
}
