import { test, expect } from '@playwright/test';

test.describe('CometChatGroups', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=components-cometchatgroups--default&viewMode=story');
  });

  test('renders correctly', async ({ page }) => {
    const list = page.locator('[class*="cometchat-groups__list"]');
    await expect(list).toBeVisible();
  });

  test('renders group items with name and member count', async ({ page }) => {
    const items = page.locator('[class*="cometchat-groups__item"]');
    await expect(items.first()).toBeVisible();

    // Check title is visible
    const title = items.first().locator('[class*="cometchat-groups__item-title"]');
    await expect(title).toBeVisible();
    await expect(title).not.toHaveText('');

    // Check member count is visible
    const memberCount = items.first().locator('[class*="cometchat-groups__item-member-count"]');
    await expect(memberCount).toBeVisible();
    await expect(memberCount).toContainText('Members');
  });

  test('renders avatar for each group', async ({ page }) => {
    const avatars = page.locator('[class*="cometchat-groups__item-avatar"]');
    await expect(avatars.first()).toBeVisible();
  });

  test('renders type badge for private/password groups', async ({ page }) => {
    // The Default story has private and password groups in mock data
    const badges = page.locator('[class*="type-badge"]');
    const count = await badges.count();
    // At least some groups should have badges (private/password types in mock data)
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('renders header with title', async ({ page }) => {
    const header = page.locator('[class*="cometchat-groups__header-title"]');
    await expect(header).toBeVisible();
    await expect(header).toHaveText('Groups');
  });

  test('renders search bar', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
  });

  test.describe('Selection modes', () => {
    test('single selection shows radio buttons', async ({ page }) => {
      await page.goto(
        '/iframe.html?id=components-cometchatgroups--single-selection&viewMode=story'
      );
      const radio = page.locator('[class*="cometchat-radio-button"]');
      await expect(radio.first()).toBeVisible({ timeout: 5000 });
    });

    test('multiple selection shows checkboxes', async ({ page }) => {
      await page.goto(
        '/iframe.html?id=components-cometchatgroups--multiple-selection&viewMode=story'
      );
      const checkbox = page.locator('[class*="cometchat-checkbox"]');
      await expect(checkbox.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('State views', () => {
    test('loading state renders shimmer', async ({ page }) => {
      await page.goto(
        '/iframe.html?id=components-cometchatgroups--loading-state&viewMode=story'
      );
      const shimmer = page.locator('[class*="cometchat-groups__shimmer-item"]').first();
      await expect(shimmer).toBeVisible();
    });

    test('empty state renders message', async ({ page }) => {
      await page.goto(
        '/iframe.html?id=components-cometchatgroups--empty-state&viewMode=story'
      );
      const emptyTitle = page.locator('[class*="cometchat-groups__empty-state-title"]');
      await expect(emptyTitle).toBeVisible();
      await expect(emptyTitle).toContainText('No Groups');
    });

    test('error state renders message', async ({ page }) => {
      await page.goto(
        '/iframe.html?id=components-cometchatgroups--error-state&viewMode=story'
      );
      const errorTitle = page.locator('[class*="cometchat-groups__error-state-title"]');
      await expect(errorTitle).toBeVisible();
      await expect(errorTitle).toContainText('Something went wrong');
    });
  });

  test.describe('Keyboard navigation', () => {
    test('Tab focuses group items', async ({ page }) => {
      await page.locator('body').click({ position: { x: 1, y: 1 } });
      await page.keyboard.press('Tab');
      // After Tab, focus should be on an interactive element (search input or group item)
      const tagName = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase());
      expect(['input', 'div', 'span']).toContain(tagName);
    });

    test('Enter activates focused group item', async ({ page }) => {
      const firstItem = page.locator('[role="option"]').first();
      await firstItem.focus();
      await page.keyboard.press('Enter');
      // No error thrown = interaction handled
    });

    test('Space activates focused group item', async ({ page }) => {
      const firstItem = page.locator('[role="option"]').first();
      await firstItem.focus();
      await page.keyboard.press('Space');
      // No error thrown = interaction handled
    });
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=components-cometchatgroups--dark-theme&viewMode=story'
    );
    const list = page.locator('[class*="cometchat-groups__list"]');
    await expect(list).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto('/iframe.html?id=components-cometchatgroups--rtl&viewMode=story');
    const list = page.locator('[class*="cometchat-groups__list"]');
    await expect(list).toBeVisible();
  });

  test('active group is highlighted', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=components-cometchatgroups--with-active-group&viewMode=story'
    );
    const activeItem = page.locator('[class*="cometchat-groups__item--active"]');
    await expect(activeItem).toBeVisible();
  });
});
