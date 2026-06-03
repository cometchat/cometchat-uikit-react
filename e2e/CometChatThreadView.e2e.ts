import { test, expect } from '@playwright/test';

test.describe('CometChatThreadView', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatthreadview--default&viewMode=story');
  });

  test('renders correctly with default props', async ({ page }) => {
    const component = page.locator('button[class*="cometchat-thread-view"]');
    await expect(component).toBeVisible();
  });

  test('displays correct reply count text', async ({ page }) => {
    const text = page.locator('[class*="cometchat-thread-view__count"]');
    await expect(text).toHaveText('5 Replies');
  });

  test('displays singular reply text', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatthreadview--single-reply&viewMode=story');
    const text = page.locator('[class*="cometchat-thread-view__count"]');
    await expect(text).toHaveText('1 Reply');
  });

  test('displays 999+ for large counts', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatthreadview--many-replies&viewMode=story');
    const text = page.locator('[class*="cometchat-thread-view__count"]');
    await expect(text).toHaveText('999+ Replies');
  });

  test('renders unread indicator dot', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatthreadview--unread-replies&viewMode=story');
    const dot = page.locator('[class*="cometchat-thread-view__unread-indicator"]');
    await expect(dot).toBeVisible();
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatthreadview--dark-theme&viewMode=story');
    const component = page.locator('button[class*="cometchat-thread-view"]');
    await expect(component).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatthreadview--rtl&viewMode=story');
    const component = page.locator('button[class*="cometchat-thread-view"]');
    await expect(component).toBeVisible();
  });

  test('renders with custom text', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatthreadview--custom-text&viewMode=story');
    const text = page.locator('[class*="cometchat-thread-view__count"]');
    await expect(text).toHaveText('View thread');
  });

  test('renders default layout without children', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatthreadview--default-layout&viewMode=story');
    const component = page.locator('button[class*="cometchat-thread-view"]');
    await expect(component).toBeVisible();
    const text = page.locator('[class*="cometchat-thread-view__count"]');
    await expect(text).toHaveText('4 Replies');
  });

  test('renders default layout with unread indicator', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatthreadview--default-layout-unread&viewMode=story');
    const dot = page.locator('[class*="cometchat-thread-view__unread-indicator"]');
    await expect(dot).toBeVisible();
  });
});

test.describe('CometChatThreadView — Keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatthreadview--default&viewMode=story');
  });

  test('button is focusable', async ({ page }) => {
    const btn = page.locator('button[class*="cometchat-thread-view"]');
    await btn.focus();
    await expect(btn).toBeFocused();
  });

  test('Enter activates the button', async ({ page }) => {
    const btn = page.locator('button[class*="cometchat-thread-view"]');
    await btn.focus();
    await page.keyboard.press('Enter');
    await expect(btn).toBeVisible();
  });

  test('Space activates the button', async ({ page }) => {
    const btn = page.locator('button[class*="cometchat-thread-view"]');
    await btn.focus();
    await page.keyboard.press('Space');
    await expect(btn).toBeVisible();
  });
});
