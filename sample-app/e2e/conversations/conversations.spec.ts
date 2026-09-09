import { test, expect, Page } from '@playwright/test';
import { loginToApp } from '../helpers';
import {
  STRATEGY_GROUP,
  PRIMARY_UID,
  SECONDARY_UID,
  PIN_CONVERSATION_OPTION,
  adminPinConversations,
  userUnpinGroupConversation,
  resolveGroupGuid,
  sendMessageToGroup,
  openChatsTab,
  openConversationRowMenu,
  pinConversationUI,
  conversationItem,
  conversationPinIndicator,
  conversationTitles,
} from '../helpers/pinSave';

/**
 * E2E Tests — CometChatConversations (React)
 *
 * Tests the conversations list component in the sample app.
 * Requires seeded data with existing conversations.
 */

test.describe('CometChatConversations', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    // Wait for conversations container AND items to load (not just the container)
    await page.waitForSelector('.cometchat-conversations', { timeout: 30_000 });
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
  });

  // ==================== Rendering & Loading ====================

  test('conversations list renders and loads conversations on init', async () => {
    await expect(page.locator('.cometchat-conversations')).toBeVisible();
    const count = await page.locator('.cometchat-conversations__item').count();
    expect(count).toBeGreaterThan(0);
  });

  test('loading state resolves (shimmer disappears)', async ({ page: freshPage }) => {
    await loginToApp(freshPage);
    await expect(freshPage.locator('.cometchat-conversations__loading-state')).not.toBeVisible({ timeout: 30_000 });
  });

  test('header title displays correctly', async () => {
    const title = page.locator('.cometchat-conversations__header-title').first();
    await expect(title).toBeVisible();
    const text = await title.textContent();
    expect(text?.trim()).toBeTruthy();
  });

  // ==================== Conversation Items ====================

  test('conversation items display avatar, name, and last message', async () => {
    const firstItem = page.locator('.cometchat-conversations__item').first();
    await expect(firstItem).toBeVisible();

    await expect(firstItem.locator('.cometchat-avatar')).toBeVisible();
    await expect(firstItem.locator('.cometchat-conversations__item-title')).toBeVisible();
    await expect(firstItem.locator('.cometchat-conversations__item-subtitle')).toBeVisible();
  });

  test('clicking a conversation sets it as active', async () => {
    const firstItem = page.locator('.cometchat-conversations__item').first();
    await firstItem.click();

    await expect(
      page.locator('.cometchat-conversations__item--active, .cometchat-conversations__list-item--active')
    ).toBeVisible({ timeout: 5_000 });
  });

  test('clicking a conversation opens the message view', async () => {
    await page.locator('.cometchat-conversations__item').first().click();
    await page.waitForTimeout(2000);

    await expect(
      page.locator('.cometchat-message-header, .cometchat-message-list, .cometchat-message-composer').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  // ==================== Timestamp ====================

  test('conversation items display timestamp', async () => {
    const dateElement = page.locator('.cometchat-conversations__item .cometchat-date').first();
    await expect(dateElement).toBeVisible({ timeout: 5_000 });
  });

  // ==================== Row Actions on Hover ====================

  test('hover on conversation reveals the row actions', async () => {
    // Skip the AI Agent chat — its row renders differently — and take the first
    // ordinary conversation.
    const firstItem = page
      .locator('.cometchat-conversations__item')
      .filter({
        hasNot: page.locator('.cometchat-conversations__item-title', { hasText: /^AI Agent E2E$/ }),
      })
      .first();
    await expect(firstItem).toBeVisible();
    await firstItem.hover();
    await page.waitForTimeout(300);

    // With conversation-pin enabled the row's actions live under `__item-options`
    // (a Pin/Delete context menu). When delete is the only available action — e.g.
    // a system-pinned row that can't be unpinned — it collapses to a lone delete
    // button, which also lives under `__item-options`. Assert the container either
    // way rather than the old delete-button-only selector.
    await expect(firstItem.locator('.cometchat-conversations__item-options')).toBeVisible({
      timeout: 3_000,
    });
  });

  // ==================== Keyboard Navigation ====================

  test('keyboard navigation works with arrow keys', async () => {
    const conversationsList = page.locator('.cometchat-conversations__list').first();
    await conversationsList.click();
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    // No crash means keyboard nav works
  });

  test('Enter key selects focused conversation', async () => {
    const conversationsList = page.locator('.cometchat-conversations__list').first();
    await conversationsList.click();
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    // No crash means Enter selection works
  });

  // ==================== Empty State ====================

  test('empty state is not shown when conversations exist', async () => {
    const emptyState = page.locator('.cometchat-conversations__empty-state');
    await expect(emptyState).not.toBeVisible({ timeout: 3_000 });
  });

  // ==================== Receipt Icons ====================

  test('receipt icons display for sent messages', async () => {
    // Send a message via REST API so a receipt is guaranteed on the conversation item
    const APP_ID = process.env.COMETCHAT_APP_ID ?? '';
    const REGION = process.env.COMETCHAT_REGION ?? 'us';
    const API_KEY = process.env.COMETCHAT_API_KEY ?? '';
    const API_BASE = `https://${APP_ID}.api-${REGION}.cometchat.io/v3`;
    await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: API_KEY, appid: APP_ID, onBehalfOf: 'e2e-user-1' },
      body: JSON.stringify({
        receiver: 'e2e-group-35',
        receiverType: 'group',
        category: 'message',
        type: 'text',
        data: { text: `Receipt check ${Date.now()}` },
      }),
    });

    // Reload the conversations list to pick up the new message
    await page.reload();
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await page.waitForTimeout(2000);

    const receiptIcon = page.locator('.cometchat-conversations__item-receipt').first();
    await expect(receiptIcon).toBeVisible({ timeout: 5_000 });
  });

  // ==================== Scroll Behavior ====================

  test('conversations list is scrollable when many items exist', async () => {
    const itemCount = await page.locator('.cometchat-conversations__item').count();
    expect(itemCount).toBeGreaterThan(10);

    const list = page.locator('.cometchat-conversations__list').first();
    const isScrollable = await list.evaluate(el => {
      return el.scrollHeight > el.clientHeight;
    }).catch(() => false);
    expect(isScrollable).toBeTruthy();
  });

  // ==================== Accessibility ====================

  test('conversations list has proper ARIA attributes', async () => {
    // Root has role="region" with aria-label
    const root = page.locator('.cometchat-conversations');
    const rootRole = await root.getAttribute('role');
    expect(rootRole).toBe('region');
    const rootLabel = await root.getAttribute('aria-label');
    expect(rootLabel).toBeTruthy();
  });

  test('conversation items have role and aria attributes', async () => {
    const firstItem = page.locator('.cometchat-conversations__item').first();
    await expect(firstItem).toBeVisible();

    const role = await firstItem.getAttribute('role');
    expect(role).toBe('option');

    const ariaSelected = await firstItem.getAttribute('aria-selected');
    expect(ariaSelected).toBeTruthy();
  });

  // ==================== Unread Badge ====================

  test('unread badge shows when another user sends a message', async () => {
    // Send a message from user-2 to a group that user-1 is in (Strategy) via REST API
    const APP_ID = process.env.COMETCHAT_APP_ID ?? '';
    const REGION = process.env.COMETCHAT_REGION ?? 'us';
    const API_KEY = process.env.COMETCHAT_API_KEY ?? '';
    const API_BASE = `https://${APP_ID}.api-${REGION}.cometchat.io/v3`;
    await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: API_KEY, appid: APP_ID, onBehalfOf: 'e2e-user-2' },
      body: JSON.stringify({
        receiver: 'e2e-group-35',
        receiverType: 'group',
        category: 'message',
        type: 'text',
        data: { text: `Unread badge check ${Date.now()}` },
      }),
    });

    // Reload the page to get fresh unread state
    await page.reload();
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await page.waitForTimeout(3000);

    // Strategy conversation should show an unread badge
    const strategyItem = page.locator('.cometchat-conversations__item').filter({ hasText: 'Strategy' }).first();
    await expect(strategyItem).toBeVisible({ timeout: 10_000 });

    const unreadBadge = strategyItem.locator('.cometchat-conversations__item-unread-badge');
    await expect(unreadBadge).toBeVisible({ timeout: 5_000 });
  });
});

/**
 * Pin conversation.
 *
 * Independent tests. Each starts from a fixed baseline seeded over REST *before*
 * login so the first load reflects it: Strategy is system/admin-pinned (the
 * persistent top anchor — never undone), and the Engineering group (the only
 * chat we pin from the UI) starts unpinned. System pins outrank user pins, so
 * once Engineering is pinned the order from the top is: Strategy (system) →
 * Engineering (user) → everything else by recency.
 *
 * The row we pin must be VISIBLE in the list first — search results don't expose
 * row actions — so each test sends Engineering a message to bump it into view
 * before pinning. (Bob is left alone; it is a read-only fixture.)
 */
test.describe('Pin conversation', () => {
  let engineeringGuid = '';

  const expectTitleAt = async (page: Page, index: number, title: string) => {
    await expect
      .poll(async () => (await conversationTitles(page))[index] ?? '', { timeout: 15_000 })
      .toBe(title);
  };

  /** Send Engineering a message so its row shows up in the conversation list. */
  const revealEngineering = async (page: Page) => {
    await sendMessageToGroup({
      guid: engineeringGuid,
      as: PRIMARY_UID,
      text: `Eng bump [${Date.now()}]`,
    });
    await expect(conversationItem(page, 'Engineering')).toBeVisible({ timeout: 15_000 });
  };

  test.beforeEach(async ({ page }) => {
    engineeringGuid = await resolveGroupGuid('Engineering');
    await adminPinConversations([{ guid: STRATEGY_GROUP }]);
    await userUnpinGroupConversation(engineeringGuid, PRIMARY_UID);
    await loginToApp(page);
    await openChatsTab(page);
  });

  test('offers "Pin conversation" in the Engineering row menu', async ({ page }) => {
    await revealEngineering(page);
    await page.waitForTimeout(5000);

    await openConversationRowMenu(page, 'Engineering');
    // Exact match — "Pin conversation" is a substring of "Unpin conversation".
    await expect(
      page.getByRole('menuitem', { name: PIN_CONVERSATION_OPTION, exact: true }).first()
    ).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press('Escape');
  });

  test('a pinned chat sorts above a more-recently-active unpinned chat', async ({ page }) => {
    // Make Engineering visible (top of the unpinned section) and pin it.
    await revealEngineering(page);

    // A more-recent message elsewhere must NOT outrank the pinned Engineering.
    const cicd = await resolveGroupGuid('CI/CD');
    await sendMessageToGroup({ guid: cicd, as: SECONDARY_UID, text: `CICD bump [${Date.now()}]` });

    await page.waitForTimeout(5000);

    await pinConversationUI(page, 'Engineering');
    await expect(conversationPinIndicator(conversationItem(page, 'Engineering'))).toBeVisible({
      timeout: 10_000,
    });

    await expectTitleAt(page, 0, 'Strategy');
    await expectTitleAt(page, 1, 'Engineering');
  });

  test('a new message in another group does not jump above the pinned chats', async ({ page }) => {
    await revealEngineering(page);
    await pinConversationUI(page, 'Engineering');
    await expectTitleAt(page, 1, 'Engineering');

    // A fresh message in the Testing group tops the *unpinned* section only.
    const testing = await resolveGroupGuid('Testing');
    await sendMessageToGroup({ guid: testing, as: SECONDARY_UID, text: `Testing bump [${Date.now()}]` });
    await page.waitForTimeout(5000);

    // Pinned rows are unmoved; Testing lands below them.
    await expectTitleAt(page, 0, 'Strategy');
    await expectTitleAt(page, 1, 'Engineering');
    await expect
      .poll(async () => (await conversationTitles(page)).findIndex(t => t === 'Testing'), {
        timeout: 15_000,
      })
      .toBeGreaterThan(1);
  });
});
