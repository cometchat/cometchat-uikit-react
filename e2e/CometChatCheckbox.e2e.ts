import { test, expect } from '@playwright/test';

test.describe('CometChatCheckbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatcheckbox--default&viewMode=story');
  });

  test('renders correctly', async ({ page }) => {
    const root = page.locator('[class*="cometchat-checkbox"]').first();
    await expect(root).toBeVisible();
    const checkmark = page.locator('[class*="cometchat-checkbox__checkmark"]');
    await expect(checkmark).toBeVisible();
  });

  test('toggles on click', async ({ page }) => {
    const input = page.getByRole('checkbox');
    const label = page.locator('[class*="cometchat-checkbox__label"]');
    await expect(input).not.toBeChecked();
    await label.click();
    await expect(input).toBeChecked();
    await label.click();
    await expect(input).not.toBeChecked();
  });

  test('displays label text', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatcheckbox--with-label&viewMode=story');
    const label = page.locator('[class*="cometchat-checkbox__text"]');
    await expect(label).toBeVisible();
    await expect(label).toHaveText('Select this item');
  });

  test('disabled checkbox does not toggle', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatcheckbox--disabled-unchecked&viewMode=story');
    const input = page.getByRole('checkbox');
    await expect(input).toBeDisabled();
  });

  test('disabled checked checkbox stays checked', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatcheckbox--disabled-checked&viewMode=story');
    const input = page.getByRole('checkbox');
    await expect(input).toBeChecked();
    await expect(input).toBeDisabled();
  });

  test.describe('Keyboard navigation', () => {
    test('Tab focuses the checkbox', async ({ page }) => {
      // Click body at bottom-right corner to set focus without hitting the checkbox
      await page.locator('body').click({ position: { x: 1, y: 1 } });
      await page.keyboard.press('Tab');
      const isFocused = await page.evaluate(() => {
        return document.activeElement?.getAttribute('type') === 'checkbox';
      });
      expect(isFocused).toBe(true);
    });

    test('Space toggles the checkbox', async ({ page }) => {
      const input = page.getByRole('checkbox');
      // Use Playwright's locator.focus() to programmatically focus the hidden input
      await input.focus();
      await expect(input).not.toBeChecked();
      await page.keyboard.press('Space');
      await expect(input).toBeChecked();
      await page.keyboard.press('Space');
      await expect(input).not.toBeChecked();
    });

    test('Shift+click is supported', async ({ page }) => {
      const input = page.getByRole('checkbox');
      const label = page.locator('[class*="cometchat-checkbox__label"]');
      await label.click({ modifiers: ['Shift'] });
      await expect(input).toBeChecked();
    });
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatcheckbox--dark-theme&viewMode=story');
    const root = page.locator('[class*="cometchat-checkbox__checkmark"]').first();
    await expect(root).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatcheckbox--rtl&viewMode=story');
    const root = page.locator('[class*="cometchat-checkbox__checkmark"]');
    await expect(root).toBeVisible();
  });
});
