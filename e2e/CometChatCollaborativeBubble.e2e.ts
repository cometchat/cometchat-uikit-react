import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=components-misc-collaborative-bubble';

test.describe('CometChatCollaborativeBubble', () => {
  // ─── Document Outgoing ──────────────────────────────────────────────

  test.describe('DocumentOutgoing story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--document-outgoing&viewMode=story`);
    });

    test('renders the collaborative bubble', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-collaborative-bubble"]').first();
      await expect(bubble).toBeVisible();
    });

    test('displays document title', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-collaborative-bubble"]').first();
      await expect(bubble).toContainText(/document/i);
    });

    test('has a clickable open button', async ({ page }) => {
      const button = page.locator('[class*="cometchat-collaborative-bubble"] button, [class*="cometchat-collaborative-bubble"] a');
      await expect(button.first()).toBeVisible();
    });
  });

  // ─── Document Incoming ──────────────────────────────────────────────

  test.describe('DocumentIncoming story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--document-incoming&viewMode=story`);
    });

    test('renders the incoming document bubble', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-collaborative-bubble"]').first();
      await expect(bubble).toBeVisible();
    });
  });

  // ─── Whiteboard Outgoing ────────────────────────────────────────────

  test.describe('WhiteboardOutgoing story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--whiteboard-outgoing&viewMode=story`);
    });

    test('renders the whiteboard bubble', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-collaborative-bubble"]').first();
      await expect(bubble).toBeVisible();
    });

    test('displays whiteboard title', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-collaborative-bubble"]').first();
      await expect(bubble).toContainText(/whiteboard/i);
    });
  });

  // ─── Whiteboard Incoming ────────────────────────────────────────────

  test.describe('WhiteboardIncoming story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--whiteboard-incoming&viewMode=story`);
    });

    test('renders the incoming whiteboard bubble', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-collaborative-bubble"]').first();
      await expect(bubble).toBeVisible();
    });
  });

  // ─── Disabled ──────────────────────────────────────────────────────

  test.describe('Disabled story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--disabled&viewMode=story`);
    });

    test('renders the disabled bubble', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-collaborative-bubble"]').first();
      await expect(bubble).toBeVisible();
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

    test('bubble is visible in dark theme', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-collaborative-bubble"]').first();
      await expect(bubble).toBeVisible();
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

    test('bubble is visible in RTL', async ({ page }) => {
      const bubble = page.locator('[class*="cometchat-collaborative-bubble"]').first();
      await expect(bubble).toBeVisible();
    });
  });
});
