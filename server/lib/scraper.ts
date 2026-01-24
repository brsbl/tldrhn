import * as cheerio from 'cheerio';
import { isValidPublicUrl } from './url-validator';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const FETCH_TIMEOUT = 10000; // 10 seconds
const MAX_CONTENT_LENGTH = 5000; // Limit response to first 5000 characters

/**
 * Scrapes article text from a URL using Cheerio.
 * Extracts content from common article selectors and returns plain text.
 * @param url The URL to scrape
 * @returns The extracted article text (limited to 5000 chars), or null on error
 */
export async function scrapeArticle(url: string): Promise<string | null> {
  // Validate URL to prevent SSRF attacks
  if (!isValidPublicUrl(url)) {
    console.log(`[scraper] Rejected URL (SSRF protection): ${url}`);
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check for error responses (blocked, paywall indicators)
    if (!response.ok) {
      console.log(`[scraper] HTTP error ${response.status} for ${url}`);
      return null;
    }

    const html = await response.text();

    // Check for common paywall/block indicators
    if (isPaywalledOrBlocked(html)) {
      console.log(`[scraper] Detected paywall or block for ${url}`);
      return null;
    }

    const text = extractArticleText(html);

    if (!text || text.trim().length === 0) {
      console.log(`[scraper] No content extracted from ${url}`);
      return null;
    }

    // Limit to first 5000 characters
    return text.slice(0, MAX_CONTENT_LENGTH);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.log(`[scraper] Timeout fetching ${url}`);
      } else {
        console.log(`[scraper] Error fetching ${url}: ${error.message}`);
      }
    }
    return null;
  }
}

/**
 * Extracts article text from HTML using common selectors.
 * Tries multiple selectors in priority order and falls back to all paragraphs.
 */
function extractArticleText(html: string): string {
  const $ = cheerio.load(html);

  // Remove unwanted elements that might contain noise
  $('script, style, nav, header, footer, aside, .sidebar, .advertisement, .ad, .ads, .comments, .social-share, .related-posts').remove();

  // Priority list of selectors for article content
  const selectors = [
    'article',
    'main',
    '.article-content',
    '.post-content',
    '.entry-content',
    '.article-body',
    '.post-body',
    '.content-body',
    '[role="main"]',
    '.story-body',
    '#article-body',
  ];

  // Try each selector in priority order
  for (const selector of selectors) {
    const element = $(selector);
    if (element.length > 0) {
      const text = extractTextFromElement($, element);
      if (text && text.trim().length > 100) {
        return cleanText(text);
      }
    }
  }

  // Fallback: collect all paragraph text
  const paragraphs: string[] = [];
  $('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 20) { // Skip very short paragraphs (likely navigation/metadata)
      paragraphs.push(text);
    }
  });

  if (paragraphs.length > 0) {
    return cleanText(paragraphs.join('\n\n'));
  }

  // Last resort: try to get body text
  return cleanText($('body').text());
}

/**
 * Extracts text from a Cheerio element, preserving paragraph breaks.
 */
function extractTextFromElement($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.AnyNode>): string {
  const paragraphs: string[] = [];

  element.find('p, h1, h2, h3, h4, h5, h6, li').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 0) {
      paragraphs.push(text);
    }
  });

  if (paragraphs.length > 0) {
    return paragraphs.join('\n\n');
  }

  // If no paragraphs found, get all text content
  return element.text();
}

/**
 * Cleans extracted text by normalizing whitespace and removing excess blank lines.
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')           // Normalize all whitespace to single spaces
    .replace(/\n\s*\n/g, '\n\n')    // Normalize multiple newlines to double newlines
    .replace(/^\s+|\s+$/g, '')      // Trim leading/trailing whitespace
    .replace(/\t/g, ' ')            // Replace tabs with spaces
    .trim();
}

/**
 * Checks for common paywall or block indicators in the HTML.
 */
function isPaywalledOrBlocked(html: string): boolean {
  const lowerHtml = html.toLowerCase();

  const paywallIndicators = [
    'subscribe to continue',
    'subscription required',
    'create an account to continue',
    'sign in to continue reading',
    'this content is for subscribers',
    'premium content',
    'you have reached your limit',
    'access denied',
    'please enable javascript',
    'browser not supported',
    'captcha',
    'cf-browser-verification',
    'checking your browser',
  ];

  for (const indicator of paywallIndicators) {
    if (lowerHtml.includes(indicator)) {
      return true;
    }
  }

  return false;
}
