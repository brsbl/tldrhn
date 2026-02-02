import { DarkModeToggle } from './DarkModeToggle';

interface HeaderProps {
  isDark: boolean;
  onToggleDark: () => void;
}

/**
 * Header component with branding and dark mode toggle
 * Sticky positioned to stay visible on scroll
 */
export function Header({ isDark, onToggleDark }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 sticky top-0 z-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo/Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          TLDR HN
        </h1>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <DarkModeToggle isDark={isDark} onToggle={onToggleDark} />
        </div>
      </div>
    </header>
  );
}

export default Header;
