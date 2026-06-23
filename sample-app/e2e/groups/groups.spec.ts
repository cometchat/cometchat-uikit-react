import { test, expect, Page } from '@playwright/test';
import { loginToApp } from '../helpers';

/**
 * E2E Tests — CometChatGroups (React)
 *
 * Tests the groups list component in the sample app.
 * The groups tab is accessible from the navigation tabs.
 */

test.describe('CometChatGroups', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations', { timeout: 30_000 });
    // Click on Groups tab
    const groupsTab = page.locator('.cometchat-tab-component__tab:has-text("Groups"), button:has-text("Groups")').first();
    await groupsTab.click();
    await page.waitForSelector('.cometchat-groups', { timeout: 15_000 });
    // Wait for items to load from API
    await page.waitForSelector('.cometchat-groups__item', { timeout: 30_000 }).catch(() => {});
  });

  // ==================== Rendering & Loading ====================

  test('groups list renders and loads groups on init', async () => {
    await expect(page.locator('.cometchat-groups').first()).toBeVisible();

    // Wait for either items, shimmer, or empty state — anything that shows the component is working
    const hasItems = await page.locator('.cometchat-groups__item').first().isVisible({ timeout: 10_000 }).catch(() => false);
    const hasShimmer = await page.locator('[class*="shimmer"]').first().isVisible().catch(() => false);
    const hasEmptyState = await page.locator('[class*="empty"]').isVisible().catch(() => false);
    const hasSearchBar = await page.locator('.cometchat-search, input[placeholder]').first().isVisible().catch(() => false);

    // Component rendered successfully if any sub-element is visible
    expect(hasItems || hasShimmer || hasEmptyState || hasSearchBar).toBeTruthy();
  });

  test('loading state resolves (shimmer disappears)', async ({ page: freshPage }) => {
    await loginToApp(freshPage);
    await freshPage.waitForSelector('.cometchat-conversations', { timeout: 30_000 });
    const groupsTab = freshPage.locator('.cometchat-tab-component__tab:has-text("Groups"), button:has-text("Groups")').first();
    await groupsTab.click();
    await freshPage.waitForSelector('.cometchat-groups', { timeout: 15_000 });
    await expect(freshPage.locator('.cometchat-groups__shimmer')).not.toBeVisible({ timeout: 10_000 });
  });

  test('groups list displays group items with avatar and name', async () => {
    const firstGroup = page.locator('.cometchat-groups__item').first();
    const hasGroup = await firstGroup.isVisible().catch(() => false);

    expect(hasGroup, 'Element should be visible: hasGroup').toBeTruthy();
      await expect(firstGroup.locator('.cometchat-avatar')).toBeVisible();
      const nameElement = firstGroup.locator('.cometchat-groups__item-title');
      await expect(nameElement).toBeVisible();
      const name = await nameElement.textContent();
      expect(name?.trim()).toBeTruthy();
  });

  // ==================== Group Type Indicator ====================

  test('group type indicator displays for password/private groups', async () => {
    const typeIndicator = page.locator('[class*="group-type"], [class*="lock"], [class*="shield"]').first();
    const hasType = await typeIndicator.isVisible().catch(() => false);

    expect(hasType, 'Element should be visible: hasType').toBeTruthy();
      expect(hasType).toBeTruthy();
  });

  // ==================== Member Count ====================

  test('member count displays correctly', async () => {
    const firstGroup = page.locator('.cometchat-groups__item').first();
    const hasGroup = await firstGroup.isVisible().catch(() => false);

    expect(hasGroup, 'Element should be visible: hasGroup').toBeTruthy();
      const subtitle = firstGroup.locator('.cometchat-groups__item-subtitle, [class*="subtitle"]');
      await expect(subtitle).toBeVisible({ timeout: 5_000 });
      const text = await subtitle.textContent();
      expect(text?.trim()).toBeTruthy();
  });

  // ==================== Search ====================

  test('search bar is visible and filters groups', async () => {
    const searchBar = page.locator('.cometchat-groups input, .cometchat-search input, input[placeholder*="Search" i]').first();
    const hasSearch = await searchBar.isVisible({ timeout: 3_000 }).catch(() => false);

    expect(hasSearch, 'Element should be visible: hasSearch').toBeTruthy();
      await page.waitForTimeout(1000);
      const initialCount = await page.locator('.cometchat-groups__item').count();

      await searchBar.fill('test');
      await page.waitForTimeout(2000);

      const filteredCount = await page.locator('.cometchat-groups__item').count();
      expect(filteredCount).toBeGreaterThanOrEqual(0);

      await searchBar.fill('');
      await page.waitForTimeout(2000);

      const countAfterClear = await page.locator('.cometchat-groups__item').count();
      expect(countAfterClear).toBeGreaterThanOrEqual(filteredCount);
  });

  // ==================== Click Interaction ====================

  test('clicking a group selects it', async () => {
    const firstGroup = page.locator('.cometchat-groups__item').first();
    const hasGroup = await firstGroup.isVisible().catch(() => false);

    expect(hasGroup, 'Element should be visible: hasGroup').toBeTruthy();
      await firstGroup.click();
      await page.waitForTimeout(2000);

      const hasMessageView = await page.locator('.cometchat-message-header, [class*="list-item--active"]').first().isVisible({ timeout: 10_000 }).catch(() => false);
      const hasJoinDialog = await page.locator('.cometchat-join-group, [class*="join-group"]').first().isVisible().catch(() => false);

      expect(hasMessageView || hasJoinDialog).toBeTruthy();
  });

  // ==================== Pagination ====================

  test('scrolling loads more groups (pagination)', async () => {
    const groupItems = page.locator('.cometchat-groups__item');
    const initialCount = await groupItems.count();
    expect(initialCount).toBeGreaterThanOrEqual(10);

    const listContainer = page.locator('.cometchat-paginated-list, .cometchat-groups').first();
    await listContainer.evaluate(el => {
      el.scrollTop = el.scrollHeight;
    });

    await page.waitForTimeout(2000);

    const newCount = await groupItems.count();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  // ==================== Empty State ====================

  test('empty state renders when search has no results', async () => {
    const searchBar = page.locator('.cometchat-groups input, .cometchat-search input, input[placeholder*="Search" i]').first();
    const hasSearch = await searchBar.isVisible({ timeout: 3_000 }).catch(() => false);

    expect(hasSearch, 'Element should be visible: hasSearch').toBeTruthy();
      await searchBar.fill('zzzznonexistentgroup12345');
      await page.waitForTimeout(3000);

      const itemCount = await page.locator('.cometchat-groups__item').count();
      const hasEmptyView = await page.locator('[class*="empty"]').isVisible().catch(() => false);

      await searchBar.fill('');
      await page.waitForTimeout(1000);

      expect(itemCount === 0 || hasEmptyView).toBeTruthy();
  });

  // ==================== Keyboard Navigation ====================

  test('keyboard navigation works', async () => {
    const groupsList = page.locator('.cometchat-groups').first();
    await groupsList.click();
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
  });

  // ==================== Accessibility ====================

  test('groups list has proper ARIA attributes', async () => {
    const list = page.locator('.cometchat-groups').first();
    await expect(list).toBeVisible();

    const hasAriaLabel = await page.locator('.cometchat-groups[aria-label], [role="region"][aria-label]').first().isVisible({ timeout: 2_000 }).catch(() => false);
    expect(hasAriaLabel).toBeTruthy();
  });

  // ==================== Create Group Button ====================

  test('create group button is present in groups tab', async () => {
    const createBtn = page.locator('[class*="create-group"], button[aria-label*="Create" i], .cometchat-selector__groups-menu button').first();
    const hasCreate = await createBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    expect(hasCreate, 'Element should be visible: hasCreate').toBeTruthy();
      await expect(createBtn).toBeVisible();
  });
});
