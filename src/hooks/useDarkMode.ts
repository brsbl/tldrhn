import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'tldrhn-theme';

export type Theme = 'light' | 'dark' | 'system';

/**
 * useDarkMode - Custom hook for managing theme preference
 *
 * Features:
 * - Three modes: light, dark, system
 * - Checks localStorage for saved preference
 * - Falls back to system preference (prefers-color-scheme)
 * - Persists preference to localStorage
 * - Adds/removes 'dark' class on document.documentElement
 *
 * @returns [theme, cycleTheme, isDark] tuple
 */
export function useDarkMode(): [Theme, () => void, boolean] {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_KEY) as Theme | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    }
    return 'system';
  });

  // Compute actual dark mode state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (theme === 'system' && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return theme === 'dark';
  });

  // Update DOM when isDark changes
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Update isDark when theme changes or system preference changes
  useEffect(() => {
    const updateIsDark = () => {
      if (theme === 'system') {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      } else {
        setIsDark(theme === 'dark');
      }
    };

    updateIsDark();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        setIsDark(mediaQuery.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Cycle through themes: system -> light -> dark -> system
  const cycleTheme = useCallback(() => {
    setTheme((prev) => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  }, []);

  return [theme, cycleTheme, isDark];
}

export default useDarkMode;
