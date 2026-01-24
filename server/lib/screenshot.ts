import { chromium, Browser } from 'playwright';
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

// Viewport dimensions
const VIEWPORT_WIDTH = 1200;
const VIEWPORT_HEIGHT = 800;

// Navigation timeout in milliseconds
const NAVIGATION_TIMEOUT = 15000;

/**
 * Captures a screenshot of a URL and saves it to the screenshots directory.
 *
 * @param url - The URL to capture
 * @param storyId - The story ID to use for the filename
 * @returns The URL path to the screenshot, or placeholder path on error
 */
export async function captureScreenshot(url: string, storyId: number): Promise<string> {
  // Validate URL to prevent SSRF attacks
  if (!isValidPublicUrl(url)) {
    console.error(`Screenshot capture rejected for story ${storyId} (SSRF protection): ${url}`);
    return PLACEHOLDER_PATH;
  }

  let browser: Browser | null = null;

  try {
    // Ensure screenshots directory exists
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }

    // Launch headless browser
    browser = await chromium.launch({
      headless: true,
    });

    // Create new page with specified viewport
    const page = await browser.newPage({
      viewport: {
        width: VIEWPORT_WIDTH,
        height: VIEWPORT_HEIGHT,
      },
    });

    // Navigate to URL with timeout
    await page.goto(url, {
      timeout: NAVIGATION_TIMEOUT,
      waitUntil: 'networkidle',
    });

    // Wait for page content to render (handles SPAs)
    await page.waitForSelector('body', { state: 'visible' });

    // Check for redirect to different domain (likely login/SSO page)
    const finalUrl = page.url();
    const expectedHost = new URL(url).hostname;
    const actualHost = new URL(finalUrl).hostname;
    if (!actualHost.includes(expectedHost) && !expectedHost.includes(actualHost)) {
      console.log(`Screenshot skipped for story ${storyId}: redirected to ${actualHost}`);
      return PLACEHOLDER_PATH;
    }

    // Check for bot protection / paywall pages
    const html = await page.content();
    const htmlLower = html.toLowerCase();
    const blockedIndicators = [
      'cf-browser-verification',
      'checking your browser',
      'please enable javascript',
      'captcha',
      'access denied',
      'just a moment',
    ];
    if (blockedIndicators.some(indicator => htmlLower.includes(indicator))) {
      console.log(`Screenshot skipped for story ${storyId}: bot protection detected`);
      return PLACEHOLDER_PATH;
    }

    // Try to dismiss cookie/GDPR banners
    const dismissSelectors = [
      '[class*="cookie"] button[class*="accept"]',
      '[class*="cookie"] button[class*="close"]',
      '[class*="consent"] button[class*="accept"]',
      '[id*="cookie"] button',
      'button[aria-label*="close"]',
      'button[aria-label*="accept"]',
      '[class*="banner"] button[class*="accept"]',
      '[class*="gdpr"] button',
    ];
    for (const selector of dismissSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 300 })) {
          await button.click();
          await page.waitForTimeout(200);
          break;
        }
      } catch {
        // Selector not found or not clickable, continue
      }
    }

    // Validate page has meaningful content
    const bodyText = await page.locator('body').textContent();
    if (!bodyText || bodyText.trim().length < 100) {
      console.log(`Screenshot skipped for story ${storyId}: insufficient content`);
      return PLACEHOLDER_PATH;
    }

    // Generate screenshot path
    const screenshotFilename = `${storyId}.png`;
    const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotFilename);

    // Take screenshot
    await page.screenshot({
      path: screenshotPath,
      type: 'png',
    });

    // Return URL path for frontend
    return `/screenshots/${screenshotFilename}`;
  } catch (error) {
    // Log error for debugging
    console.error(`Screenshot capture failed for story ${storyId} (${url}):`, error);

    // Return placeholder path on any error (including timeout)
    return PLACEHOLDER_PATH;
  } finally {
    // Always close browser to prevent memory leaks
    if (browser) {
      await browser.close();
    }
  }
}
