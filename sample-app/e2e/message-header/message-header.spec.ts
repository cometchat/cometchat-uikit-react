import { test, expect, Page } from '../helpers/test';
import { loginToApp, openBobChat, selectGroupByName } from '../helpers';

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

  // ==================== Subtitle ====================

  test('subtitle displays (last active or member count)', async () => {
    const subtitle = page.locator('.cometchat-message-header__subtitle, [class*="message-header"] [class*="subtitle"]').first();
    const hasSubtitle = await subtitle.isVisible().catch(() => false);

    expect(hasSubtitle, 'Element should be visible: hasSubtitle').toBeTruthy();
      const text = await subtitle.textContent();
      expect(text?.trim()).toBeTruthy();
  });

  // ==================== Call Buttons ====================

  // ==================== Back Button ====================

  test('back button shows only on mobile and returns to the list', async () => {
    const backBtn = page.locator('.cometchat-messages-wrapper .cometchat-message-header__back-button');
    // Desktop: the list and the chat are side by side, so there is no back button.
    await expect(backBtn).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(backBtn.first()).toBeVisible({ timeout: 10_000 });
    await backBtn.first().click();
    // This spec opens Bob from the Users tab, so back returns to that list.
    await expect(page.locator('.cometchat-users').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.cometchat-messages-wrapper .cometchat-message-header')).toHaveCount(0);
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

    await expect(header.locator('[aria-label]').first()).toBeVisible({ timeout: 3_000 });
  });

  // ==================== Group Header ====================

  test('group conversation shows member count in subtitle', async () => {
    // Open a group chat via Groups tab (falls back to search when the group is
    // past the first page of the list).
    await selectGroupByName(page, 'Design Team');

    await page.waitForSelector('.cometchat-message-header', { timeout: 15_000 });

    // Subtitle should show member count (e.g., "5 Members")
    const subtitle = page.locator('.cometchat-message-header__subtitle').first();
    await expect(subtitle).toBeVisible({ timeout: 5_000 });
    const text = await subtitle.textContent();
    expect(text?.trim()).toBeTruthy();
    expect(text?.toLowerCase()).toMatch(/member/);
  });

  // ==================== Search Button ====================

  /*
   * Search has two possible homes in the header, and which one it gets depends on the app's
   * other features — so the test has to accept either.
   *
   * It is a standalone button only when nothing else would share the trailing slot. As soon as
   * the conversation summary or Pinned Messages is enabled, search is folded into the overflow
   * menu instead, and `--search` never renders. This sample app enables pinned messages, which
   * is why asserting on the standalone button alone used to fail here.
   */
  test('search button renders and clicking triggers search', async () => {
    const standaloneBtn = page.locator('.cometchat-message-header__menu-button--search').first();
    const overflowBtn = page
      .locator('.cometchat-message-header__menu-button')
      .filter({ has: page.locator('.cometchat-message-header__menu-button-icon--more') })
      .first();

    if (await standaloneBtn.isVisible().catch(() => false)) {
      await standaloneBtn.click();
    } else {
      await expect(overflowBtn).toBeVisible({ timeout: 5_000 });
      await overflowBtn.click();
      await page.getByText('Search', { exact: true }).first().click();
    }
    await page.waitForTimeout(2000);

    // Search component should appear
    const searchComponent = page.locator('.cometchat-search').first();
    await expect(searchComponent).toBeVisible({ timeout: 5_000 });
  });
});
