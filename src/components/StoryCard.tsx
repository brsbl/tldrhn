import { useState } from 'react';
import type { Story } from '../types';

interface StoryCardProps {
  story: Story;
  isSelected?: boolean;
  index?: number;
  'aria-setsize'?: number;
  'aria-posinset'?: number;
}

/**
 * Formats a Unix timestamp into a relative time string
 * e.g., "2 hours ago", "5 minutes ago"
 */
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp * 1000) / 1000);

  if (seconds < 60) {
    return 'just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

/**
 * StoryCard displays a single Hacker News story with enriched content
 * including screenshot, summary, and metadata.
 */
export function StoryCard({
  story,
  isSelected = false,
  index,
  'aria-setsize': ariaSetsize,
  'aria-posinset': ariaPosinset,
}: StoryCardProps) {
  const {
    title,
    url,
    hnUrl,
    score,
    descendants,
    time,
    summary,
    screenshotUrl,
  } = story;

  const articleUrl = url || hnUrl;
  const timeAgo = formatTimeAgo(time);
  const [imageError, setImageError] = useState(false);

  return (
    <article
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 ${
        isSelected ? 'ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-gray-900' : ''
      }`}
      data-story-index={index}
      aria-setsize={ariaSetsize}
      aria-posinset={ariaPosinset}
    >
      {/* Screenshot thumbnail with 16:9 aspect ratio */}
      <a
        href={articleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-video overflow-hidden bg-gray-100 dark:bg-gray-700"
      >
        {screenshotUrl && !imageError ? (
          <img
            src={screenshotUrl}
            alt={`Screenshot of ${title}`}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </a>

      {/* Card content */}
      <div className="p-4">
        {/* Headline */}
        <h2 className="text-lg font-semibold mb-2 line-clamp-2">
          <a
            href={articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          >
            {title}
          </a>
        </h2>

        {/* Summary */}
        {summary && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-3">{summary}</p>
        )}

        {/* Metadata row */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            {/* Points */}
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
              {score}
            </span>

            {/* Comment count */}
            <a
              href={hnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              aria-label={`${descendants} comments on Hacker News`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {descendants}
            </a>
          </div>

          {/* Time ago */}
          <time
            dateTime={new Date(time * 1000).toISOString()}
            className="text-gray-400 dark:text-gray-500"
            title={new Date(time * 1000).toLocaleString()}
          >
            {timeAgo}
          </time>
        </div>

        {/* HN Discussion link */}
        <a
          href={hnUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline"
          aria-label={`View Hacker News discussion for ${title}`}
        >
          View HN Discussion
        </a>
      </div>
    </article>
  );
}

export default StoryCard;
