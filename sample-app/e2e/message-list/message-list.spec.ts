import { test, expect, Page } from '../helpers/test';
import { loginToApp, openBobChat, openDesignTeamChat } from '../helpers';

/**
 * E2E Tests — CometChatMessageList (React)
 *
 * Uses Bob chat (static, 2 incoming + 2 outgoing messages).
 */

test.describe('CometChatMessageList', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openBobChat(page);
  });

  // ==================== Rendering ====================

  test('text messages render with content', async () => {
    const textBubble = page.locator('.cometchat-text-bubble').first();
    await expect(textBubble).toBeVisible({ timeout: 10_000 });
    const content = await textBubble.textContent();
    expect(content?.trim()).toBeTruthy();
  });

  // ==================== Message Alignment ====================

  test('sent messages align to the right', async () => {
    const outgoing = page.locator('.cometchat-message-bubble__wrapper--outgoing').first();
    await expect(outgoing).toBeVisible({ timeout: 10_000 });
  });

  test('received messages align to the left', async () => {
    const incoming = page.locator('.cometchat-message-bubble-incoming').first();
    await expect(incoming).toBeVisible({ timeout: 10_000 });
  });

  // ==================== Date Separators ====================

  test('date separators render between message groups', async () => {
    const dateSeparator = page.locator('.cometchat-message-list__date-separator, .cometchat-date').first();
    await expect(dateSeparator).toBeVisible({ timeout: 10_000 });
    const dateText = await dateSeparator.textContent();
    expect(dateText?.trim()).toBeTruthy();
  });

  // ==================== Receipts ====================

  test('message receipts display for sent messages', async () => {
    const statusInfo = page.locator('.cometchat-message-bubble__body-status-info-view').first();
    await expect(statusInfo).toBeVisible({ timeout: 10_000 });
  });

  // ==================== Accessibility ====================

  test('message list has proper ARIA structure', async () => {
    const list = page.locator('.cometchat-message-list').first();
    await expect(list).toBeVisible();

    await expect(list.locator('[aria-label], [role]').first()).toBeVisible({ timeout: 3_000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// PAGINATION & SCROLL (Design Team — 40 messages)
// ═══════════════════════════════════════════════════════════════

/**
 * Wait until a newly opened chat has made its initial scroll to the latest message. The list
 * renders first and scrolls to the bottom a frame later; scrolling up before that is a no-op
 * (the list is already at the top), after which the initial scroll lands at the bottom anyway.
 */
async function waitForInitialScroll(page: Page) {
  const scrollContainer = page.locator('.cometchat-message-list__scroll-container').first();
  await expect(page.locator('.cometchat-message-bubble').first()).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(() => scrollContainer.evaluate(el => el.scrollHeight - el.scrollTop - el.clientHeight), {
      message: 'the chat opens scrolled to its latest message',
      timeout: 10_000,
    })
    .toBeLessThanOrEqual(2);
  return scrollContainer;
}

test.describe('CometChatMessageList (Pagination)', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await loginToApp(page);
    await page.waitForSelector('.cometchat-conversations__item', { timeout: 30_000 });
    await openDesignTeamChat(page);
  });

  test('scrolling up loads older messages (pagination)', { tag: '@smoke' }, async () => {
    // Design Team has 40+ text messages — initial load fetches latest batch (typically 30)
    const scrollContainer = await waitForInitialScroll(page);

    const initialCount = await page.locator('.cometchat-message-bubble').count();
    // The list must be scrollable for pagination to work — need enough messages that
    // the initial fetch doesn't show all of them. With 40+ messages and a default
    // page size of 30, there should be older messages to load.
    expect(initialCount).toBeGreaterThanOrEqual(15);

    // Verify the list IS scrollable (scrollHeight > clientHeight)
    const isScrollable = await scrollContainer.evaluate(el => el.scrollHeight > el.clientHeight);
    expect(isScrollable).toBeTruthy();

    // Scroll the message list to the very top to trigger fetchPrevious
    await scrollContainer.evaluate(el => { el.scrollTop = 0; });
    await page.waitForTimeout(4000);

    // After pagination, more messages should have loaded
    const newCount = await page.locator('.cometchat-message-bubble').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('scroll-to-bottom button appears when scrolled up', async () => {
    const scrollContainer = await waitForInitialScroll(page);

    // Scroll up
    await scrollContainer.evaluate(el => { el.scrollTop = 0; });

    // Scroll-to-bottom button should appear
    const scrollBtn = page.locator('.cometchat-message-list__scroll-to-bottom').first();
    await expect(scrollBtn).toBeVisible({ timeout: 5_000 });
  });

  test('clicking scroll-to-bottom scrolls to latest message', async () => {
    const scrollContainer = await waitForInitialScroll(page);

    // Scroll up — this also fetches an older page, which prepends bubbles.
    await scrollContainer.evaluate(el => { el.scrollTop = 0; });

    // Let that fetch land before clicking, so the click isn't racing a prepend:
    // the bubble count must hold steady across two consecutive reads.
    const bubbles = page.locator('.cometchat-messages-wrapper .cometchat-message-list .cometchat-message-bubble');
    let last = -1;
    await expect
      .poll(async () => {
        const n = await bubbles.count();
        const stable = n === last;
        last = n;
        return stable;
      }, { intervals: [1_000], timeout: 15_000 })
      .toBe(true);

    // Click scroll-to-bottom button
    const scrollBtn = page.locator('.cometchat-message-list__scroll-to-bottom').first();
    await expect(scrollBtn).toBeVisible({ timeout: 5_000 });
    await scrollBtn.click();

    // The list reaches the bottom and the button goes away.
    await expect
      .poll(() => scrollContainer.evaluate(el => el.scrollHeight - el.scrollTop - el.clientHeight), { timeout: 10_000 })
      .toBeLessThanOrEqual(2);
    await expect(scrollBtn).not.toBeVisible({ timeout: 5_000 });
  });
});
