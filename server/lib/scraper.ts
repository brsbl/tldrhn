import * as cheerio from 'cheerio';
import { chromium, Browser, BrowserContext } from 'playwright';
import { isValidPublicUrl } from './url-validator';

const MAX_CONTENT_LENGTH = 5000;
const FETCH_TIMEOUT = 15000;  // Increased from 10s for slow sites
const BROWSER_TIMEOUT = 25000;  // Increased from 15s for slow sites
const BROWSER_RENDER_WAIT = 3000;  // Increased from 2s for JS-heavy sites

// Browser pool for reusing browser instances
let browserInstance: Browser | null = null;
let browserContext: BrowserContext | null = null;

async function getBrowser(): Promise<BrowserContext> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    browserContext = await browserInstance.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'America/New_York',
      bypassCSP: true,
      ignoreHTTPSErrors: true,
    });
  }

  return browserContext!;
}

/**
 * Scrapes article text from a URL using Playwright for JS-rendered content.
 * Falls back to simple fetch for faster scraping when possible.
 */
export async function scrapeArticle(url: string): Promise<string | null> {
  if (!isValidPublicUrl(url)) {
    console.log(`[scraper] Rejected URL (SSRF protection): ${url}`);
    return null;
  }

  // Try simple fetch first (faster)
  const simpleResult = await scrapeWithFetch(url);
  if (simpleResult && simpleResult.length > 200) {
    return simpleResult;
  }

  // Fall back to browser-based scraping
  return await scrapeWithBrowser(url);
}

/**
 * Simple fetch-based scraping (fast, works for static sites)
 */
async function scrapeWithFetch(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Check for Cloudflare or other bot protection (will need browser)
    if (needsBrowser(html)) {
      return null;
    }

    const text = extractArticleText(html);
    if (text && text.trim().length > 100) {
      return text.slice(0, MAX_CONTENT_LENGTH);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Browser-based scraping using Playwright (handles JS-rendered content)
 */
async function scrapeWithBrowser(url: string): Promise<string | null> {
  let page = null;

  try {
    const context = await getBrowser();
    page = await context.newPage();

    // Block heavy resources for faster loading
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      if (['image', 'media', 'font', 'stylesheet'].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto(url, {
      timeout: BROWSER_TIMEOUT,
      waitUntil: 'domcontentloaded',
    });

    // Wait for JS to render (increased for slow sites)
    await page.waitForTimeout(BROWSER_RENDER_WAIT);

    const html = await page.content();

    // Check if still blocked
    const lowerHtml = html.toLowerCase();
    if (lowerHtml.includes('captcha') ||
        (lowerHtml.includes('access denied') && html.length < 5000)) {
      console.log(`[scraper] Still blocked after browser render for ${url}`);
      return null;
    }

    const text = extractArticleText(html);
    if (text && text.trim().length > 100) {
      console.log(`[scraper] Browser scrape succeeded for ${url}`);
      return text.slice(0, MAX_CONTENT_LENGTH);
    }

    console.log(`[scraper] No content extracted from ${url}`);
    return null;
  } catch (error) {
    if (error instanceof Error) {
      console.log(`[scraper] Browser error for ${url}: ${error.message}`);
    }
    return null;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}

/**
 * Check if the page needs browser rendering (Cloudflare, JS-required, etc.)
 */
function needsBrowser(html: string): boolean {
  const lowerHtml = html.toLowerCase();
  const indicators = [
    'cf-browser-verification',
    'checking your browser',
    'just a moment',
    'please enable javascript',
    'javascript is required',
    'noscript',
    'ray id',
  ];

  // Very short pages often indicate a challenge page
  if (html.length < 2000 && lowerHtml.includes('cloudflare')) {
    return true;
  }

  return indicators.some(indicator => lowerHtml.includes(indicator));
}

/**
 * Extracts article text from HTML using common selectors.
 */
function extractArticleText(html: string): string {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $('script, style, nav, header, footer, aside, .sidebar, .advertisement, .ad, .ads, .comments, .social-share, .related-posts, .newsletter, .subscription, [role="navigation"], [role="banner"], [role="complementary"]').remove();

  // Priority list of selectors for article content
  const selectors = [
    'article',
    '[role="article"]',
    'main',
    '[role="main"]',
    '.article-content',
    '.article-body',
    '.article__body',
    '.post-content',
    '.post-body',
    '.entry-content',
    '.content-body',
    '.story-body',
    '.story-content',
    '#article-body',
    '#article-content',
    '.prose',
    '.markdown-body',
    '.rich-text',
    '.text-content',
    '.page-content',
    '.single-post-content',
    '.blog-post-content',
    '.news-article',
    '[itemprop="articleBody"]',
    '[data-article-body]',
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

  // Try meta description early - often more reliable than scraping
  const metaDescription = $('meta[name="description"]').attr('content') ||
                          $('meta[property="og:description"]').attr('content') ||
                          $('meta[name="twitter:description"]').attr('content');
  if (metaDescription && metaDescription.trim().length > 30) {
    return cleanText(metaDescription);
  }

  // Fallback: collect all paragraph text
  const paragraphs: string[] = [];
  $('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 30) {
      paragraphs.push(text);
    }
  });

  if (paragraphs.length > 0) {
    return cleanText(paragraphs.join(' '));
  }

  // Last resort: try body text
  const bodyText = $('body').text();
  if (bodyText && bodyText.trim().length > 200) {
    return cleanText(bodyText);
  }

  return '';
}

/**
 * Extracts text from a Cheerio element
 */
function extractTextFromElement($: cheerio.CheerioAPI, element: cheerio.Cheerio<cheerio.AnyNode>): string {
  const paragraphs: string[] = [];

  element.find('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 0) {
      paragraphs.push(text);
    }
  });

  if (paragraphs.length > 0) {
    return paragraphs.join(' ');
  }

  return element.text();
}

/**
 * Cleans extracted text
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, ' ')
    .trim();
}

/**
 * Cleanup browser resources
 */
export async function closeScraper(): Promise<void> {
  if (browserContext) {
    await browserContext.close().catch(() => {});
    browserContext = null;
  }
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
  }
}
