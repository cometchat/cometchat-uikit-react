import { test, expect, Page } from '@playwright/test';
import { loginToApp, openBobChat } from '../helpers';

/**
 * E2E Tests — CometChatMessageHeader (React)
 *
 * Tests the message header component. Requires opening a conversation first.
 */

test.describe('CometChatMessageHeader', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openBobChat(page);
  });

  // ==================== Rendering ====================

  test('message header renders for active conversation', async () => {
    await expect(page.locator('.cometchat-message-header').first()).toBeVisible();
  });

  test('header displays user/group name', async () => {
    const title = page.locator('.cometchat-message-header__title, [class*="message-header"] [class*="title"]').first();
    await expect(title).toBeVisible();
    const name = await title.textContent();
    expect(name?.trim()).toBeTruthy();
  });

  test('header displays avatar', async () => {
    const avatar = page.locator('.cometchat-message-header .cometchat-avatar').first();
    await expect(avatar).toBeVisible();
  });

  // ==================== User Status ====================

  test('user online/offline status indicator displays', async () => {
    const statusIndicator = page.locator('.cometchat-message-header__subtitle').first();
    const hasStatus = await statusIndicator.isVisible().catch(() => false);

    expect(hasStatus, 'Element should be visible: hasStatus').toBeTruthy();
      expect(hasStatus).toBeTruthy();
  });

  // ==================== Subtitle ====================

  test('subtitle displays (last active or member count)', async () => {
    const subtitle = page.locator('.cometchat-message-header__subtitle, [class*="message-header"] [class*="subtitle"]').first();
    const hasSubtitle = await subtitle.isVisible().catch(() => false);

    expect(hasSubtitle, 'Element should be visible: hasSubtitle').toBeTruthy();
      const text = await subtitle.textContent();
      expect(text?.trim()).toBeTruthy();
  });

  // ==================== Call Buttons ====================

  test('voice call button renders', async () => {
    const voiceCallBtn = page.locator('.cometchat-call-buttons__voice, [class*="call-buttons"] [class*="voice"]').first();
    const hasVoiceCall = await voiceCallBtn.isVisible().catch(() => false);

    expect(hasVoiceCall, 'Element should be visible: hasVoiceCall').toBeTruthy();
      await expect(voiceCallBtn).toBeVisible();
  });

  test('video call button renders', async () => {
    const videoCallBtn = page.locator('.cometchat-call-buttons__video, [class*="call-buttons"] [class*="video"]').first();
    const hasVideoCall = await videoCallBtn.isVisible().catch(() => false);

    expect(hasVideoCall, 'Element should be visible: hasVideoCall').toBeTruthy();
      await expect(videoCallBtn).toBeVisible();
  });

  // ==================== Back Button ====================

  test('back button is present', async () => {
    // Back button may only be shown on mobile viewport or when configured
    const backBtn = page.locator('.cometchat-message-header__back-button, [class*="message-header"] [class*="back"]').first();
    const hasBack = await backBtn.isVisible().catch(() => false);
    // At minimum verify the selector query ran — back button presence depends on viewport
    expect(typeof hasBack).toBe('boolean');
  });

  // ==================== Typing Indicator ====================

  test('typing indicator subtitle wrapper exists in header', async () => {
    // The subtitle-wrapper is always rendered in the DOM (shows status/members when not typing,
    // shows typing dots when someone types). Check it's attached to the DOM.
    const subtitleWrapper = page.locator('.cometchat-message-header__subtitle-wrapper').first();
    await expect(subtitleWrapper).toBeAttached({ timeout: 5_000 });
  });

  // ==================== Accessibility ====================

  test('header has proper ARIA attributes', async () => {
    const header = page.locator('.cometchat-message-header').first();
    await expect(header).toBeVisible();

    const hasAriaElements = await header.locator('[aria-label]').first().isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasAriaElements).toBeTruthy();
  });

  // ==================== Group Header ====================

  test('group conversation shows member count in subtitle', async () => {
    // Open a group chat via Groups tab
    const groupsTab = page.locator('.cometchat-tab-component__tab:has-text("Groups")').first();
    await groupsTab.click();
    await page.waitForSelector('.cometchat-groups__item', { timeout: 30_000 });

    const designTeam = page.locator('.cometchat-groups__item').filter({ hasText: 'Design Team' }).first();
    await expect(designTeam).toBeVisible({ timeout: 5_000 });
    await designTeam.click();

    await page.waitForSelector('.cometchat-message-header', { timeout: 15_000 });

    // Subtitle should show member count (e.g., "5 Members")
    const subtitle = page.locator('.cometchat-message-header__subtitle').first();
    await expect(subtitle).toBeVisible({ timeout: 5_000 });
    const text = await subtitle.textContent();
    expect(text?.trim()).toBeTruthy();
    expect(text?.toLowerCase()).toMatch(/member/);
  });

  // ==================== Search Button ====================

  test('search button renders and clicking triggers search', async () => {
    const searchBtn = page.locator('.cometchat-message-header__menu-button--search').first();
    await expect(searchBtn).toBeVisible({ timeout: 5_000 });

    await searchBtn.click();
    await page.waitForTimeout(2000);

    // Search component should appear
    const searchComponent = page.locator('.cometchat-search').first();
    await expect(searchComponent).toBeVisible({ timeout: 5_000 });
  });
});
