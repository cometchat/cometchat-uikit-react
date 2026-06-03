import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=core-components-bubbles-message-bubble-text';

test.describe('CometChatTextBubble', () => {
  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  test.describe('Rendering', () => {
    test('renders outgoing and incoming text bubbles', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const outgoing = page.locator('[class*="text-bubble"][class*="outgoing"]').first();
      const incoming = page.locator('[class*="text-bubble"][class*="incoming"]').first();
      await expect(outgoing).toBeVisible();
      await expect(incoming).toBeVisible();
    });

    test('renders incoming text bubble with sender info', async ({ page }) => {
      await page.goto(`${STORY_BASE}--incoming&viewMode=story`);
      const bubble = page.locator('[class*="text-bubble"]').first();
      await expect(bubble).toBeVisible();
    });

    test('renders single emoji at larger size', async ({ page }) => {
      await page.goto(`${STORY_BASE}--single-emoji&viewMode=story`);
      const emoji = page.locator('[class*="single-emoji"]').first();
      await expect(emoji).toBeVisible();
    });

    test('renders in dark theme', async ({ page }) => {
      await page.goto(`${STORY_BASE}--dark-theme&viewMode=story`);
      const bubble = page.locator('[class*="text-bubble"]').first();
      await expect(bubble).toBeVisible();
    });

    test('renders in RTL layout', async ({ page }) => {
      await page.goto(`${STORY_BASE}--rtl&viewMode=story`);
      const bubble = page.locator('[class*="text-bubble"]').first();
      await expect(bubble).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Truncation
  // ---------------------------------------------------------------------------

  test.describe('Truncation', () => {
    test('shows "Read more" button for long text', async ({ page }) => {
      await page.goto(`${STORY_BASE}--long-text&viewMode=story`);
      const readMore = page.locator('button', { hasText: 'Read more' });
      await expect(readMore).toBeVisible();
    });

    test('expands text on "Read more" click', async ({ page }) => {
      await page.goto(`${STORY_BASE}--long-text&viewMode=story`);
      const readMore = page.locator('button', { hasText: 'Read more' });
      await readMore.click();
      const showLess = page.locator('button', { hasText: 'Show less' });
      await expect(showLess).toBeVisible();
    });

    test('collapses text on "Show less" click', async ({ page }) => {
      await page.goto(`${STORY_BASE}--long-text&viewMode=story`);
      const readMore = page.locator('button', { hasText: 'Read more' });
      await readMore.click();
      const showLess = page.locator('button', { hasText: 'Show less' });
      await showLess.click();
      await expect(readMore).toBeVisible();
    });

    test('"Read more" button has correct aria-expanded', async ({ page }) => {
      await page.goto(`${STORY_BASE}--long-text&viewMode=story`);
      const readMore = page.locator('button', { hasText: 'Read more' });
      await expect(readMore).toHaveAttribute('aria-expanded', 'false');
      await readMore.click();
      const showLess = page.locator('button', { hasText: 'Show less' });
      await expect(showLess).toHaveAttribute('aria-expanded', 'true');
    });
  });

  // ---------------------------------------------------------------------------
  // Formatting
  // ---------------------------------------------------------------------------

  test.describe('Formatting', () => {
    test('renders URLs as clickable links', async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-urls&viewMode=story`);
      const link = page.locator('a.cometchat-link').first();
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href');
    });

    test('renders mention spans', async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-mentions&viewMode=story`);
      const mention = page.locator('.cometchat-mentions').first();
      await expect(mention).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Link Preview
  // ---------------------------------------------------------------------------

  test.describe('Link Preview', () => {
    test('renders link preview card', async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-link-preview&viewMode=story`);
      const preview = page.locator('[class*="link-preview"]').first();
      await expect(preview).toBeVisible();
    });

    test('link preview shows title', async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-link-preview&viewMode=story`);
      const title = page.locator('[class*="link-preview-title"]').first();
      await expect(title).toBeVisible();
    });

    test('link preview shows image', async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-link-preview&viewMode=story`);
      const image = page.locator('[class*="link-preview-image"]').first();
      await expect(image).toBeVisible();
    });

    test('link preview is keyboard accessible', async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-link-preview&viewMode=story`);
      const preview = page.locator('[class*="link-preview"][role="article"]').first();
      await expect(preview).toHaveAttribute('tabindex', '0');
    });
  });

  // ---------------------------------------------------------------------------
  // Translation
  // ---------------------------------------------------------------------------

  test.describe('Translation', () => {
    test('renders translated message section', async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-translation&viewMode=story`);
      const label = page.locator('text=Translated Message');
      await expect(label).toBeVisible();
    });

    test('shows both original and translated text', async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-translation&viewMode=story`);
      // Original text + translated text are in separate divs within the translation container
      const container = page.locator('[class*="translation-container"]').first();
      await expect(container).toBeVisible();
      // Should contain both the original and translated content
      const textBlocks = container.locator('div[class*="text"]');
      const count = await textBlocks.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------

  test.describe('Accessibility', () => {
    test('text content is selectable', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const text = page.locator('[class*="text-bubble__text"]').first();
      const userSelect = await text.evaluate(el => getComputedStyle(el).userSelect);
      expect(userSelect).toBe('text');
    });

    test('"Read more" button is keyboard focusable', async ({ page }) => {
      await page.goto(`${STORY_BASE}--long-text&viewMode=story`);
      const readMore = page.locator('button', { hasText: 'Read more' });
      await readMore.focus();
      await expect(readMore).toBeFocused();
    });
  });
});
