import { Locator, Page, expect, test } from '@playwright/test';
import { visibleWithin } from './wait';

/**
 * Navigation helpers for opening specific chats in E2E tests.
 *
 * Chat assignments:
 * - Bob (e2e-user-2): static 1:1 chat — for read-only tests
 * - Design Team (e2e-group-1): static group — for pagination/group tests
 * - Strategy (e2e-group-35): mutable group — for send/edit/delete tests
 * - AI Agent E2E: optional AI agent chat
 */

/** Resolves true once `locator` is visible, false if it isn't within `timeout`. */

/**
 * Wait until the open conversation is `name`'s and its message list has finished
 * its first load (shimmer gone). With `expectMessages`, also wait for a bubble.
 * Replaces fixed sleeps after opening a chat.
 */
export async function waitForChatOpen(
  page: Page,
  name: string,
  { expectMessages = false }: { expectMessages?: boolean } = {}
): Promise<void> {
  const chat = page.locator('.cometchat-messages-wrapper');
  await expect(chat.locator('.cometchat-message-header__title').first()).toContainText(name, {
    timeout: 15_000,
  });
  const list = chat.locator('.cometchat-message-list').first();
  await expect(list).toBeVisible({ timeout: 15_000 });
  await expect(chat.locator('.cometchat-message-list__shimmer')).toHaveCount(0, { timeout: 20_000 });
  if (expectMessages) {
    await expect(list.locator('.cometchat-message-bubble').first()).toBeVisible({ timeout: 15_000 });
  }
}

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
  if (await visibleWithin(groupItem(), 5_000)) {
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
  // Waits out the search debounce and the fetch it triggers.
  await expect(groupItem(), `Group "${name}" not found, even via search`).toBeVisible({
    timeout: 15_000,
  });
  await groupItem().click();

  // Leave the list unfiltered for the next helper that uses this tab.
  await searchInput.fill('').catch(() => undefined);
}

/** Open Bob Smith's 1:1 chat via Users tab */
export async function openBobChat(page: Page): Promise<void> {
  const usersTab = page.locator('.cometchat-tab-component__tab:has-text("Users")').first();
  await usersTab.click();
  await page.waitForSelector('.cometchat-users__item', { timeout: 30_000 });

  const bobUser = page.locator('.cometchat-users__item').filter({ hasText: 'Bob' }).first();
  await expect(bobUser).toBeVisible({ timeout: 5_000 });
  await bobUser.click();
  await waitForChatOpen(page, 'Bob', { expectMessages: true });
}

/** Open Design Team group chat via Groups tab */
export async function openDesignTeamChat(page: Page): Promise<void> {
  await selectGroupByName(page, 'Design Team');
  await waitForChatOpen(page, 'Design Team', { expectMessages: true });
}

/** Open Strategy group chat via Groups tab */
export async function openStrategyChat(page: Page): Promise<void> {
  await selectGroupByName(page, 'Strategy');
  await waitForChatOpen(page, 'Strategy');
  // Strategy always has messages, so an empty list is the known blank-list issue (a chat opened
  // while the SDK is still connecting never loads). That isn't what callers test, so open another
  // chat and come back: by then the SDK has connected and the list loads. (A reload would only
  // restart the race.)
  const bubble = page.locator('.cometchat-messages-wrapper .cometchat-message-bubble').first();
  if (await visibleWithin(bubble, 10_000)) return;
  test.info().annotations.push({
    type: 'known-bug',
    description: 'message list stayed blank after opening a chat during connect; reopened it',
  });
  await selectGroupByName(page, 'CI/CD');
  await waitForChatOpen(page, 'CI/CD');
  await selectGroupByName(page, 'Strategy');
  await waitForChatOpen(page, 'Strategy', { expectMessages: true });
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
  if (await visibleWithin(strategy, 5_000)) {
    await strategy.click();
  } else {
    await selectGroupByName(page, 'Strategy');
  }
  await waitForChatOpen(page, 'Strategy');
}

/** Open CI/CD group chat via Groups tab (has incoming messages for message-privately tests) */
export async function openCICDChat(page: Page): Promise<void> {
  await selectGroupByName(page, 'CI/CD');
  await waitForChatOpen(page, 'CI/CD', { expectMessages: true });
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
  const found = await visibleWithin(aiAgent, 5_000);
  if (!found) return false;

  await aiAgent.click();
  await page.waitForSelector('.cometchat-message-list, .cometchat-ai-assistant-chat', { timeout: 15_000 });
  await page.waitForTimeout(2000);
  return true;
}

/**
 * Open a conversation from the Chats list by name and wait for its messages.
 *
 * Known issue: a chat opened right after load can stay permanently blank. The
 * group-details and message-list specs enforce the fix; for tests about other
 * behaviour this records the hit in the report and reopens the chat once.
 */
export async function openConversationFromList(page: Page, name: string): Promise<void> {
  const row = page.locator('.cometchat-conversations__item').filter({ hasText: name }).first();
  const header = page.locator('.cometchat-messages-wrapper .cometchat-message-header__title').first();
  const firstBubble = page.locator('.cometchat-messages-wrapper .cometchat-message-list .cometchat-message-bubble').first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.click();
  await expect(header).toContainText(name, { timeout: 15_000 });
  if (!(await visibleWithin(firstBubble, 15_000))) {
    test.info().annotations.push({ type: 'known-bug', description: 'blank message list right after load; chat reopened' });
    await page.locator('.cometchat-conversations__item').filter({ hasNotText: name }).first().click();
    await row.click();
    await expect(header).toContainText(name, { timeout: 15_000 });
  }
  await expect(firstBubble).toBeVisible({ timeout: 20_000 });
}
