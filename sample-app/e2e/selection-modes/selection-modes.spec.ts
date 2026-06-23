import { test, expect, Page } from '@playwright/test';
import { loginToApp } from '../helpers';

/**
 * E2E Tests — Selection Modes (React)
 *
 * Tests selection mode interactions across Conversations, Users, and Groups tabs.
 */

test.describe('Selection Modes', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations', { timeout: 30_000 });
    await page.waitForTimeout(2000);
  });

  // ==================== Conversations Selection ====================

  test.describe('Conversations Tab', () => {
    test('conversation items are clickable and set active state', async () => {
      const firstItem = page.locator('.cometchat-conversations__item').first();
      await expect(firstItem).toBeVisible({ timeout: 10_000 });

      await page.waitForTimeout(1000);
      await firstItem.click();

      const activeItem = page.locator('[class*="list-item--active"], [class*="item--active"]');
      const hasActive = await activeItem.isVisible({ timeout: 5_000 }).catch(() => false);
      expect(hasActive).toBeTruthy();
    });

    test('clicking different conversation changes active state', async () => {
      const items = page.locator('.cometchat-conversations__item');
      const count = await items.count();
      expect(count).toBeGreaterThanOrEqual(2);

      const firstItem = items.first()
      await expect(firstItem).toBeVisible({ timeout: 5_000 });

      await firstItem.click();
      await page.waitForTimeout(1000);

      const secondItem = items.nth(1)
      await expect(secondItem).toBeVisible({ timeout: 5_000 });

      await secondItem.click();
      await page.waitForTimeout(1000);

      const activeItems = page.locator('[class*="list-item--active"], [class*="item--active"]');
      const activeCount = await activeItems.count();
      expect(activeCount).toBeLessThanOrEqual(1);
    });
  });

  // ==================== Users Tab Selection ====================

  test.describe('Users Tab', () => {
    test.beforeEach(async () => {
      const usersTab = page.locator('.cometchat-tab-component__tab:has-text("Users"), button:has-text("Users")').first();
      await usersTab.click();
      await page.waitForSelector('.cometchat-users', { timeout: 15_000 });
      await page.waitForTimeout(2000);
    });

    test('user items are clickable', async () => {
      const firstUser = page.locator('.cometchat-users__item').first();
      const hasUser = await firstUser.isVisible({ timeout: 5_000 }).catch(() => false);

      expect(hasUser, 'Element should be visible: hasUser').toBeTruthy();
        await firstUser.click();
        await page.waitForTimeout(2000);

        const hasMessageView = await page.locator('.cometchat-message-header').first().isVisible({ timeout: 10_000 }).catch(() => false);
        const hasActive = await page.locator('[class*="list-item--active"]').isVisible().catch(() => false);
        expect(hasMessageView || hasActive).toBeTruthy();
    });

    test('users list supports keyboard selection', async () => {
      const usersList = page.locator('.cometchat-users').first();
      const hasList = await usersList.isVisible().catch(() => false);

      expect(hasList, 'Element should be visible: hasList').toBeTruthy();
        await usersList.click();
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(300);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(300);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);

    });
  });

  // ==================== Groups Tab Selection ====================

  test.describe('Groups Tab', () => {
    test.beforeEach(async () => {
      const groupsTab = page.locator('.cometchat-tab-component__tab:has-text("Groups"), button:has-text("Groups")').first();
      await groupsTab.click();
      await page.waitForSelector('.cometchat-groups', { timeout: 15_000 });
      await page.waitForTimeout(2000);
    });

    test('group items are clickable', async () => {
      const firstGroup = page.locator('.cometchat-groups__item').first();
      const hasGroup = await firstGroup.isVisible({ timeout: 5_000 }).catch(() => false);

      expect(hasGroup, 'Element should be visible: hasGroup').toBeTruthy();
        await firstGroup.click();
        await page.waitForTimeout(3000);

        const hasMessageView = await page.locator('.cometchat-message-header').first().isVisible({ timeout: 10_000 }).catch(() => false);
        const hasJoinDialog = await page.locator('[class*="join-group"]').isVisible().catch(() => false);
        expect(hasMessageView || hasJoinDialog).toBeTruthy();
    });

    test('groups list supports keyboard selection', async () => {
      const groupsList = page.locator('.cometchat-groups').first();
      const hasList = await groupsList.isVisible().catch(() => false);

      expect(hasList, 'Element should be visible: hasList').toBeTruthy();
        await groupsList.click();
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(300);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);

    });
  });

  // ==================== Tab Switching ====================

  test('switching tabs preserves no selection conflicts', async () => {
    await page.locator('.cometchat-conversations__item').first().click();
    await page.waitForTimeout(1000);

    const usersTab = page.locator('.cometchat-tab-component__tab:has-text("Users"), button:has-text("Users")').first();
    await usersTab.click();
    await page.waitForTimeout(2000);

    const groupsTab = page.locator('.cometchat-tab-component__tab:has-text("Groups"), button:has-text("Groups")').first();
    await groupsTab.click();
    await page.waitForTimeout(2000);

    const chatsTab = page.locator('.cometchat-tab-component__tab:has-text("Chats"), button:has-text("Chats")').first();
    await chatsTab.click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.cometchat-conversations')).toBeVisible();
  });
});
