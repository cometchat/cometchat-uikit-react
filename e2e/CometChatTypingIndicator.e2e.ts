import { test, expect } from '@playwright/test';

test.describe('CometChatTypingIndicator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      '/iframe.html?id=base-cometchattypingindicator--default&viewMode=story'
    );
  });

  test('renders correctly with animated dots visible', async ({ page }) => {
    const root = page.locator('[class*="cometchat-typing-indicator__content"]');
    await expect(root).toBeVisible();

    const dotsContainer = page.locator('[class*="cometchat-typing-indicator__dots"]');
    const dots = dotsContainer.locator('> span');
    await expect(dots).toHaveCount(3);
  });

  test('displays correct text for 1-on-1 chat', async ({ page }) => {
    const text = page.locator('[class*="cometchat-typing-indicator__text"]');
    await expect(text).toHaveText('typing');
  });

  test('displays correct text for single user in group', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=base-cometchattypingindicator--single-user-group&viewMode=story'
    );
    const text = page.locator('[class*="cometchat-typing-indicator__text"]');
    await expect(text).toContainText('Bob');
    await expect(text).toContainText('is typing');
  });

  test('displays correct text for two users in group', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=base-cometchattypingindicator--two-users-group&viewMode=story'
    );
    const text = page.locator('[class*="cometchat-typing-indicator__text"]');
    await expect(text).toContainText('Alice');
    await expect(text).toContainText('Bob');
    await expect(text).toContainText('are typing');
  });

  test('displays correct text for multiple users in group', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=base-cometchattypingindicator--multiple-users-group&viewMode=story'
    );
    const text = page.locator('[class*="cometchat-typing-indicator__text"]');
    await expect(text).toHaveText('Multiple people are typing');
  });

  test('dots animate', async ({ page }) => {
    const dotsContainer = page.locator('[class*="cometchat-typing-indicator__dots"]');
    const dot = dotsContainer.locator('> span').first();
    const animationDuration = await dot.evaluate((el) => {
      return window.getComputedStyle(el).animationDuration;
    });
    // Animation duration should be non-zero (e.g., "1.4s"), not "0s"
    expect(animationDuration).not.toBe('0s');
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=base-cometchattypingindicator--dark-theme&viewMode=story'
    );
    const content = page.locator('[class*="cometchat-typing-indicator__content"]').first();
    await expect(content).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=base-cometchattypingindicator--rtl&viewMode=story'
    );
    const content = page.locator('[class*="cometchat-typing-indicator__content"]');
    await expect(content).toBeVisible();
  });
});
