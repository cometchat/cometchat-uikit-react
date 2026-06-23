import { test, expect, Page } from '@playwright/test';
import { loginToApp, openCICDChat } from '../helpers';

/**
 * E2E Tests — Message Privately (React)
 *
 * Tests the "Message Privately" option in the context menu of incoming messages
 * in a group conversation. This option should only appear on incoming messages
 * (not outgoing), and clicking it opens a 1:1 chat with that user.
 *
 * Uses CI/CD group (e2e-group-33) which has seeded incoming messages from user-2.
 */

test.describe('Message Privately', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openCICDChat(page);
  });

  test('message privately option is NOT visible on outgoing messages', async () => {
    const outgoingWrapper = page.locator('.cometchat-message-bubble__wrapper--outgoing').last();
    await expect(outgoingWrapper).toBeVisible({ timeout: 10_000 });

    const bodyArea = outgoingWrapper.locator('.cometchat-message-bubble__body').first();
    await bodyArea.hover();
    await page.waitForTimeout(500);

    const moreBtn = outgoingWrapper.locator('button[aria-label*="More" i]').first();
    await expect(moreBtn).toBeVisible({ timeout: 5_000 });
    await moreBtn.click();
    await page.waitForTimeout(500);

    // "Message Privately" should NOT be in the menu for outgoing messages
    const msgPrivately = page.locator('[role="menuitem"]:has-text("Message Privately")').first();
    await expect(msgPrivately).not.toBeVisible({ timeout: 3_000 });

    // Close menu
    await page.keyboard.press('Escape');
  });

  test('message privately option IS visible on incoming messages in group', async () => {
    const incomingBubble = page.locator('.cometchat-message-bubble-incoming .cometchat-message-bubble__body-wrapper').last();
    await expect(incomingBubble).toBeVisible({ timeout: 10_000 });

    await incomingBubble.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await incomingBubble.hover();
    await page.waitForTimeout(500);

    const moreBtn = incomingBubble.locator('..').locator('button[aria-label*="More" i]').first();
    await expect(moreBtn).toBeVisible({ timeout: 5_000 });
    await moreBtn.click();
    await page.waitForTimeout(500);

    // "Message Privately" MUST be in the menu for incoming group messages
    const msgPrivately = page.locator('[role="menuitem"]:has-text("Message Privately")').first();
    await expect(msgPrivately).toBeVisible({ timeout: 5_000 });

    // Close menu without clicking
    await page.keyboard.press('Escape');
  });

  test('clicking message privately opens 1:1 chat with the sender', async () => {
    const incomingBubble = page.locator('.cometchat-message-bubble-incoming .cometchat-message-bubble__body-wrapper').last();
    await expect(incomingBubble).toBeVisible({ timeout: 10_000 });

    await incomingBubble.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await incomingBubble.hover();
    await page.waitForTimeout(500);

    const moreBtn = incomingBubble.locator('..').locator('button[aria-label*="More" i]').first();
    await expect(moreBtn).toBeVisible({ timeout: 5_000 });
    await moreBtn.click();
    await page.waitForTimeout(500);

    const msgPrivately = page.locator('[role="menuitem"]:has-text("Message Privately")').first();
    await expect(msgPrivately).toBeVisible({ timeout: 5_000 });
    await msgPrivately.click();
    await page.waitForTimeout(2000);

    // Should open a 1:1 chat — message composer must be visible
    await expect(page.locator('.cometchat-message-composer')).toBeVisible({ timeout: 10_000 });

    // The header should show a user name (not the group name "Design Team")
    const headerTitle = page.locator('.cometchat-message-header__title').first();
    const title = await headerTitle.textContent();
    expect(title?.trim()).toBeTruthy();
    expect(title?.trim()).not.toBe('CI/CD');
  });
});
