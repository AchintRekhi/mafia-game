'use client';

import '@livekit/components-styles';
import { useEffect, useState, type ReactNode } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  VideoTrack,
  useTracks,
  useParticipants,
  useIsSpeaking,
  isTrackReference,
  type TrackReference,
} from '@livekit/components-react';
import { Track, type Participant } from 'livekit-client';
import type { PlayerView } from '@mafia/shared';
import { getSocket } from '@/lib/socket';
import { PlayerTile, type PlayerTileProps } from './PlayerTile';
import { RoleChip } from './RoleChip';

export interface GameTableConfig {
  players: PlayerView[];
  myId: string | null;
  /** Ids whose tile is clickable in the current phase (day vote / night action). */
  selectableIds?: Set<string>;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Live day-vote tally (targetId → count). */
  voteTally?: Record<string, number>;
  /** Ids to flag with the red "Mafia" ally tag (Mafia's view at night). */
  allyIds?: Set<string>;
  /** Render a RoleChip on tiles where the viewer is allowed to see the role. */
  showRoleChip?: boolean;
  /** Dim non-selectable, non-self tiles (used to focus the actor at night). */
  dimUnselectable?: boolean;
  hostBadge?: boolean;
  /** Show the mic/camera control bar under the grid. */
  showControls?: boolean;
}

/** Chrome shared by both the live and static tiles — everything except video/mic/speaking. */
function baseTileProps(
  cfg: GameTableConfig,
  p: PlayerView,
): Omit<PlayerTileProps, 'videoSlot' | 'camOff' | 'speaking' | 'micOff'> {
  const selectable = cfg.selectableIds?.has(p.id) ?? false;
  const selected = cfg.selectedId != null && cfg.selectedId === p.id;
  const allyTag = cfg.allyIds?.has(p.id) ?? false;
  return {
    name: p.name,
    isMe: p.isMe,
    dead: !p.alive,
    hostBadge: (cfg.hostBadge && p.isHost) || false,
    roleChip: cfg.showRoleChip && p.role ? <RoleChip role={p.role} /> : undefined,
    allyTag,
    voteCount: cfg.voteTally?.[p.id],
    selectable,
    selected,
    dimmed: (cfg.dimUnselectable && !selectable && !p.isMe && p.alive) || false,
    onSelect: selectable ? () => cfg.onSelect?.(p.id) : undefined,
  };
}

function GridContainer({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]">
      {children}
    </div>
  );
}

/** A tile for a player who is connected to LiveKit — resolves their live video/mic/speaking. */
function LiveTile({
  participant,
  camRef,
  micMuted,
  base,
}: {
  participant: Participant;
  camRef: TrackReference | undefined;
  micMuted: boolean;
  base: ReturnType<typeof baseTileProps>;
}) {
  const speaking = useIsSpeaking(participant);
  const hasVideo = !!camRef && !camRef.publication.isMuted;
  const videoSlot = hasVideo ? (
    <VideoTrack
      trackRef={camRef}
      className={`h-full w-full object-cover ${base.isMe ? 'scale-x-[-1]' : ''}`}
    />
  ) : null;
  return (
    <PlayerTile
      {...base}
      videoSlot={videoSlot}
      camOff={!hasVideo}
      speaking={speaking && !base.dead}
      micOff={micMuted && !base.dead}
    />
  );
}

/** The live grid — must render inside <LiveKitRoom>. */
function PlayerGrid({ cfg }: { cfg: GameTableConfig }) {
  const refs = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.Microphone, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  const participants = useParticipants();

  const partById = new Map<string, Participant>();
  for (const p of participants) partById.set(p.identity, p);

  const camById = new Map<string, TrackReference>();
  const micMutedById = new Map<string, boolean>();
  for (const r of refs) {
    if (!isTrackReference(r)) continue;
    if (r.source === Track.Source.Camera) camById.set(r.participant.identity, r);
    else if (r.source === Track.Source.Microphone)
      micMutedById.set(r.participant.identity, r.publication.isMuted);
  }

  return (
    <GridContainer>
      {cfg.players.map((p) => {
        const base = baseTileProps(cfg, p);
        const participant = partById.get(p.id);
        if (participant) {
          return (
            <LiveTile
              key={p.id}
              participant={participant}
              camRef={camById.get(p.id)}
              micMuted={micMutedById.get(p.id) ?? true}
              base={base}
            />
          );
        }
        // Player hasn't connected media yet — show their static tile.
        return <PlayerTile key={p.id} {...base} videoSlot={null} camOff={false} micOff={false} />;
      })}
    </GridContainer>
  );
}

/** Video-less fallback grid (LiveKit unavailable) — the game stays fully playable. */
function StaticGrid({ cfg }: { cfg: GameTableConfig }) {
  return (
    <GridContainer>
      {cfg.players.map((p) => (
        <PlayerTile key={p.id} {...baseTileProps(cfg, p)} videoSlot={null} camOff={false} />
      ))}
    </GridContainer>
  );
}

interface TokenInfo {
  token: string;
  url: string;
}

/**
 * The unified game grid: one 4:3 tile per player holding their own video (or
 * avatar / cam-off), name, role/ally tag, vote badge, and mic/speaking state.
 * Replaces the old two-grid split (separate LiveKit GridLayout + name cards).
 */
export function GameTable(cfg: GameTableConfig) {
  const [info, setInfo] = useState<TokenInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSocket().emit('livekit:requestToken', (res) => {
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setInfo({ token: res.token, url: res.url });
    });
  }, []);

  if (error || !info) {
    return (
      <div className="flex flex-col gap-3">
        <StaticGrid cfg={cfg} />
        {error && (
          <p className="text-xs font-light tracking-[0.08em] text-parchment/40">
            Video unavailable — {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={info.token}
      serverUrl={info.url}
      connect
      audio
      video
      data-lk-theme="default"
      className="flex flex-col gap-3 border-none bg-transparent"
    >
      <PlayerGrid cfg={cfg} />
      <RoomAudioRenderer />
      {cfg.showControls && (
        <div className="flex justify-center">
          <ControlBar
            variation="minimal"
            controls={{ microphone: true, camera: true, screenShare: false, leave: false, chat: false }}
          />
        </div>
      )}
    </LiveKitRoom>
  );
}
