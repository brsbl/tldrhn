import { useState, useEffect, useCallback } from 'react';

const DARK_MODE_KEY = 'tldrhn-dark-mode';

/**
 * useDarkMode - Custom hook for managing dark mode preference
 *
 * Features:
 * - Checks localStorage for saved preference
 * - Falls back to system preference (prefers-color-scheme)
 * - Persists preference to localStorage
 * - Adds/removes 'dark' class on document.documentElement
 *
 * @returns [isDark, toggleDark] tuple
 */
export function useDarkMode(): [boolean, () => void] {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(DARK_MODE_KEY);
      if (stored !== null) {
        return stored === 'true';
      }
      // Fall back to system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Update DOM and localStorage when isDark changes
  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem(DARK_MODE_KEY, String(isDark));
  }, [isDark]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if no saved preference exists
      const stored = localStorage.getItem(DARK_MODE_KEY);
      if (stored === null) {
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  return [isDark, toggleDark];
}

export default useDarkMode;
