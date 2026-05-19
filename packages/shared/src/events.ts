import type { Role } from './roles.js';
import type { Phase, TimingPreset } from './phases.js';

/**
 * The personalized view of another player from the perspective of a given socket.
 * `role` is null if the viewer is not allowed to know this player's role yet.
 */
export interface PlayerView {
  id: string;
  name: string;
  alive: boolean;
  role: Role | null;
  isMe: boolean;
  isHost: boolean;
}

export interface RoomView {
  code: string;
  phase: Phase;
  phaseEndsAt: number | null;
  preset: TimingPreset;
  players: PlayerView[];
}

/** Client → server */
export interface ClientToServerEvents {
  'room:join': (
    payload: { code: string; name: string },
    ack: (res: { ok: true; you: { id: string } } | { ok: false; error: string }) => void,
  ) => void;
  'host:start': () => void;
  'host:setPreset': (preset: TimingPreset) => void;

  'mafia:pickTarget': (targetId: string) => void;
  'doctor:protect': (targetId: string) => void;
  'detective:investigate': (targetId: string) => void;
  'day:vote': (targetId: string | null) => void;

  'chat:send': (text: string) => void;
  'ghost:send': (text: string) => void;
}

/** Server → client */
export interface ServerToClientEvents {
  'room:state': (state: RoomView) => void;
  'role:assigned': (role: Role) => void;
  'detective:result': (payload: { targetId: string; isMafia: boolean }) => void;

  'phase:start': (payload: { phase: Phase; endsAt: number }) => void;
  'player:died': (payload: { id: string; cause: 'mafia' | 'vote' }) => void;
  'game:end': (payload: { winner: 'town' | 'mafia'; reveal: Record<string, Role> }) => void;

  'chat:message': (msg: { from: string; text: string; at: number }) => void;
  'ghost:message': (msg: { from: string; text: string; at: number }) => void;

  'error:msg': (msg: string) => void;
}
