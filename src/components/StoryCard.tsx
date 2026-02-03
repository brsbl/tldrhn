import { useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { ArrowUp, MessageCircle, Clock, User } from 'lucide-react';
import type { Story } from '../types';

/**
 * Trigger screenshot capture on-demand when user clicks a story.
 * This caches the screenshot for future users/visits.
 */
function triggerScreenshotCapture(storyId: number, url?: string): void {
  // Fire and forget - don't block the navigation
  fetch(`/api/screenshot/${storyId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  }).catch(() => {
    // Silently fail - this is a background optimization
  });
}

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
 * including screenshot, excerpt, and metadata.
 */
export function StoryCard({
  story,
  isSelected = false,
  index,
  'aria-setsize': ariaSetsize,
  'aria-posinset': ariaPosinset,
}: StoryCardProps) {
  // isSelected is used for keyboard navigation styling - keeping for future use
  void isSelected;

  const {
    title,
    url,
    hnUrl,
    score,
    descendants,
    time,
    by,
    excerpt,
    screenshotUrl,
    heroImageUrl,
    isImageFallback,
  } = story;

  const articleUrl = url || hnUrl;
  const timeAgo = formatTimeAgo(time);
  const [imageError, setImageError] = useState(false);

  // Sanitize excerpt to prevent XSS attacks
  const sanitizedExcerpt = excerpt ? DOMPurify.sanitize(excerpt) : '';

  // Check if we have a real image or just a placeholder/fallback
  const hasHeroImage = !!heroImageUrl && !imageError;
  const hasScreenshot = !!screenshotUrl && !screenshotUrl.includes('placeholder') && !imageError;
  const hasRealImage = hasHeroImage || hasScreenshot;

  // Trigger screenshot capture when user clicks a story
  // Always capture if no hero image (to potentially get a better screenshot)
  const handleLinkClick = useCallback(() => {
    if (!hasHeroImage) {
      triggerScreenshotCapture(story.id, url);
    }
  }, [hasHeroImage, story.id, url]);

  // Also trigger capture when image fails to load
  const handleImageError = useCallback(() => {
    setImageError(true);
    triggerScreenshotCapture(story.id, url);
  }, [story.id, url]);

  return (
    <article
      className="group flex flex-col bg-slate-50 dark:bg-neutral-800 rounded-2xl border border-slate-200/80 dark:border-neutral-600/50 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.15)] hover:shadow-xl hover:border-slate-300 dark:hover:border-neutral-500 overflow-hidden transition-all duration-300"
      data-story-index={index}
      aria-setsize={ariaSetsize}
      aria-posinset={ariaPosinset}
    >
      {/* Image section with floating points badge */}
      <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-neutral-700">
        <a
          href={articleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
          onClick={handleLinkClick}
        >
          {(heroImageUrl || screenshotUrl) && !imageError ? (
            <img
              src={heroImageUrl || screenshotUrl}
              alt={`Screenshot of ${title}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-neutral-500">
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

        {/* Floating points badge */}
        <div className="absolute top-3 right-3 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-slate-200 dark:border-neutral-600 flex items-center gap-1.5">
          <ArrowUp className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-neutral-200">{score}</span>
        </div>
      </div>

      {/* Card content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Headline */}
        <h2 className="font-bold text-lg mb-2 line-clamp-2 leading-snug">
          <a
            href={articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-900 dark:text-neutral-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors"
            onClick={handleLinkClick}
          >
            {title}
          </a>
        </h2>

        {/* Excerpt */}
        {sanitizedExcerpt && (
          <p className="text-slate-600 dark:text-neutral-300 text-sm leading-relaxed mb-4 line-clamp-3">
            {sanitizedExcerpt}
          </p>
        )}

        {/* Metadata section - pushed to bottom */}
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-neutral-400 pt-4 mt-auto border-t border-slate-100 dark:border-neutral-700">
          <div className="flex items-center gap-4">
            {/* Comment count */}
            <a
              href={hnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              aria-label={`${descendants} comments on Hacker News`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>{descendants}</span>
            </a>

            {/* Time ago */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <time
                dateTime={new Date(time * 1000).toISOString()}
                title={new Date(time * 1000).toLocaleString()}
              >
                {timeAgo}
              </time>
            </div>
          </div>

          {/* Author */}
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            <span>{by}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default StoryCard;
