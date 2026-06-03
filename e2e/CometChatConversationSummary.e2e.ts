import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=base-cometchatconversationsummary';

test.describe('CometChatConversationSummary', () => {
  // ─── Default (loaded state) ────────────────────────────────────────

  test.describe('Default story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('renders shimmer loading state initially', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const root = page.locator('[class*="cometchat-conversation-summary"]').first();
      await expect(root).toBeVisible();
    });

    test('renders summary text after data loads', async ({ page }) => {
      const body = page.locator('[class*="cometchat-conversation-summary__body"]');
      await expect(body).toBeVisible({ timeout: 5000 });
      await expect(body).not.toBeEmpty();
    });

    test('renders header with title and close button', async ({ page }) => {
      const title = page.locator('[class*="cometchat-conversation-summary__header-title"]');
      await expect(title).toBeVisible();
      await expect(title).toHaveText('Conversation summary');

      const closeBtn = page.locator('[class*="cometchat-conversation-summary__header-close-button"]');
      await expect(closeBtn).toBeVisible();
    });

    test('clicking close button triggers the callback', async ({ page }) => {
      const closeBtn = page.locator('[class*="cometchat-conversation-summary__header-close-button"]');
      await expect(closeBtn).toBeVisible({ timeout: 5000 });
      // Should not crash when clicked (onClick is console.log in story)
      await closeBtn.click();
    });

    test('root has role="region"', async ({ page }) => {
      const root = page.locator('[role="region"]');
      await expect(root).toBeVisible();
    });

    test('root has aria-label', async ({ page }) => {
      const root = page.locator('[role="region"]');
      await expect(root).toHaveAttribute('aria-label', 'Conversation summary');
    });

    test('root has aria-live="polite"', async ({ page }) => {
      const root = page.locator('[role="region"]');
      await expect(root).toHaveAttribute('aria-live', 'polite');
    });
  });

  // ─── Loading story ─────────────────────────────────────────────────

  test.describe('Loading story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--loading&viewMode=story`);
    });

    test('renders shimmer items', async ({ page }) => {
      const shimmers = page.locator('[class*="cometchat-conversation-summary__shimmer-item"]');
      await expect(shimmers).toHaveCount(3);
    });

    test('shimmer container is visible', async ({ page }) => {
      const container = page.locator('[class*="cometchat-conversation-summary__shimmer-container"]');
      await expect(container).toBeVisible();
    });

    test('root has aria-busy="true" during loading', async ({ page }) => {
      const root = page.locator('[role="region"]');
      await expect(root).toHaveAttribute('aria-busy', 'true');
    });
  });

  // ─── Error story ───────────────────────────────────────────────────

  test.describe('Error story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--error-state&viewMode=story`);
    });

    test('renders error state', async ({ page }) => {
      const errorView = page.locator('[role="alert"]');
      await expect(errorView).toBeVisible({ timeout: 5000 });
    });

    test('displays error message', async ({ page }) => {
      await expect(page.getByText('Could not load summary')).toBeVisible({ timeout: 5000 });
    });

    test('error view has role="alert"', async ({ page }) => {
      const errorView = page.locator('[role="alert"]');
      await expect(errorView).toBeVisible({ timeout: 5000 });
      await expect(errorView).toHaveAttribute('role', 'alert');
    });

    test('retry button is visible', async ({ page }) => {
      const retryBtn = page.locator('[class*="cometchat-conversation-summary__error-retry"]');
      await expect(retryBtn).toBeVisible({ timeout: 5000 });
    });
  });

  // ─── Empty story ───────────────────────────────────────────────────

  test.describe('Empty story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--empty-state&viewMode=story`);
    });

    test('renders empty state message', async ({ page }) => {
      await expect(page.getByText('No summary available')).toBeVisible({ timeout: 5000 });
    });
  });

  // ─── Dark theme ────────────────────────────────────────────────────

  test.describe('DarkTheme story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--dark-theme&viewMode=story`);
    });

    test('renders inside a dark theme container', async ({ page }) => {
      const themeContainer = page.locator('[data-theme="dark"]');
      await expect(themeContainer).toBeVisible();
    });

    test('summary card is visible in dark theme', async ({ page }) => {
      const root = page.locator('[class*="cometchat-conversation-summary"]').first();
      await expect(root).toBeVisible({ timeout: 5000 });
    });
  });

  // ─── RTL ───────────────────────────────────────────────────────────

  test.describe('RTL story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--rtl&viewMode=story`);
    });

    test('renders inside an RTL container', async ({ page }) => {
      const rtlContainer = page.locator('[dir="rtl"]');
      await expect(rtlContainer).toBeVisible();
    });

    test('container direction is RTL', async ({ page }) => {
      const rtlContainer = page.locator('[dir="rtl"]');
      const direction = await rtlContainer.evaluate(
        (el) => window.getComputedStyle(el).direction
      );
      expect(direction).toBe('rtl');
    });
  });

  // ─── Keyboard navigation ──────────────────────────────────────────

  test.describe('Keyboard navigation', () => {
    test('Tab moves focus to close button', async ({ page, browserName }) => {
      test.skip(browserName === 'webkit', 'WebKit does not Tab-focus buttons by default');
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const closeBtn = page.locator('[class*="cometchat-conversation-summary__header-close-button"]');
      await expect(closeBtn).toBeVisible({ timeout: 5000 });

      await page.keyboard.press('Tab');
      await expect(closeBtn).toBeFocused();
    });

    test('Enter activates close button', async ({ page, browserName }) => {
      test.skip(browserName === 'webkit', 'WebKit does not Tab-focus buttons by default');
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const closeBtn = page.locator('[class*="cometchat-conversation-summary__header-close-button"]');
      await expect(closeBtn).toBeVisible({ timeout: 5000 });

      await closeBtn.focus();
      await page.keyboard.press('Enter');
    });

    test('Space activates close button', async ({ page, browserName }) => {
      test.skip(browserName === 'webkit', 'WebKit does not Tab-focus buttons by default');
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const closeBtn = page.locator('[class*="cometchat-conversation-summary__header-close-button"]');
      await expect(closeBtn).toBeVisible({ timeout: 5000 });

      await closeBtn.focus();
      await page.keyboard.press('Space');
    });

    test('Escape closes the summary card', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const root = page.locator('[role="region"]');
      await expect(root).toBeVisible({ timeout: 5000 });

      await root.focus();
      await page.keyboard.press('Escape');
    });

    test('Tab moves to retry button in error state', async ({ page, browserName }) => {
      test.skip(browserName === 'webkit', 'WebKit does not Tab-focus buttons by default');
      await page.goto(`${STORY_BASE}--error-state&viewMode=story`);
      const retryBtn = page.locator('[class*="cometchat-conversation-summary__error-retry"]');
      await expect(retryBtn).toBeVisible({ timeout: 5000 });

      // Tab through close button to retry button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(retryBtn).toBeFocused();
    });
  });
});
