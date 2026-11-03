import { test, expect, Page } from '../helpers/test';
import { loginToApp } from '../helpers';
import { visibleWithin } from '../helpers/wait';

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

    test('users list supports keyboard selection', async () => {
      const items = page.locator('.cometchat-users__item');
      await expect(items.nth(1)).toBeVisible({ timeout: 30_000 });
      const name = (await items.nth(1).locator('.cometchat-users__item-title').innerText()).trim();

      await items.first().focus();
      await items.first().press('ArrowDown');
      await expect(items.nth(1)).toBeFocused();
      await items.nth(1).press('Enter');

      await expect(page.locator('.cometchat-messages-wrapper .cometchat-message-header__title').first()).toContainText(
        name,
        { timeout: 15_000 }
      );
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

    test('groups list supports keyboard selection', async () => {
      const items = page.locator('.cometchat-groups__item');
      await expect(items.nth(1)).toBeVisible({ timeout: 30_000 });
      const name = (await items.nth(1).locator('.cometchat-groups__item-title').innerText()).trim();

      await items.first().focus();
      await items.first().press('ArrowDown');
      await expect(items.nth(1)).toBeFocused();
      await items.nth(1).press('Enter');

      await expect(page.locator('.cometchat-messages-wrapper .cometchat-message-header__title').first()).toContainText(
        name,
        { timeout: 15_000 }
      );
    });
  });

  // ==================== Tab Switching ====================

  test('each tab keeps its own selection', async () => {
    const header = page.locator('.cometchat-messages-wrapper .cometchat-message-header__title').first();
    const tab = (name: string) => page.locator(`.cometchat-tab-component__tab:has-text("${name}")`).first();

    // Open a conversation in Chats.
    const conversation = page.locator('.cometchat-conversations__item').first();
    await expect(conversation).toBeVisible({ timeout: 30_000 });
    const chatName = (await conversation.locator('.cometchat-conversations__item-title').innerText()).trim();
    await conversation.click();
    await expect(header).toContainText(chatName, { timeout: 15_000 });

    // Users has no selection yet, so nothing is open there; pick a user.
    await tab('Users').click();
    await expect(page.locator('.cometchat-messages-wrapper .cometchat-message-header')).toHaveCount(0);
    const user = page.locator('.cometchat-users__item').first();
    await expect(user).toBeVisible({ timeout: 30_000 });
    const userName = (await user.locator('.cometchat-users__item-title').innerText()).trim();
    await user.click();
    await expect(header).toContainText(userName, { timeout: 15_000 });

    // Back on Chats, its own conversation is restored — not the user from the other tab.
    await tab('Chats').click();
    await expect(header).toContainText(chatName, { timeout: 15_000 });

    // And Users still remembers its user.
    await tab('Users').click();
    await expect(header).toContainText(userName, { timeout: 15_000 });
  });
});
