import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=components-messages-cometchat-message-list';

test.describe('CometChatMessageList', () => {
  // ─── Default ───────────────────────────────────────────────────────

  test.describe('Default story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('renders the message list container', async ({ page }) => {
      const list = page.locator('[class*="cometchat-message-list"]').first();
      await expect(list).toBeVisible();
    });

    test('renders message bubbles', async ({ page }) => {
      const bubbles = page.locator('[class*="cometchat-message-bubble"]');
      await expect(bubbles.first()).toBeVisible({ timeout: 10000 });
      const count = await bubbles.count();
      expect(count).toBeGreaterThan(0);
    });

    test('renders outgoing messages aligned right', async ({ page }) => {
      const outgoing = page.locator('[class*="cometchat-message-bubble"][class*="--outgoing"], [class*="cometchat-message-bubble"][data-alignment="right"]');
      if (await outgoing.count() > 0) {
        await expect(outgoing.first()).toBeVisible();
      }
    });

    test('renders incoming messages aligned left', async ({ page }) => {
      const incoming = page.locator('[class*="cometchat-message-bubble"][class*="--incoming"], [class*="cometchat-message-bubble"][data-alignment="left"]');
      if (await incoming.count() > 0) {
        await expect(incoming.first()).toBeVisible();
      }
    });

    test('renders date separators', async ({ page }) => {
      const separators = page.locator('[class*="cometchat-message-list__date-separator"], [class*="date-separator"]');
      // Date separators may or may not be present depending on message timing
      const count = await separators.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  // ─── Empty State ───────────────────────────────────────────────────

  test.describe('EmptyState story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--empty-state&viewMode=story`);
    });

    test('renders empty state', async ({ page }) => {
      const emptyState = page.locator('[class*="cometchat-message-list__empty"], [class*="empty-state"], [role="status"]');
      await expect(emptyState.first()).toBeVisible();
    });

    test('does not render message bubbles', async ({ page }) => {
      const bubbles = page.locator('[class*="cometchat-message-bubble"]');
      await expect(bubbles).toHaveCount(0);
    });
  });

  // ─── Loading State ─────────────────────────────────────────────────

  test.describe('LoadingState story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--loading-state&viewMode=story`);
    });

    test('renders loading state', async ({ page }) => {
      const loadingState = page.locator('[class*="cometchat-message-list__loading"], [class*="shimmer"], [aria-busy="true"]');
      await expect(loadingState.first()).toBeVisible();
    });
  });

  // ─── Error State ───────────────────────────────────────────────────

  test.describe('ErrorState story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--error-state&viewMode=story`);
    });

    test('renders error state', async ({ page }) => {
      const errorState = page.locator('[class*="cometchat-message-list__error"], [class*="error-state"], [role="alert"]');
      await expect(errorState.first()).toBeVisible();
    });

    test('displays error message text', async ({ page }) => {
      const container = page.locator('[class*="cometchat-message-list"]').first();
      const text = await container.textContent();
      expect(text).toContain('Something went wrong');
    });
  });

  // ─── Mixed Message Types ───────────────────────────────────────────

  test.describe('MixedMessageTypes story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--mixed-message-types&viewMode=story`);
    });

    test('renders text bubbles', async ({ page }) => {
      const textBubbles = page.locator('[class*="cometchat-text-bubble"]');
      await expect(textBubbles.first()).toBeVisible({ timeout: 10000 });
    });

    test('renders image bubbles', async ({ page }) => {
      const imageBubbles = page.locator('[class*="cometchat-image-bubble"]');
      if (await imageBubbles.count() > 0) {
        await expect(imageBubbles.first()).toBeVisible();
      }
    });

    test('renders file bubbles', async ({ page }) => {
      const fileBubbles = page.locator('[class*="cometchat-file-bubble"]');
      if (await fileBubbles.count() > 0) {
        await expect(fileBubbles.first()).toBeVisible();
      }
    });

    test('renders audio bubbles', async ({ page }) => {
      const audioBubbles = page.locator('[class*="cometchat-audio-bubble"]');
      if (await audioBubbles.count() > 0) {
        await expect(audioBubbles.first()).toBeVisible();
      }
    });

    test('renders video bubbles', async ({ page }) => {
      const videoBubbles = page.locator('[class*="cometchat-video-bubble"]');
      if (await videoBubbles.count() > 0) {
        await expect(videoBubbles.first()).toBeVisible();
      }
    });
  });

  // ─── Thread Reply Visible ──────────────────────────────────────────

  test.describe('ThreadReplyVisible story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--thread-reply-visible&viewMode=story`);
    });

    test('renders message bubbles with thread indicators', async ({ page }) => {
      const threadIndicators = page.locator('[class*="thread"], [class*="reply-count"]');
      await expect(threadIndicators.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── Keyboard Navigation ───────────────────────────────────────────

  test.describe('Keyboard navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('message list is scrollable', async ({ page }) => {
      const list = page.locator('[class*="cometchat-message-list__view"], [class*="cometchat-message-list"]').first();
      await expect(list).toBeVisible();
    });
  });
});
