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

  const ghost = channel === 'ghost';

  return (
    <div
      className={`flex h-[40vh] flex-col border bg-ink/60 backdrop-blur ${
        ghost ? 'border-parchment/[0.15]' : 'border-gold/[0.18]'
      }`}
    >
      <div
        className={`border-b px-[18px] py-3.5 text-[11px] uppercase tracking-[0.32em] ${
          ghost
            ? 'border-parchment/10 text-parchment/40'
            : 'border-gold/[0.15] text-parchment/55'
        }`}
      >
        {ghost ? 'Beyond the grave · dead only' : 'Table talk'}
      </div>
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-[18px] py-3.5"
      >
        {messages.length === 0 ? (
          <p className="text-sm font-light text-parchment/40">No messages yet.</p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className="animate-fade-up [animation-duration:0.3s]">
              <div
                className={`mb-[3px] text-[11px] uppercase tracking-[0.18em] ${
                  ghost ? 'text-parchment/35' : 'text-parchment/50'
                }`}
              >
                {m.from}
              </div>
              <div
                className={`text-sm font-light leading-normal ${
                  ghost ? 'text-parchment/60' : 'text-parchment/90'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))
        )}
      </div>
      <div className={`flex gap-2 border-t p-3 ${ghost ? 'border-parchment/10' : 'border-gold/[0.15]'}`}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
          maxLength={280}
          placeholder={placeholder ?? 'Say something…'}
          className="min-w-0 flex-1 border border-parchment/[0.18] bg-ink/70 px-3 py-2.5 text-sm text-parchment outline-none focus:border-gold/60"
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className="border border-gold/[0.45] bg-gold/15 px-3.5 text-xs uppercase tracking-[0.12em] text-gold transition hover:bg-gold/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
