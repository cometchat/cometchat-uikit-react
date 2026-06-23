import { Page, expect } from '@playwright/test';

/**
 * Navigation helpers for opening specific chats in E2E tests.
 *
 * Chat assignments:
 * - Bob (e2e-user-2): static 1:1 chat — for read-only tests
 * - Design Team (e2e-group-1): static group — for pagination/group tests
 * - Strategy (e2e-group-35): mutable group — for send/edit/delete tests
 * - AI Agent E2E: optional AI agent chat
 */

/** Open Bob Smith's 1:1 chat via Users tab */
export async function openBobChat(page: Page): Promise<void> {
  const usersTab = page.locator('.cometchat-tab-component__tab:has-text("Users")').first();
  await usersTab.click();
  await page.waitForSelector('.cometchat-users__item', { timeout: 30_000 });

  const bobUser = page.locator('.cometchat-users__item').filter({ hasText: 'Bob' }).first();
  await expect(bobUser).toBeVisible({ timeout: 5_000 });
  await bobUser.click();

  await page.waitForSelector('.cometchat-message-list', { timeout: 15_000 });
  await page.waitForSelector('.cometchat-message-bubble', { timeout: 15_000 });
  await page.waitForTimeout(1000);
}

/** Open Design Team group chat via Groups tab */
export async function openDesignTeamChat(page: Page): Promise<void> {
  const groupsTab = page.locator('.cometchat-tab-component__tab:has-text("Groups")').first();
  await groupsTab.click();
  await page.waitForSelector('.cometchat-groups__item', { timeout: 30_000 });

  const designTeam = page.locator('.cometchat-groups__item').filter({ hasText: 'Design Team' }).first();
  await expect(designTeam).toBeVisible({ timeout: 5_000 });
  await designTeam.click();

  await page.waitForSelector('.cometchat-message-list', { timeout: 15_000 });
  await page.waitForSelector('.cometchat-message-bubble', { timeout: 15_000 });
  await page.waitForTimeout(1000);
}

/** Open Strategy group chat via Groups tab */
export async function openStrategyChat(page: Page): Promise<void> {
  const groupsTab = page.locator('.cometchat-tab-component__tab:has-text("Groups")').first();
  await groupsTab.click();
  await page.waitForSelector('.cometchat-groups__item', { timeout: 30_000 });

  const strategy = page.locator('.cometchat-groups__item').filter({ hasText: 'Strategy' }).first();
  await expect(strategy).toBeVisible({ timeout: 5_000 });
  await strategy.click();

  await page.waitForSelector('.cometchat-message-list', { timeout: 15_000 });
  await page.waitForTimeout(2000);
}

/** Open Strategy group chat via Conversations tab (should be at top after seed) */
export async function openStrategyChatFromConversations(page: Page): Promise<void> {
  const chatsTab = page.locator('.cometchat-tab-component__tab:has-text("Chats")').first();
  await chatsTab.click();
  await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });

  const strategy = page.locator('.cometchat-conversations__item').filter({ hasText: 'Strategy' }).first();
  await expect(strategy).toBeVisible({ timeout: 5_000 });
  await strategy.click();

  await page.waitForSelector('.cometchat-message-list', { timeout: 15_000 });
  await page.waitForTimeout(2000);
}

/** Open CI/CD group chat via Groups tab (has incoming messages for message-privately tests) */
export async function openCICDChat(page: Page): Promise<void> {
  const groupsTab = page.locator('.cometchat-tab-component__tab:has-text("Groups")').first();
  await groupsTab.click();
  await page.waitForSelector('.cometchat-groups__item', { timeout: 30_000 });

  const cicdGroup = page.locator('.cometchat-groups__item').filter({ hasText: 'CI/CD' }).first();
  await expect(cicdGroup).toBeVisible({ timeout: 5_000 });
  await cicdGroup.click();

  await page.waitForSelector('.cometchat-message-list', { timeout: 15_000 });
  await page.waitForSelector('.cometchat-message-bubble', { timeout: 15_000 });
  await page.waitForTimeout(1000);
}

/** Open AI Agent chat from conversations (skip-safe — returns false if not found) */
export async function openAIAgentChat(page: Page): Promise<boolean> {
  const chatsTab = page.locator('.cometchat-tab-component__tab:has-text("Chats")').first();
  await chatsTab.click();
  await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });

  const aiAgent = page.locator('.cometchat-conversations__item').filter({ hasText: 'AI Agent E2E' }).first();
  const found = await aiAgent.isVisible({ timeout: 5_000 }).catch(() => false);
  if (!found) return false;

  await aiAgent.click();
  await page.waitForSelector('.cometchat-message-list, .cometchat-ai-assistant-chat', { timeout: 15_000 });
  await page.waitForTimeout(2000);
  return true;
}
