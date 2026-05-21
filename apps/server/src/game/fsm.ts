import type { Server } from 'socket.io';
import type { ClientToServerEvents, Phase, ServerToClientEvents } from '@mafia/shared';
import { PRESET_TIMINGS } from '@mafia/shared';
import { getRoomByCode, resetNightActions, resetVotes, setPhase } from '../rooms/store.js';
import { broadcastRoom } from '../handlers/lobby.js';
import { resolveNight, resolveVote, checkWinner } from './resolver.js';
import { silenceParticipant, unsilenceParticipant } from '../livekit/admin.js';

type IO = Server<ClientToServerEvents, ServerToClientEvents>;

// One timer per room. Cleared on transition or game end.
const TIMERS = new Map<string, NodeJS.Timeout>();

const NEXT: Partial<Record<Phase, Phase>> = {
  role_assign: 'night_mafia',
  night_mafia: 'night_doctor',
  night_doctor: 'night_detective',
  night_detective: 'day_recap',
  day_recap: 'day_discussion',
  day_discussion: 'day_vote',
  day_vote: 'resolve',
  resolve: 'night_mafia',
};

/** Start (or restart) the phase timer for a room. */
export function scheduleAdvance(io: IO, code: string) {
  const room = getRoomByCode(code);
  if (!room) return;
  clearTimer(code);
  const ms = (PRESET_TIMINGS[room.preset][room.phase] ?? 0) * 1000;
  if (ms <= 0) return; // unbounded phase
  TIMERS.set(
    code,
    setTimeout(() => {
      advance(io, code).catch((err) => console.error('[fsm] advance failed', err));
    }, ms),
  );
}

export function clearTimer(code: string) {
  const t = TIMERS.get(code);
  if (t) {
    clearTimeout(t);
    TIMERS.delete(code);
  }
}

async function advance(io: IO, code: string) {
  const room = getRoomByCode(code);
  if (!room) return;

  // onExit hooks for the phase we're leaving.
  if (room.phase === 'night_mafia') {
    // Leaving the Mafia-only audio window — restore mic/camera for living
    // non-Mafia players that we silenced on enter. Dead players stay silenced.
    await Promise.all(
      room.players
        .filter((p) => p.alive && p.role !== 'mafia')
        .map((p) => unsilenceParticipant(room.code, p.id)),
    );
  }

  if (room.phase === 'night_detective') {
    const outcome = resolveNight(room);
    if (outcome.detective) {
      io.to(outcome.detective.detectiveId).emit('detective:result', {
        targetId: outcome.detective.targetId,
        isMafia: outcome.detective.isMafia,
      });
    }
    for (const d of outcome.deaths) {
      await silenceParticipant(room.code, d.id);
      io.to(room.code).emit('player:died', d);
    }
    if (await endIfWinner(io, code)) return;
  }

  if (room.phase === 'day_vote') {
    const outcome = resolveVote(room);
    if (outcome.lynched) {
      await silenceParticipant(room.code, outcome.lynched);
      io.to(room.code).emit('player:died', { id: outcome.lynched, cause: 'vote' });
    }
    if (await endIfWinner(io, code)) return;
  }

  const next = NEXT[room.phase];
  if (!next) return;

  // onEnter
  if (next === 'night_mafia') {
    resetNightActions(code);
    // Cheat-proof Mafia coordination: server-mute every non-Mafia living
    // player so only Mafia can talk during this window. Restored on exit.
    await Promise.all(
      room.players
        .filter((p) => p.alive && p.role !== 'mafia')
        .map((p) => silenceParticipant(room.code, p.id)),
    );
  } else if (next === 'day_vote') {
    resetVotes(code);
  }

  const ms = (PRESET_TIMINGS[room.preset][next] ?? 0) * 1000;
  const endsAt = ms > 0 ? Date.now() + ms : null;
  setPhase(code, next, endsAt);
  io.to(code).emit('phase:start', { phase: next, endsAt: endsAt ?? 0 });
  broadcastRoom(io, code);
  scheduleAdvance(io, code);
}

async function endIfWinner(io: IO, code: string): Promise<boolean> {
  const room = getRoomByCode(code);
  if (!room) return false;
  const winner = checkWinner(room);
  if (!winner) return false;
  const reveal: Record<string, NonNullable<(typeof room.players)[number]['role']>> = {};
  for (const p of room.players) if (p.role) reveal[p.id] = p.role;
  setPhase(code, 'end', null);
  // Restore mic + camera for everyone who was silenced during the game so the
  // table can see and hear each other's reactions during the reveal.
  await Promise.all(room.players.map((p) => unsilenceParticipant(room.code, p.id)));
  broadcastRoom(io, code);
  io.to(code).emit('game:end', { winner, reveal });
  clearTimer(code);
  return true;
}
