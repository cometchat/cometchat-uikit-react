import { test, expect } from '@playwright/test';
import { loginToApp, openStrategyChatFromConversations, openBobChat, openStrategyChat, SECONDARY_USER } from './helpers';

/**
 * Full Journey E2E Test — CometChat React UIKit
 *
 * Each test is INDEPENDENT — logs in fresh, navigates to the right chat.
 * No shared state between tests. If one fails, others still run.
 */

const RUN_ID = Date.now().toString(36);

test.describe('Full App Journey', () => {

  // ═══════════════════════════════════════════════════════════
  // SECTION 1: CONVERSATIONS TAB
  // ═══════════════════════════════════════════════════════════

  test('1.1 — Conversations list loads with items', async ({ page }) => {
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations', { timeout: 30_000 });
    const items = page.locator('.cometchat-conversations__item');
    await expect(items.first()).toBeVisible({ timeout: 15_000 });
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('1.2 — Open Strategy conversation shows message list', async ({ page }) => {
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChatFromConversations(page);
    await expect(page.locator('.cometchat-message-list').first()).toBeVisible();
    await expect(page.locator('.cometchat-message-composer').first()).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 2: SEND MESSAGE
  // ═══════════════════════════════════════════════════════════

  test('2.1 — Send a text message and verify it appears', async ({ page }) => {
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChatFromConversations(page);

    // Wait for messages to fully load
    await page.waitForSelector('.cometchat-message-bubble', { timeout: 15_000 });
    await page.waitForTimeout(2000);

    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();

    const textMsg = `Hello from full-journey [${RUN_ID}]`;
    await page.keyboard.type(textMsg);

    const sendBtn = composer.locator('[class*="send-button"], [class*="send"], button[aria-label*="Send" i]').first();
    await sendBtn.click();

    await expect(
      page.locator('.cometchat-message-list').getByText(textMsg)
    ).toBeVisible({ timeout: 15_000 });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 3: MESSAGE ACTIONS (on Bob chat — static)
  // ═══════════════════════════════════════════════════════════

  test('3.1 — Message info panel opens for outgoing message', async ({ page }) => {
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openBobChat(page);

    const outgoing = page.locator('.cometchat-message-bubble__wrapper--outgoing').last();
    await expect(outgoing).toBeVisible({ timeout: 10_000 });

    const bodyArea = outgoing.locator('.cometchat-message-bubble__body').first();
    await bodyArea.hover();
    await page.waitForTimeout(500);

    const moreBtn = outgoing.locator('button[aria-label*="More" i]').first();
    await expect(moreBtn).toBeVisible({ timeout: 5_000 });
    await moreBtn.click();
    await page.waitForTimeout(500);

    const infoOption = page.locator('[role="menuitem"]:has-text("Info")').first();
    await expect(infoOption).toBeVisible({ timeout: 5_000 });
    await infoOption.click();
    await page.waitForTimeout(1000);

    const infoPanel = page.getByRole('dialog', { name: 'Message Information' });
    await expect(infoPanel).toBeVisible({ timeout: 5_000 });

    await infoPanel.getByRole('button', { name: 'Close' }).click();
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 4: USERS TAB
  // ═══════════════════════════════════════════════════════════

  test('4.1 — Switch to Users tab and browse users', async ({ page }) => {
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });

    const usersTab = page.locator('.cometchat-tab-component__tab:has-text("Users")').first();
    await usersTab.click();
    await page.waitForTimeout(3000);

    await expect(page.locator('.cometchat-users')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.cometchat-users__item').first()).toBeVisible({ timeout: 30_000 });
  });

  test('4.2 — Click a user to open chat', async ({ page }) => {
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });

    const usersTab = page.locator('.cometchat-tab-component__tab:has-text("Users")').first();
    await usersTab.click();
    await page.waitForSelector('.cometchat-users__item', { timeout: 30_000 });

    await page.locator('.cometchat-users__item').first().click();
    await page.waitForTimeout(2000);

    await expect(page.locator('.cometchat-message-list').first()).toBeVisible({ timeout: 15_000 });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 5: GROUPS TAB
  // ═══════════════════════════════════════════════════════════

  test('5.1 — Switch to Groups tab and browse groups', async ({ page }) => {
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });

    const groupsTab = page.locator('.cometchat-tab-component__tab:has-text("Groups")').first();
    await groupsTab.click();
    await page.waitForTimeout(3000);

    await expect(page.locator('.cometchat-groups')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.cometchat-groups__item').first()).toBeVisible({ timeout: 30_000 });
  });

  test('5.2 — Open a group conversation', async ({ page }) => {
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChat(page);

    await expect(page.locator('.cometchat-message-list').first()).toBeVisible({ timeout: 10_000 });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 6: CALLS TAB
  // ═══════════════════════════════════════════════════════════

  test('6.1 — Switch to Calls tab and verify it renders', async ({ page }) => {
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });

    const callsTab = page.locator('.cometchat-tab-component__tab:has-text("Calls")').first();
    await callsTab.click();
    await page.waitForTimeout(2000);

    const callContent = page.locator('[class*="call-log"], [class*="call-list"], .cometchat-call-logs__empty-state-view').first();
    await expect(callContent).toBeVisible({ timeout: 10_000 });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 7: MESSAGE HEADER
  // ═══════════════════════════════════════════════════════════

  test('7.1 — Message header shows user name and avatar', async ({ page }) => {
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openBobChat(page);

    const header = page.locator('.cometchat-message-header').first();
    await expect(header).toBeVisible({ timeout: 10_000 });

    const headerText = await header.textContent();
    expect(headerText?.trim()).toBeTruthy();
  });


  // ═══════════════════════════════════════════════════════════
  // SECTION 8: REAL-TIME — Second user receives message
  // ═══════════════════════════════════════════════════════════

  // test('8.1 — User B receives real-time message from User A', async ({ browser }) => {
  //   // User A page
  //   const ctxA = await browser.newContext();
  //   const pageA = await ctxA.newPage();
  //   await loginToApp(pageA);
  //   await pageA.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
  //   await openStrategyChatFromConversations(pageA);
  //   await pageA.waitForSelector('.cometchat-message-bubble', { timeout: 15_000 });
  //   await pageA.waitForTimeout(2000);

  //   // User B page — login as secondary user
  //   const ctxB = await browser.newContext();
  //   const pageB = await ctxB.newPage();
  //   await loginToApp(pageB, SECONDARY_USER);
  //   await pageB.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });

  //   // Wait for User B's websocket + message listeners to fully establish
  //   await pageB.waitForTimeout(5000);

  //   // Send message from User A
  //   const composer = pageA.locator('.cometchat-message-composer').first();
  //   const input = composer.locator('[contenteditable="true"]').first();
  //   await input.click();

  //   const realtimeMsg = `Realtime check [${RUN_ID}]`;
  //   await pageA.keyboard.type(realtimeMsg);
  //   const sendBtn = composer.locator('[class*="send-button"], button[aria-label*="Send" i]').first();
  //   await sendBtn.click();

  //   // Verify User A sees the message
  //   await expect(
  //     pageA.locator('.cometchat-message-list').getByText(realtimeMsg)
  //   ).toBeVisible({ timeout: 15_000 });

  //   // Wait for real-time delivery to User B via websocket
  //   // Check User B's Strategy conversation subtitle for the message text
  //   const strategyConv = pageB.locator('.cometchat-conversations__item').filter({ hasText: 'Strategy' }).first();
  //   await expect(strategyConv).toBeVisible({ timeout: 10_000 });

  //   const subtitle = strategyConv.locator('.cometchat-conversations__item-subtitle');
  //   await expect(subtitle.getByText(realtimeMsg.substring(0, 15))).toBeVisible({ timeout: 15_000 });

  //   await ctxA.close();
  //   await ctxB.close();
  // });

  // ═══════════════════════════════════════════════════════════
  // SECTION 8b: CREATE A POLL
  // ═══════════════════════════════════════════════════════════

  test('8b.1 — Create a poll from attachment menu', async ({ page }) => {
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChatFromConversations(page);
    await page.waitForSelector('.cometchat-message-bubble', { timeout: 15_000 });
    await page.waitForTimeout(2000);

    // Click attachment button
    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(1000);

    // Attachment options list should open
    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    // Click the "Polls" option
    const pollOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Poll")'),
    }).first();
    await expect(pollOption).toBeVisible({ timeout: 3_000 });
    await pollOption.click();
    await page.waitForTimeout(1000);

    // Create Poll modal should open
    const pollModal = page.locator('.cometchat-create-poll').first();
    await expect(pollModal).toBeVisible({ timeout: 5_000 });

    // Fill question with a unique identifier
    const pollQuestion = `E2E Poll [${RUN_ID}]`;
    const questionInput = pollModal.locator('.cometchat-create-poll__question-input').first();
    await expect(questionInput).toBeVisible({ timeout: 3_000 });
    await questionInput.fill(pollQuestion);

    // Fill at least 2 options (they should be pre-rendered)
    const optionInputs = pollModal.locator('.cometchat-create-poll__option-input');
    const optionCount = await optionInputs.count();
    expect(optionCount).toBeGreaterThanOrEqual(2);

    await optionInputs.nth(0).fill('Option A');
    await optionInputs.nth(1).fill('Option B');

    // Click Create button
    const createBtn = pollModal.locator('.cometchat-create-poll__create-button').first();
    await expect(createBtn).toBeVisible({ timeout: 3_000 });
    await createBtn.click();
    await page.waitForTimeout(3000);

    // Modal should close
    await expect(pollModal).not.toBeVisible({ timeout: 5_000 });

    // The poll is created via CometChat.callExtension (server-side), not via the
    // optimistic send flow. The message arrives back as onCustomMessageReceived.
    // If it doesn't appear in real-time, reload to verify it was created.
    const pollBubbleWithQuestion = page.locator('.cometchat-poll-bubble__question').filter({ hasText: pollQuestion });
    let pollVisible = await pollBubbleWithQuestion.first()
      .isVisible({ timeout: 10_000 }).catch(() => false);

    if (!pollVisible) {
      // Reload and re-navigate to verify the poll was persisted
      await page.reload();
      await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
      await openStrategyChatFromConversations(page);
      await page.waitForSelector('.cometchat-message-bubble', { timeout: 15_000 });
      pollVisible = await pollBubbleWithQuestion.first()
        .isVisible({ timeout: 10_000 }).catch(() => false);
    }

    expect(pollVisible).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 8c: COLLABORATIVE DOCUMENT
  // ═══════════════════════════════════════════════════════════

  test('8c.1 — Collaborative Document from attachment menu', async ({ page }) => {
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChatFromConversations(page);
    await page.waitForSelector('.cometchat-message-bubble', { timeout: 15_000 });
    await page.waitForTimeout(2000);

    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(1000);

    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    // Click the "Collaborative Document" option
    const docOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Document")'),
    }).first();
    await expect(docOption).toBeVisible({ timeout: 3_000 });
    await docOption.click();
    await page.waitForTimeout(3000);

    // Collaborative bubble (document type) should appear (reload fallback)
    const docCountBefore = await page.locator('.cometchat-collaborative-bubble--document').count();

    // Wait for real-time delivery first
    await page.waitForTimeout(5_000);
    let docCountAfter = await page.locator('.cometchat-collaborative-bubble--document').count();

    // If count didn't increase (websocket didn't deliver), reload to fetch from server
    if (docCountAfter <= docCountBefore) {
      await page.reload();
      await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
      await openStrategyChatFromConversations(page);
      await page.waitForSelector('.cometchat-message-bubble', { timeout: 15_000 });
      docCountAfter = await page.locator('.cometchat-collaborative-bubble--document').count();
    }

    // Verify count increased (not matching an old bubble)
    expect(docCountAfter).toBeGreaterThan(docCountBefore);

    // Bubble should have an "Open" button
    const openBtn = page.locator('.cometchat-collaborative-bubble--document .cometchat-collaborative-bubble__button').last();
    await expect(openBtn).toBeVisible({ timeout: 5_000 });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 8d: COLLABORATIVE WHITEBOARD
  // ═══════════════════════════════════════════════════════════

  test('8d.1 — Collaborative Whiteboard from attachment menu', async ({ page }) => {
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChatFromConversations(page);
    await page.waitForSelector('.cometchat-message-bubble', { timeout: 15_000 });
    await page.waitForTimeout(2000);

    const attachBtn = page.locator('.cometchat-message-composer__attachment-button').first();
    await expect(attachBtn).toBeVisible({ timeout: 5_000 });
    await attachBtn.click();
    await page.waitForTimeout(1000);

    const optionsList = page.locator('.cometchat-message-composer__attachment-list').first();
    await expect(optionsList).toBeVisible({ timeout: 5_000 });

    // Click the "Collaborative Whiteboard" option
    const wbOption = optionsList.locator('.cometchat-message-composer__attachment-option').filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title:has-text("Whiteboard")'),
    }).first();
    await expect(wbOption).toBeVisible({ timeout: 3_000 });
    await wbOption.click();
    await page.waitForTimeout(3000);

    // Collaborative bubble (whiteboard type) should appear (reload fallback)
    const wbCountBefore = await page.locator('.cometchat-collaborative-bubble--whiteboard').count();

    // Wait for real-time delivery first
    await page.waitForTimeout(5_000);
    let wbCountAfter = await page.locator('.cometchat-collaborative-bubble--whiteboard').count();

    // If count didn't increase (websocket didn't deliver), reload to fetch from server
    if (wbCountAfter <= wbCountBefore) {
      await page.reload();
      await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
      await openStrategyChatFromConversations(page);
      await page.waitForSelector('.cometchat-message-bubble', { timeout: 15_000 });
      wbCountAfter = await page.locator('.cometchat-collaborative-bubble--whiteboard').count();
    }

    // Verify count increased (not matching an old bubble)
    expect(wbCountAfter).toBeGreaterThan(wbCountBefore);

    // Bubble should have an "Open" button
    const openBtn = page.locator('.cometchat-collaborative-bubble--whiteboard .cometchat-collaborative-bubble__button').last();
    await expect(openBtn).toBeVisible({ timeout: 5_000 });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 9: REGRESSION — No error on rapid click during load
  // ═══════════════════════════════════════════════════════════

  test('9.1 — Clicking conversation during load does not show error state', async ({ page }) => {
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });

    // Reload to trigger the loading state
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Click the first conversation as soon as it appears (may still be loading)
    const convItem = page.locator('.cometchat-conversations__item').first();
    await expect(convItem).toBeVisible({ timeout: 30_000 });
    await convItem.click();
    await page.waitForTimeout(3000);

    // "Something went wrong" error state must NOT appear
    const errorState = page.locator('[class*="error-state"], [class*="something-went-wrong"]').first();
    const hasError = await errorState.isVisible({ timeout: 2_000 }).catch(() => false);
    expect(hasError).toBeFalsy();

    // Message area should render normally
    await expect(
      page.locator('.cometchat-message-list, .cometchat-message-composer').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 10: REGRESSION — Info panel stays open after load
  // ═══════════════════════════════════════════════════════════

  test('10.1 — Info panel stays open after messages finish loading', async ({ page }) => {
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openBobChat(page);

    // Open user details panel immediately
    const headerTitle = page.locator('.cometchat-message-header__title, .cometchat-message-header .cometchat-avatar').first();
    await headerTitle.click();
    await page.waitForTimeout(500);

    // Panel should be open
    const detailsPanel = page.locator('.side-component-wrapper').first();
    await expect(detailsPanel).toBeVisible({ timeout: 5_000 });

    // Wait for messages to fully finish loading
    await page.waitForTimeout(5000);

    // Panel should STILL be open after messages loaded
    await expect(detailsPanel).toBeVisible({ timeout: 3_000 });
  });
});
