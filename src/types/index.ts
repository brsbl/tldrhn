/**
 * TypeScript interfaces for TLDR HN data models
 */

// Feed types for HN feeds
export const FEED_TYPES = ['top', 'new', 'show'] as const;
export type FeedType = typeof FEED_TYPES[number];

export const FEED_LABELS: Record<FeedType, string> = {
  top: 'Top',
  new: 'New',
  show: 'Show HN',
};

/**
 * Represents a comment from Hacker News
 */
export interface Comment {
  /** HN comment ID */
  id: number;
  /** Username of the comment author */
  by: string;
  /** Comment text content (may contain HTML) */
  text: string;
  /** Comment score/points */
  score: number;
}

/**
 * Represents a story from Hacker News with enriched data
 */
export interface Story {
  /** HN story ID */
  id: number;
  /** Story headline/title */
  title: string;
  /** URL of the linked article (empty string for Ask HN, etc.) */
  url: string;
  /** URL to the HN discussion page */
  hnUrl: string;
  /** Story score/points */
  score: number;
  /** Username of the story submitter */
  by: string;
  /** Unix timestamp of when the story was submitted */
  time: number;
  /** Number of comments on the story */
  descendants: number;
  /** AI-generated summary of the article content */
  summary: string;
  /** URL path to the captured screenshot image */
  screenshotUrl: string;
  /** The highest-quality comment on this story, or null if none */
  topComment: Comment | null;
  /** Unix timestamp of when this data was fetched/cached */
  fetchedAt: number;
  /** Extracted article text, or null if scraping failed */
  articleText: string | null;
}
