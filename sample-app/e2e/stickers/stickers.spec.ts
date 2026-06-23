import { test, expect, Page } from '@playwright/test';
import { loginToApp, openStrategyChat } from '../helpers';

/**
 * E2E Tests — Stickers Keyboard (React)
 *
 * Tests the stickers keyboard component.
 * Stickers extension must be enabled on the CometChat dashboard.
 */

test.describe('Stickers Keyboard', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChat(page);
  });

  test('stickers button is present in composer', async () => {
    const stickersBtn = page.locator('.cometchat-message-composer__sticker-button').first();
    await expect(stickersBtn).toBeVisible({ timeout: 5_000 });
  });

  test('clicking stickers button opens stickers keyboard', async () => {
    const stickersBtn = page.locator('.cometchat-message-composer__sticker-button').first();
    await expect(stickersBtn).toBeVisible({ timeout: 5_000 });
    await stickersBtn.click();
    await page.waitForTimeout(1000);

    const stickersKeyboard = page.locator('.cometchat-stickers-keyboard, [class*="stickers-keyboard"]').first();
    await expect(stickersKeyboard).toBeVisible({ timeout: 5_000 });
  });

  test('stickers keyboard shows category tabs', async () => {
    const stickersBtn = page.locator('.cometchat-message-composer__sticker-button').first();
    await expect(stickersBtn).toBeVisible({ timeout: 5_000 });
    await stickersBtn.click();
    await page.waitForTimeout(1000);

    const stickersKeyboard = page.locator('.cometchat-stickers-keyboard, [class*="stickers-keyboard"]').first();
    await expect(stickersKeyboard).toBeVisible({ timeout: 5_000 });

    const categoryTabs = stickersKeyboard.locator('[class*="category"], [class*="tab"], [role="tab"]');
    const tabCount = await categoryTabs.count();
    expect(tabCount).toBeGreaterThan(0);
  });

  test('stickers grid displays sticker images', async () => {
    const stickersBtn = page.locator('.cometchat-message-composer__sticker-button').first();
    await expect(stickersBtn).toBeVisible({ timeout: 5_000 });
    await stickersBtn.click();
    await page.waitForTimeout(2000);

    const stickersKeyboard = page.locator('.cometchat-stickers-keyboard, [class*="stickers-keyboard"]').first();
    await expect(stickersKeyboard).toBeVisible({ timeout: 5_000 });

    const stickerItems = stickersKeyboard.locator('[class*="sticker-item"], img[class*="sticker"]');
    const count = await stickerItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking a sticker sends it as a message', async () => {
    // Count existing sticker bubbles before sending
    const stickerBubblesBefore = await page.locator('.cometchat-sticker-bubble, [class*="sticker-bubble"]').count();

    const stickersBtn = page.locator('.cometchat-message-composer__sticker-button').first();
    await expect(stickersBtn).toBeVisible({ timeout: 5_000 });
    await stickersBtn.click();
    await page.waitForTimeout(2000);

    const stickersKeyboard = page.locator('.cometchat-stickers-keyboard, [class*="stickers-keyboard"]').first();
    await expect(stickersKeyboard).toBeVisible({ timeout: 5_000 });

    const firstSticker = stickersKeyboard.locator('.cometchat-stickers-keyboard__sticker-item').first();
    await expect(firstSticker).toBeVisible({ timeout: 5_000 });
    await firstSticker.click();
    await page.waitForTimeout(3000);

    // A NEW sticker bubble should appear (count increased)
    const stickerBubblesAfter = await page.locator('.cometchat-sticker-bubble, [class*="sticker-bubble"]').count();
    expect(stickerBubblesAfter).toBeGreaterThan(stickerBubblesBefore);
  });

  test('clicking stickers button again closes the keyboard', async () => {
    const stickersBtn = page.locator('.cometchat-message-composer__sticker-button').first();
    await expect(stickersBtn).toBeVisible({ timeout: 5_000 });

    // Open
    await stickersBtn.click();
    await page.waitForTimeout(1000);
    const stickersKeyboard = page.locator('.cometchat-stickers-keyboard, [class*="stickers-keyboard"]').first();
    await expect(stickersKeyboard).toBeVisible({ timeout: 5_000 });

    // Close
    await stickersBtn.click();
    await page.waitForTimeout(500);
    await expect(stickersKeyboard).not.toBeVisible({ timeout: 3_000 });
  });

  test('pressing Escape closes stickers keyboard', async () => {
    const stickersBtn = page.locator('.cometchat-message-composer__sticker-button').first();
    await expect(stickersBtn).toBeVisible({ timeout: 5_000 });

    await stickersBtn.click();
    await page.waitForTimeout(1000);
    const stickersKeyboard = page.locator('.cometchat-stickers-keyboard, [class*="stickers-keyboard"]').first();
    await expect(stickersKeyboard).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await expect(stickersKeyboard).not.toBeVisible({ timeout: 3_000 });
  });
});
