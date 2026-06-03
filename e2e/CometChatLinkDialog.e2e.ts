import { test, expect } from '@playwright/test';

test.describe('CometChatLinkDialog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatlinkdialog--default&viewMode=story');
  });

  test('renders correctly with title, inputs, and buttons', async ({ page }) => {
    await expect(page.getByText('Add Link')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Text' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Link' })).toBeVisible();
    await expect(page.getByText('Cancel')).toBeVisible();
    await expect(page.getByText('Save')).toBeVisible();
  });

  test('Save button submits valid data and closes dialog', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Text' }).fill('My Link');
    await page.getByRole('textbox', { name: 'Link' }).fill('https://example.com');
    await page.getByText('Save').click();

    await expect(page.getByText('Show dialog again')).toBeVisible();
  });

  test('Cancel button closes the dialog', async ({ page }) => {
    await page.getByText('Cancel').click();
    await expect(page.getByText('Show dialog again')).toBeVisible();
  });

  test.describe('Keyboard navigation', () => {
    test('Escape closes the dialog', async ({ page }) => {
      await expect(page.getByText('Add Link')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByText('Show dialog again')).toBeVisible();
    });

    test('Enter in input submits the form', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Text' }).fill('My Link');
      await page.getByRole('textbox', { name: 'Link' }).fill('https://example.com');
      await page.getByRole('textbox', { name: 'Link' }).press('Enter');
      await expect(page.getByText('Show dialog again')).toBeVisible();
    });

    test('Tab cycles within the dialog (focus trap)', async ({ page }) => {
      const textInput = page.getByRole('textbox', { name: 'Text' });
      const urlInput = page.getByRole('textbox', { name: 'Link' });

      // Text input should be auto-focused
      await expect(textInput).toBeFocused();

      // Tab → URL input
      await page.keyboard.press('Tab');
      await expect(urlInput).toBeFocused();

      // Tab → Cancel button
      await page.keyboard.press('Tab');
      await expect(page.getByLabel('Cancel')).toBeFocused();

      // Tab → Save button
      await page.keyboard.press('Tab');
      await expect(page.getByLabel('Save')).toBeFocused();

      // Tab → wraps back to Text input (focus trap)
      await page.keyboard.press('Tab');
      await expect(textInput).toBeFocused();
    });
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatlinkdialog--dark-theme&viewMode=story');
    await expect(page.getByText('Add Link')).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatlinkdialog--rtl&viewMode=story');
    await expect(page.getByText('Add Link')).toBeVisible();
  });
});
