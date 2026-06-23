import { test, expect, Page } from '@playwright/test';
import { loginToApp, openStrategyChat } from '../helpers';

/**
 * E2E Tests — CometChatThreadView (React)
 *
 * Tests the thread header and threaded messages functionality.
 * The first test creates a thread reply so subsequent tests can verify thread UI.
 */

test.describe('CometChatThreadView', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openStrategyChat(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ==================== Create Thread Reply First ====================

  test('open reply in thread and send a reply', async () => {
    // Target a message bubble and hover its body
    const outgoingWrapper = page.locator('.cometchat-message-bubble__wrapper--outgoing').last();
    await expect(outgoingWrapper).toBeVisible({ timeout: 10_000 });

    const bodyArea = outgoingWrapper.locator('.cometchat-message-bubble__body').first();
    await bodyArea.hover();
    await page.waitForTimeout(500);

    // Click "More options" button (context menu trigger)
    const moreBtn = outgoingWrapper.locator('button[aria-label*="More" i]').first();
    await expect(moreBtn).toBeVisible({ timeout: 5_000 });
    await moreBtn.click();
    await page.waitForTimeout(500);

    // Click "Reply in thread" from the context menu
    const replyInThread = page.locator('[role="menuitem"]:has-text("Reply in thread")').first();
    await expect(replyInThread).toBeVisible({ timeout: 5_000 });
    await replyInThread.click();
    await page.waitForTimeout(2000);

    // Thread panel should open
    const threadPanel = page.locator('.cometchat-thread-panel__messages, .cometchat-thread-panel-wrapper').first();
    await expect(threadPanel).toBeVisible({ timeout: 10_000 });

    // Type and send a reply in the thread composer
    const threadComposer = threadPanel.locator('.cometchat-message-composer').first();
    await expect(threadComposer).toBeVisible({ timeout: 5_000 });

    const threadInput = threadComposer.locator('[contenteditable="true"]').first();
    await threadInput.click();
    await page.keyboard.type(`Thread reply ${Date.now()}`);
    await page.waitForTimeout(300);

    // Send via send button
    const sendBtn = threadComposer.locator('[class*="send-button"], button[aria-label*="Send" i]').first();
    await sendBtn.click();
    await page.waitForTimeout(3000);

    // Verify the reply appeared in thread
    const threadMessages = page.locator('.cometchat-thread-panel__messages .cometchat-message-bubble');
    await expect(threadMessages.first()).toBeVisible({ timeout: 10_000 });

    // Close thread to return to main view
    const closeBtn = page.locator('.cometchat-thread-header__close-button').first();
    await closeBtn.click();
    await page.waitForTimeout(1000);
  });

  // ==================== Opening Thread ====================

  test('clicking thread reply count opens thread view', async () => {
    const threadReply = page.locator('.cometchat-thread-view').first();
    await expect(threadReply).toBeVisible({ timeout: 10_000 });
    await threadReply.click();

    await expect(
      page.locator('.cometchat-thread-header')
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('.cometchat-thread-panel__messages')
    ).toBeVisible({ timeout: 10_000 });
  });

  // ==================== Thread Header ====================

  test('thread header renders parent message preview', async () => {
    const preview = page.locator('.cometchat-thread-header__bubble-wrapper');
    await expect(preview).toBeVisible({ timeout: 5_000 });
  });

  test('thread header shows reply count', async () => {
    const replyCount = page.locator('.cometchat-thread-header__reply-count');
    await expect(replyCount).toBeVisible({ timeout: 5_000 });
    const text = await replyCount.textContent();
    expect(text?.trim()).toBeTruthy();
  });

  test('thread header has close/back button', async () => {
    const closeBtn = page.locator('.cometchat-thread-header__close-button');
    await expect(closeBtn).toBeVisible({ timeout: 5_000 });
  });

  // ==================== Thread Message List ====================

  test('thread message list loads replies', async () => {
    const threadMessages = page.locator('.cometchat-thread-panel__messages .cometchat-message-bubble');
    await expect(threadMessages.first()).toBeVisible({ timeout: 5_000 });
  });

  // ==================== Thread Composer ====================

  test('thread has its own message composer', async () => {
    const threadComposer = page.locator('.cometchat-thread-panel .cometchat-message-composer');
    await expect(threadComposer).toBeVisible({ timeout: 5_000 });
  });

  // ==================== Close Thread ====================

  test('closing thread returns to main view', async () => {
    const closeBtn = page.locator('.cometchat-thread-header__close, [class*="thread-header"] [class*="close"]').first();
    await closeBtn.click();

    await expect(
      page.locator('.cometchat-thread-header')
    ).not.toBeVisible({ timeout: 5_000 });
  });

  // ==================== Accessibility ====================

  test('thread header has proper ARIA attributes', async () => {
    // Re-open thread for this test
    const threadReply = page.locator('.cometchat-thread-view').first();
    await expect(threadReply).toBeVisible({ timeout: 10_000 });
    await threadReply.click();
    await page.waitForSelector('.cometchat-thread-header', { timeout: 10_000 });

    const closeBtn = page.locator('.cometchat-thread-header__close-button').first();
    await expect(closeBtn).toBeVisible({ timeout: 5_000 });
    const label = await closeBtn.getAttribute('aria-label');
    expect(label).toBeTruthy();
  });

  // ==================== Regression: No preview leak ====================

  test('thread reply does NOT leak reply preview into main composer', async () => {
    // Ensure thread is open (re-open if closed by prior test)
    const threadHeader = page.locator('.cometchat-thread-header').first();
    const isOpen = await threadHeader.isVisible().catch(() => false);
    if (!isOpen) {
      const threadReply = page.locator('.cometchat-thread-view').first();
      await expect(threadReply).toBeVisible({ timeout: 10_000 });
      await threadReply.click();
      await page.waitForSelector('.cometchat-thread-header', { timeout: 10_000 });
    }

    // Find the thread panel
    const threadPanel = page.locator('.cometchat-thread-panel-wrapper, .cometchat-thread-panel').first();
    await expect(threadPanel).toBeVisible({ timeout: 5_000 });

    // Wait for thread message list to load
    await page.waitForTimeout(5000);

    // Send a new message in the thread so we have a confirmed bubble to interact with
    const threadComposer = threadPanel.locator('.cometchat-message-composer').first();
    await expect(threadComposer).toBeVisible({ timeout: 5_000 });
    const threadInput = threadComposer.locator('[contenteditable="true"]').first();
    await threadInput.click();
    await page.keyboard.type(`Thread leak test ${Date.now()}`);
    const sendBtn = threadComposer.locator('[class*="send-button"], button[aria-label*="Send" i]').first();
    await sendBtn.click();

    // Wait for the message to appear and confirm (pending → sent)
    await page.waitForTimeout(5000);

    // Hover the last message in the thread to get options
    const lastThreadBubble = threadPanel.locator('.cometchat-message-bubble__body-wrapper').last();
    await expect(lastThreadBubble).toBeVisible({ timeout: 5_000 });
    await lastThreadBubble.hover();
    await page.waitForTimeout(500);

    // Click the Reply quick action in the thread
    const replyBtn = threadPanel.locator('button[aria-label="Reply"]').last();
    await expect(replyBtn).toBeVisible({ timeout: 5_000 });
    await replyBtn.click();
    await page.waitForTimeout(1000);

    // The MAIN composer (outside thread panel) must NOT show reply preview
    const mainComposer = page.locator('.cometchat-message-composer').first();
    const mainReplyPreview = mainComposer.locator('.cometchat-message-composer__reply-preview');
    await expect(mainReplyPreview).not.toBeVisible({ timeout: 3_000 });
  });
});
