import { useState, useCallback, useEffect } from 'react';
import { useStories } from './hooks/useStories';
import { useDarkMode } from './hooks/useDarkMode';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { StoryGrid } from './components/StoryGrid';
import { SkeletonCard } from './components/SkeletonCard';
import { ErrorState } from './components/ErrorState';
import { KeyboardHelpModal } from './components/KeyboardHelpModal';
import { Header } from './components/Header';
import { FeedTabs } from './components/FeedTabs';
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
  const [isDark, toggleDark] = useDarkMode();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  // Handle feed change
  const handleFeedChange = useCallback((newFeed: FeedType) => {
    setFeed(newFeed);
    localStorage.setItem('selectedFeed', newFeed);
    setSelectedIndex(0); // Reset selection when switching feeds
  }, []);

  // Reset selected index when stories change
  useEffect(() => {
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

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    stories: stories || [],
    selectedIndex,
    setSelectedIndex,
    onRefresh: refetch,
    onShowHelp: handleShowHelp,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <Header isDark={isDark} onToggleDark={toggleDark} />

      {/* Feed Tabs */}
      <FeedTabs activeFeed={feed} onFeedChange={handleFeedChange} />

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

      {/* Keyboard shortcut hint */}
      <div className="fixed bottom-4 right-4 text-xs text-gray-400 dark:text-gray-500">
        Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded font-mono">?</kbd> for keyboard shortcuts
      </div>
    </div>
  );
}

export default App;
