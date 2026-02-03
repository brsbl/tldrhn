import { chromium, Browser, BrowserContext } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { isValidPublicUrl } from './url-validator';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to screenshots directory
const SCREENSHOTS_DIR = path.join(__dirname, '../../public/screenshots');

// Placeholder path returned on error/timeout
const PLACEHOLDER_PATH = '/placeholder.svg';

/**
 * Generate a unique placeholder PNG based on story ID using Playwright
 */
async function generateDomainPlaceholder(url: string | undefined, storyId: number, savePath: string): Promise<boolean> {
  let page = null;

  try {
    let domain = 'news.ycombinator.com';
    if (url) {
      try {
        domain = new URL(url).hostname.replace('www.', '');
      } catch {
        // Use default
      }
    }

    // Generate unique colors from story ID
    const hue1 = (storyId * 137) % 360;
    const hue2 = (hue1 + 40) % 360;
    const color1 = `hsl(${hue1}, 25%, 15%)`;
    const color2 = `hsl(${hue2}, 30%, 20%)`;
    const accentHue = (hue1 + 180) % 360;
    const accent = `hsl(${accentHue}, 40%, 50%)`;

    // Generate unique geometric pattern from story ID
    const shapes = generateShapes(storyId, accentHue);

    // Truncate long domains
    const displayDomain = domain.length > 30 ? domain.substring(0, 27) + '...' : domain;

    const svg = `<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg${storyId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1}" />
      <stop offset="100%" style="stop-color:${color2}" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg${storyId})"/>
  ${shapes}
  <text x="600" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="600" fill="${accent}" text-anchor="middle" opacity="0.9">${escapeXml(displayDomain)}</text>
  <rect x="500" y="410" width="200" height="3" fill="${accent}" opacity="0.5" rx="1"/>
</svg>`;

    // Use Playwright to render SVG as PNG
    const context = await getBrowser();
    page = await context.newPage();

    // Load SVG as data URL
    const svgBase64 = Buffer.from(svg).toString('base64');
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><style>body { margin: 0; padding: 0; }</style></head>
        <body><img src="data:image/svg+xml;base64,${svgBase64}" width="1200" height="800" /></body>
      </html>
    `);

    await page.setViewportSize({ width: 1200, height: 800 });
    await page.screenshot({ path: savePath, type: 'png' });

    return true;
  } catch (error) {
    console.error(`[image] Failed to generate placeholder for story ${storyId}:`, error);
    return false;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}

/**
 * Generate unique geometric shapes based on story ID
 */
function generateShapes(storyId: number, baseHue: number): string {
  const shapes: string[] = [];
  const seed = storyId;

  // Pseudo-random generator based on story ID
  const rand = (i: number) => ((seed * 9301 + 49297 + i * 233) % 233280) / 233280;

  // Generate 5-8 abstract shapes
  const numShapes = 5 + Math.floor(rand(0) * 4);

  for (let i = 0; i < numShapes; i++) {
    const x = rand(i * 7) * 1200;
    const y = rand(i * 11) * 800;
    const size = 50 + rand(i * 13) * 200;
    const opacity = 0.03 + rand(i * 17) * 0.07;
    const hue = (baseHue + rand(i * 19) * 60 - 30) % 360;
    const color = `hsl(${hue}, 30%, 40%)`;

    const shapeType = Math.floor(rand(i * 23) * 3);

    if (shapeType === 0) {
      // Circle
      shapes.push(`<circle cx="${x}" cy="${y}" r="${size}" fill="${color}" opacity="${opacity}"/>`);
    } else if (shapeType === 1) {
      // Rounded rectangle
      const rotation = rand(i * 29) * 360;
      shapes.push(`<rect x="${x - size/2}" y="${y - size/2}" width="${size}" height="${size * 0.6}" rx="${size * 0.1}" fill="${color}" opacity="${opacity}" transform="rotate(${rotation} ${x} ${y})"/>`);
    } else {
      // Triangle/polygon
      const points = `${x},${y - size * 0.5} ${x - size * 0.5},${y + size * 0.3} ${x + size * 0.5},${y + size * 0.3}`;
      const rotation = rand(i * 31) * 360;
      shapes.push(`<polygon points="${points}" fill="${color}" opacity="${opacity}" transform="rotate(${rotation} ${x} ${y})"/>`);
    }
  }

  return shapes.join('\n  ');
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
  }[c] || c));
}

// Viewport dimensions for fallback screenshots
const VIEWPORT_WIDTH = 1200;
const VIEWPORT_HEIGHT = 800;

// Navigation timeout in milliseconds (increased for slow sites)
const NAVIGATION_TIMEOUT = 25000;
const PAGE_RENDER_WAIT = 3000;

// Browser pool for reusing browser instances (only used for fallback screenshots)
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
      viewport: {
        width: VIEWPORT_WIDTH,
        height: VIEWPORT_HEIGHT,
      },
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
 * Extract hero image URL from HTML content
 * Checks og:image, twitter:image, and other common meta tags
 */
function extractHeroImageUrl(html: string, baseUrl: string): string | null {
  // Priority order for image extraction
  const patterns = [
    // Open Graph image
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    // Twitter card image
    /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
    // Schema.org image
    /"image"\s*:\s*"([^"]+)"/i,
    // Article thumbnail
    /<meta[^>]*name=["']thumbnail["'][^>]*content=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      let imageUrl = match[1];

      // Handle relative URLs
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      } else if (imageUrl.startsWith('/')) {
        try {
          const base = new URL(baseUrl);
          imageUrl = `${base.protocol}//${base.host}${imageUrl}`;
        } catch {
          continue;
        }
      }

      // Validate it's a proper URL
      if (imageUrl.startsWith('http')) {
        return imageUrl;
      }
    }
  }

  return null;
}

/**
 * Fetch HTML content from a URL
 */
async function fetchHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);  // Increased for slow sites

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  }
}

/**
 * Download an image from URL and save it locally
 */
async function downloadImage(imageUrl: string, savePath: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/*',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return false;

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('image')) return false;

    // Check content length - skip tiny images (likely tracking pixels)
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) < 5000) {
      return false; // Skip images smaller than 5KB
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Additional size check after download
    if (buffer.length < 5000) {
      return false;
    }

    fs.writeFileSync(savePath, buffer);
    return true;
  } catch {
    return false;
  }
}

/**
 * Take a screenshot of an HN page focused on the top comment
 */
async function takeHNScreenshot(hnUrl: string, savePath: string): Promise<boolean> {
  let page = null;

  try {
    const context = await getBrowser();
    page = await context.newPage();

    await page.goto(hnUrl, {
      timeout: NAVIGATION_TIMEOUT,
      waitUntil: 'domcontentloaded',
    });

    await page.waitForTimeout(1000);

    // Find and scroll to the first comment (skip the story header)
    const scrolled = await page.evaluate(() => {
      // HN comments have class "comtr"
      const comments = document.querySelectorAll('.comtr');
      if (comments.length > 0) {
        // Scroll to put first comment at top of viewport with small padding
        const firstComment = comments[0] as HTMLElement;
        const rect = firstComment.getBoundingClientRect();
        window.scrollTo(0, window.scrollY + rect.top - 20);
        return true;
      }
      return false;
    });

    if (!scrolled) {
      console.log(`[image] No comments found on HN page`);
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: savePath, type: 'png' });
    return true;
  } catch (error) {
    console.log(`[image] HN screenshot failed: ${error}`);
    return false;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}

/**
 * Take a screenshot of a URL as fallback
 */
async function takeScreenshot(url: string, savePath: string): Promise<boolean> {
  let page = null;

  try {
    const context = await getBrowser();
    page = await context.newPage();

    // Block heavy resources
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      if (['media', 'font', 'websocket'].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto(url, {
      timeout: NAVIGATION_TIMEOUT,
      waitUntil: 'domcontentloaded',
    });

    await page.waitForTimeout(PAGE_RENDER_WAIT);

    // Check for bot protection
    const html = await page.content();
    const htmlLower = html.toLowerCase();

    const blockIndicators = ['cf-browser-verification', 'checking your browser', 'just a moment'];
    if (blockIndicators.some(indicator => htmlLower.includes(indicator))) {
      console.log(`[image] Bot protection detected, skipping`);
      return false;
    }

    // Check visible text for errors (more reliable than HTML)
    const visibleText = await page.evaluate(() => document.body?.innerText || '');
    const visibleTextLower = visibleText.toLowerCase();

    // Error page indicators - check visible text
    const errorIndicators = [
      'application error',
      'client-side exception',
      'internal server error',
      '404',
      'page not found',
      'something went wrong',
      'error occurred',
      'server error',
      'access denied',
      'forbidden',
      'this page isn\'t working',
      'cannot be reached',
      'took too long to respond',
    ];

    // If error text found AND page is mostly empty (short visible text), skip
    const hasErrorText = errorIndicators.some(indicator => visibleTextLower.includes(indicator));
    const isShortPage = visibleText.length < 500;

    if (hasErrorText && isShortPage) {
      console.log(`[image] Error page detected: "${visibleText.substring(0, 100)}...", skipping`);
      return false;
    }

    await page.screenshot({ path: savePath, type: 'png' });
    return true;
  } catch {
    return false;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}

/**
 * Result of image capture operation
 */
export interface ImageCaptureResult {
  /** URL path to the local screenshot/image */
  screenshotUrl: string;
  /** Direct URL to the hero image (if available and valid) */
  heroImageUrl?: string;
  /** True if this is a fallback (HN page or placeholder), not the actual article */
  isFallback?: boolean;
}

/**
 * Captures a hero image or screenshot for a story.
 * Priority: 1) Hero/OG image from URL, 2) Screenshot of URL, 3) Screenshot of HN page
 *
 * @param url - The article URL (can be empty for Ask HN posts)
 * @param storyId - The story ID to use for the filename
 * @param hnUrl - The HN discussion URL (used as fallback)
 * @returns Object containing screenshotUrl and optional heroImageUrl
 */
export async function captureScreenshot(
  url: string | undefined,
  storyId: number,
  hnUrl?: string
): Promise<ImageCaptureResult> {
  const imageFilename = `${storyId}.png`;
  const imagePath = path.join(SCREENSHOTS_DIR, imageFilename);

  // Skip if image already exists
  if (fs.existsSync(imagePath)) {
    return { screenshotUrl: `/screenshots/${imageFilename}` };
  }

  // Ensure screenshots directory exists
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const primaryUrl = url && isValidPublicUrl(url) ? url : null;
  const fallbackUrl = hnUrl || `https://news.ycombinator.com/item?id=${storyId}`;

  // Step 1: Try to get hero image from primary URL
  if (primaryUrl) {
    console.log(`[image] Fetching hero image for story ${storyId}`);

    const html = await fetchHtml(primaryUrl);
    if (html) {
      const heroImageUrl = extractHeroImageUrl(html, primaryUrl);
      if (heroImageUrl) {
        console.log(`[image] Found hero image: ${heroImageUrl.substring(0, 80)}...`);
        if (await downloadImage(heroImageUrl, imagePath)) {
          console.log(`[image] Hero image saved for story ${storyId}`);
          // Return both the local copy and the original hero URL
          return {
            screenshotUrl: `/screenshots/${imageFilename}`,
            heroImageUrl
          };
        }
      }
    }

    // Step 2: Try screenshot of primary URL
    console.log(`[image] No hero image, trying screenshot for story ${storyId}`);
    if (await takeScreenshot(primaryUrl, imagePath)) {
      console.log(`[image] Screenshot saved for story ${storyId}`);
      return { screenshotUrl: `/screenshots/${imageFilename}` };
    }
  }

  // Step 3: Fall back to HN page screenshot (focused on top comment)
  console.log(`[image] Falling back to HN page for story ${storyId}`);
  if (await takeHNScreenshot(fallbackUrl, imagePath)) {
    console.log(`[image] HN screenshot saved for story ${storyId}`);
    return { screenshotUrl: `/screenshots/${imageFilename}`, isFallback: true };
  }

  // Step 4: Generate a domain-specific placeholder
  console.log(`[image] Generating domain placeholder for story ${storyId}`);
  if (await generateDomainPlaceholder(url, storyId, imagePath)) {
    return { screenshotUrl: `/screenshots/${imageFilename}` };
  }

  console.log(`[image] All methods failed for story ${storyId}`);
  return { screenshotUrl: PLACEHOLDER_PATH };
}

/**
 * Cleanup browser resources (call on server shutdown)
 */
export async function closeBrowser(): Promise<void> {
  if (browserContext) {
    await browserContext.close().catch(() => {});
    browserContext = null;
  }
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
  }
}
