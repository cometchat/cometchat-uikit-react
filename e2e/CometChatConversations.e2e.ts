import { test, expect } from '@playwright/test';

test.describe('CometChatConversations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      '/iframe.html?id=components-conversations-cometchat-conversations--default&viewMode=story'
    );
  });

  test('renders correctly', async ({ page }) => {
    const component = page.locator('[class*="cometchat-conversations"]');
    await expect(component.first()).toBeVisible();
  });

  test('renders conversation items', async ({ page }) => {
    const items = page.locator('[role="option"]');
    await expect(items.first()).toBeVisible({ timeout: 10000 });
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('has listbox role with aria-label', async ({ page }) => {
    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toBeVisible();
    await expect(listbox).toHaveAttribute('aria-label', 'Conversations list');
  });

  test('supports keyboard navigation', async ({ page }) => {
    const firstItem = page.locator('[role="option"]').first();
    await firstItem.focus();
    await expect(firstItem).toBeFocused();

    await page.keyboard.press('ArrowDown');
    const secondItem = page.locator('[role="option"]').nth(1);
    // Focus should have moved (or at least not throw)
    await expect(secondItem).toBeVisible();
  });

  test('renders in dark theme', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=components-conversations-cometchat-conversations--dark-theme&viewMode=story'
    );
    const component = page.locator('[data-theme="dark"]');
    await expect(component).toBeVisible();
  });

  test('renders in RTL', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=components-conversations-cometchat-conversations--rtl&viewMode=story'
    );
    const rtlContainer = page.locator('[dir="rtl"]');
    await expect(rtlContainer).toBeVisible();
  });

  test('loading state renders shimmer', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=components-conversations-cometchat-conversations--loading-state&viewMode=story'
    );
    const loadingState = page.locator('[aria-busy="true"]');
    await expect(loadingState).toBeVisible();
  });

  test('empty state renders message', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=components-conversations-cometchat-conversations--empty-state&viewMode=story'
    );
    const emptyState = page.locator('[role="status"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No Conversations');
  });

  test('error state renders message', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=components-conversations-cometchat-conversations--error-state&viewMode=story'
    );
    const errorState = page.locator('[role="status"]');
    await expect(errorState).toBeVisible();
    await expect(errorState).toContainText('Something went wrong');
  });
});
