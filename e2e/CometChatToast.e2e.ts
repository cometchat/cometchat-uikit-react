import { test, expect } from '@playwright/test';

test.describe('CometChatToast', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchattoast--default&viewMode=story');
  });

  test('renders correctly', async ({ page }) => {
    const toast = page.locator('[class*="cometchat-toast__text"]');
    await expect(toast).toBeVisible();
  });

  test('displays text content', async ({ page }) => {
    const text = page.locator('[class*="cometchat-toast__text"]');
    await expect(text).toBeVisible();
    await expect(text).toHaveText('This is a notification message');
  });

  test('close button dismisses the toast', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchattoast--with-close-button&viewMode=story');
    const closeBtn = page.getByRole('button', { name: 'Close notification' });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    const showAgain = page.getByText('Show toast again');
    await expect(showAgain).toBeVisible();
  });

  test('toast without close button has no close button', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=base-cometchattoast--without-close-button&viewMode=story'
    );
    const closeBtn = page.getByRole('button', { name: 'Close notification' });
    await expect(closeBtn).toHaveCount(0);
  });

  test.describe('Keyboard navigation', () => {
    test('Tab focuses the close button', async ({ page }) => {
      await page.locator('body').click({ position: { x: 1, y: 1 } });
      await page.keyboard.press('Tab');
      const isFocused = await page.evaluate(() => {
        return document.activeElement?.getAttribute('aria-label') === 'Close notification';
      });
      expect(isFocused).toBe(true);
    });

    test('Enter activates the close button', async ({ page }) => {
      await page.goto(
        '/iframe.html?id=base-cometchattoast--with-close-button&viewMode=story'
      );
      const closeBtn = page.getByRole('button', { name: 'Close notification' });
      await expect(closeBtn).toBeVisible();
      await closeBtn.focus();
      await page.keyboard.press('Enter');

      const showAgain = page.getByText('Show toast again');
      await expect(showAgain).toBeVisible();
    });

    test('Space activates the close button', async ({ page }) => {
      await page.goto(
        '/iframe.html?id=base-cometchattoast--with-close-button&viewMode=story'
      );
      const closeBtn = page.getByRole('button', { name: 'Close notification' });
      await expect(closeBtn).toBeVisible();
      await closeBtn.focus();
      await page.keyboard.press('Space');

      const showAgain = page.getByText('Show toast again');
      await expect(showAgain).toBeVisible();
    });

    test('Escape dismisses the toast', async ({ page }) => {
      await page.goto(
        '/iframe.html?id=base-cometchattoast--without-close-button&viewMode=story'
      );
      // Wait for the toast to be visible before pressing Escape
      const toastText = page.locator('[class*="cometchat-toast__text"]');
      await expect(toastText).toBeVisible();

      await page.keyboard.press('Escape');

      const showAgain = page.getByText('Show toast again');
      await expect(showAgain).toBeVisible();
    });
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchattoast--dark-theme&viewMode=story');
    const toast = page.locator('[class*="cometchat-toast__text"]').first();
    await expect(toast).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchattoast--rtl&viewMode=story');
    const toast = page.locator('[class*="cometchat-toast__text"]');
    await expect(toast).toBeVisible();
  });
});
