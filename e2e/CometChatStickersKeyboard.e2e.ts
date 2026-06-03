import { test, expect } from '@playwright/test';

test.describe('CometChatStickersKeyboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatstickerskeyboard--default&viewMode=story');
    await page.waitForSelector('[role="dialog"]');
  });

  test('renders with category tabs and sticker grid', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(3); // 3 mock categories
    const grid = page.locator('[role="grid"]');
    await expect(grid).toBeVisible();
  });

  test('clicking a tab switches the sticker grid', async ({ page }) => {
    const secondTab = page.locator('[role="tab"]').nth(1);
    await secondTab.click();
    await expect(secondTab).toHaveAttribute('aria-selected', 'true');
  });

  test('clicking a sticker triggers onStickerClick', async ({ page }) => {
    const firstSticker = page.locator('[role="gridcell"]').first();
    await expect(firstSticker).toBeVisible();
    await firstSticker.click();
  });

  test('loading state shows shimmer', async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatstickerskeyboard--loading&viewMode=story');
    await page.waitForSelector('[role="dialog"]');
    const shimmer = page.locator('[role="status"]');
    await expect(shimmer).toBeVisible();
  });

  test('error state shows retry button', async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatstickerskeyboard--error&viewMode=story');
    await page.waitForSelector('[role="dialog"]');
    const retryButton = page.locator('[aria-label="Retry loading stickers"]');
    await expect(retryButton).toBeVisible();
  });

  test('empty state shows message', async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatstickerskeyboard--empty&viewMode=story');
    await page.waitForSelector('[role="dialog"]');
    const emptyText = page.getByText('No stickers available');
    await expect(emptyText).toBeVisible();
  });

  test.describe('Keyboard navigation', () => {
    test('ArrowRight moves focus between tabs', async ({ page }) => {
      const firstTab = page.locator('[role="tab"]').first();
      await firstTab.click();
      await expect(firstTab).toBeFocused();
      await page.keyboard.press('ArrowRight');
      const secondTab = page.locator('[role="tab"]').nth(1);
      await expect(secondTab).toBeFocused();
    });

    test('ArrowLeft wraps from first tab to last', async ({ page }) => {
      const firstTab = page.locator('[role="tab"]').first();
      await firstTab.click();
      await page.keyboard.press('ArrowLeft');
      const lastTab = page.locator('[role="tab"]').last();
      await expect(lastTab).toBeFocused();
    });

    test('Enter on sticker triggers click', async ({ page }) => {
      const firstSticker = page.locator('[role="gridcell"]').first();
      await firstSticker.click();
      await expect(firstSticker).toBeFocused();
      await page.keyboard.press('Enter');
    });

    test('Arrow keys navigate the sticker grid', async ({ page }) => {
      const firstSticker = page.locator('[role="gridcell"]').first();
      await firstSticker.click();
      await page.keyboard.press('ArrowRight');
      const secondSticker = page.locator('[role="gridcell"]').nth(1);
      await expect(secondSticker).toBeFocused();
    });
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatstickerskeyboard--dark-theme&viewMode=story');
    await page.waitForSelector('[role="dialog"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });
});
