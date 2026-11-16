import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ArcaneThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useArcaneThemeStore = create<ArcaneThemeState>()(persist((set) => ({
  isDark: true,
  toggleTheme: () => set(state => ({ isDark: !state.isDark })),
}), {
  name: 'arcane-theme-v1',
  storage: createJSONStorage(() => AsyncStorage),
}));
