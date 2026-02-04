import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { Story, FeedType } from '../src/types/index.js';
import { FEED_TYPES } from '../src/types/index.js';
import { fetchFeedStories, fetchStory, getHNUrl, HNStory } from './lib/hn-api.js';
import { scrapeArticle } from './lib/scraper.js';
import { captureScreenshot } from './lib/screenshot.js';
import { generateExcerpt } from './lib/excerpt.js';
import { getTopComment } from './lib/comments.js';
import { screenshotLimit, scrapeLimit } from './lib/concurrency.js';
import { cache, CACHE_TTL_MS, type CacheResult } from './lib/cache.js';
import { parseAllowedOrigins, isOriginAllowed, validateApiKey } from './lib/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);

// Warn if ALLOWED_ORIGINS is not set in production
if (isProduction && allowedOrigins.length === 0) {
  console.warn('[security] WARNING: ALLOWED_ORIGINS is not set in production. CORS will reject all cross-origin requests and HTTPS redirects may not work correctly.');
}

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding screenshots
}));

// Trust proxy in production (needed for rate limiter to see real client IPs)
if (isProduction) {
  app.set('trust proxy', 1);
}

// Rate limiting - 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// HTTPS redirect for production (behind proxy like Vercel)
app.use((req, res, next) => {
  if (isProduction && req.headers['x-forwarded-proto'] === 'http') {
    const host = req.headers.host;

    // Validate host against allowed origins to prevent host header injection
    if (host && allowedOrigins.length > 0) {
      const isValidHost = allowedOrigins.some(origin => {
        try {
          const url = new URL(origin);
          return url.host === host;
        } catch {
          return false;
        }
      });

      if (isValidHost) {
        return res.redirect(301, `https://${host}${req.url}`);
      }

      // Host not in allowed origins - use first allowed origin's host
      try {
        const fallbackUrl = new URL(allowedOrigins[0]);
        return res.redirect(301, `https://${fallbackUrl.host}${req.url}`);
      } catch {
        // Skip redirect if we can't determine a safe host
      }
    }
    // No allowed origins configured or no host - skip redirect
  }
  next();
});

// Cache key prefix for stories response (per feed)
const getStoriesCacheKey = (feed: FeedType) => `stories:${feed}`;
const PORT = process.env.PORT || 3001;

// Batch size for parallel processing (to avoid rate limiting)
const BATCH_SIZE = 5;

// Configure CORS
app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin, allowedOrigins, isProduction)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Serve static files from public directory (screenshots, placeholder.svg)
app.use(express.static(path.join(__dirname, '../public')));

/**
 * Processes a single story: scrapes article, captures screenshot,
 * generates excerpt, and fetches top comment.
 */
async function processStory(hnStory: HNStory): Promise<Story | null> {
  try {
    console.log(`[stories] Processing story ${hnStory.id}: "${hnStory.title}"`);

    const url = hnStory.url || '';
    const hnUrl = getHNUrl(hnStory.id);
    const fetchedAt = Math.floor(Date.now() / 1000);

    // Process in parallel: scrape, screenshot, and top comment (with concurrency limits)
    const [articleText, imageResult, topComment] = await Promise.all([
      url ? scrapeLimit(() => scrapeArticle(url)) : Promise.resolve(null),
      screenshotLimit(() => captureScreenshot(url || undefined, hnStory.id, hnUrl)),
      hnStory.kids ? getTopComment(hnStory.kids) : Promise.resolve(null),
    ]);

    // Generate excerpt from article text
    let excerpt = '';
    if (articleText) {
      excerpt = generateExcerpt(articleText);
    } else if (hnStory.text) {
      // For Ask HN / Show HN text posts, use the story text
      excerpt = generateExcerpt(hnStory.text);
    }
    // If scraping failed, leave excerpt empty - the title is enough

    const story: Story = {
      id: hnStory.id,
      title: hnStory.title,
      url,
      hnUrl,
      score: hnStory.score,
      by: hnStory.by,
      time: hnStory.time,
      descendants: hnStory.descendants ?? 0,
      excerpt,
      screenshotUrl: imageResult.screenshotUrl,
      heroImageUrl: imageResult.heroImageUrl,
      isImageFallback: imageResult.isFallback,
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

// Track in-flight refreshes to avoid duplicate work
const refreshInProgress = new Set<string>();

/**
 * Refresh stories for a feed in the background.
 */
async function refreshFeedInBackground(feedType: FeedType): Promise<void> {
  const cacheKey = getStoriesCacheKey(feedType);

  // Skip if already refreshing
  if (refreshInProgress.has(cacheKey)) {
    console.log(`[stories:${feedType}] Background refresh already in progress, skipping`);
    return;
  }

  refreshInProgress.add(cacheKey);
  console.log(`[stories:${feedType}] Starting background refresh...`);

  try {
    // Step 1: Fetch 30 story IDs for this feed
    const storyIds = await fetchFeedStories(feedType);
    console.log(`[stories:${feedType}] Got ${storyIds.length} story IDs`);

    // Step 2: Fetch full story details for each ID
    const storyPromises = storyIds.map(id => fetchStory(id));
    const hnStories = await Promise.all(storyPromises);

    // Filter out null values (deleted/dead stories)
    const validStories = hnStories.filter((story): story is HNStory => story !== null);
    console.log(`[stories:${feedType}] Got ${validStories.length} valid stories`);

    // Step 3: Process each story (scrape, screenshot, extract excerpt, get comments)
    const stories = await processStoriesInBatches(validStories);

    // Cache the response with 30 minute TTL
    cache.set(cacheKey, stories, CACHE_TTL_MS);
    console.log(`[stories:${feedType}] Background refresh complete: ${stories.length} stories cached`);
  } catch (error) {
    console.error(`[stories:${feedType}] Background refresh failed:`, error);
  } finally {
    refreshInProgress.delete(cacheKey);
  }
}

interface FeedResult {
  stories: Story[];
  cacheStatus: 'fresh' | 'stale' | 'miss';
}

/**
 * Fetches stories for a feed with stale-while-revalidate support.
 * Returns stale data immediately while refreshing in background.
 */
async function fetchAndProcessFeed(feedType: FeedType): Promise<FeedResult> {
  const cacheKey = getStoriesCacheKey(feedType);

  // Check cache with stale-while-revalidate support
  const cacheResult: CacheResult<Story[]> = cache.getWithMeta<Story[]>(cacheKey);

  if (cacheResult.status === 'fresh' && cacheResult.data) {
    console.log(`[stories:${feedType}] Returning ${cacheResult.data.length} fresh cached stories`);
    return { stories: cacheResult.data, cacheStatus: 'fresh' };
  }

  if (cacheResult.status === 'stale' && cacheResult.data) {
    console.log(`[stories:${feedType}] Returning ${cacheResult.data.length} stale stories, refreshing in background`);
    // Trigger background refresh (non-blocking)
    refreshFeedInBackground(feedType);
    return { stories: cacheResult.data, cacheStatus: 'stale' };
  }

  // Cache miss - must fetch synchronously
  console.log(`[stories:${feedType}] Cache miss, fetching from HN API...`);

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

  // Step 3: Process each story (scrape, screenshot, extract excerpt, get comments)
  console.log(`[stories:${feedType}] Processing stories...`);
  const stories = await processStoriesInBatches(validStories);

  // Cache the response with 30 minute TTL
  cache.set(cacheKey, stories, CACHE_TTL_MS);

  console.log(`[stories:${feedType}] Cached ${stories.length} processed stories`);
  return { stories, cacheStatus: 'miss' };
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
    const { stories, cacheStatus } = await fetchAndProcessFeed(feedType);

    // Add cache status header for debugging/client awareness
    res.setHeader('X-Cache-Status', cacheStatus);
    res.json(stories);
  } catch (error) {
    console.error('[stories] Error fetching stories:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// GET /api/stories endpoint (alias for /api/stories/top)
app.get('/api/stories', async (_req, res) => {
  try {
    const { stories, cacheStatus } = await fetchAndProcessFeed('top');
    res.setHeader('X-Cache-Status', cacheStatus);
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

// POST /api/screenshot/:storyId - Capture screenshot on-demand (triggered by user click)
app.post('/api/screenshot/:storyId', async (req, res) => {
  try {
    const storyId = parseInt(req.params.storyId, 10);
    if (isNaN(storyId)) {
      res.status(400).json({ error: 'Invalid story ID' });
      return;
    }

    const { url } = req.body as { url?: string };
    const hnUrl = getHNUrl(storyId);

    console.log(`[screenshot] On-demand capture requested for story ${storyId}`);

    // Capture screenshot in background (non-blocking response)
    screenshotLimit(() => captureScreenshot(url || undefined, storyId, hnUrl))
      .then(result => {
        console.log(`[screenshot] On-demand capture complete for story ${storyId}: ${result.screenshotUrl}`);
      })
      .catch(err => {
        console.error(`[screenshot] On-demand capture failed for story ${storyId}:`, err);
      });

    // Return immediately - screenshot will be ready on next page load
    res.json({
      success: true,
      message: 'Screenshot capture started',
      storyId
    });
  } catch (error) {
    console.error('[screenshot] Error triggering capture:', error);
    res.status(500).json({ error: 'Failed to trigger screenshot capture' });
  }
});

// POST /api/refresh endpoint - clears cache and signals refresh (protected)
app.post('/api/refresh', (req, res) => {
  const refreshApiKey = process.env.REFRESH_API_KEY;
  const providedKey = (req.headers['x-api-key'] as string) || req.headers['authorization']?.replace('Bearer ', '');

  if (!validateApiKey(providedKey, refreshApiKey)) {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
    return;
  }

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
