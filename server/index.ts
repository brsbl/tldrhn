import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import type { Story, Comment, FeedType } from '../src/types/index.js';
import { FEED_TYPES } from '../src/types/index.js';
import { fetchFeedStories, fetchStory, getHNUrl, HNStory } from './lib/hn-api.js';
import { scrapeArticle } from './lib/scraper.js';
import { captureScreenshot } from './lib/screenshot.js';
import { generateSummary } from './lib/summarizer.js';
import { getTopComment } from './lib/comments.js';
import { screenshotLimit, scrapeLimit, llmLimit } from './lib/concurrency.js';
import { cache, CACHE_TTL_MS } from './lib/cache.js';

const app = express();

// Cache key prefix for stories response (per feed)
const getStoriesCacheKey = (feed: FeedType) => `stories:${feed}`;
const PORT = process.env.PORT || 3001;

// Batch size for parallel processing (to avoid rate limiting)
const BATCH_SIZE = 5;

// Configure CORS to allow requests from Vite dev server (any port)
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from localhost on any port, or no origin (e.g., curl)
    if (!origin || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

/**
 * Processes a single story: scrapes article, captures screenshot,
 * generates summary, and fetches top comment.
 */
async function processStory(hnStory: HNStory): Promise<Story | null> {
  try {
    console.log(`[stories] Processing story ${hnStory.id}: "${hnStory.title}"`);

    const url = hnStory.url || '';
    const hnUrl = getHNUrl(hnStory.id);
    const fetchedAt = Math.floor(Date.now() / 1000);

    // Process in parallel: scrape, screenshot, and top comment (with concurrency limits)
    const [articleText, screenshotUrl, topComment] = await Promise.all([
      url ? scrapeLimit(() => scrapeArticle(url)) : Promise.resolve(null),
      url ? screenshotLimit(() => captureScreenshot(url, hnStory.id)) : Promise.resolve('/placeholder.svg'),
      hnStory.kids ? getTopComment(hnStory.kids) : Promise.resolve(null),
    ]);

    // Generate summary (depends on article text, with LLM concurrency limit)
    let summary = '';
    if (articleText) {
      summary = await llmLimit(() => generateSummary(articleText, hnStory.title));
    } else if (hnStory.text) {
      // For Ask HN / Show HN text posts, use the story text
      summary = await llmLimit(() => generateSummary(hnStory.text, hnStory.title));
    } else if (url) {
      // Fallback for failed scrapes: provide a read more prompt with domain
      try {
        const domain = new URL(url).hostname.replace(/^www\./, '');
        summary = `Read the full article on ${domain}.`;
      } catch {
        summary = 'Read the full article at the link above.';
      }
    }

    const story: Story = {
      id: hnStory.id,
      title: hnStory.title,
      url,
      hnUrl,
      score: hnStory.score,
      by: hnStory.by,
      time: hnStory.time,
      descendants: hnStory.descendants ?? 0,
      summary,
      screenshotUrl,
      topComment,
      fetchedAt,
      articleText,
    };

    console.log(`[stories] Completed story ${hnStory.id}`);
    return story;
  } catch (error) {
    console.error(`[stories] Failed to process story ${hnStory.id}:`, error);
    return null;
  }
}

/**
 * Processes stories in batches to avoid rate limiting.
 */
async function processStoriesInBatches(hnStories: HNStory[]): Promise<Story[]> {
  const results: Story[] = [];

  for (let i = 0; i < hnStories.length; i += BATCH_SIZE) {
    const batch = hnStories.slice(i, i + BATCH_SIZE);
    console.log(`[stories] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(hnStories.length / BATCH_SIZE)} (stories ${i + 1}-${Math.min(i + BATCH_SIZE, hnStories.length)})`);

    const batchResults = await Promise.all(batch.map(processStory));

    // Filter out failed stories (null values)
    for (const story of batchResults) {
      if (story !== null) {
        results.push(story);
      }
    }
  }

  return results;
}

/**
 * Fetches and processes stories for a specific feed type.
 */
async function fetchAndProcessFeed(feedType: FeedType): Promise<Story[]> {
  const cacheKey = getStoriesCacheKey(feedType);

  // Check cache first
  const cachedStories = cache.get<Story[]>(cacheKey);
  if (cachedStories) {
    console.log(`[stories:${feedType}] Returning ${cachedStories.length} cached stories`);
    return cachedStories;
  }

  console.log(`[stories:${feedType}] Fetching from HN API...`);

  // Step 1: Fetch 30 story IDs for this feed
  const storyIds = await fetchFeedStories(feedType);
  console.log(`[stories:${feedType}] Got ${storyIds.length} story IDs`);

  // Step 2: Fetch full story details for each ID
  console.log(`[stories:${feedType}] Fetching story details...`);
  const storyPromises = storyIds.map(id => fetchStory(id));
  const hnStories = await Promise.all(storyPromises);

  // Filter out null values (deleted/dead stories)
  const validStories = hnStories.filter((story): story is HNStory => story !== null);
  console.log(`[stories:${feedType}] Got ${validStories.length} valid stories`);

  // Step 3: Process each story (scrape, screenshot, summarize, get comments)
  console.log(`[stories:${feedType}] Processing stories...`);
  const stories = await processStoriesInBatches(validStories);

  // Cache the response with 30 minute TTL
  cache.set(cacheKey, stories, CACHE_TTL_MS);

  console.log(`[stories:${feedType}] Cached ${stories.length} processed stories`);
  return stories;
}

// GET /api/stories/:feed endpoint
app.get('/api/stories/:feed', async (req, res) => {
  try {
    const feedParam = req.params.feed as string;

    // Validate feed type
    if (!FEED_TYPES.includes(feedParam as FeedType)) {
      res.status(400).json({ error: `Invalid feed type: ${feedParam}. Valid types: ${FEED_TYPES.join(', ')}` });
      return;
    }

    const feedType = feedParam as FeedType;
    const stories = await fetchAndProcessFeed(feedType);
    res.json(stories);
  } catch (error) {
    console.error('[stories] Error fetching stories:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// GET /api/stories endpoint (alias for /api/stories/top)
app.get('/api/stories', async (_req, res) => {
  try {
    const stories = await fetchAndProcessFeed('top');
    res.json(stories);
  } catch (error) {
    console.error('[stories] Error fetching stories:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /api/refresh endpoint - clears cache and signals refresh
app.post('/api/refresh', (_req, res) => {
  console.log('[refresh] Manual refresh triggered');
  cache.clear();
  res.json({ success: true, message: 'Cache cleared', timestamp: new Date().toISOString() });
});

// Refresh interval (25 minutes - before cache expires)
const REFRESH_INTERVAL_MS = 25 * 60 * 1000;

/**
 * Proactively fetches and caches stories for a single feed.
 */
async function refreshFeed(feedType: FeedType): Promise<void> {
  const cacheKey = getStoriesCacheKey(feedType);
  console.log(`[refresh:${feedType}] Starting...`);
  const startTime = Date.now();

  try {
    // Step 1: Fetch 30 story IDs
    const storyIds = await fetchFeedStories(feedType);
    console.log(`[refresh:${feedType}] Got ${storyIds.length} story IDs`);

    // Step 2: Fetch full story details
    const storyPromises = storyIds.map(id => fetchStory(id));
    const hnStories = await Promise.all(storyPromises);
    const validStories = hnStories.filter((story): story is HNStory => story !== null);
    console.log(`[refresh:${feedType}] Got ${validStories.length} valid stories`);

    // Step 3: Process each story
    const stories = await processStoriesInBatches(validStories);

    // Cache the results
    cache.set(cacheKey, stories, CACHE_TTL_MS);

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`[refresh:${feedType}] Completed: ${stories.length} stories in ${duration}s`);
  } catch (error) {
    console.error(`[refresh:${feedType}] Failed:`, error);
  }
}

/**
 * Proactively fetches and caches all feed types.
 * Processes feeds sequentially to avoid overwhelming the APIs.
 */
async function refreshAllFeeds(): Promise<void> {
  console.log('[refresh] Starting proactive fetch of all feeds...');
  const startTime = Date.now();

  for (const feedType of FEED_TYPES) {
    await refreshFeed(feedType);
  }

  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log(`[refresh] All feeds completed in ${duration}s`);
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints: http://localhost:${PORT}/api/stories/:feed`);
  console.log(`  Valid feeds: ${FEED_TYPES.join(', ')}`);

  // Proactively fetch all feeds on startup
  console.log('[startup] Fetching all feeds in background...');
  refreshAllFeeds();

  // Set up periodic refresh of all feeds
  setInterval(refreshAllFeeds, REFRESH_INTERVAL_MS);
  console.log(`[startup] Auto-refresh scheduled every ${REFRESH_INTERVAL_MS / 60000} minutes`);
});
