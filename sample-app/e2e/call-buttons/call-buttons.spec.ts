import { test, expect, Page } from '@playwright/test';
import { loginToApp, openStrategyChat } from '../helpers';

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

    test('call buttons render for group conversation', async () => {
      const callButtons = page.locator('.cometchat-call-buttons').first();
      const hasCallButtons = await callButtons.isVisible({ timeout: 5_000 }).catch(() => false);

      expect(hasCallButtons, 'Element should be visible: hasCallButtons').toBeTruthy();
      await expect(callButtons).toBeVisible();
    });

    test('voice call button is present', async () => {
      const voiceBtn = page
        .locator(
          '.cometchat-call-buttons__voice, button[aria-label*="Voice" i], button[aria-label*="Audio" i]'
        )
        .first();
      const hasVoice = await voiceBtn.isVisible({ timeout: 5_000 }).catch(() => false);

      expect(hasVoice, 'Element should be visible: hasVoice').toBeTruthy();
      await expect(voiceBtn).toBeVisible();
    });

    test('video call button is present', async () => {
      const videoBtn = page
        .locator('.cometchat-call-buttons__video, button[aria-label*="Video" i]')
        .first();
      const hasVideo = await videoBtn.isVisible({ timeout: 5_000 }).catch(() => false);

      expect(hasVideo, 'Element should be visible: hasVideo').toBeTruthy();
      await expect(videoBtn).toBeVisible();
    });

    test('voice call button initiates outgoing voice call', async () => {
      const voiceBtn = page
        .locator(
          '.cometchat-call-buttons__voice, button[aria-label*="Voice" i], button[aria-label*="Audio" i]'
        )
        .first();
      const hasVoice = await voiceBtn.isVisible({ timeout: 5_000 }).catch(() => false);

      expect(hasVoice, 'Element should be visible: hasVoice').toBeTruthy();
      await voiceBtn.click();
      await page.waitForTimeout(7500);

      const ongoingCall = page
        .locator('.cometchat-ongoing-call, [class*="ongoing-call"]')
        .first();
      const hasOngoing = await ongoingCall.isVisible({ timeout: 5_000 }).catch(() => false);

      expect(
        hasOngoing,
        'Ongoing call screen must appear after clicking call button'
      ).toBeTruthy();
      const cancelBtn = page
        .locator(
          '.cometchat-calls-control-button--call-end'
        )
        .first();
      await expect(cancelBtn).toBeVisible({ timeout: 5_000 });
      await cancelBtn.click();
      await page.waitForTimeout(2000);
    });

    test('video call button initiates outgoing video call', async () => {
      const videoBtn = page
        .locator('.cometchat-call-buttons__video, button[aria-label*="Video" i]')
        .first();
      const hasVideo = await videoBtn.isVisible({ timeout: 5_000 }).catch(() => false);

      expect(hasVideo, 'Element should be visible: hasVideo').toBeTruthy();
      await videoBtn.click();
      await page.waitForTimeout(7500);

      const ongoingCall = page
        .locator('.cometchat-ongoing-call, [class*="ongoing-call"]')
        .first();
      const hasOngoing = await ongoingCall.isVisible({ timeout: 5_000 }).catch(() => false);

      expect(
        hasOngoing,
        'Ongoing call screen must appear after clicking call button'
      ).toBeTruthy();
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
      const hasVoice = await voiceBtn.isVisible({ timeout: 5_000 }).catch(() => false);

      expect(hasVoice, 'Element should be visible: hasVoice').toBeTruthy();
      await voiceBtn.click();
      await page.waitForTimeout(7500);

      const ongoingCall = page
        .locator('.cometchat-ongoing-call, [class*="ongoing-call"]')
        .first();
      const hasOngoing = await ongoingCall.isVisible({ timeout: 5_000 }).catch(() => false);

      expect(
        hasOngoing,
        'Outgoing call screen must appear after clicking call button'
      ).toBeTruthy();
      const cancelBtn = ongoingCall
        .locator(
          '.cometchat-calls-control-button--call-end'
        )
        .first();
      await cancelBtn.click();
      await page.waitForTimeout(2000);

      const stillVisible = await ongoingCall.isVisible().catch(() => false);
      expect(stillVisible).toBeFalsy();
    });
  });

  // ==================== 1:1 Call (generates call logs) ====================

  test.describe('Calling (User)', () => {
    test.beforeEach(async () => {
      // Open a 1:1 chat with any user (not Bob — Bob is immutable)
      // Use Users tab and click the first user (Alice won't show since she's logged in)
      const usersTab = page.locator('.cometchat-tab-component__tab:has-text("Users")').first();
      await usersTab.click();
      await page.waitForSelector('.cometchat-users__item', { timeout: 30_000 });

      // Click first user that is not Bob
      const allUsers = page.locator('.cometchat-users__item');
      const count = await allUsers.count();
      for (let i = 0; i < count; i++) {
        const name = await allUsers.nth(i).locator('.cometchat-users__item-title').textContent();
        if (!name?.includes('Bob')) {
          await allUsers.nth(i).click();
          break;
        }
      }

      await page.waitForSelector('.cometchat-message-list', { timeout: 15_000 });
      await page.waitForTimeout(1000);
    });

    test('voice call shows outgoing call screen and cancel dismisses it', async () => {
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

    test('call logs list renders', async () => {
      // CometChatCallLogs renders in the selector area — wait for it to appear
      await page.waitForTimeout(3000);

      // Check for call log items, empty state, or the call logs container
      const hasItems = await page
        .locator('.cometchat-call-logs__list-item')
        .first()
        .isVisible()
        .catch(() => false);
      const hasEmpty = await page
        .locator('[class*="empty"]')
        .isVisible()
        .catch(() => false);
      const hasCallLogsContainer = await page
        .locator('[class*="call-log"], [class*="calllog"]')
        .first()
        .isVisible()
        .catch(() => false);
      const hasShimmer = await page
        .locator('[class*="shimmer"]')
        .first()
        .isVisible()
        .catch(() => false);

      // At least something related to call logs should be visible
      expect(hasItems || hasEmpty || hasCallLogsContainer || hasShimmer).toBeTruthy();
    });

    test('call log entries show type and status', async () => {
      const callLogItem = page.locator('.cometchat-call-logs__list-item').first();
      const hasItem = await callLogItem.isVisible({ timeout: 5_000 }).catch(() => false);

      expect(hasItem, 'Element should be visible: hasItem').toBeTruthy();
      const hasTypeIcon = await callLogItem
        .locator('[class*="audio"], [class*="video"], img, svg')
        .first()
        .isVisible()
        .catch(() => false);
      expect(hasTypeIcon).toBeTruthy();
    });

    test('call logs list has proper ARIA attributes', async () => {
      const callLogs = page.locator('.cometchat-call-logs, [class*="call-log"]').first();
      const hasCallLogs = await callLogs.isVisible({ timeout: 5_000 }).catch(() => false);

      expect(hasCallLogs, 'Element should be visible: hasCallLogs').toBeTruthy();
      const hasAriaElements = await callLogs
        .locator('[aria-label], [role]')
        .first()
        .isVisible({ timeout: 2_000 })
        .catch(() => false);
      expect(hasAriaElements).toBeTruthy();
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
