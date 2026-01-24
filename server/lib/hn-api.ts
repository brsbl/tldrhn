/**
 * Hacker News API Client
 *
 * Fetches top stories and story details from the official HN Firebase API.
 * Uses native fetch (Node 18+).
 */

import type { FeedType } from '../src/types/index.js';

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

const FEED_ENDPOINTS: Record<FeedType, string> = {
  top: 'topstories',
  new: 'newstories',
  show: 'showstories',
};

/**
 * HN API story response type.
 * Note: Some fields are optional depending on story type:
 * - `url` is absent for Ask HN, Show HN text posts, and jobs
 * - `text` is present for Ask HN and text-only Show HN posts
 * - `kids` is absent if there are no comments
 */
export interface HNStory {
  id: number;
  title: string;
  url?: string;          // Optional: Ask HN, Show HN text posts don't have URLs
  score: number;
  by: string;
  time: number;          // Unix timestamp
  descendants?: number;  // Number of comments (may be absent for jobs)
  kids?: number[];       // Comment IDs (absent if no comments)
  type: 'story' | 'job' | 'poll';
  text?: string;         // Present for Ask HN, Show HN text posts
  dead?: boolean;        // If true, story is dead
  deleted?: boolean;     // If true, story was deleted
}

/**
 * HN API comment response type.
 */
export interface HNComment {
  id: number;
  by?: string;           // Author (absent if deleted)
  text?: string;         // Comment HTML (absent if deleted)
  time: number;          // Unix timestamp
  parent: number;        // Parent item ID
  kids?: number[];       // Child comment IDs
  type: 'comment';
  dead?: boolean;        // If true, comment is dead
  deleted?: boolean;     // If true, comment was deleted
}

/**
 * Fetches the top 30 story IDs from Hacker News.
 *
 * @returns Promise resolving to an array of the first 30 story IDs
 * @throws Error if the fetch fails or response is invalid
 */
export async function fetchTopStories(): Promise<number[]> {
  return fetchFeedStories('top');
}

/**
 * Fetches the first 30 story IDs for a given feed type.
 *
 * @param feedType - The type of feed to fetch (top, new, ask, show, jobs)
 * @returns Promise resolving to an array of the first 30 story IDs
 * @throws Error if the fetch fails or response is invalid
 */
export async function fetchFeedStories(feedType: FeedType = 'top'): Promise<number[]> {
  const endpoint = FEED_ENDPOINTS[feedType];
  const response = await fetch(`${HN_API_BASE}/${endpoint}.json`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${feedType} stories: ${response.status} ${response.statusText}`);
  }

  const storyIds: number[] = await response.json();

  if (!Array.isArray(storyIds)) {
    throw new Error('Invalid response: expected array of story IDs');
  }

  // Return only the first 30 stories
  return storyIds.slice(0, 30);
}

/**
 * Fetches a single story by ID from Hacker News.
 *
 * Handles various story types:
 * - Regular stories (have url)
 * - Ask HN (no url, have text)
 * - Show HN (may or may not have url)
 * - Jobs (have url, no descendants)
 *
 * @param id - The story ID to fetch
 * @returns Promise resolving to the story object, or null if not found/deleted
 * @throws Error if the fetch fails
 */
export async function fetchStory(id: number): Promise<HNStory | null> {
  const response = await fetch(`${HN_API_BASE}/item/${id}.json`);

  if (!response.ok) {
    throw new Error(`Failed to fetch story ${id}: ${response.status} ${response.statusText}`);
  }

  const story: HNStory | null = await response.json();

  // Story might be null if deleted or doesn't exist
  if (!story) {
    return null;
  }

  // Skip deleted or dead stories
  if (story.deleted || story.dead) {
    return null;
  }

  return story;
}

/**
 * Fetches a single comment by ID from Hacker News.
 *
 * @param id - The comment ID to fetch
 * @returns Promise resolving to the comment object, or null if not found/deleted
 * @throws Error if the fetch fails
 */
export async function fetchComment(id: number): Promise<HNComment | null> {
  const response = await fetch(`${HN_API_BASE}/item/${id}.json`);

  if (!response.ok) {
    throw new Error(`Failed to fetch comment ${id}: ${response.status} ${response.statusText}`);
  }

  const comment: HNComment | null = await response.json();

  // Comment might be null if deleted or doesn't exist
  if (!comment) {
    return null;
  }

  // Skip deleted or dead comments
  if (comment.deleted || comment.dead) {
    return null;
  }

  return comment;
}

/**
 * Generates the HN discussion URL for a story.
 *
 * @param id - The story ID
 * @returns The HN URL for the story's discussion page
 */
export function getHNUrl(id: number): string {
  return `https://news.ycombinator.com/item?id=${id}`;
}

/**
 * Fetches multiple stories in parallel.
 *
 * @param ids - Array of story IDs to fetch
 * @returns Promise resolving to array of stories (nulls filtered out)
 */
export async function fetchStories(ids: number[]): Promise<HNStory[]> {
  const storyPromises = ids.map(id => fetchStory(id));
  const stories = await Promise.all(storyPromises);

  // Filter out null values (deleted/dead/missing stories)
  return stories.filter((story): story is HNStory => story !== null);
}
