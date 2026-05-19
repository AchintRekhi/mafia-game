'use client';

import { create } from 'zustand';
import type { Role, RoomView } from '@mafia/shared';

export interface DetectiveResult {
  targetId: string;
  isMafia: boolean;
  at: number;
}

export interface DeathEvent {
  id: string;
  cause: 'mafia' | 'vote';
  at: number;
}

export interface ChatMessage {
  from: string;
  text: string;
  at: number;
}

interface GameState {
  myId: string | null;
  room: RoomView | null;
  myRole: Role | null;
  detectiveResults: DetectiveResult[];
  recentDeaths: DeathEvent[];
  chat: ChatMessage[];
  setMe: (id: string) => void;
  setRoom: (room: RoomView) => void;
  setRole: (role: Role) => void;
  addDetectiveResult: (r: Omit<DetectiveResult, 'at'>) => void;
  addDeath: (d: Omit<DeathEvent, 'at'>) => void;
  addChat: (msg: ChatMessage) => void;
  reset: () => void;
}

export const useGame = create<GameState>((set) => ({
  myId: null,
  room: null,
  myRole: null,
  detectiveResults: [],
  recentDeaths: [],
  chat: [],
  setMe: (id) => set({ myId: id }),
  setRoom: (room) => set({ room }),
  setRole: (role) => set({ myRole: role }),
  addDetectiveResult: (r) =>
    set((s) => ({ detectiveResults: [...s.detectiveResults, { ...r, at: Date.now() }] })),
  addDeath: (d) => set((s) => ({ recentDeaths: [...s.recentDeaths, { ...d, at: Date.now() }] })),
  addChat: (msg) => set((s) => ({ chat: [...s.chat, msg].slice(-200) })),
  reset: () =>
    set({
      myId: null,
      room: null,
      myRole: null,
      detectiveResults: [],
      recentDeaths: [],
      chat: [],
    }),
}));
