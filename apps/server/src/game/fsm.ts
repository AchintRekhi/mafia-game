import type { Server } from 'socket.io';
import type { ClientToServerEvents, Phase, ServerToClientEvents } from '@mafia/shared';
import { PRESET_TIMINGS } from '@mafia/shared';
import { getRoomByCode, resetNightActions, setPhase } from '../rooms/store.js';
import { broadcastRoom } from '../handlers/lobby.js';
import { resolveNight, checkWinner } from './resolver.js';
import { silenceParticipant } from '../livekit/admin.js';

type IO = Server<ClientToServerEvents, ServerToClientEvents>;

// One timer per room. Cleared on transition or game end.
const TIMERS = new Map<string, NodeJS.Timeout>();

const NEXT: Partial<Record<Phase, Phase>> = {
  role_assign: 'night_mafia',
  night_mafia: 'night_doctor',
  night_doctor: 'night_detective',
  night_detective: 'day_recap',
  // day_recap → day_discussion will land in the day-phase milestone.
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
    const winner = checkWinner(room);
    if (winner) {
      const reveal: Record<string, NonNullable<typeof room.players[number]['role']>> = {};
      for (const p of room.players) if (p.role) reveal[p.id] = p.role;
      setPhase(code, 'end', null);
      broadcastRoom(io, code);
      io.to(code).emit('game:end', { winner, reveal });
      return;
    }
  }

  const next = NEXT[room.phase];
  if (!next) return;

  // onEnter
  if (next === 'night_mafia') {
    resetNightActions(code);
  }

  const ms = (PRESET_TIMINGS[room.preset][next] ?? 0) * 1000;
  const endsAt = ms > 0 ? Date.now() + ms : null;
  setPhase(code, next, endsAt);
  io.to(code).emit('phase:start', { phase: next, endsAt: endsAt ?? 0 });
  broadcastRoom(io, code);
  scheduleAdvance(io, code);
}
