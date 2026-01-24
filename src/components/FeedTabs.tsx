import type { FeedType } from '../types/index';
import { FEED_TYPES, FEED_LABELS } from '../types/index';

interface FeedTabsProps {
  activeFeed: FeedType;
  onFeedChange: (feed: FeedType) => void;
}

export function FeedTabs({ activeFeed, onFeedChange }: FeedTabsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Feeds">
          {FEED_TYPES.map((feed) => {
            const isActive = feed === activeFeed;
            return (
              <button
                key={feed}
                onClick={() => onFeedChange(feed)}
                className={`
                  whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {FEED_LABELS[feed]}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
