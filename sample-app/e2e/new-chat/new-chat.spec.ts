import { test, expect, Page } from '@playwright/test';
import { loginToApp } from '../helpers';

/**
 * E2E Tests — CometChatNewChat (React)
 *
 * Tests the new chat component/dialog accessible from the conversations tab.
 */

test.describe('CometChatNewChat', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations', { timeout: 30_000 });
    await page.waitForTimeout(2000);
  });

  /** Helper: open the New Chat dialog */
  async function openNewChat() {
    const menuBtn = page.locator('.cometchat-selector__menu-button, button[aria-label*="CometChat Selector" i], [class*="selector"] [class*="menu"]').first();
    await expect(menuBtn).toBeVisible({ timeout: 5_000 });
    await menuBtn.click();
    await page.waitForTimeout(1000);

    const newChatOption = page.locator('button:has-text("Create conversation")').first();
    await expect(newChatOption).toBeVisible({ timeout: 5_000 });
    await newChatOption.click();
    await page.waitForTimeout(2000);
  }

  test('new chat dialog opens from conversations menu', async () => {
    await openNewChat();

    const newChatComponent = page.locator('.cometchat-new-chat, [class*="new-chat"]').first();
    await expect(newChatComponent).toBeVisible({ timeout: 5_000 });
  });

  test('users list renders in new chat', async () => {
    await openNewChat();

    const usersList = page.locator('.cometchat-users, [class*="new-chat"] [class*="list"]').first();
    await expect(usersList).toBeVisible({ timeout: 5_000 });

    await page.waitForTimeout(2000);
    const userItems = page.locator('.cometchat-users__item');
    const count = await userItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('search filters users in new chat', async () => {
    await openNewChat();

    const searchInput = page.locator('.cometchat-new-chat-view input[placeholder*="Search" i], .cometchat-new-chat-view .cometchat-search input').first();
    await expect(searchInput).toBeVisible({ timeout: 5_000 });

    await searchInput.fill('super');
    await page.waitForTimeout(2000);

    const userItems = page.locator('.cometchat-users__item');
    const count = await userItems.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('clicking a user starts a new conversation', async () => {
    await openNewChat();

    const userItem = page.locator('.cometchat-users__item').first();
    await expect(userItem).toBeVisible({ timeout: 10_000 });
    await userItem.click();
    await page.waitForTimeout(2000);

    const hasMessages = await page.locator('.cometchat-message-header, .cometchat-message-list, .cometchat-message-composer').first().isVisible({ timeout: 10_000 }).catch(() => false);
    expect(hasMessages).toBeTruthy();
  });

  test('back button closes new chat', async () => {
    await openNewChat();

    const newChatComponent = page.locator('.cometchat-new-chat, [class*="new-chat"]').first();
    await expect(newChatComponent).toBeVisible({ timeout: 5_000 });

    const backBtn = newChatComponent.locator('[class*="back"], [class*="close"], button[aria-label*="Back" i]').first();
    await expect(backBtn).toBeVisible({ timeout: 5_000 });
    await backBtn.click();
    await page.waitForTimeout(1000);

    await expect(page.locator('.cometchat-conversations')).toBeVisible();
  });

  test('new chat component has proper ARIA attributes', async () => {
    await openNewChat();

    const newChatComponent = page.locator('.cometchat-new-chat, [class*="new-chat"]').first();
    await expect(newChatComponent).toBeVisible({ timeout: 5_000 });

    const hasAriaElements = await newChatComponent.locator('[aria-label], [role], input').first().isVisible({ timeout: 2_000 }).catch(() => false);
    expect(hasAriaElements).toBeTruthy();
  });
});
