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

/**
 * Select a group by name from the Groups tab.
 *
 * The list is paginated (30 per page), so as the test app accumulates groups a
 * target eventually falls off the first page and no amount of waiting reveals
 * it. When the direct hit misses, this falls back to the search bar, which
 * filters server-side and finds the group wherever it sits.
 *
 * The search box is cleared afterwards so the Groups tab is left unfiltered for
 * whatever runs next.
 */
export async function selectGroupByName(page: Page, name: string): Promise<void> {
  const groupsTab = page.locator('.cometchat-tab-component__tab:has-text("Groups")').first();
  await groupsTab.click();
  await page.waitForSelector('.cometchat-groups__item', { timeout: 30_000 });

  const groupItem = () => page.locator('.cometchat-groups__item').filter({ hasText: name }).first();

  // Fast path — the group is on the currently loaded page of the list.
  if (await groupItem().isVisible({ timeout: 5_000 }).catch(() => false)) {
    await groupItem().click();
    return;
  }

  // Fallback — filter by name instead of paging through the whole list.
  const searchInput = page
    .locator('.cometchat-groups__search-bar input, .cometchat-groups input[type="text"]')
    .first();
  await expect(
    searchInput,
    `"${name}" is not on the first page of the Groups list, and no search bar was found to fall back to`
  ).toBeVisible({ timeout: 5_000 });

  await searchInput.fill(name);
  await page.waitForTimeout(1500); // 300 ms debounce + the fetch it triggers

  await expect(groupItem(), `Group "${name}" not found, even via search`).toBeVisible({
    timeout: 10_000,
  });
  await groupItem().click();

  // Leave the list unfiltered for the next helper that uses this tab.
  await searchInput.fill('').catch(() => undefined);
  await page.waitForTimeout(500);
}

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
  await selectGroupByName(page, 'Design Team');

  await page.waitForSelector('.cometchat-message-list', { timeout: 15_000 });
  await page.waitForSelector('.cometchat-message-bubble', { timeout: 15_000 });
  await page.waitForTimeout(1000);
}

/** Open Strategy group chat via Groups tab */
export async function openStrategyChat(page: Page): Promise<void> {
  await selectGroupByName(page, 'Strategy');

  await page.waitForSelector('.cometchat-message-list', { timeout: 15_000 });
  await page.waitForTimeout(2000);
}

/** Open Strategy group chat via Conversations tab (should be at top after seed) */
export async function openStrategyChatFromConversations(page: Page): Promise<void> {
  const chatsTab = page.locator('.cometchat-tab-component__tab:has-text("Chats")').first();
  await chatsTab.click();
  await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });

  const strategy = page
    .locator('.cometchat-conversations__item')
    .filter({ hasText: 'Strategy' })
    .first();

  // The seed posts to Strategy so it sits at the top, but a busy app can push it
  // off the loaded page — fall back to opening it from the Groups tab.
  if (await strategy.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await strategy.click();
  } else {
    await selectGroupByName(page, 'Strategy');
  }

  await page.waitForSelector('.cometchat-message-list', { timeout: 15_000 });
  await page.waitForTimeout(2000);
}

/** Open CI/CD group chat via Groups tab (has incoming messages for message-privately tests) */
export async function openCICDChat(page: Page): Promise<void> {
  await selectGroupByName(page, 'CI/CD');

  await page.waitForSelector('.cometchat-message-list', { timeout: 15_000 });
  await page.waitForSelector('.cometchat-message-bubble', { timeout: 15_000 });
  await page.waitForTimeout(1000);
}

/** Open AI Agent chat from conversations (skip-safe — returns false if not found) */
export async function openAIAgentChat(page: Page): Promise<boolean> {
  const chatsTab = page.locator('.cometchat-tab-component__tab:has-text("Chats")').first();
  await chatsTab.click();
  await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });

  // Match the conversation's title exactly. `hasText` on the whole item is a
  // case-insensitive substring match over the subtitle too, so a conversation
  // whose last message merely mentions the agent would win instead.
  const aiAgent = page
    .locator('.cometchat-conversations__item')
    .filter({
      has: page.locator('.cometchat-conversations__item-title', { hasText: /^AI Agent E2E$/ }),
    })
    .first();
  const found = await aiAgent.isVisible({ timeout: 5_000 }).catch(() => false);
  if (!found) return false;

  await aiAgent.click();
  await page.waitForSelector('.cometchat-message-list, .cometchat-ai-assistant-chat', { timeout: 15_000 });
  await page.waitForTimeout(2000);
  return true;
}
