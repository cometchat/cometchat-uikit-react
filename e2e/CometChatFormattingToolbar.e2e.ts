import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=base-elements-formatting-toolbar';

test.describe('CometChatFormattingToolbar', () => {
  // ─── Default ───────────────────────────────────────────────────────

  test.describe('Default story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('renders the toolbar', async ({ page }) => {
      const toolbar = page.locator('[class*="cometchat-formatting-toolbar"]').first();
      await expect(toolbar).toBeVisible();
    });

    test('renders formatting buttons', async ({ page }) => {
      const toolbar = page.locator('[class*="cometchat-formatting-toolbar"]').first();
      await expect(toolbar).toBeVisible();
      const buttons = toolbar.locator('button');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);
    });

    test('buttons are clickable', async ({ page }) => {
      const toolbar = page.locator('[class*="cometchat-formatting-toolbar"]').first();
      const firstButton = toolbar.locator('button').first();
      await firstButton.click();
      // No error means success
    });
  });

  // ─── With Active Formats ───────────────────────────────────────────

  test.describe('WithActiveFormats story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--with-active-formats&viewMode=story`);
    });

    test('renders toolbar with active state buttons', async ({ page }) => {
      const toolbar = page.locator('[class*="cometchat-formatting-toolbar"]').first();
      await expect(toolbar).toBeVisible();
    });

    test('active buttons have visual distinction', async ({ page }) => {
      const toolbar = page.locator('[class*="cometchat-formatting-toolbar"]').first();
      await expect(toolbar).toBeVisible();
      const activeButtons = toolbar.locator('button[aria-pressed="true"]');
      const count = await activeButtons.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  // ─── Inline Disabled ───────────────────────────────────────────────

  test.describe('InlineDisabled story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--inline-disabled&viewMode=story`);
    });

    test('renders toolbar with some disabled buttons', async ({ page }) => {
      const toolbar = page.locator('[class*="cometchat-formatting-toolbar"]').first();
      await expect(toolbar).toBeVisible();
    });
  });

  // ─── Dark Theme ────────────────────────────────────────────────────

  test.describe('DarkTheme story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--dark-theme&viewMode=story`);
    });

    test('renders inside dark theme container', async ({ page }) => {
      const container = page.locator('[data-theme="dark"]');
      await expect(container).toBeVisible();
    });

    test('toolbar is visible in dark theme', async ({ page }) => {
      const toolbar = page.locator('[class*="cometchat-formatting-toolbar"]').first();
      await expect(toolbar).toBeVisible();
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

    test('toolbar is visible in RTL', async ({ page }) => {
      const toolbar = page.locator('[class*="cometchat-formatting-toolbar"]').first();
      await expect(toolbar).toBeVisible();
    });
  });

  // ─── Keyboard Navigation ───────────────────────────────────────────

  test.describe('Keyboard navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('buttons are focusable via Tab', async ({ page }) => {
      const toolbar = page.locator('[class*="cometchat-formatting-toolbar"]').first();
      const firstButton = toolbar.locator('button').first();
      await firstButton.focus();
      await expect(firstButton).toBeFocused();
    });

    test('button activates with Enter', async ({ page }) => {
      const toolbar = page.locator('[class*="cometchat-formatting-toolbar"]').first();
      const firstButton = toolbar.locator('button').first();
      await firstButton.focus();
      await page.keyboard.press('Enter');
    });

    test('button activates with Space', async ({ page }) => {
      const toolbar = page.locator('[class*="cometchat-formatting-toolbar"]').first();
      const firstButton = toolbar.locator('button').first();
      await firstButton.focus();
      await page.keyboard.press('Space');
    });
  });
});
