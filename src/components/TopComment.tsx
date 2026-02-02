import { useState } from 'react';
import DOMPurify, { type Config } from 'dompurify';
import type { Comment } from '../types';

interface TopCommentProps {
  /** The comment to display */
  comment: Comment;
}

/**
 * DOMPurify configuration for comment sanitization.
 * Allows basic formatting tags while blocking potentially dangerous content.
 */
const SANITIZE_CONFIG: Config = {
  ALLOWED_TAGS: ['p', 'a', 'code', 'pre', 'em', 'strong', 'br'],
  ALLOWED_ATTR: ['href'],
  FORBID_TAGS: ['script', 'style', 'img', 'iframe'],
};

/**
 * TopComment component displays a collapsible comment from a Hacker News story.
 * Starts collapsed by default, showing just the author.
 * When expanded, shows the full comment text with HTML sanitization for XSS protection.
 */
export function TopComment({ comment }: TopCommentProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate a unique ID for aria-controls
  const contentId = `comment-content-${comment.id}`;

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  // Sanitize comment HTML to prevent XSS attacks
  // DOMPurify is used here to safely render HTML content while preventing XSS
  const sanitizedHtml = DOMPurify.sanitize(comment.text, SANITIZE_CONFIG);

  return (
    <div className="mt-3 bg-gray-50 dark:bg-neutral-700 border-l-4 border-orange-400 rounded-r-md">
      {isExpanded ? (
        /* Expanded state: show full comment */
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-neutral-200">
              Comment by <span className="text-orange-600 dark:text-orange-400">{comment.by}</span>
            </span>
            <button
              onClick={toggleExpanded}
              className="text-xs text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-600 px-2 py-1 rounded transition-colors"
              aria-expanded={isExpanded}
              aria-controls={contentId}
              aria-label="Collapse comment"
            >
              Collapse
            </button>
          </div>
          {/* Content is sanitized with DOMPurify before rendering to prevent XSS */}
          <div
            id={contentId}
            className="text-sm text-gray-600 dark:text-neutral-300 leading-relaxed prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        </div>
      ) : (
        /* Collapsed state: show preview with expand button */
        <button
          onClick={toggleExpanded}
          className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-neutral-600 rounded-r-md transition-colors"
          aria-expanded={isExpanded}
          aria-controls={contentId}
          aria-label="Expand comment"
        >
          <span className="text-sm text-gray-600 dark:text-neutral-300">
            Top comment by <span className="font-medium text-orange-600 dark:text-orange-400">{comment.by}</span>
          </span>
          <span className="text-xs text-gray-400 dark:text-neutral-500 ml-2">
            Click to expand
          </span>
        </button>
      )}
    </div>
  );
}

export default TopComment;
