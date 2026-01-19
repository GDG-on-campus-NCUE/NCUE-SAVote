import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  computedMode: 'light' | 'dark'; // The actual active mode
  setComputedMode: (mode: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
      computedMode: 'light', // Default, will be updated by effect
      setComputedMode: (computedMode) => set({ computedMode }),
    }),
    {
      name: 'savote-theme',
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);
