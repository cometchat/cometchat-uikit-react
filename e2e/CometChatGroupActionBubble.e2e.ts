import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=core-components-bubbles-message-bubble-group-action';

test.describe('CometChatGroupActionBubble', () => {
  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  test.describe('Rendering', () => {
    test('renders default group action bubble', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const bubble = page.locator('[class*="group-action-bubble"]');
      await expect(bubble.first()).toBeVisible();
    });

    test('renders all group action types', async ({ page }) => {
      await page.goto(`${STORY_BASE}--group-actions&viewMode=story`);
      const bubbles = page.locator('[class*="group-action-bubble"]');
      await expect(bubbles.first()).toBeVisible();
      const count = await bubbles.count();
      expect(count).toBeGreaterThanOrEqual(6);
    });

    test('renders call audio ended with icon', async ({ page }) => {
      await page.goto(`${STORY_BASE}--call-audio-ended&viewMode=story`);
      const icon = page.locator('[class*="group-action-bubble__icon"]').first();
      await expect(icon).toBeVisible();
    });

    test('renders call audio missed with error styling', async ({ page }) => {
      await page.goto(`${STORY_BASE}--call-audio-missed&viewMode=story`);
      const icon = page.locator('[class*="group-action-bubble__icon"]').first();
      await expect(icon).toBeVisible();
      const text = page.locator('text=Missed Voice Call');
      await expect(text).toBeVisible();
    });

    test('renders call video ended with icon', async ({ page }) => {
      await page.goto(`${STORY_BASE}--call-video-ended&viewMode=story`);
      const icon = page.locator('[class*="group-action-bubble__icon"]').first();
      await expect(icon).toBeVisible();
    });

    test('renders call audio initiated', async ({ page }) => {
      await page.goto(`${STORY_BASE}--call-audio-initiated&viewMode=story`);
      const text = page.locator('text=Outgoing Voice Call');
      await expect(text).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Theme & Layout
  // ---------------------------------------------------------------------------

  test.describe('Theme & Layout', () => {
    test('renders in dark theme', async ({ page }) => {
      await page.goto(`${STORY_BASE}--dark-theme&viewMode=story`);
      const bubble = page.locator('[class*="group-action-bubble"]').first();
      await expect(bubble).toBeVisible();
    });

    test('renders in RTL layout', async ({ page }) => {
      await page.goto(`${STORY_BASE}--rtl&viewMode=story`);
      const bubble = page.locator('[class*="group-action-bubble"]').first();
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

    test('has aria-label matching the message text', async ({ page }) => {
      await page.goto(`${STORY_BASE}--default&viewMode=story`);
      const bubble = page.locator('[role="status"]').first();
      await expect(bubble).toHaveAttribute('aria-label', 'Jane Smith joined');
    });

    test('icon has aria-hidden="true" when present', async ({ page }) => {
      await page.goto(`${STORY_BASE}--call-audio-ended&viewMode=story`);
      const icon = page.locator('[class*="group-action-bubble__icon"]').first();
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
