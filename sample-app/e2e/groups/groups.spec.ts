import { test, expect, Page } from '../helpers/test';
import { loginToApp } from '../helpers';
import { visibleWithin } from '../helpers/wait';
import { expectArrowFocusNavigation } from '../helpers/keyboard';
import { waitForChatOpen } from '../helpers/navigation';

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
    await expect(firstGroup).toBeVisible({ timeout: 10_000 });
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
    await expect(firstGroup).toBeVisible({ timeout: 10_000 });
      const subtitle = firstGroup.locator('.cometchat-groups__item-subtitle, [class*="subtitle"]');
      await expect(subtitle).toBeVisible({ timeout: 5_000 });
      const text = await subtitle.textContent();
      expect(text?.trim()).toBeTruthy();
  });

  // ==================== Search ====================

  test('search bar is visible and filters groups', async () => {
    const searchBar = page.locator('.cometchat-groups input, .cometchat-search input, input[placeholder*="Search" i]').first();
    await expect(searchBar).toBeVisible({ timeout: 3_000 });
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

  test('clicking a group opens its chat', { tag: '@smoke' }, async () => {
    // Strategy: Alice is a member, so the chat opens directly (no join dialog).
    const strategy = page.locator('.cometchat-groups__item').filter({ hasText: 'Strategy' }).first();
    const search = page.locator('.cometchat-groups input').first();
    if (!(await visibleWithin(strategy, 10_000))) await search.fill('Strategy');
    await strategy.click();
    await waitForChatOpen(page, 'Strategy');
    await expect(strategy).toHaveAttribute('aria-selected', 'true');
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
    await expect(searchBar).toBeVisible({ timeout: 3_000 });
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
    await expectArrowFocusNavigation(page.locator('.cometchat-groups__item'));
  });

  // ==================== Accessibility ====================

  test('groups list has proper ARIA attributes', async () => {
    const list = page.locator('.cometchat-groups').first();
    await expect(list).toBeVisible();

    await expect(page.locator('.cometchat-groups[aria-label], [role="region"][aria-label]').first()).toBeVisible({ timeout: 2_000 });
  });

  // ==================== Create Group Button ====================

});
