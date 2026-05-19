import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

const URL = process.env.LIVEKIT_URL ?? '';
const API_KEY = process.env.LIVEKIT_API_KEY ?? '';
const API_SECRET = process.env.LIVEKIT_API_SECRET ?? '';

export function isLiveKitConfigured(): boolean {
  return Boolean(URL && API_KEY && API_SECRET);
}

export function getLiveKitUrl(): string {
  return URL;
}

/**
 * Mint a short-lived JWT for a player joining a LiveKit room.
 * `roomCode` here is reused as the LiveKit room name; `identity` should be the
 * Socket.IO socket.id so server-side mutes can target a stable participant.
 *
 * canPublish controls mic/camera publishing — useful later for forcing dead
 * players (or non-Mafia during NIGHT_MAFIA) into listen-only mode.
 */
export async function mintAccessToken(opts: {
  roomCode: string;
  identity: string;
  displayName: string;
  canPublish?: boolean;
  ttlSeconds?: number;
}): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    identity: opts.identity,
    name: opts.displayName,
    ttl: opts.ttlSeconds ?? 60 * 60, // 1h
  });
  at.addGrant({
    room: opts.roomCode,
    roomJoin: true,
    canPublish: opts.canPublish ?? true,
    canSubscribe: true,
    canPublishData: true,
  });
  return at.toJwt();
}

let svcSingleton: RoomServiceClient | null = null;

function svc(): RoomServiceClient {
  if (svcSingleton) return svcSingleton;
  // RoomServiceClient takes the LiveKit HTTPS endpoint (not the WSS one used by clients).
  const httpsUrl = URL.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');
  svcSingleton = new RoomServiceClient(httpsUrl, API_KEY, API_SECRET);
  return svcSingleton;
}

/**
 * Server-side mute. Used when a player dies — the client cannot un-mute itself.
 * Returns void; logs and swallows failures so a transient LiveKit hiccup doesn't
 * crash the game server.
 */
export async function silenceParticipant(roomCode: string, identity: string) {
  if (!isLiveKitConfigured()) return;
  try {
    const participant = await svc().getParticipant(roomCode, identity);
    for (const track of participant.tracks ?? []) {
      await svc().mutePublishedTrack(roomCode, identity, track.sid, true);
    }
  } catch (err) {
    console.error('[livekit] silenceParticipant failed', { roomCode, identity, err });
  }
}

/** Inverse of silenceParticipant — used at rematch to restore publishing. */
export async function unsilenceParticipant(roomCode: string, identity: string) {
  if (!isLiveKitConfigured()) return;
  try {
    const participant = await svc().getParticipant(roomCode, identity);
    for (const track of participant.tracks ?? []) {
      await svc().mutePublishedTrack(roomCode, identity, track.sid, false);
    }
  } catch (err) {
    console.error('[livekit] unsilenceParticipant failed', { roomCode, identity, err });
  }
}
