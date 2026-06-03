import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=components-cometchatusers';

/** Navigate to a story and wait for the component to render. */
async function gotoStory(page: import('@playwright/test').Page, storyName: string) {
  await page.goto(`${STORY_BASE}--${storyName}&viewMode=story`);
  await page.waitForSelector('[class*="cometchat-users"]', { timeout: 10_000 });
}

test.describe('CometChatUsers', () => {
  // ─── Default Story ──────────────────────────────────────────────

  test.describe('Default story', () => {
    test.beforeEach(async ({ page }) => {
      await gotoStory(page, 'default');
    });

    test('renders the users list', async ({ page }) => {
      const list = page.locator('[role="listbox"]');
      await expect(list).toBeVisible();
    });

    test('renders user items', async ({ page }) => {
      const items = page.locator('[role="option"]');
      await expect(items.first()).toBeVisible();
      const count = await items.count();
      expect(count).toBeGreaterThan(0);
    });

    test('renders section headers', async ({ page }) => {
      // Section headers use role="presentation" with aria-hidden
      const headers = page.locator('[class*="section-header"]');
      await expect(headers.first()).toBeVisible();
    });

    test('renders user names', async ({ page }) => {
      await expect(page.getByText('Alice Johnson')).toBeVisible();
    });

    test('renders user avatars', async ({ page }) => {
      const avatars = page.locator('[class*="cometchat-avatar"]');
      await expect(avatars.first()).toBeVisible();
    });
  });

  // ─── Loading State ──────────────────────────────────────────────

  test.describe('Loading state story', () => {
    test.beforeEach(async ({ page }) => {
      await gotoStory(page, 'loading-state');
    });

    test('renders shimmer items', async ({ page }) => {
      const shimmers = page.locator('[class*="shimmer-item"]');
      await expect(shimmers.first()).toBeVisible();
      const count = await shimmers.count();
      expect(count).toBeGreaterThan(5);
    });

    test('has aria-busy attribute', async ({ page }) => {
      const loading = page.locator('[aria-busy="true"]');
      await expect(loading).toBeVisible();
    });
  });

  // ─── Empty State ──────────────────────────────────────────────

  test.describe('Empty state story', () => {
    test.beforeEach(async ({ page }) => {
      await gotoStory(page, 'empty-state');
    });

    test('renders empty state message', async ({ page }) => {
      await expect(page.getByText('No Users', { exact: true })).toBeVisible();
    });

    test('has role="status"', async ({ page }) => {
      const status = page.locator('[role="status"]');
      await expect(status).toBeVisible();
    });
  });

  // ─── Error State ──────────────────────────────────────────────

  test.describe('Error state story', () => {
    test.beforeEach(async ({ page }) => {
      await gotoStory(page, 'error-state');
    });

    test('renders error state message', async ({ page }) => {
      await expect(page.getByText('Something went wrong')).toBeVisible();
    });
  });

  // ─── Single Selection ──────────────────────────────────────────────

  test.describe('Single selection story', () => {
    test.beforeEach(async ({ page }) => {
      await gotoStory(page, 'single-selection');
    });

    test('renders radio buttons', async ({ page }) => {
      // CometChatRadioButton wraps the input in a label — look for the component wrapper
      const radios = page.locator('[class*="cometchat-radio-button"]');
      await expect(radios.first()).toBeVisible();
    });

    test('has a selected radio button', async ({ page }) => {
      // The checked radio input has aria-checked="true"
      const checked = page.locator('input[type="radio"][aria-checked="true"]');
      await expect(checked).toHaveCount(1);
    });
  });

  // ─── Multiple Selection ──────────────────────────────────────────────

  test.describe('Multiple selection story', () => {
    test.beforeEach(async ({ page }) => {
      await gotoStory(page, 'multiple-selection');
    });

    test('renders checkboxes', async ({ page }) => {
      // CometChatCheckbox wraps the input — look for the component wrapper
      const checkboxes = page.locator('[class*="cometchat-checkbox"]');
      await expect(checkboxes.first()).toBeVisible();
    });

    test('renders selected users preview', async ({ page }) => {
      const preview = page.locator('[class*="selected-preview"]').first();
      await expect(preview).toBeVisible();
    });

    test('renders chips for selected users', async ({ page }) => {
      // Use a more specific selector that matches only the chip container, not its children
      const chips = page.locator('[class*="selected-preview-chip"]:not([class*="selected-preview-chip-"])');
      const count = await chips.count();
      expect(count).toBe(3);
    });

    test('chip close buttons have aria-label', async ({ page }) => {
      const closeBtn = page.locator('button[aria-label*="Remove"]').first();
      await expect(closeBtn).toBeVisible();
    });
  });

  // ─── Keyboard Navigation ──────────────────────────────────────────────

  test.describe('Keyboard navigation', () => {
    test.beforeEach(async ({ page }) => {
      await gotoStory(page, 'default');
    });

    test('Tab focuses the first interactive element', async ({ page }) => {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    });

    test('Enter activates a focused user item', async ({ page }) => {
      const firstItem = page.locator('[role="option"]').first();
      await firstItem.focus();
      await page.keyboard.press('Enter');
      // Item should still be visible (no navigation away)
      await expect(firstItem).toBeVisible();
    });

    test('Space activates a focused user item', async ({ page }) => {
      const firstItem = page.locator('[role="option"]').first();
      await firstItem.focus();
      await page.keyboard.press('Space');
      await expect(firstItem).toBeVisible();
    });
  });

  // ─── Dark Theme ──────────────────────────────────────────────

  test.describe('Dark theme story', () => {
    test.beforeEach(async ({ page }) => {
      await gotoStory(page, 'dark-theme');
    });

    test('renders correctly in dark theme', async ({ page }) => {
      const darkContainer = page.locator('[data-theme="dark"]');
      await expect(darkContainer).toBeVisible();
      const list = page.locator('[role="listbox"]');
      await expect(list).toBeVisible();
    });
  });

  // ─── RTL ──────────────────────────────────────────────

  test.describe('RTL story', () => {
    test.beforeEach(async ({ page }) => {
      await gotoStory(page, 'rtl');
    });

    test('renders correctly in RTL', async ({ page }) => {
      const rtlContainer = page.locator('[dir="rtl"]');
      await expect(rtlContainer).toBeVisible();
      const list = page.locator('[role="listbox"]');
      await expect(list).toBeVisible();
    });
  });
});
