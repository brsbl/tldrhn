/**
 * Top Comment Fetcher
 *
 * Fetches and selects the "best" comment from a HN story's comment tree.
 * Uses heuristics to find high-quality, informative comments.
 */

import { fetchComment, HNComment } from './hn-api';

/**
 * Comment interface for the frontend (matches src/types/index.ts).
 */
export interface Comment {
  id: number;
  by: string;
  text: string;
  score: number;
}

/**
 * Strips HTML tags from a string, preserving text content.
 * Also decodes common HTML entities.
 *
 * @param html - HTML string to strip
 * @returns Plain text string
 */
function stripHtmlTags(html: string): string {
  // Replace <br> and </p> with newlines for readability
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n');

  // Remove all HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');

  // Normalize whitespace: collapse multiple spaces/newlines
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

/**
 * Calculates a quality score for a comment based on heuristics.
 *
 * Scoring factors:
 * - Length: 50-500 chars is preferred (sweet spot for informative but readable)
 * - Replies: Having child comments (kids) indicates engagement
 * - Too short (<50 chars) is penalized
 * - Too long (>500 chars) gets mild penalty
 *
 * @param comment - The HN comment to score
 * @param textLength - Pre-calculated length of stripped text
 * @returns Numeric quality score
 */
function calculateCommentScore(comment: HNComment, textLength: number): number {
  let score = 0;

  // Length scoring
  if (textLength >= 50 && textLength <= 500) {
    // Optimal length range - bonus points
    score += 100;
    // Additional bonus for being closer to 150-300 chars (very readable)
    if (textLength >= 150 && textLength <= 300) {
      score += 50;
    }
  } else if (textLength < 50) {
    // Too short - significant penalty
    score -= 50;
  } else if (textLength > 500) {
    // Too long - mild penalty, but still valuable content
    score += 50;
    // Penalty increases with length
    score -= Math.min(50, Math.floor((textLength - 500) / 100) * 10);
  }

  // Replies bonus - comments with replies indicate engagement/quality
  const kidsCount = comment.kids?.length ?? 0;
  if (kidsCount > 0) {
    // Bonus for having replies, capped to avoid favoring controversial comments
    score += Math.min(30, kidsCount * 10);
  }

  return score;
}

/**
 * Fetches the top (best quality) comment from a story's comment IDs.
 *
 * Algorithm:
 * 1. Takes the first 5-10 comment IDs from story.kids
 * 2. Fetches them in parallel
 * 3. Filters out deleted/dead comments
 * 4. Scores remaining comments using heuristics
 * 5. Returns the highest-scoring comment
 *
 * @param kids - Array of comment IDs from story.kids
 * @returns The best Comment object, or null if none found
 */
export async function getTopComment(kids: number[]): Promise<Comment | null> {
  // Handle empty kids array
  if (!kids || kids.length === 0) {
    return null;
  }

  // Fetch first 5-10 comments in parallel (cap at 10 for performance)
  const commentsToFetch = Math.min(10, kids.length);
  const commentIds = kids.slice(0, commentsToFetch);

  const commentPromises = commentIds.map(id => fetchComment(id));
  const fetchedComments = await Promise.all(commentPromises);

  // Filter out null (deleted/dead) comments and ensure they have required fields
  const validComments = fetchedComments.filter(
    (comment): comment is HNComment =>
      comment !== null &&
      typeof comment.by === 'string' &&
      typeof comment.text === 'string' &&
      comment.text.length > 0
  );

  // Handle case where all comments are deleted
  if (validComments.length === 0) {
    return null;
  }

  // Score each comment and find the best one
  let bestComment: HNComment | null = null;
  let bestScore = -Infinity;
  let bestStrippedText = '';

  for (const comment of validComments) {
    const strippedText = stripHtmlTags(comment.text!);
    const score = calculateCommentScore(comment, strippedText.length);

    if (score > bestScore) {
      bestScore = score;
      bestComment = comment;
      bestStrippedText = strippedText;
    }
  }

  // Should not happen given validComments.length > 0, but TypeScript safety
  if (!bestComment) {
    return null;
  }

  // Return Comment object matching frontend interface
  // Note: HN API doesn't provide comment scores, so we use 0 as a placeholder
  return {
    id: bestComment.id,
    by: bestComment.by!,
    text: bestStrippedText,
    score: 0, // HN doesn't expose comment scores via API
  };
}
