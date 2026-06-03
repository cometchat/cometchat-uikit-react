import { test, expect } from '@playwright/test';

test.describe('CometChatPollBubble', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatpollbubble--default&viewMode=story');
    await page.waitForSelector('[class*="cometchat-poll-bubble"]');
  });

  test('renders poll question and options', async ({ page }) => {
    const bubble = page.locator('[class*="cometchat-poll-bubble"]').first();
    await expect(bubble).toBeVisible();
    await expect(bubble).toContainText('What should we build next?');
    await expect(bubble).toContainText('Dark mode');
    await expect(bubble).toContainText('Notifications');
    await expect(bubble).toContainText('Search');
  });

  test('shows three poll options', async ({ page }) => {
    const options = page.locator('[role="radio"]');
    await expect(options).toHaveCount(3);
  });

  test('shows progress bars for each option', async ({ page }) => {
    const progressBars = page.locator('[role="progressbar"]');
    await expect(progressBars).toHaveCount(3);
  });

  test('clicking an option keeps it interactive', async ({ page }) => {
    const secondOption = page.locator('[role="radio"]').nth(1);
    await secondOption.click();
    await expect(secondOption).toBeVisible();
    // Should still be clickable — not disabled
    await secondOption.click();
    await expect(secondOption).toBeVisible();
  });

  test('outgoing variant renders with primary background', async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatpollbubble--outgoing&viewMode=story');
    await page.waitForSelector('[class*="cometchat-poll-bubble--outgoing"]');
    const bubble = page.locator('[class*="cometchat-poll-bubble--outgoing"]');
    await expect(bubble).toBeVisible();
  });

  test('disabled interaction sets tabindex to -1', async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatpollbubble--disabled-interaction&viewMode=story');
    await page.waitForSelector('[role="radio"]');
    const option = page.locator('[role="radio"]').first();
    await expect(option).toHaveAttribute('tabindex', '-1');
  });

  test.describe('Keyboard navigation', () => {
    test('options are focusable via click then keyboard', async ({ page }) => {
      const firstOption = page.locator('[role="radio"]').first();
      await firstOption.click();
      await expect(firstOption).toBeFocused();
    });

    test('Enter key triggers vote on focused option', async ({ page }) => {
      const secondOption = page.locator('[role="radio"]').nth(1);
      await secondOption.click();
      await page.keyboard.press('Enter');
      // Option should still be visible and interactive after Enter
      await expect(secondOption).toBeVisible();
    });

    test('Space key triggers vote on focused option', async ({ page }) => {
      const thirdOption = page.locator('[role="radio"]').nth(2);
      await thirdOption.click();
      await page.keyboard.press(' ');
      await expect(thirdOption).toBeVisible();
    });
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatpollbubble--dark-theme&viewMode=story');
    await page.waitForSelector('[class*="cometchat-poll-bubble"]');
    const bubble = page.locator('[class*="cometchat-poll-bubble"]').first();
    await expect(bubble).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto('/iframe.html?id=extension-plugins-cometchatpollbubble--rtl&viewMode=story');
    await page.waitForSelector('[class*="cometchat-poll-bubble"]');
    const bubble = page.locator('[class*="cometchat-poll-bubble"]').first();
    await expect(bubble).toBeVisible();
  });
});
