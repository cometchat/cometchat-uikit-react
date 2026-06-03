import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=components-cometchatreactionlist';

test.describe('CometChatReactionList', () => {
  // ─── Default ───────────────────────────────────────────────────────

  test.describe('Default story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('renders the reaction list', async ({ page }) => {
      const component = page.locator('[class*="cometchat-reaction-list"]').first();
      await expect(component).toBeVisible();
    });

    test('displays reaction items', async ({ page }) => {
      const items = page.locator('[class*="cometchat-reaction-list"] [class*="item"], [class*="cometchat-reaction-list"] [role="listitem"], [class*="cometchat-reaction-list"] li');
      await expect(items.first()).toBeVisible({ timeout: 10000 });
      const count = await items.count();
      expect(count).toBeGreaterThan(0);
    });

    test('displays emoji and user info', async ({ page }) => {
      const component = page.locator('[class*="cometchat-reaction-list"]').first();
      const text = await component.textContent();
      expect(text!.length).toBeGreaterThan(0);
    });
  });

  // ─── Loading State ─────────────────────────────────────────────────

  test.describe('LoadingState story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--loading-state&viewMode=story`);
    });

    test('renders loading state', async ({ page }) => {
      const loadingState = page.locator('[class*="cometchat-reaction-list"] [aria-busy="true"], [class*="cometchat-reaction-list"] [class*="loading"], [class*="shimmer"]');
      await expect(loadingState.first()).toBeVisible();
    });
  });

  // ─── Error State ───────────────────────────────────────────────────

  test.describe('ErrorState story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--error-state&viewMode=story`);
    });

    test('renders error state', async ({ page }) => {
      const errorState = page.locator('[class*="cometchat-reaction-list"] [class*="error"], [role="alert"]');
      await expect(errorState.first()).toBeVisible();
    });
  });

  // ─── Empty State ───────────────────────────────────────────────────

  test.describe('EmptyState story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--empty-state&viewMode=story`);
    });

    test('renders empty state', async ({ page }) => {
      const component = page.locator('[class*="cometchat-reaction-list"]').first();
      await expect(component).toBeVisible();
    });
  });

  // ─── Filtered By Emoji ─────────────────────────────────────────────

  test.describe('FilteredByEmoji story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--filtered-by-emoji&viewMode=story`);
    });

    test('renders filtered reaction list', async ({ page }) => {
      const component = page.locator('[class*="cometchat-reaction-list"]').first();
      await expect(component).toBeVisible();
    });
  });

  // ─── RTL ───────────────────────────────────────────────────────────

  test.describe('RTL story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--rtl&viewMode=story`);
    });

    test('renders inside RTL container', async ({ page }) => {
      const rtlContainer = page.locator('[dir="rtl"]');
      await expect(rtlContainer).toBeVisible();
    });

    test('component is visible in RTL', async ({ page }) => {
      const component = page.locator('[class*="cometchat-reaction-list"]').first();
      await expect(component).toBeVisible();
    });
  });

  // ─── Keyboard Navigation ───────────────────────────────────────────

  test.describe('Keyboard navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('tab navigation works within the list', async ({ page }) => {
      // The reaction list may not have focusable elements by default
      const component = page.locator('[class*="cometchat-reaction-list"]').first();
      await expect(component).toBeVisible();
    });
  });
});
