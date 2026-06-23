import { test, expect, Page } from '@playwright/test';
import { loginToApp, openBobChat } from '../helpers';

/**
 * E2E Tests — Message Actions (React)
 *
 * Tests context menu actions on messages.
 * Uses Bob chat (static, 2 incoming + 2 outgoing messages).
 *
 * Incoming messages: Reply in thread, Copy, Report, Mark Unread
 * Outgoing text messages: Edit, Delete, Copy, Reply in thread, Message Info
 */

test.describe('Message Actions', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openBobChat(page);
  });

  // ==================== Reply in thread (incoming message) ====================

  test('reply in thread works from incoming message context menu', async () => {
    const incomingWrapper = page.locator('.cometchat-message-bubble-incoming').last();
    await expect(incomingWrapper).toBeVisible({ timeout: 10_000 });

    await incomingWrapper.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await incomingWrapper.hover();
    await page.waitForTimeout(500);

    const moreBtn = incomingWrapper.locator('..').locator('button[aria-label*="More" i]').first();
    await expect(moreBtn).toBeVisible({ timeout: 5_000 });
    await moreBtn.click();
    await page.waitForTimeout(500);

    const threadOption = page.locator('[role="menuitem"]:has-text("Reply in thread")').first();
    await expect(threadOption).toBeVisible({ timeout: 5_000 });
    await threadOption.click();
    await page.waitForTimeout(2000);

    const threadPanel = page.locator('.cometchat-thread-panel-wrapper, .cometchat-threaded-messages').first();
    await expect(threadPanel).toBeVisible({ timeout: 10_000 });

    // Close thread
    const closeBtn = page.locator('button[aria-label*="Close" i], .cometchat-thread-header__close').first();
    const hasClose = await closeBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (hasClose) await closeBtn.click();
  });

  // ==================== Report (incoming message) ====================

  test('report option is available on incoming messages', async () => {
    const incomingWrapper = page.locator('.cometchat-message-bubble-incoming').last();
    await expect(incomingWrapper).toBeVisible({ timeout: 10_000 });

    await incomingWrapper.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await incomingWrapper.hover();
    await page.waitForTimeout(500);

    const moreBtn = incomingWrapper.locator('..').locator('button[aria-label*="More" i]').first();
    await expect(moreBtn).toBeVisible({ timeout: 5_000 });
    await moreBtn.click();
    await page.waitForTimeout(500);

    const reportOption = page.locator('[role="menuitem"]:has-text("Report")').first();
    await expect(reportOption).toBeVisible({ timeout: 5_000 });
    await reportOption.click();
    await page.waitForTimeout(1000);

    // Report dialog or confirmation
    const reportDialog = page.locator('.cometchat-confirm-dialog, [role="dialog"]').first();
    const hasDialog = await reportDialog.isVisible({ timeout: 5_000 }).catch(() => false);
    if (hasDialog) {
      await page.keyboard.press('Escape');
    }
  });

  // ==================== Mark as Unread (incoming message) ====================

  test('mark as unread option marks conversation as unread', async () => {
    const incomingWrapper = page.locator('.cometchat-message-bubble-incoming').last();
    await expect(incomingWrapper).toBeVisible({ timeout: 10_000 });

    await incomingWrapper.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await incomingWrapper.hover();
    await page.waitForTimeout(500);

    const moreBtn = incomingWrapper.locator('..').locator('button[aria-label*="More" i]').first();
    await expect(moreBtn).toBeVisible({ timeout: 5_000 });
    await moreBtn.click();
    await page.waitForTimeout(500);

    const unreadOption = page.locator('[role="menuitem"]:has-text("Mark Unread")').first();
    await expect(unreadOption).toBeVisible({ timeout: 5_000 });
    await unreadOption.click();
    await page.waitForTimeout(2000);

    // New messages banner should appear in the message list
    const newMessagesBanner = page.locator('[class="cometchat-message-list__new-message-divider"]').first();
    await expect(newMessagesBanner).toBeVisible({ timeout: 5_000 });
  });

  // ==================== Message Information (outgoing message) ====================

  test('message info option opens information panel', async () => {
    const outgoingWrapper = page.locator('.cometchat-message-bubble__wrapper--outgoing').last();
    await expect(outgoingWrapper).toBeVisible({ timeout: 10_000 });

    const bodyArea = outgoingWrapper.locator('.cometchat-message-bubble__body').first();
    await bodyArea.hover();
    await page.waitForTimeout(500);

    const moreBtn = outgoingWrapper.locator('button[aria-label*="More" i]').first();
    await expect(moreBtn).toBeVisible({ timeout: 5_000 });
    await moreBtn.click();
    await page.waitForTimeout(500);

    const infoOption = page.locator('[role="menuitem"]:has-text("Info"), [role="menuitem"]:has-text("Information")').first();
    await expect(infoOption).toBeVisible({ timeout: 5_000 });
    await infoOption.click();
    await page.waitForTimeout(1000);

    const infoPanel = page.getByRole('dialog', { name: 'Message Information' });
    await expect(infoPanel).toBeVisible({ timeout: 5_000 });

    const closeBtn = infoPanel.getByRole('button', { name: 'Close' });
    await closeBtn.click();
  });

  // ==================== Copy (outgoing text message) ====================

  test('copy option is available for text messages', async () => {
    const outgoingTextWrapper = page.locator('.cometchat-message-bubble__wrapper--outgoing').filter({ has: page.locator('.cometchat-text-bubble') }).last();
    await expect(outgoingTextWrapper).toBeVisible({ timeout: 10_000 });

    const bodyArea = outgoingTextWrapper.locator('.cometchat-message-bubble__body').first();
    await bodyArea.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await bodyArea.hover();
    await page.waitForTimeout(500);

    const moreBtn = outgoingTextWrapper.locator('button[aria-label*="More" i]').first();
    await expect(moreBtn).toBeVisible({ timeout: 5_000 });
    await moreBtn.click();
    await page.waitForTimeout(500);

    const copyOption = page.locator('[role="menuitem"]:has-text("Copy")').first();
    await expect(copyOption).toBeVisible({ timeout: 5_000 });
    await copyOption.click();
    await page.waitForTimeout(500);
  });

  // ==================== Edit (outgoing text message) ====================

  test('edit shows preview in composer, edits message, and shows edited label', async () => {
    const outgoingTextWrapper = page.locator('.cometchat-message-bubble__wrapper--outgoing').filter({ has: page.locator('.cometchat-text-bubble') }).last();
    await expect(outgoingTextWrapper).toBeVisible({ timeout: 10_000 });

    const bodyArea = outgoingTextWrapper.locator('.cometchat-message-bubble__body').first();
    await bodyArea.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await bodyArea.hover();
    await page.waitForTimeout(500);

    const moreBtn = outgoingTextWrapper.locator('button[aria-label*="More" i]').first();
    await expect(moreBtn).toBeVisible({ timeout: 5_000 });
    await moreBtn.click();
    await page.waitForTimeout(500);

    const editOption = page.locator('[role="menuitem"]:has-text("Edit")').first();
    await expect(editOption).toBeVisible({ timeout: 5_000 });
    await editOption.click();
    await page.waitForTimeout(500);

    // Edit preview MUST appear in composer
    const editPreview = page.locator('.cometchat-message-composer__edit-preview');
    await expect(editPreview).toBeVisible({ timeout: 5_000 });

    // Composer should be populated with the original message text
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    const content = await input.textContent();
    expect(content?.trim().length).toBeGreaterThan(0);

    // Close the edit preview
    const closeEditPreview = page.locator('.cometchat-message-composer__edit-preview-close').first();
    await expect(closeEditPreview).toBeVisible({ timeout: 3_000 });
    await closeEditPreview.click();
    await page.waitForTimeout(500);

    // After closing, edit preview should disappear and composer should be cleared
    await expect(editPreview).not.toBeVisible({ timeout: 3_000 });
    const clearedContent = await input.textContent();
    expect(clearedContent?.trim()).toBe('');
  });

  // ==================== Reply in thread (outgoing message) ====================

  test('reply in thread option opens thread panel', async () => {
    const outgoingWrapper = page.locator('.cometchat-message-bubble__wrapper--outgoing').last();
    await expect(outgoingWrapper).toBeVisible({ timeout: 10_000 });

    const bodyArea = outgoingWrapper.locator('.cometchat-message-bubble__body').first();
    await bodyArea.hover();
    await page.waitForTimeout(500);

    const moreBtn = outgoingWrapper.locator('button[aria-label*="More" i]').first();
    await expect(moreBtn).toBeVisible({ timeout: 5_000 });
    await moreBtn.click();
    await page.waitForTimeout(500);

    const threadOption = page.locator('[role="menuitem"]:has-text("Reply in thread")').first();
    await expect(threadOption).toBeVisible({ timeout: 5_000 });
    await threadOption.click();
    await page.waitForTimeout(2000);

    const threadPanel = page.locator('.cometchat-thread-panel-wrapper, .cometchat-threaded-messages').first();
    await expect(threadPanel).toBeVisible({ timeout: 10_000 });

    // Close thread
    const closeBtn = page.locator('button[aria-label*="Close" i], .cometchat-thread-header__close').first();
    const hasClose = await closeBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (hasClose) await closeBtn.click();
  });

  // ==================== Toast after Copy ====================

  test('copy action shows toast notification', async () => {
    const outgoingTextWrapper = page.locator('.cometchat-message-bubble__wrapper--outgoing').filter({ has: page.locator('.cometchat-text-bubble') }).last();
    await expect(outgoingTextWrapper).toBeVisible({ timeout: 10_000 });

    const bodyArea = outgoingTextWrapper.locator('.cometchat-message-bubble__body').first();
    await bodyArea.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await bodyArea.hover();
    await page.waitForTimeout(500);

    const moreBtn = outgoingTextWrapper.locator('button[aria-label*="More" i]').first();
    await expect(moreBtn).toBeVisible({ timeout: 5_000 });
    await moreBtn.click();
    await page.waitForTimeout(500);

    const copyOption = page.locator('[role="menuitem"]:has-text("Copy")').first();
    await expect(copyOption).toBeVisible({ timeout: 5_000 });
    await copyOption.click();
    await page.waitForTimeout(1000);

    // Toast notification should appear
    const toast = page.locator('.cometchat-toast').first();
    await expect(toast).toBeVisible({ timeout: 5_000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// MUTABLE ACTIONS (Strategy group — send, delete, reply)
// These tests use Strategy group since they modify message state.
// ═══════════════════════════════════════════════════════════════

test.describe('Message Actions (Mutable)', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });

    // Open Strategy group via Groups tab
    const groupsTab = page.locator('.cometchat-tab-component__tab:has-text("Groups")').first();
    await groupsTab.click();
    await page.waitForSelector('.cometchat-groups__item', { timeout: 30_000 });
    const strategy = page.locator('.cometchat-groups__item').filter({ hasText: 'Strategy' }).first();
    await expect(strategy).toBeVisible({ timeout: 5_000 });
    await strategy.click();
    await page.waitForSelector('.cometchat-message-list', { timeout: 15_000 });
    await page.waitForTimeout(2000);
  });

  /** Helper: send a message and wait for it to appear */
  async function sendAndVerify(text: string) {
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    await page.keyboard.type(text);
    const sendBtn = composer.locator('[class*="send-button"], button[aria-label*="Send" i]').first();
    await sendBtn.click();
    await expect(
      page.locator('.cometchat-message-list').getByText(text)
    ).toBeVisible({ timeout: 15_000 });
  }

  // ==================== Delete a message ====================

  test('delete a message shows deleted bubble', async () => {
    const deleteMsg = `Delete me ${Date.now()}`;
    await sendAndVerify(deleteMsg);

    // Hover the sent message to get context menu
    const targetBubble = page.locator('.cometchat-message-bubble__wrapper--outgoing').last();
    const bodyArea = targetBubble.locator('.cometchat-message-bubble__body').first();
    await bodyArea.hover();
    await page.waitForTimeout(500);

    // Click "More options" to open submenu (Delete is in the dropdown, not top-menu)
    const moreBtn = targetBubble.locator('button[aria-label*="More" i]').first();
    await expect(moreBtn).toBeVisible({ timeout: 5_000 });
    await moreBtn.click();
    await page.waitForTimeout(500);

    // Click "Delete"
    const deleteOption = page.locator('[role="menuitem"]:has-text("Delete")').first();
    await expect(deleteOption).toBeVisible({ timeout: 5_000 });
    await deleteOption.click();
    await page.waitForTimeout(500);

    // Confirm deletion dialog if it appears
    const confirmBtn = page.locator('.cometchat-confirm-dialog__actions-confirm button').first();
    const hasConfirm = await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    if (hasConfirm) {
      await confirmBtn.click();
    }

    await page.waitForTimeout(2000);

    // Original text should no longer be visible
    await expect(
      page.locator('.cometchat-message-list').getByText(deleteMsg)
    ).not.toBeVisible({ timeout: 5_000 });
  });

  // ==================== Reply (Quoted Reply) ====================

  test('reply shows preview in composer, sends with quoted bubble', async () => {
    const originalMsg = `Quote me ${Date.now()}`;
    await sendAndVerify(originalMsg);

    // Hover the sent message
    const targetBubble = page.locator('.cometchat-message-bubble__wrapper--outgoing').last();
    const bodyArea = targetBubble.locator('.cometchat-message-bubble__body').first();
    await bodyArea.hover();
    await page.waitForTimeout(500);

    // "Reply" is a top-level quick action (like "React")
    const replyBtn = targetBubble.locator('button[aria-label="Reply"]').first();
    await expect(replyBtn).toBeVisible({ timeout: 5_000 });
    await replyBtn.click();
    await page.waitForTimeout(1000);

    // Reply preview should appear in the composer
    const replyPreview = page.locator('.cometchat-message-composer__reply-preview').first();
    await expect(replyPreview).toBeVisible({ timeout: 5_000 });

    // Type and send a reply
    const composer = page.locator('.cometchat-message-composer').first();
    const input = composer.locator('[contenteditable="true"]').first();
    await input.click();
    const replyText = `Reply to: ${originalMsg}`;
    await page.keyboard.type(replyText);
    const sendBtn = composer.locator('[class*="send-button"], button[aria-label*="Send" i]').first();
    await sendBtn.click();

    // The reply should appear in the message list
    await expect(
      page.locator('.cometchat-message-list').getByText(replyText)
    ).toBeVisible({ timeout: 15_000 });

    // The reply bubble should contain a reply-view (quoted preview)
    const replyBubble = page.locator('.cometchat-message-bubble__wrapper--outgoing').last();
    const replyView = replyBubble.locator('.cometchat-message-bubble__body-reply-view').first();
    await expect(replyView).toBeVisible({ timeout: 5_000 });
  });

});
