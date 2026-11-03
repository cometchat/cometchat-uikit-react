import { test, expect, Page } from '../helpers/test';
import { loginToApp, openStrategyChat } from '../helpers';
import { waitForChatOpen } from '../helpers/navigation';

/** The user the 1:1 call tests call (e2e-user-3). */
const CALLEE_NAME = 'Charlie Brown';

/**
 * E2E Tests — CometChatCallButtons & Calling (React)
 *
 * Tests call buttons and calling components + Call Logs tab.
 */

test.describe('CometChatCallButtons & Calling', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations', { timeout: 30_000 });
  });

  // ==================== Call Buttons in Message Header ====================

  test.describe('Call Buttons (Group)', () => {
    test.beforeEach(async () => {
      await openStrategyChat(page);
    });

    test('video call button initiates outgoing video call', async () => {
      const videoBtn = page
        .locator('.cometchat-call-buttons__video, button[aria-label*="Video" i]')
        .first();
      await expect(videoBtn).toBeVisible({ timeout: 5_000 });
      await videoBtn.click();
      await page.waitForTimeout(7500);

      const ongoingCall = page
        .locator('.cometchat-ongoing-call, [class*="ongoing-call"]')
        .first();
      await expect(ongoingCall, 'Ongoing call screen must appear after clicking call button').toBeVisible({ timeout: 5_000 });
      const cancelBtn = page
        .locator(
          '.cometchat-calls-control-button--call-end'
        )
        .first();
      await expect(cancelBtn).toBeVisible({ timeout: 5_000 });
      await cancelBtn.click();
      await page.waitForTimeout(2000);
    });

    test('cancelling outgoing call dismisses the screen', async () => {
      const voiceBtn = page
        .locator(
          '.cometchat-call-buttons__voice, button[aria-label*="Voice" i], button[aria-label*="Audio" i]'
        )
        .first();
      await expect(voiceBtn).toBeVisible({ timeout: 5_000 });
      await voiceBtn.click();
      await page.waitForTimeout(7500);

      const ongoingCall = page
        .locator('.cometchat-ongoing-call, [class*="ongoing-call"]')
        .first();
      await expect(ongoingCall, 'Outgoing call screen must appear after clicking call button').toBeVisible({ timeout: 5_000 });
      const cancelBtn = ongoingCall
        .locator(
          '.cometchat-calls-control-button--call-end'
        )
        .first();
      await cancelBtn.click();
      await expect(ongoingCall).toBeHidden({ timeout: 10_000 });
    });
  });

  // ==================== 1:1 Call (generates call logs) ====================

  test.describe('Calling (User)', () => {
    test.beforeEach(async () => {
      // Call Charlie, never Bob: Bob's chat is the static fixture other specs read, and every
      // call leaves records in the chat it was placed from. Open Charlie by name and wait for his
      // header, so a slow users list can't leave the call going out from whichever chat was open.
      const usersTab = page.locator('.cometchat-tab-component__tab:has-text("Users")').first();
      await usersTab.click();
      const charlie = page.locator('.cometchat-users__item').filter({ hasText: CALLEE_NAME }).first();
      await expect(charlie).toBeVisible({ timeout: 30_000 });
      await charlie.click();
      await waitForChatOpen(page, CALLEE_NAME);
    });

    test('voice call shows outgoing call screen and cancel dismisses it', { tag: '@smoke' }, async () => {
      const voiceBtn = page
        .locator('.cometchat-call-buttons__voice, button[aria-label*="Voice" i], button[aria-label*="Audio" i]')
        .first();
      await expect(voiceBtn).toBeVisible({ timeout: 5_000 });
      await voiceBtn.click();
      await page.waitForTimeout(3000);

      // 1:1 calls show the outgoing call dialog
      const outgoingCall = page.locator('.cometchat-outgoing-call').first();
      await expect(outgoingCall).toBeVisible({ timeout: 10_000 });

      // Cancel the call
      const cancelBtn = outgoingCall.locator('.cometchat-outgoing-call__button').first();
      await expect(cancelBtn).toBeVisible({ timeout: 5_000 });
      await cancelBtn.click();
      await page.waitForTimeout(2000);

      // Outgoing call screen should dismiss
      await expect(outgoingCall).not.toBeVisible({ timeout: 5_000 });
    });

    test('video call shows outgoing call screen and cancel dismisses it', async () => {
      const videoBtn = page
        .locator('.cometchat-call-buttons__video, button[aria-label*="Video" i]')
        .first();
      await expect(videoBtn).toBeVisible({ timeout: 5_000 });
      await videoBtn.click();
      await page.waitForTimeout(3000);

      // 1:1 calls show the outgoing call dialog
      const outgoingCall = page.locator('.cometchat-outgoing-call').first();
      await expect(outgoingCall).toBeVisible({ timeout: 10_000 });

      // Cancel the call
      const cancelBtn = outgoingCall.locator('.cometchat-outgoing-call__button').first();
      await expect(cancelBtn).toBeVisible({ timeout: 5_000 });
      await cancelBtn.click();
      await page.waitForTimeout(2000);

      // Outgoing call screen should dismiss
      await expect(outgoingCall).not.toBeVisible({ timeout: 5_000 });
    });
  });

  // ==================== Call Logs ====================

  test.describe('Call Logs', () => {
    test.beforeEach(async () => {
      const callsTab = page
        .locator('.cometchat-tab-component__tab:has-text("Calls"), button:has-text("Calls")')
        .first();
      await callsTab.click();
      await page.waitForTimeout(3000);
    });

    test('call log entries show type and status', async () => {
      const callLogItem = page.locator('.cometchat-call-logs__list-item').first();
      await expect(callLogItem).toBeVisible({ timeout: 5_000 });
      const hasTypeIcon = await callLogItem
        .locator('[class*="audio"], [class*="video"], img, svg')
        .first()
        .isVisible()
        .catch(() => false);
      expect(hasTypeIcon).toBeTruthy();
    });

    test('call logs list has proper ARIA attributes', async () => {
      const callLogs = page.locator('.cometchat-call-logs, [class*="call-log"]').first();
      await expect(callLogs).toBeVisible({ timeout: 5_000 });
      await expect(callLogs
        .locator('[aria-label], [role]')
        .first()).toBeVisible({ timeout: 2_000 });
    });

    test('clicking a call log entry opens call details', async () => {
      const callLogItem = page.locator('.cometchat-call-logs__list-item').first();
      await expect(callLogItem).toBeVisible({ timeout: 10_000 });

      await callLogItem.click();
      await page.waitForTimeout(2000);

      // Call log details panel should open
      const callDetails = page.locator('.cometchat-call-log-details').first();
      await expect(callDetails).toBeVisible({ timeout: 10_000 });
    });
  });
});
