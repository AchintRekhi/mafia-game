'use client';

import '@livekit/components-styles';
import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  useTracks,
  RoomAudioRenderer,
  ControlBar,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { getSocket } from '@/lib/socket';

interface TokenInfo {
  token: string;
  url: string;
}

export function VideoRoom() {
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

  if (error) {
    return (
      <div className="rounded border border-stone-800 bg-stone-950/60 p-4 text-sm text-stone-400">
        <p className="font-display tracking-wider text-stone-200">Video unavailable</p>
        <p>{error}</p>
        <p className="mt-2 text-xs text-stone-500">
          Set <code>LIVEKIT_URL</code>, <code>LIVEKIT_API_KEY</code>,{' '}
          <code>LIVEKIT_API_SECRET</code> in <code>apps/server/.env</code> and{' '}
          <code>NEXT_PUBLIC_LIVEKIT_URL</code> in <code>apps/web/.env.local</code>.
        </p>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="rounded border border-stone-800 bg-stone-950/60 p-4 text-sm text-stone-500">
        Joining video room…
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
      className="rounded-lg border border-stone-800 bg-black"
    >
      <VideoGrid />
      <RoomAudioRenderer />
      <ControlBar variation="minimal" controls={{ microphone: true, camera: true, screenShare: false, leave: false, chat: false }} />
    </LiveKitRoom>
  );
}

function VideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <GridLayout tracks={tracks} className="h-[60vh]">
      <ParticipantTile />
    </GridLayout>
  );
}
