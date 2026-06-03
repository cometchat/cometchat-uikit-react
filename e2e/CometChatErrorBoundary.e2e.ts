import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=base-cometchaterrorboundary';

test.describe('CometChatErrorBoundary', () => {
  // ─── Default (no error) ────────────────────────────────────────────

  test.describe('Default story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('renders child content correctly when no error', async ({ page }) => {
      await expect(page.getByText('Child content rendered successfully.')).toBeVisible();
    });

    test('does not show fallback UI', async ({ page }) => {
      await expect(page.locator('[role="alert"]')).not.toBeVisible();
    });
  });

  // ─── Error state ───────────────────────────────────────────────────

  test.describe('ErrorState story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--error-state&viewMode=story`);
    });

    test('displays default fallback UI when error is triggered', async ({ page }) => {
      const alert = page.locator('[role="alert"]');
      await expect(alert).toBeVisible();
    });

    test('shows "Something went wrong" message', async ({ page }) => {
      const message = page.locator('[class*="cometchat-error-boundary__message"]');
      await expect(message).toBeVisible();
    });

    test('shows retry button', async ({ page }) => {
      const retryBtn = page.locator('[class*="cometchat-error-boundary__retry"]');
      await expect(retryBtn).toBeVisible();
    });

    test('fallback has role="alert" attribute', async ({ page }) => {
      const alert = page.locator('[role="alert"]');
      await expect(alert).toHaveAttribute('aria-live', 'assertive');
    });
  });

  // ─── Custom fallback ──────────────────────────────────────────────

  test.describe('CustomFallback story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--custom-fallback&viewMode=story`);
    });

    test('custom fallback view renders when provided', async ({ page }) => {
      await expect(page.getByText(/Custom error in MessageBubble/)).toBeVisible();
    });

    test('custom fallback has a retry button', async ({ page }) => {
      await expect(page.getByText('Try Again')).toBeVisible();
    });
  });

  // ─── Nested boundaries ────────────────────────────────────────────

  test.describe('NestedBoundaries story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--nested-boundaries&viewMode=story`);
    });

    test('inner error does not affect outer boundary', async ({ page }) => {
      // ChildA and ChildC render normally
      const successTexts = page.getByText('Child content rendered successfully.');
      await expect(successTexts).toHaveCount(2);

      // ChildB shows error fallback
      const alert = page.locator('[role="alert"]');
      await expect(alert).toBeVisible();
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

    test('fallback is visible in dark theme', async ({ page }) => {
      const alert = page.locator('[role="alert"]');
      await expect(alert).toBeVisible();
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
    test('Tab focuses the retry button', async ({ page, browserName }) => {
      test.skip(browserName === 'webkit', 'WebKit does not Tab-focus buttons by default');
      await page.goto(`${STORY_BASE}--error-state&viewMode=story`);
      const retryBtn = page.locator('[class*="cometchat-error-boundary__retry"]');
      await expect(retryBtn).toBeVisible();

      await page.keyboard.press('Tab');
      await expect(retryBtn).toBeFocused();
    });

    test('Enter activates the retry button', async ({ page, browserName }) => {
      test.skip(browserName === 'webkit', 'WebKit does not Tab-focus buttons by default');
      await page.goto(`${STORY_BASE}--error-state&viewMode=story`);
      const retryBtn = page.locator('[class*="cometchat-error-boundary__retry"]');
      await expect(retryBtn).toBeVisible();

      await retryBtn.focus();
      await page.keyboard.press('Enter');
    });

    test('Space activates the retry button', async ({ page, browserName }) => {
      test.skip(browserName === 'webkit', 'WebKit does not Tab-focus buttons by default');
      await page.goto(`${STORY_BASE}--error-state&viewMode=story`);
      const retryBtn = page.locator('[class*="cometchat-error-boundary__retry"]');
      await expect(retryBtn).toBeVisible();

      await retryBtn.focus();
      await page.keyboard.press('Space');
    });
  });
});
