import { useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';

export const useThemeEffect = () => {
  const { mode, setComputedMode } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let isDark = false;
      if (mode === 'system') {
        isDark = mediaQuery.matches;
      } else {
        isDark = mode === 'dark';
      }

      if (isDark) {
        root.classList.add('dark');
        setComputedMode('dark');
      } else {
        root.classList.remove('dark');
        setComputedMode('light');
      }
    };

    // Apply immediately
    applyTheme();

    // Listen for system changes if in system mode
    const handler = () => {
        if (mode === 'system') applyTheme();
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [mode, setComputedMode]);
};
