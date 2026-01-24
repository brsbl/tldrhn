import pLimit from 'p-limit';

// Concurrency limiters to prevent rate limiting and resource exhaustion

// Max 3 concurrent screenshots (Playwright instances are resource-heavy)
export const screenshotLimit = pLimit(3);

// Max 5 concurrent scrapes (prevent overwhelming target sites)
export const scrapeLimit = pLimit(5);

// Max 3 concurrent LLM calls (respect API rate limits)
export const llmLimit = pLimit(3);
