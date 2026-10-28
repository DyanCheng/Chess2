import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface LocalHistoryEntry {
  id: string;
  date: string;
  opponent: string;
  result: 'win' | 'loss' | 'draw';
  duration: string;
}

interface HistoryStore {
  entries: LocalHistoryEntry[];
  recordGame: (entry: LocalHistoryEntry) => void;
}

export const useHistoryStore = create<HistoryStore>()(persist((set) => ({
  entries: [],
  recordGame: entry => set(state => ({
    entries: [entry, ...state.entries.filter(previous => previous.id !== entry.id)].slice(0, 100),
  })),
}), {
  name: 'arcane-local-history-v1',
  storage: createJSONStorage(() => AsyncStorage),
}));
