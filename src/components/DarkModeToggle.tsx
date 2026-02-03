import { Sun, Moon, Monitor } from 'lucide-react';
import type { Theme } from '../hooks/useDarkMode';

interface DarkModeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

const THEME_LABELS: Record<Theme, string> = {
  light: 'Light mode',
  dark: 'Dark mode',
  system: 'System theme',
};

const NEXT_THEME: Record<Theme, Theme> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

/**
 * DarkModeToggle - Toggle button for switching between light, dark, and system themes
 * Uses Sun/Moon/Monitor icons from lucide-react
 */
export function DarkModeToggle({ theme, onToggle }: DarkModeToggleProps) {
  const nextTheme = NEXT_THEME[theme];
  const label = `${THEME_LABELS[theme]} (click for ${THEME_LABELS[nextTheme].toLowerCase()})`;

  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"
      aria-label={label}
      title={label}
    >
      {theme === 'dark' && (
        <Moon className="w-4 h-4 text-slate-600 dark:text-neutral-100" />
      )}
      {theme === 'light' && (
        <Sun className="w-4 h-4 text-slate-600 dark:text-neutral-100" />
      )}
      {theme === 'system' && (
        <Monitor className="w-4 h-4 text-slate-600 dark:text-neutral-100" />
      )}
    </button>
  );
}

export default DarkModeToggle;
