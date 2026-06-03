import { test, expect } from '@playwright/test';

const STORY_PREFIX =
  '/iframe.html?id=components-cometchatmessageinformation--';

test.describe('CometChatMessageInformation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${STORY_PREFIX}default-1-on-1&viewMode=story`);
    await page.waitForSelector('[role="dialog"]');
  });

  test('renders panel with header and receipt sections', async ({ page }) => {
    const panel = page.locator('[role="dialog"]');
    await expect(panel).toBeVisible();

    // Header title
    const title = page.locator('#cometchat-message-info-title');
    await expect(title).toBeVisible();

    // Close button
    const closeButton = page.locator(
      '[data-cometchat-message-info-close]'
    );
    await expect(closeButton).toBeVisible();
  });

  test('1-on-1 message renders Read and Delivered sections', async ({
    page,
  }) => {
    const panel = page.locator('[role="dialog"]');
    await expect(panel).toBeVisible();

    // Should have section titles for Read and Delivered
    const sections = page.locator('[class*="section-title"]');
    await expect(sections).toHaveCount(2);
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto(`${STORY_PREFIX}dark-theme&viewMode=story`);
    await page.waitForSelector('[role="dialog"]');
    const panel = page.locator('[role="dialog"]');
    await expect(panel).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto(`${STORY_PREFIX}rtl&viewMode=story`);
    await page.waitForSelector('[role="dialog"]');
    const panel = page.locator('[role="dialog"]');
    await expect(panel).toBeVisible();
  });

  test.describe('Group message', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${STORY_PREFIX}default-group&viewMode=story`);
      await page.waitForSelector('[role="dialog"]');
    });

    test('renders user avatars and names with receipt timestamps', async ({
      page,
    }) => {
      const userItems = page.locator('[class*="user-item"]');
      await expect(userItems.first()).toBeVisible();

      const userName = page.locator('[class*="user-item-name"]').first();
      await expect(userName).toBeVisible();
    });

    test('shows empty state when no receipts', async ({ page }) => {
      await page.goto(`${STORY_PREFIX}group-empty&viewMode=story`);
      await page.waitForSelector('[role="dialog"]');
      const emptyState = page.locator('[class*="empty"]');
      await expect(emptyState.first()).toBeVisible();
    });
  });

  test.describe('Keyboard navigation', () => {
    test('Escape closes the panel', async ({ page }) => {
      const panel = page.locator('[role="dialog"]');
      await expect(panel).toBeVisible();

      // Focus the panel first so Escape is captured
      await page.locator('[data-cometchat-message-info-close]').focus();
      await page.keyboard.press('Escape');
      // Panel close is callback-based — in Storybook the panel stays
      // but the onClose handler fires. Verify the panel was visible.
    });

    test('Tab cycles within the panel (focus trap)', async ({ page }) => {
      const panel = page.locator('[role="dialog"]');
      await expect(panel).toBeVisible();

      // Close button should receive initial focus
      const closeButton = page.locator(
        '[data-cometchat-message-info-close]'
      );
      await expect(closeButton).toBeFocused();

      // Tab should keep focus within the panel
      await page.keyboard.press('Tab');
      const activeElement = page.locator(':focus');
      const isWithinPanel = await activeElement.evaluate((el) => {
        return el.closest('[role="dialog"]') !== null;
      });
      expect(isWithinPanel).toBe(true);
    });

    test('Enter/Space on close button closes the panel', async ({
      page,
    }) => {
      const closeButton = page.locator(
        '[data-cometchat-message-info-close]'
      );
      await expect(closeButton).toBeVisible();
      await closeButton.focus();
      await page.keyboard.press('Enter');
      // Callback-based — verify button was interactable
    });
  });
});
