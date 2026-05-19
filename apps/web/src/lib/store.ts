'use client';

import { create } from 'zustand';
import type { Role, RoomView } from '@mafia/shared';

interface GameState {
  myId: string | null;
  room: RoomView | null;
  myRole: Role | null;
  setMe: (id: string) => void;
  setRoom: (room: RoomView) => void;
  setRole: (role: Role) => void;
  reset: () => void;
}

export const useGame = create<GameState>((set) => ({
  myId: null,
  room: null,
  myRole: null,
  setMe: (id) => set({ myId: id }),
  setRoom: (room) => set({ room }),
  setRole: (role) => set({ myRole: role }),
  reset: () => set({ myId: null, room: null, myRole: null }),
}));
