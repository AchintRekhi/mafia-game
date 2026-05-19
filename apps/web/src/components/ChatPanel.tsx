'use client';

import { useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useGame } from '@/lib/store';

interface Props {
  /** Channel to render. 'public' = living-player chat, 'ghost' = dead-only chat. */
  channel?: 'public' | 'ghost';
  placeholder?: string;
}

export function ChatPanel({ channel = 'public', placeholder }: Props) {
  const messages = useGame((s) => (channel === 'ghost' ? s.ghostChat : s.chat));
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    getSocket().emit('chat:send', trimmed);
    setText('');
  };

  const accent = channel === 'ghost' ? 'border-stone-700' : 'border-stone-800';
  const inputAccent = channel === 'ghost' ? 'focus:border-stone-400' : 'focus:border-mafia';
  const buttonClass =
    channel === 'ghost' ? 'bg-stone-700 text-stone-100' : 'bg-mafia text-stone-50';

  return (
    <div className={`flex h-[40vh] flex-col rounded border bg-stone-950/60 ${accent}`}>
      {channel === 'ghost' && (
        <div className="border-b border-stone-800 px-3 py-1.5 text-[10px] uppercase tracking-widest text-stone-500">
          Ghost chat · only the dead can read this
        </div>
      )}
      <div ref={scrollRef} className="flex-1 space-y-1 overflow-y-auto p-3 text-sm">
        {messages.length === 0 ? (
          <p className="text-stone-500">No messages yet.</p>
        ) : (
          messages.map((m, i) => (
            <p key={i} className={channel === 'ghost' ? 'text-stone-400' : 'text-stone-200'}>
              <span className="font-display tracking-wider text-stone-500">{m.from}:</span>{' '}
              {m.text}
            </p>
          ))
        )}
      </div>
      <div className="flex gap-2 border-t border-stone-800 p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
          maxLength={280}
          placeholder={placeholder ?? 'Say something…'}
          className={`flex-1 rounded border border-stone-700 bg-stone-900 px-3 py-1.5 text-stone-100 outline-none ${inputAccent}`}
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className={`rounded px-4 py-1.5 font-display tracking-wider disabled:opacity-40 ${buttonClass}`}
        >
          Send
        </button>
      </div>
    </div>
  );
}
