import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=components-calls-cometchat-ongoing-call';

test.describe('CometChatOngoingCall', () => {
  // NOTE: CometChatOngoingCall requires the Calls SDK with a valid session.
  // Storybook stories render static placeholders to show the container structure.

  // ─── Placeholder ───────────────────────────────────────────────────

  test.describe('Placeholder story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--placeholder&viewMode=story`);
    });

    test('renders the placeholder container', async ({ page }) => {
      const container = page.locator('div').first();
      await expect(container).toBeVisible();
    });

    test('container takes full viewport', async ({ page }) => {
      const container = page.locator('div').first();
      const box = await container.boundingBox();
      expect(box!.width).toBeGreaterThan(300);
      expect(box!.height).toBeGreaterThan(300);
    });

    test('displays placeholder text', async ({ page }) => {
      const text = page.locator('text=Ongoing Call');
      await expect(text).toBeVisible();
    });
  });

  // ─── Audio Only ────────────────────────────────────────────────────

  test.describe('AudioOnly story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--audio-only&viewMode=story`);
    });

    test('renders audio-only placeholder', async ({ page }) => {
      const container = page.locator('div').first();
      await expect(container).toBeVisible();
    });
  });

  // ─── Direct Calling ────────────────────────────────────────────────

  test.describe('DirectCalling story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_BASE}--direct-calling&viewMode=story`);
    });

    test('renders direct calling placeholder', async ({ page }) => {
      const container = page.locator('div').first();
      await expect(container).toBeVisible();
    });
  });
});
