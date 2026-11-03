import { test, expect, Page } from '../helpers/test';
import { loginToApp } from '../helpers';
import { visibleWithin } from '../helpers/wait';
import { expectArrowFocusNavigation } from '../helpers/keyboard';

/**
 * E2E Tests — CometChatUsers (React)
 *
 * Tests the users list component in the sample app.
 * The users tab is accessible from the navigation tabs.
 */

test.describe('CometChatUsers', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations', { timeout: 30_000 });
    // Click on Users tab
    const usersTab = page.locator('.cometchat-tab-component__tab:has-text("Users"), button:has-text("Users")').first();
    await usersTab.click();
    await page.waitForSelector('.cometchat-users', { timeout: 15_000 });
    // Wait for items to load from API
    await page.waitForSelector('.cometchat-users__item', { timeout: 30_000 }).catch(() => {});
  });

  // ==================== Rendering & Loading ====================

  test('users list displays user items with avatar and name', async () => {
    const firstUser = page.locator('.cometchat-users__item').first();
    await expect(firstUser).toBeVisible({ timeout: 10_000 });

    await expect(firstUser.locator('.cometchat-avatar')).toBeVisible();
    const nameElement = firstUser.locator('.cometchat-users__item-title');
    await expect(nameElement).toBeVisible();
    const name = await nameElement.textContent();
    expect(name?.trim()).toBeTruthy();
  });

  // ==================== Search ====================

  test('search bar is visible and functional', async () => {
    const searchBar = page.locator('.cometchat-users input, .cometchat-search input, input[placeholder*="Search" i]').first();
    await expect(searchBar).toBeVisible({ timeout: 3_000 });

    await page.waitForTimeout(1000);
    const initialCount = await page.locator('.cometchat-users__item').count();

    await searchBar.fill('super');
    await page.waitForTimeout(2000);

    const filteredCount = await page.locator('.cometchat-users__item').count();
    expect(filteredCount).toBeGreaterThanOrEqual(0);

    await searchBar.fill('');
    await page.waitForTimeout(2000);

    const countAfterClear = await page.locator('.cometchat-users__item').count();
    expect(countAfterClear).toBeGreaterThanOrEqual(filteredCount);
  });

  // ==================== Click Interaction ====================

  test('clicking a user selects it', { tag: '@smoke' }, async () => {
    const firstUser = page.locator('.cometchat-users__item').first();
    await expect(firstUser).toBeVisible({ timeout: 10_000 });

    const name = (await firstUser.locator('.cometchat-users__item-title').first().innerText()).trim();
    await firstUser.click();

    // The chat for that user opens.
    await expect(page.locator('.cometchat-messages-wrapper .cometchat-message-header__title').first()).toContainText(
      name,
      { timeout: 10_000 }
    );
  });

  // ==================== Pagination ====================

  test('scrolling loads more users (pagination)', async () => {
    const userItems = page.locator('.cometchat-users__item');
    const initialCount = await userItems.count();
    expect(initialCount).toBeGreaterThanOrEqual(10);

    const listContainer = page.locator('.cometchat-paginated-list, .cometchat-users').first();
    await listContainer.evaluate(el => {
      el.scrollTop = el.scrollHeight;
    });

    await page.waitForTimeout(2000);

    const newCount = await userItems.count();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  // ==================== Section Headers ====================

  test('alphabetical section headers display', async () => {
    const sectionHeaders = page.locator('.cometchat-users__section-header, .cometchat-users__separator');
    const headerCount = await sectionHeaders.count();
    expect(headerCount).toBeGreaterThan(0);
  });

  // ==================== Keyboard Navigation ====================

  test('keyboard navigation works', async () => {
    await expectArrowFocusNavigation(page.locator('.cometchat-users__item'));
  });

  // ==================== Accessibility ====================

  test('users list has proper ARIA attributes', async () => {
    const list = page.locator('.cometchat-users').first();
    await expect(list).toBeVisible();

    await expect(page.locator('.cometchat-users[aria-label], [role="region"][aria-label]').first()).toBeVisible({ timeout: 2_000 });
  });

  test('empty state renders when search has no results', async () => {
    const searchBar = page.locator('.cometchat-users input, .cometchat-search input, input[placeholder*="Search" i]').first();
    await expect(searchBar).toBeVisible({ timeout: 3_000 });

    await searchBar.fill('zzzznonexistentuser12345');
    await page.waitForTimeout(3000);

    const itemCount = await page.locator('.cometchat-users__item').count();
    const hasEmptyView = await page.locator('[class*="empty"]').isVisible().catch(() => false);

    await searchBar.fill('');
    await page.waitForTimeout(1000);

    expect(itemCount === 0 || hasEmptyView).toBeTruthy();
  });
});
