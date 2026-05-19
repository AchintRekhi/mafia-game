import type { PlayerView, RoomView } from '@mafia/shared';
import type { Room } from './store.js';

/**
 * Build the personalized RoomView for a specific viewer.
 * In LOBBY, no asymmetric info exists yet (roles are null for everyone).
 * The asymmetric logic lives here so when roles are assigned later, only this function changes.
 */
export function buildRoomView(room: Room, viewerSocketId: string): RoomView {
  const viewer = room.players.find((p) => p.id === viewerSocketId);
  const players: PlayerView[] = room.players.map((p) => ({
    id: p.id,
    name: p.name,
    alive: p.alive,
    isMe: p.id === viewerSocketId,
    isHost: p.isHost,
    role: computeVisibleRole(p, viewer),
  }));
  return {
    code: room.code,
    phase: room.phase,
    phaseEndsAt: room.phaseEndsAt,
    preset: room.preset,
    players,
  };
}

function computeVisibleRole(
  target: Room['players'][number],
  viewer: Room['players'][number] | undefined,
) {
  if (!viewer) return null;
  // You always see your own role.
  if (target.id === viewer.id) return target.role;
  // Mafia sees fellow Mafia.
  if (viewer.role === 'mafia' && target.role === 'mafia') return 'mafia';
  // Dead players see roles of other dead players.
  if (!viewer.alive && !target.alive) return target.role;
  // Otherwise: hidden.
  return null;
}
