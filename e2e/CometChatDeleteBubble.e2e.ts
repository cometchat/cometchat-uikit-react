import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=core-components-bubbles-message-bubble-delete';

test.describe('CometChatDeleteBubble', () => {
  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  test.describe('Rendering', () => {
    test('renders outgoing and incoming deleted bubbles', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const bubbles = page.locator('[class*="delete-bubble"]');
      await expect(bubbles.first()).toBeVisible();
      const count = await bubbles.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test('renders outgoing deleted bubble with sender styling', async ({ page }) => {
      await page.goto(`${STORY_BASE}--outgoing&viewMode=story`);
      const bubble = page.locator('[class*="delete-bubble"][class*="sender"]').first();
      await expect(bubble).toBeVisible();
    });

    test('renders incoming deleted bubble with receiver styling', async ({ page }) => {
      await page.goto(`${STORY_BASE}--incoming&viewMode=story`);
      const bubble = page.locator('[class*="delete-bubble"][class*="receiver"]').first();
      await expect(bubble).toBeVisible();
    });

    test('renders delete icon', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const icon = page.locator('[class*="delete-bubble__icon"]').first();
      await expect(icon).toBeVisible();
    });

    test('renders "This message was deleted" text', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const text = page.locator('text=This message was deleted').first();
      await expect(text).toBeVisible();
    });

    test('renders custom text', async ({ page }) => {
      await page.goto(`${STORY_BASE}--custom-text&viewMode=story`);
      const text = page.locator('text=Message removed by admin');
      await expect(text).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Theme & Layout
  // ---------------------------------------------------------------------------

  test.describe('Theme & Layout', () => {
    test('renders in dark theme', async ({ page }) => {
      await page.goto(`${STORY_BASE}--dark-theme&viewMode=story`);
      const bubble = page.locator('[class*="delete-bubble"]').first();
      await expect(bubble).toBeVisible();
    });

    test('renders in RTL layout', async ({ page }) => {
      await page.goto(`${STORY_BASE}--rtl&viewMode=story`);
      const bubble = page.locator('[class*="delete-bubble"]').first();
      await expect(bubble).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------

  test.describe('Accessibility', () => {
    test('has role="status"', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const status = page.locator('[role="status"]').first();
      await expect(status).toBeVisible();
    });

    test('has aria-label on the bubble', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const bubble = page.locator('[role="status"]').first();
      const label = await bubble.getAttribute('aria-label');
      expect(label).toBeTruthy();
    });

    test('icon has aria-hidden="true"', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const icon = page.locator('[class*="delete-bubble__icon"]').first();
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
