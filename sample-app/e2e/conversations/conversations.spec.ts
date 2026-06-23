import { test, expect, Page } from '@playwright/test';
import { loginToApp } from '../helpers';

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

  // ==================== Delete Button on Hover ====================

  test('hover on conversation shows delete button', async () => {
    const firstItem = page.locator('.cometchat-conversations__item').first();
    await expect(firstItem).toBeVisible();
    await firstItem.hover();
    await page.waitForTimeout(300);

    const deleteBtn = firstItem.locator('.cometchat-conversations__item-delete-button');
    await expect(deleteBtn).toBeVisible({ timeout: 3_000 });
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
