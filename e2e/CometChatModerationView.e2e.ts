import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=base-elements-moderation-view';

test.describe('CometChatModerationView', () => {
  // ─── Default ───────────────────────────────────────────────────────

  test.describe('Default story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
    });

    test('renders the moderation view', async ({ page }) => {
      const component = page.locator('[class*="cometchat-moderation-view"]').first();
      await expect(component).toBeVisible();
    });

    test('displays moderation message', async ({ page }) => {
      const component = page.locator('[class*="cometchat-moderation-view"]').first();
      const text = await component.textContent();
      expect(text!.length).toBeGreaterThan(0);
    });
  });

  // ─── Custom Message ────────────────────────────────────────────────

  test.describe('CustomMessage story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--custom-message&viewMode=story`);
    });

    test('renders with custom message text', async ({ page }) => {
      const component = page.locator('[class*="cometchat-moderation-view"]').first();
      await expect(component).toBeVisible();
    });
  });

  // ─── Long Message ──────────────────────────────────────────────────

  test.describe('LongMessage story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--long-message&viewMode=story`);
    });

    test('renders with long message without overflow', async ({ page }) => {
      const component = page.locator('[class*="cometchat-moderation-view"]').first();
      await expect(component).toBeVisible();
      const box = await component.boundingBox();
      // Should not be unreasonably wide
      expect(box!.width).toBeLessThan(800);
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

    test('component is visible in dark theme', async ({ page }) => {
      const component = page.locator('[class*="cometchat-moderation-view"]').first();
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
      const component = page.locator('[class*="cometchat-moderation-view"]').first();
      await expect(component).toBeVisible();
    });
  });
});
