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

export interface VoteOutcome {
  tally: Record<string, number>;
  lynched: string | null; // null = tie or all abstain
}

export function resolveVote(room: Room): VoteOutcome {
  const tally: Record<string, number> = {};
  for (const [, target] of room.votes) {
    if (!target) continue;
    tally[target] = (tally[target] ?? 0) + 1;
  }
  let lynched: string | null = null;
  let max = 0;
  let tied = false;
  for (const [id, count] of Object.entries(tally)) {
    if (count > max) {
      max = count;
      lynched = id;
      tied = false;
    } else if (count === max) {
      tied = true;
    }
  }
  if (tied) lynched = null;

  if (lynched) {
    const p = room.players.find((x) => x.id === lynched);
    if (p && p.alive) p.alive = false;
    else lynched = null;
  }
  return { tally, lynched };
}
