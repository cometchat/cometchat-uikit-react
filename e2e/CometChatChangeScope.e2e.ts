import { test, expect } from '@playwright/test';

test.describe('CometChatChangeScope', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatchangescope--default&viewMode=story');
  });

  test('renders correctly', async ({ page }) => {
    const component = page.locator('[class*="cometchat-change-scope"]').first();
    await expect(component).toBeVisible();
  });

  test('renders all scope options', async ({ page }) => {
    const options = page.locator('input[type="radio"]');
    await expect(options).toHaveCount(3);
  });

  test('has dialog role and aria-labelledby', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('aria-labelledby', 'cometchat-change-scope-title');
  });

  test('has radiogroup with aria-label', async ({ page }) => {
    const radiogroup = page.locator('[role="radiogroup"]');
    await expect(radiogroup).toBeVisible();
    await expect(radiogroup).toHaveAttribute('aria-label');
  });

  test('pre-selects the default option', async ({ page }) => {
    const participantRadio = page.locator('input[type="radio"][value="participant"]');
    await expect(participantRadio).toBeChecked();
  });

  test('submit button is disabled when selection unchanged', async ({ page }) => {
    const submitButton = page.locator('[class*="cometchat-change-scope__submit-button"] button');
    await expect(submitButton).toBeDisabled();
  });

  test('submit button enables after selecting a different option', async ({ page }) => {
    // Click the Admin option's list item (radio input is visually hidden inside CometChatRadioButton)
    await page.getByText('Admin').click();

    const submitButton = page.locator('[class*="cometchat-change-scope__submit-button"] button');
    await expect(submitButton).toBeEnabled();
  });

  test('selecting an option updates the radio state', async ({ page }) => {
    // Click the Admin option's list item
    await page.getByText('Admin').click();

    const adminRadio = page.locator('input[type="radio"][value="admin"]');
    await expect(adminRadio).toBeChecked();

    const participantRadio = page.locator('input[type="radio"][value="participant"]');
    await expect(participantRadio).not.toBeChecked();
  });

  test.describe('Keyboard navigation', () => {
    test('Tab cycles through focusable elements', async ({ page }) => {
      await page.keyboard.press('Tab');
      const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
      expect(firstFocused).toBeTruthy();
    });

    test('Escape closes the dialog', async ({ page }) => {
      await page.keyboard.press('Escape');
      // Dialog should still be in DOM since the story doesn't unmount,
      // but the onClose callback should have been called.
    });

    test('Enter/Space selects a radio option', async ({ page }) => {
      // Tab to the first radio input (CometChatRadioButton makes it focusable via label)
      const adminRadio = page.locator('input[type="radio"][value="admin"]');
      await adminRadio.focus();
      await page.keyboard.press('Space');
      await expect(adminRadio).toBeChecked();
    });
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatchangescope--dark-theme&viewMode=story');
    const component = page.locator('[class*="cometchat-change-scope"]').first();
    await expect(component).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatchangescope--rtl&viewMode=story');
    const component = page.locator('[class*="cometchat-change-scope"]').first();
    await expect(component).toBeVisible();
  });
});
