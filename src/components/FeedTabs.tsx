import type { FeedType } from '../types/index';
import { FEED_TYPES, FEED_LABELS } from '../types/index';

interface FeedTabsProps {
  activeFeed: FeedType;
  onFeedChange: (feed: FeedType) => void;
}

export function FeedTabs({ activeFeed, onFeedChange }: FeedTabsProps) {
  return (
    <nav
      className="flex gap-6 overflow-x-auto"
      aria-label="Feeds"
    >
      {FEED_TYPES.map((feed) => {
        const isActive = feed === activeFeed;
        return (
          <button
            key={feed}
            data-feed={feed}
            onClick={() => onFeedChange(feed)}
            className={`
              whitespace-nowrap py-2 font-medium text-sm transition-colors border-b-2
              ${isActive
                ? 'text-orange-600 dark:text-orange-400 border-orange-600 dark:border-orange-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 border-transparent'
              }
            `}
            aria-current={isActive ? 'page' : undefined}
          >
            {FEED_LABELS[feed]}
          </button>
        );
      })}
    </nav>
  );
}
