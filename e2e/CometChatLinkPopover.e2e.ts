import { test, expect } from '@playwright/test';

test.describe('CometChatLinkPopover', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatlinkpopover--default&viewMode=story');
  });

  test('renders correctly with title, URL, and buttons', async ({ page }) => {
    await expect(page.getByText('Example Link')).toBeVisible();
    await expect(page.getByText('https://example.com')).toBeVisible();
    await expect(page.getByText('Edit')).toBeVisible();
    await expect(page.getByText('Remove')).toBeVisible();
  });

  test('Close button dismisses the popover', async ({ page }) => {
    const closeBtn = page.getByLabel('Close');
    await closeBtn.click();
    const showAgain = page.getByText('Show popover again');
    await expect(showAgain).toBeVisible();
  });

  test.describe('Keyboard navigation', () => {
    test('Escape closes the popover', async ({ page }) => {
      await expect(page.getByText('Example Link')).toBeVisible();
      // Wait for Edit button to be auto-focused
      const editBtn = page.getByLabel('Edit link');
      await expect(editBtn).toBeFocused();

      await page.keyboard.press('Escape');
      const showAgain = page.getByText('Show popover again');
      await expect(showAgain).toBeVisible();
    });

    test('Arrow keys navigate between Edit and Remove', async ({ page }) => {
      const editBtn = page.getByLabel('Edit link');
      const removeBtn = page.getByLabel('Remove link');

      // Wait for Edit button to be auto-focused
      await expect(editBtn).toBeFocused();

      // Arrow Down → Remove
      await page.keyboard.press('ArrowDown');
      await expect(removeBtn).toBeFocused();

      // Arrow Up → Edit
      await page.keyboard.press('ArrowUp');
      await expect(editBtn).toBeFocused();
    });

    test('Tab closes the popover', async ({ page }) => {
      const editBtn = page.getByLabel('Edit link');
      await expect(editBtn).toBeFocused();

      await page.keyboard.press('Tab');
      const showAgain = page.getByText('Show popover again');
      await expect(showAgain).toBeVisible();
    });

    test('Enter activates the focused button', async ({ page }) => {
      const editBtn = page.getByLabel('Edit link');
      await expect(editBtn).toBeFocused();

      await page.keyboard.press('Enter');
      // Popover stays open (onEdit doesn't close)
      await expect(page.getByText('Example Link')).toBeVisible();
    });
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatlinkpopover--dark-theme&viewMode=story');
    await expect(page.getByText('Example Link')).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto('/iframe.html?id=base-cometchatlinkpopover--rtl&viewMode=story');
    await expect(page.getByText('رابط المثال')).toBeVisible();
  });
});
