import { test, expect } from '@playwright/test';

test.describe('CometChatCollaborativeBubble — Whiteboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatcollaborativebubble--whiteboard-outgoing&viewMode=story');
    await page.waitForSelector('[class*="cometchat-collaborative-bubble"]');
  });

  test('renders whiteboard bubble with title, subtitle, and button', async ({ page }) => {
    const bubble = page.locator('[class*="cometchat-collaborative-bubble"]').first();
    await expect(bubble).toBeVisible();
    await expect(bubble).toContainText('Collaborative Whiteboard');
    await expect(bubble).toContainText('Open whiteboard to draw together');
    await expect(bubble).toContainText('Open Whiteboard');
  });

  test('renders banner image', async ({ page }) => {
    const banner = page.locator('[class*="cometchat-collaborative-bubble__banner-image"] img');
    await expect(banner).toBeVisible();
  });

  test('incoming variant renders correctly', async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatcollaborativebubble--whiteboard-incoming&viewMode=story');
    await page.waitForSelector('[class*="cometchat-collaborative-bubble--incoming"]');
    const bubble = page.locator('[class*="cometchat-collaborative-bubble--incoming"]');
    await expect(bubble).toBeVisible();
  });

  test.describe('Keyboard navigation', () => {
    test('button is focusable via click', async ({ page }) => {
      const button = page.locator('button[aria-label="Open Whiteboard"]');
      await button.click();
      await expect(button).toBeFocused();
    });

    test('focused button is enabled for Enter/Space activation', async ({ page }) => {
      const button = page.locator('button[aria-label="Open Whiteboard"]');
      await button.focus();
      await expect(button).toBeFocused();
      await expect(button).toBeEnabled();
    });
  });
});
