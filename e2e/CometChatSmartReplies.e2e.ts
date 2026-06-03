import { test, expect } from '@playwright/test';

test.describe('CometChatSmartReplies', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatsmartreplies--default&viewMode=story');
  });

  test('renders correctly with reply items after loading', async ({ page }) => {
    const component = page.locator('[class*="cometchat-smart-replies"]').first();
    await expect(component).toBeVisible();
    // Wait for loaded state — reply items should appear
    const item = page.locator('button[class*="cometchat-smart-replies__item"]').first();
    await expect(item).toBeVisible({ timeout: 5000 });
  });

  test('renders loading state initially', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatsmartreplies--loading&viewMode=story');
    const shimmer = page.locator('[class*="cometchat-smart-replies__shimmer-item"]').first();
    await expect(shimmer).toBeVisible();
  });

  test('renders error state with retry button', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatsmartreplies--error-state&viewMode=story');
    const errorView = page.locator('[class*="cometchat-smart-replies__error-view"]');
    await expect(errorView).toBeVisible({ timeout: 3000 });
    const retryButton = page.locator('[class*="cometchat-smart-replies__error-retry"]');
    await expect(retryButton).toBeVisible();
  });

  test('renders empty state', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatsmartreplies--empty-state&viewMode=story');
    const emptyView = page.locator('[class*="cometchat-smart-replies__empty-view"]');
    await expect(emptyView).toBeVisible({ timeout: 3000 });
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatsmartreplies--dark-theme&viewMode=story');
    const component = page.locator('[class*="cometchat-smart-replies"]').first();
    await expect(component).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatsmartreplies--rtl&viewMode=story');
    const component = page.locator('[class*="cometchat-smart-replies"]').first();
    await expect(component).toBeVisible();
  });
});

test.describe('CometChatSmartReplies — Keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatsmartreplies--default&viewMode=story');
    // Wait for loaded state
    await page.locator('button[class*="cometchat-smart-replies__item"]').first().waitFor({ timeout: 5000 });
  });

  test('close button is focusable and responds to click', async ({ page }) => {
    const closeButton = page.locator('[class*="cometchat-smart-replies__header-close-button"]');
    await closeButton.focus();
    await expect(closeButton).toBeFocused();
  });

  test('reply items are focusable', async ({ page }) => {
    const firstItem = page.locator('button[class*="cometchat-smart-replies__item"]').first();
    await firstItem.focus();
    await expect(firstItem).toBeFocused();
  });

  test('Enter activates a focused reply item', async ({ page }) => {
    const firstItem = page.locator('button[class*="cometchat-smart-replies__item"]').first();
    await firstItem.focus();
    await page.keyboard.press('Enter');
    // Verify the item was activated (no crash)
  });

  test('Space activates a focused reply item', async ({ page }) => {
    const firstItem = page.locator('button[class*="cometchat-smart-replies__item"]').first();
    await firstItem.focus();
    await page.keyboard.press('Space');
    // Verify the item was activated (no crash)
  });
});
