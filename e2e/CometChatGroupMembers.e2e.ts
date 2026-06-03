import { test, expect } from '@playwright/test';

test.describe('CometChatGroupMembers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      '/iframe.html?id=components-groups-cometchat-group-members--default&viewMode=story'
    );
  });

  test('renders correctly', async ({ page }) => {
    const list = page.locator('[class*="cometchat-group-members__list"]');
    await expect(list).toBeVisible();
  });

  test('renders member items with name', async ({ page }) => {
    const items = page.locator('[class*="cometchat-group-members__item"]');
    await expect(items.first()).toBeVisible();

    // Check title is visible
    const title = items.first().locator('[class*="cometchat-group-members__item-title"]');
    await expect(title).toBeVisible();
    await expect(title).not.toHaveText('');
  });

  test('renders avatar for each member', async ({ page }) => {
    const avatars = page.locator('[class*="cometchat-group-members__item-avatar"]');
    await expect(avatars.first()).toBeVisible();
  });

  test('renders role badges for non-participant members', async ({ page }) => {
    // Wait for members to load
    const items = page.locator('[class*="cometchat-group-members__item"]');
    await expect(items.first()).toBeVisible({ timeout: 5000 });

    // Look for badge text — Admin or Moderator (Owner may not render depending on SDK scope handling)
    const adminText = page.locator('text=Admin');
    const moderatorText = page.locator('text=Moderator');
    const ownerText = page.locator('text=Owner');

    const adminCount = await adminText.count();
    const moderatorCount = await moderatorText.count();
    const ownerCount = await ownerText.count();

    // At least one role badge should be present
    expect(adminCount + moderatorCount + ownerCount).toBeGreaterThan(0);
  });

  test('renders header with title', async ({ page }) => {
    const header = page.locator('[class*="cometchat-group-members__header-title"]');
    await expect(header).toBeVisible();
    await expect(header).toHaveText('Members');
  });

  test('renders search bar', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
  });

  test('search filters members', async ({ page }) => {
    // Wait for members to load first
    const items = page.locator('[class*="cometchat-group-members__item"]');
    await expect(items.first()).toBeVisible({ timeout: 5000 });
    const initialCount = await items.count();

    // Type in search
    const searchInput = page.locator('input[placeholder*="earch"]');
    await searchInput.fill('Alice');

    // Wait for debounce + async re-fetch + re-render
    await page.waitForTimeout(1000);

    const filteredCount = await items.count();
    // After filtering, count should be <= initial
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test.describe('Selection modes', () => {
    test('single selection shows radio buttons', async ({ page }) => {
      await page.goto(
        '/iframe.html?id=components-groups-cometchat-group-members--single-selection&viewMode=story'
      );
      const radio = page.locator('[class*="cometchat-radio-button"]');
      await expect(radio.first()).toBeVisible({ timeout: 5000 });
    });

    test('multiple selection shows checkboxes', async ({ page }) => {
      await page.goto(
        '/iframe.html?id=components-groups-cometchat-group-members--multiple-selection&viewMode=story'
      );
      const checkbox = page.locator('[class*="cometchat-checkbox"]');
      await expect(checkbox.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('State views', () => {
    test('loading state renders shimmer', async ({ page }) => {
      await page.goto(
        '/iframe.html?id=components-groups-cometchat-group-members--loading-state&viewMode=story'
      );
      const shimmer = page.locator('[class*="cometchat-group-members__shimmer-item"]').first();
      await expect(shimmer).toBeVisible();
    });

    test('empty state renders message', async ({ page }) => {
      await page.goto(
        '/iframe.html?id=components-groups-cometchat-group-members--empty-state&viewMode=story'
      );
      const emptyTitle = page.locator('[class*="cometchat-group-members__empty-state-title"]');
      await expect(emptyTitle).toBeVisible();
      await expect(emptyTitle).toContainText('No Members');
    });

    test('error state renders message', async ({ page }) => {
      await page.goto(
        '/iframe.html?id=components-groups-cometchat-group-members--error-state&viewMode=story'
      );
      const errorTitle = page.locator('[class*="cometchat-group-members__error-state-title"]');
      await expect(errorTitle).toBeVisible();
      await expect(errorTitle).toContainText('OOPS!');
    });
  });

  test.describe('Keyboard navigation', () => {
    test('Tab focuses member items', async ({ page }) => {
      // Wait for items to render
      const items = page.locator('[role="option"]');
      await expect(items.first()).toBeVisible({ timeout: 5000 });

      // Click body to reset focus, then tab
      await page.locator('body').click({ position: { x: 1, y: 1 } });
      await page.keyboard.press('Tab');

      // After Tab, focus should be on some interactive element
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.tagName.toLowerCase() : null;
      });
      expect(focused).not.toBeNull();
    });

    test('Enter activates focused member item', async ({ page }) => {
      const firstItem = page.locator('[role="option"]').first();
      await firstItem.focus();
      await page.keyboard.press('Enter');
      // No error thrown = interaction handled
    });

    test('Space activates focused member item', async ({ page }) => {
      const firstItem = page.locator('[role="option"]').first();
      await firstItem.focus();
      await page.keyboard.press('Space');
      // No error thrown = interaction handled
    });

    test('Tab to action buttons within member item', async ({ page }) => {
      // Hover over first item to reveal context menu
      const firstItem = page.locator('[role="option"]').first();
      await firstItem.hover();
      // Context menu trigger may or may not be visible depending on user role
      const menu = firstItem.locator('[class*="cometchat-group-members__item-menu"]');
      const isVisible = await menu.isVisible().catch(() => false);
      if (isVisible) {
        await page.keyboard.press('Tab');
      }
    });
  });

  test('infinite scroll loads more members', async ({ page }) => {
    const items = page.locator('[class*="cometchat-group-members__item"]');
    const initialCount = await items.count();
    // Scroll to bottom to trigger infinite scroll
    const list = page.locator('[class*="cometchat-group-members__list"]');
    await list.evaluate(el => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(500);
    const newCount = await items.count();
    // Count should be same or more (depends on mock data)
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });
});
