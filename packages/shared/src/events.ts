import type { Role } from './roles';
import type { Phase, TimingPreset } from './phases';

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

/**
 * Per-viewer projection of the room's current night-action state.
 * - Mafia sees the current collective pick (so multiple Mafia can coordinate).
 * - Doctor sees their own protect pick.
 * - Detective gets results via a separate `detective:result` event after the phase ends.
 */
export type NightSlice =
  | { mafiaTarget: string | null }
  | { doctorTarget: string | null }
  | null;

export interface RoomView {
  code: string;
  phase: Phase;
  phaseEndsAt: number | null;
  preset: TimingPreset;
  players: PlayerView[];
  night: NightSlice;
  /** Per-viewer: the id this socket has voted for in day_vote (null if not voted / abstain). */
  myVote?: string | null;
  /** Public running tally during day_vote (targetId → count). */
  voteTally?: Record<string, number>;
}

export type JoinAck =
  | { ok: true; you: { id: string; sessionId: string }; code: string }
  | { ok: false; error: string };

export type ResumeAck =
  | { ok: true; you: { id: string }; code: string }
  | { ok: false; error: string };

/** Client → server */
export interface ClientToServerEvents {
  'room:create': (payload: { name: string }, ack: (res: JoinAck) => void) => void;
  'room:join': (payload: { code: string; name: string }, ack: (res: JoinAck) => void) => void;
  'room:resume': (
    payload: { code: string; sessionId: string },
    ack: (res: ResumeAck) => void,
  ) => void;
  'room:leave': () => void;
  'host:start': () => void;
  'host:rematch': () => void;
  'host:setPreset': (preset: TimingPreset) => void;

  'livekit:requestToken': (
    ack: (
      res:
        | { ok: true; token: string; url: string; identity: string }
        | { ok: false; error: string },
    ) => void,
  ) => void;

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
  'vote:tally': (tally: Record<string, number>) => void;
  'game:reset': () => void;

  'error:msg': (msg: string) => void;
}
