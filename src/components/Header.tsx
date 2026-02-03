interface HeaderProps {
  children?: React.ReactNode;
}

/**
 * Header component with branding and feed tabs
 * Single-line layout: logo on left, tabs follow
 */
export function Header({ children }: HeaderProps) {
  return (
    <header className="backdrop-blur-sm bg-white/95 dark:bg-neutral-800/95 border-b border-slate-200 dark:border-neutral-700 sticky top-0 z-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-6">
        {/* Logo/Title - left */}
        <h1 className="font-mono font-bold text-lg text-slate-900 dark:text-neutral-100 tracking-tight whitespace-nowrap">
          Visual HN
        </h1>

        {/* Tabs - left aligned */}
        {children && (
          <div className="min-w-0">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
