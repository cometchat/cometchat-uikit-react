import { test, expect } from '@playwright/test';

test.describe('CometChatStickerBubble', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatstickerbubble--default&viewMode=story');
    await page.waitForSelector('[role="img"]');
  });

  test('renders sticker image', async ({ page }) => {
    const bubble = page.locator('[role="img"]');
    await expect(bubble).toBeVisible();
    const img = bubble.locator('img');
    await expect(img).toBeVisible();
  });

  test('has correct ARIA role and label', async ({ page }) => {
    const bubble = page.locator('[role="img"]');
    await expect(bubble).toBeVisible();
    await expect(bubble).toHaveAttribute('aria-label', 'Iron Man');
  });

  test('image has lazy loading attributes', async ({ page }) => {
    const img = page.locator('[role="img"] img');
    await expect(img).toHaveAttribute('loading', 'lazy');
    await expect(img).toHaveAttribute('decoding', 'async');
  });

  test('outgoing variant renders correctly', async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatstickerbubble--outgoing&viewMode=story');
    await page.waitForSelector('[role="img"]');
    const bubble = page.locator('[role="img"]');
    await expect(bubble).toBeVisible();
  });

  test('incoming variant renders correctly', async ({ page }) => {
    const bubble = page.locator('[role="img"]');
    await expect(bubble).toBeVisible();
  });

  test('empty URL renders no image', async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatstickerbubble--empty-url&viewMode=story');
    await page.waitForSelector('[role="img"]');
    const bubble = page.locator('[role="img"]');
    await expect(bubble).toBeVisible();
    const img = bubble.locator('img');
    await expect(img).toHaveCount(0);
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatstickerbubble--dark-theme&viewMode=story');
    await page.waitForSelector('[role="img"]');
    const bubble = page.locator('[role="img"]');
    await expect(bubble).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatstickerbubble--rtl&viewMode=story');
    await page.waitForSelector('[role="img"]');
    const bubbles = page.locator('[role="img"]');
    await expect(bubbles.first()).toBeVisible();
  });

  test.describe('Keyboard navigation', () => {
    test('sticker bubble is not interactive (role=img)', async ({ page }) => {
      const bubble = page.locator('[role="img"]');
      await expect(bubble).toBeVisible();
      const tabindex = await bubble.getAttribute('tabindex');
      expect(tabindex).toBeNull();
    });
  });
});
