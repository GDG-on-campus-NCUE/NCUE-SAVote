import { useEffect } from 'react';
import { useThemeStore } from '../../stores/themeStore';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { mode, setComputedMode } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let systemTheme = 'light';
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      systemTheme = 'dark';
    }

    const effectiveMode = mode === 'system' ? systemTheme : mode;
    
    // Set the class on HTML element
    root.classList.add(effectiveMode);
    
    // Update store state so components know the effective mode
    setComputedMode(effectiveMode as 'light' | 'dark');

    // System theme listener
    if (mode === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            const newMode = e.matches ? 'dark' : 'light';
            root.classList.remove('light', 'dark');
            root.classList.add(newMode);
            setComputedMode(newMode);
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }

  }, [mode, setComputedMode]);

  return <>{children}</>;
};
