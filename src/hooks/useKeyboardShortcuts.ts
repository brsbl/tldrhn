import { useEffect, useCallback } from 'react';
import type { Story } from '../types';

interface UseKeyboardShortcutsOptions {
  stories: Story[];
  selectedIndex: number;
  setSelectedIndex: (index: number | ((prev: number) => number)) => void;
  onRefresh: () => void;
  onShowHelp: () => void;
}

/**
 * useKeyboardShortcuts hook provides vim-style keyboard navigation for stories.
 *
 * Shortcuts:
 * - J: Move down (next story)
 * - K: Move up (previous story)
 * - O: Open article URL in new tab
 * - C: Open HN comments in new tab
 * - R: Trigger refresh
 * - ?: Show help modal
 */
export function useKeyboardShortcuts({
  stories,
  selectedIndex,
  setSelectedIndex,
  onRefresh,
  onShowHelp,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle shortcuts when typing in input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      switch (key) {
        case 'j':
          // Move down
          setSelectedIndex((prev) => Math.min(prev + 1, stories.length - 1));
          break;

        case 'k':
          // Move up
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;

        case 'o':
          // Open article URL
          if (stories[selectedIndex]) {
            const story = stories[selectedIndex];
            const url = story.url || story.hnUrl;
            if (url) {
              window.open(url, '_blank', 'noopener,noreferrer');
            }
          }
          break;

        case 'c':
          // Open HN comments
          if (stories[selectedIndex]) {
            const story = stories[selectedIndex];
            if (story.hnUrl) {
              window.open(story.hnUrl, '_blank', 'noopener,noreferrer');
            }
          }
          break;

        case 'r':
          // Refresh
          onRefresh();
          break;

        case '?':
          // Show help modal
          event.preventDefault();
          onShowHelp();
          break;

        default:
          break;
      }
    },
    [stories, selectedIndex, setSelectedIndex, onRefresh, onShowHelp]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Scroll selected card into view
  useEffect(() => {
    const selectedCard = document.querySelector(`[data-story-index="${selectedIndex}"]`);
    if (selectedCard) {
      selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedIndex]);
}

export default useKeyboardShortcuts;
