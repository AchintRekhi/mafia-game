'use client';

import { useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useGame } from '@/lib/store';

export function ChatPanel({ disabled, placeholder }: { disabled?: boolean; placeholder?: string }) {
  const messages = useGame((s) => s.chat);
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

  return (
    <div className="flex h-[40vh] flex-col rounded border border-stone-800 bg-stone-950/60">
      <div ref={scrollRef} className="flex-1 space-y-1 overflow-y-auto p-3 text-sm">
        {messages.length === 0 ? (
          <p className="text-stone-500">No messages yet.</p>
        ) : (
          messages.map((m, i) => (
            <p key={i} className="text-stone-200">
              <span className="font-display tracking-wider text-stone-400">{m.from}:</span>{' '}
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
          disabled={disabled}
          placeholder={disabled ? 'Chat disabled this phase' : (placeholder ?? 'Say something…')}
          className="flex-1 rounded border border-stone-700 bg-stone-900 px-3 py-1.5 text-stone-100 outline-none focus:border-mafia disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={disabled || !text.trim()}
          className="rounded bg-mafia px-4 py-1.5 font-display tracking-wider text-stone-50 disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
