import { test, expect } from '@playwright/test';

test.describe('CometChatRadioButton', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatradiobutton--default&viewMode=story');
  });

  test('renders correctly', async ({ page }) => {
    const root = page.locator('[class*="cometchat-radio-button"]').first();
    await expect(root).toBeVisible();
    const custom = page.locator('[class*="cometchat-radio-button__custom"]');
    await expect(custom).toBeVisible();
  });

  test('selects on click', async ({ page }) => {
    const input = page.getByRole('radio');
    const label = page.locator('[class*="cometchat-radio-button__label"]');
    await expect(input).not.toBeChecked();
    await label.click();
    await expect(input).toBeChecked();
  });

  test('displays label text', async ({ page }) => {
    const label = page.locator('[class*="cometchat-radio-button__text"]');
    await expect(label).toBeVisible();
    await expect(label).toHaveText('Option 1');
  });

  test('disabled radio button does not toggle', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=base-cometchatradiobutton--disabled-unchecked&viewMode=story'
    );
    const input = page.getByRole('radio');
    await expect(input).toBeDisabled();
  });

  test('disabled checked radio button stays checked', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=base-cometchatradiobutton--disabled-checked&viewMode=story'
    );
    const input = page.getByRole('radio');
    await expect(input).toBeChecked();
    await expect(input).toBeDisabled();
  });

  test.describe('Keyboard navigation', () => {
    test('Tab focuses the radio button', async ({ page }) => {
      await page.locator('body').click({ position: { x: 1, y: 1 } });
      await page.keyboard.press('Tab');
      const isFocused = await page.evaluate(() => {
        return document.activeElement?.getAttribute('type') === 'radio';
      });
      expect(isFocused).toBe(true);
    });

    test('Space selects the radio button', async ({ page }) => {
      const input = page.getByRole('radio');
      await input.focus();
      await expect(input).not.toBeChecked();
      await page.keyboard.press('Space');
      await expect(input).toBeChecked();
    });

    test('Arrow keys navigate between grouped radio buttons', async ({ page }) => {
      await page.goto(
        '/iframe.html?id=base-cometchatradiobutton--radio-group&viewMode=story'
      );
      const radios = page.getByRole('radio');
      const first = radios.nth(0);
      await first.focus();
      await expect(first).toBeChecked();

      // Arrow down should move to next radio in the group
      await page.keyboard.press('ArrowDown');
      const second = radios.nth(1);
      await expect(second).toBeChecked();
    });
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=base-cometchatradiobutton--dark-theme&viewMode=story'
    );
    const custom = page.locator('[class*="cometchat-radio-button__custom"]').first();
    await expect(custom).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatradiobutton--rtl&viewMode=story');
    const custom = page.locator('[class*="cometchat-radio-button__custom"]');
    await expect(custom).toBeVisible();
  });
});
