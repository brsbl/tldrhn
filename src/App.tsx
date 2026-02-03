import { useState, useCallback, useEffect } from 'react';
import { Agentation } from 'agentation';
import { useStories } from './hooks/useStories';
import { useDarkMode } from './hooks/useDarkMode';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { StoryGrid } from './components/StoryGrid';
import { SkeletonCard } from './components/SkeletonCard';
import { ErrorState } from './components/ErrorState';
import { KeyboardHelpModal } from './components/KeyboardHelpModal';
import { Header } from './components/Header';
import { FeedTabs } from './components/FeedTabs';
import { DarkModeToggle } from './components/DarkModeToggle';
import type { FeedType } from './types/index';
import { FEED_TYPES } from './types/index';

// Load saved feed from localStorage, with validation
function getInitialFeed(): FeedType {
  const saved = localStorage.getItem('selectedFeed');
  if (saved && FEED_TYPES.includes(saved as FeedType)) {
    return saved as FeedType;
  }
  return 'top';
}

function App() {
  const [feed, setFeed] = useState<FeedType>(getInitialFeed);
  const { stories, loading, error, refetch } = useStories(feed);
  const [theme, cycleTheme] = useDarkMode();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  // Handle feed change
  const handleFeedChange = useCallback((newFeed: FeedType) => {
    setFeed(newFeed);
    localStorage.setItem('selectedFeed', newFeed);
    setSelectedIndex(0); // Reset selection when switching feeds
  }, []);

  // Reset selected index when stories change - this is intentional to reset
  // UI state when data changes, which is a valid React pattern
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(0);
  }, [stories]);

  const handleShowHelp = useCallback(() => {
    setShowHelp(true);
  }, []);

  const handleCloseHelp = useCallback(() => {
    setShowHelp(false);
  }, []);

  // Handle Escape key to close help modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showHelp) {
        setShowHelp(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHelp]);

  // Initialize keyboard shortcuts (disabled when help modal is open)
  useKeyboardShortcuts({
    stories: stories || [],
    selectedIndex,
    setSelectedIndex,
    onRefresh: refetch,
    onShowHelp: handleShowHelp,
    disabled: showHelp,
  });

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900 transition-colors">
      {/* Header with Feed Tabs */}
      <Header>
        <FeedTabs activeFeed={feed} onFeedChange={handleFeedChange} />
      </Header>

      {/* Main Content */}
      <main className="py-8">
        {loading && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 30 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          </div>
        )}

        {error && <ErrorState message={error} onRetry={refetch} />}

        {stories && !loading && !error && (
          <StoryGrid stories={stories} selectedIndex={selectedIndex} />
        )}
      </main>

      {/* Help Modal */}
      <KeyboardHelpModal isOpen={showHelp} onClose={handleCloseHelp} />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-neutral-400">
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="hover:text-slate-700 dark:hover:text-neutral-200 transition-colors"
              >
                Home
              </a>
              <a
                href="https://github.com/brsabel/tldrhn"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-700 dark:hover:text-neutral-200 transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://x.com/brsabel"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-700 dark:hover:text-neutral-200 transition-colors"
              >
                Twitter
              </a>
            </div>
            <div className="flex items-center gap-4">
              <DarkModeToggle theme={theme} onToggle={cycleTheme} />
              <p>&copy; Visual HN. Not affiliated with Hacker News.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
    <Agentation />
    </>
  );
}

export default App;
