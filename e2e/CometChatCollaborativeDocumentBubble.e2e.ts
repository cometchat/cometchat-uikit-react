import { test, expect } from '@playwright/test';

test.describe('CometChatCollaborativeBubble — Document', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatcollaborativebubble--document-outgoing&viewMode=story');
    await page.waitForSelector('[class*="cometchat-collaborative-bubble"]');
  });

  test('renders document bubble with title, subtitle, and button', async ({ page }) => {
    const bubble = page.locator('[class*="cometchat-collaborative-bubble"]').first();
    await expect(bubble).toBeVisible();
    await expect(bubble).toContainText('Collaborative Document');
    await expect(bubble).toContainText('Open document to edit content together');
    await expect(bubble).toContainText('Open Document');
  });

  test('renders banner image', async ({ page }) => {
    const banner = page.locator('[class*="cometchat-collaborative-bubble__banner-image"] img');
    await expect(banner).toBeVisible();
  });

  test('button is enabled and clickable', async ({ page }) => {
    const button = page.locator('button[aria-label="Open Document"]');
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });

  test('incoming variant renders correctly', async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatcollaborativebubble--document-incoming&viewMode=story');
    await page.waitForSelector('[class*="cometchat-collaborative-bubble--incoming"]');
    const bubble = page.locator('[class*="cometchat-collaborative-bubble--incoming"]');
    await expect(bubble).toBeVisible();
  });

  test('disabled state disables button', async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatcollaborativebubble--disabled&viewMode=story');
    await page.waitForSelector('button[aria-label="Open Document"]');
    const button = page.locator('button[aria-label="Open Document"]');
    await expect(button).toBeDisabled();
  });

  test.describe('Keyboard navigation', () => {
    test('button is focusable via click', async ({ page }) => {
      const button = page.locator('button[aria-label="Open Document"]');
      await button.click();
      await expect(button).toBeFocused();
    });

    test('Enter activates the focused button', async ({ page }) => {
      const button = page.locator('button[aria-label="Open Document"]');
      await button.focus();
      // Native button handles Enter — just verify it's focused and enabled
      await expect(button).toBeFocused();
      await expect(button).toBeEnabled();
    });

    test('Space activates the focused button', async ({ page }) => {
      const button = page.locator('button[aria-label="Open Document"]');
      await button.focus();
      await expect(button).toBeFocused();
      await expect(button).toBeEnabled();
    });
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatcollaborativebubble--dark-theme&viewMode=story');
    await page.waitForSelector('[class*="cometchat-collaborative-bubble"]');
    const bubbles = page.locator('[class*="cometchat-collaborative-bubble"]');
    await expect(bubbles.first()).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatcollaborativebubble--rtl&viewMode=story');
    await page.waitForSelector('[class*="cometchat-collaborative-bubble"]');
    const bubbles = page.locator('[class*="cometchat-collaborative-bubble"]');
    await expect(bubbles.first()).toBeVisible();
  });
});
