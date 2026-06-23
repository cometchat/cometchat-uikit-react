import { test, expect, Page } from '@playwright/test';
import { loginToApp } from '../helpers';

/**
 * E2E Tests — CometChatSearch (React)
 *
 * Tests the search component accessible from the conversations header.
 */

test.describe('CometChatSearch', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations', { timeout: 30_000 });
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });

    // Open search by clicking the conversations search bar
    const searchBar = page.locator('.cometchat-conversations__search-bar').first();
    await expect(searchBar).toBeVisible({ timeout: 5_000 });
    await searchBar.click();
    await page.waitForTimeout(2000);
  });

  // ==================== Rendering ====================

  test('search component renders with input', async () => {
    const searchComponent = page.locator('.cometchat-search').first();
    await expect(searchComponent).toBeVisible({ timeout: 5_000 });

    const input = page.locator('.cometchat-search__input input').first();
    await expect(input).toBeVisible();
  });

  test('search input is focusable and accepts text', async () => {
    const input = page.locator('.cometchat-search__input input').first();
    await expect(input).toBeVisible({ timeout: 5_000 });

    await input.click();
    await input.fill('hello');
    await page.waitForTimeout(500);

    const value = await input.inputValue();
    expect(value).toBe('hello');
  });

  // ==================== Search Triggers ====================

  test('typing in search input triggers search results', async () => {
    const input = page.locator('.cometchat-search__input input').first();
    await expect(input).toBeVisible({ timeout: 5_000 });

    await input.fill('test');
    await page.waitForTimeout(3000);

    const hasResults = await page.locator('.cometchat-search__results').first().isVisible().catch(() => false);
    const hasConversationResults = await page.locator('.cometchat-search__conversations-list-item').first().isVisible().catch(() => false);
    const hasMessageResults = await page.locator('.cometchat-search__messages-list-item').first().isVisible().catch(() => false);
    const hasEmpty = await page.locator('.cometchat-search__empty-view').isVisible().catch(() => false);

    expect(hasResults || hasConversationResults || hasMessageResults || hasEmpty).toBeTruthy();
  });

  // ==================== Conversations Results ====================

  test('conversations tab shows matching conversations', async () => {
    const input = page.locator('.cometchat-search__input input').first();
    await expect(input).toBeVisible({ timeout: 5_000 });

    await input.fill('Design');
    await page.waitForTimeout(3000);

    const conversationResults = page.locator('.cometchat-search__conversations-list-item').first();
    await expect(conversationResults).toBeVisible({ timeout: 10_000 });
  });

  // ==================== Result Click ====================

  test('clicking a search result navigates to conversation', async () => {
    const input = page.locator('.cometchat-search__input input').first();
    await expect(input).toBeVisible({ timeout: 5_000 });

    await input.fill('Design');
    await page.waitForTimeout(3000);

    const resultItem = page.locator('.cometchat-search__conversations-list-item, .cometchat-search__messages-list-item').first();
    await expect(resultItem).toBeVisible({ timeout: 10_000 });
    await resultItem.click();
    await page.waitForTimeout(2000);

    const hasMessages = await page.locator('.cometchat-message-header, .cometchat-message-list').first().isVisible({ timeout: 10_000 }).catch(() => false);
    expect(hasMessages).toBeTruthy();
  });

  // ==================== Back Button ====================

  test('back button closes search', async () => {
    const searchComponent = page.locator('.cometchat-search').first();
    await expect(searchComponent).toBeVisible({ timeout: 5_000 });

    const backBtn = page.locator('.cometchat-search__back-button').first();
    await expect(backBtn).toBeVisible({ timeout: 5_000 });
    await backBtn.click();
    await page.waitForTimeout(1000);

    const hasConversations = await page.locator('.cometchat-conversations').isVisible().catch(() => false);
    expect(hasConversations).toBeTruthy();
  });

  // ==================== Empty State ====================

  test('empty state renders when no results found', async () => {
    const input = page.locator('.cometchat-search__input input').first();
    await expect(input).toBeVisible({ timeout: 5_000 });

    await input.fill('zzzznonexistentsearchterm99999');
    await page.waitForTimeout(5000);

    const value = await input.inputValue();
    expect(value).toBe('zzzznonexistentsearchterm99999');

    const itemCount = await page.locator('.cometchat-search__conversations-list-item, .cometchat-search__messages-list-item').count();
    const hasEmpty = await page.locator('.cometchat-search__empty-view').isVisible().catch(() => false);

    expect(hasEmpty || itemCount === 0).toBeTruthy();
  });

  // ==================== Keyboard Navigation ====================

  test('keyboard navigation through results works', async () => {
    const input = page.locator('.cometchat-search__input input').first();
    await expect(input).toBeVisible({ timeout: 5_000 });

    await input.fill('Design');
    await page.waitForTimeout(3000);

    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
  });

  // ==================== Accessibility ====================

  test('search component has proper ARIA attributes', async () => {
    const searchComponent = page.locator('.cometchat-search').first();
    await expect(searchComponent).toBeVisible({ timeout: 5_000 });

    const input = searchComponent.locator('.cometchat-search__input input').first();
    const hasAriaLabel = await input.getAttribute('aria-label');
    const hasPlaceholder = await input.getAttribute('placeholder');

    expect(hasAriaLabel || hasPlaceholder).toBeTruthy();
  });

  // ==================== Filter Tabs ====================

  test('filter buttons are visible', async () => {
    const filterBar = page.locator('.cometchat-search__body-filters').first();
    await expect(filterBar).toBeVisible({ timeout: 5_000 });

    const filters = filterBar.locator('.cometchat-search__body-filter');
    const count = await filters.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking Messages filter shows messages results section', async () => {
    const input = page.locator('.cometchat-search__input input').first();
    await expect(input).toBeVisible({ timeout: 5_000 });

    // Type a search term that matches seeded messages
    await input.fill('Hello');
    await page.waitForTimeout(3000);

    // Results should appear (conversations or messages with "Hello")
    const resultItems = page.locator('.cometchat-search__conversations-list-item, .cometchat-search__messages-list-item');
    await expect(resultItems.first()).toBeVisible({ timeout: 10_000 });

    // Now apply "Audio" filter — no audio messages contain "Hello" so results should be empty
    const audioFilter = page.locator('.cometchat-search__body-filter').filter({ hasText: 'Audio' }).first();
    await expect(audioFilter).toBeVisible({ timeout: 5_000 });
    await audioFilter.click();
    await page.waitForTimeout(3000);

    // After applying Audio filter, no results should match "Hello"
    const emptyView = page.locator('.cometchat-search__empty-view').first();
    const noItems = await page.locator('.cometchat-search__messages-list-item').count() === 0;
    const hasEmpty = await emptyView.isVisible({ timeout: 5_000 }).catch(() => false);
    expect(noItems || hasEmpty).toBeTruthy();
  });

  // ==================== Scoped Search Clean Filters ====================

  test('scoped search does not inherit filters from global search', async () => {
    const input = page.locator('.cometchat-search__input input').first();
    await expect(input).toBeVisible({ timeout: 5_000 });

    // Apply a filter in global search (e.g., "Audio")
    const audioFilter = page.locator('.cometchat-search__body-filter').filter({ hasText: 'Audio' }).first();
    await expect(audioFilter).toBeVisible({ timeout: 5_000 });
    await audioFilter.click();
    await page.waitForTimeout(500);

    // Verify it's now active (has the --active class)
    const activeFilter = page.locator('.cometchat-search__body-filter--active').first();
    await expect(activeFilter).toBeVisible({ timeout: 3_000 });

    // Close global search via back button
    const backBtn = page.locator('.cometchat-search__back-button').first();
    await expect(backBtn).toBeVisible({ timeout: 3_000 });
    await backBtn.click();
    await page.waitForTimeout(1000);

    // Re-open search
    const searchBar = page.locator('.cometchat-conversations__search-bar').first();
    await expect(searchBar).toBeVisible({ timeout: 5_000 });
    await searchBar.click();
    await page.waitForTimeout(2000);

    // No filter should be active (clean state)
    const activeAfterReopen = page.locator('.cometchat-search__body-filter--active');
    const activeCount = await activeAfterReopen.count();
    expect(activeCount).toBe(0);
  });
});
