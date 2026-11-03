import { test, expect, Browser, Page } from '../helpers/test';
import { loginToApp, PRIMARY_USER, SECONDARY_USER } from '../helpers';
import { selectGroupByName, waitForChatOpen } from '../helpers/navigation';
import { fetchForMessage, restBase, sendMessageToGroup, userHeaders } from '../helpers/pinSave';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { bubbleWithText } from '../helpers/threads';
import { expectSendAccepted } from '../helpers/send';

/**
 * E2E — realtime between two users (catalog N2–N5).
 *
 * Alice (primary user) and Bob (secondary user) share a throwaway group, so
 * nothing here touches the shared seed data. Where the receiver's view is what
 * is under test, Bob acts over REST (deterministic); typing and read receipts
 * come from a client, so Bob gets his own browser context for those.
 */

let group: ThrowawayGroup;

test.beforeEach(async () => {
  group = await createThrowawayGroup({ name: `E2E Realtime ${Date.now()}` });
  // A first message puts the group in both users' conversation lists.
  await sendMessageToGroup({ guid: group.guid, as: PRIMARY_USER, text: `Realtime start [${Date.now()}]` });
});

test.afterEach(async () => {
  await group.dispose();
});

async function openGroup(page: Page, uid?: string) {
  await loginToApp(page, uid);
  await selectGroupByName(page, group.name);
  await waitForChatOpen(page, group.name, { expectMessages: true });
}

/** A second, independent browser session for Bob (same app URL as the test's own page). */
async function bobPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  return context.newPage();
}

async function restAsBob(path: string, method: string, body?: unknown) {
  const res = await fetchForMessage(`${restBase()}${path}`, {
    method,
    headers: userHeaders(SECONDARY_USER),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!res.ok) throw new Error(`${method} ${path} as Bob failed: ${String(res.status)} ${await res.text()}`);
}

test.describe('Realtime — typing (N2)', () => {
  test("Bob's typing shows in Alice's header and clears when he stops", async ({ page, browser }) => {
    const bob = await bobPage(browser);
    try {
      await openGroup(page);
      await openGroup(bob, SECONDARY_USER);

      const composer = bob.locator('.cometchat-messages-wrapper [contenteditable="true"]').first();
      await composer.click();
      await composer.pressSequentially('typing…', { delay: 80 });

      const typing = page.locator(
        '.cometchat-messages-wrapper .cometchat-message-header__subtitle--typing, .cometchat-messages-wrapper .cometchat-typing-indicator'
      );
      await expect(typing.first()).toBeVisible({ timeout: 10_000 });

      // Stopping (clearing the draft) ends the typing state for the receiver.
      await composer.press('ControlOrMeta+a');
      await composer.press('Backspace');
      await expect(typing).toHaveCount(0, { timeout: 15_000 });
    } finally {
      await bob.context().close();
    }
  });
});

test.describe('Realtime — receipts (N3)', () => {
  test("Alice's message goes delivered while Bob is online, then read when he opens the chat", async ({
    page,
    browser,
  }) => {
    const bob = await bobPage(browser);
    try {
      // Bob is online but on his conversation list, not in the group.
      await loginToApp(bob, SECONDARY_USER);

      await openGroup(page);
      const text = `Receipt check [${Date.now()}]`;
      const composer = page.locator('.cometchat-messages-wrapper [contenteditable="true"]').first();
      await expectSendAccepted(page, async () => {
        await composer.click();
        await composer.pressSequentially(text);
        await composer.press('Enter');
      });

      const bubble = bubbleWithText(page, text);
      await expect(bubble.locator('.cometchat-receipts-delivered, .cometchat-receipts-read')).toBeVisible({
        timeout: 20_000,
      });

      await selectGroupByName(bob, group.name);
      await waitForChatOpen(bob, group.name, { expectMessages: true });
      await expect(bubble.locator('.cometchat-receipts-read')).toBeVisible({ timeout: 20_000 });
    } finally {
      await bob.context().close();
    }
  });
});

test.describe('Realtime — changes reach the receiver (N4)', () => {
  test("Bob's edit shows on Alice's open chat with the edited label", async ({ page }) => {
    const original = `Before edit [${Date.now()}]`;
    const id = await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text: original });
    await openGroup(page);
    await expect(bubbleWithText(page, original)).toBeVisible({ timeout: 15_000 });

    const edited = `After edit [${Date.now()}]`;
    await restAsBob(`/messages/${String(id)}`, 'PUT', { data: { text: edited } });

    const bubble = bubbleWithText(page, edited);
    await expect(bubble).toBeVisible({ timeout: 15_000 });
    await expect(bubble.locator('.cometchat-message-bubble__status-info-view-helper-text')).toBeVisible();
    await expect(bubbleWithText(page, original)).toHaveCount(0);
  });

  test("Bob's delete turns the bubble into a deleted message on Alice's open chat", async ({ page }) => {
    const text = `To be deleted [${Date.now()}]`;
    const id = await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text });
    await openGroup(page);
    await expect(bubbleWithText(page, text)).toBeVisible({ timeout: 15_000 });
    const deletedBefore = await page.locator('.cometchat-messages-wrapper .cometchat-delete-bubble').count();

    await restAsBob(`/messages/${String(id)}`, 'DELETE');

    await expect(bubbleWithText(page, text)).toHaveCount(0, { timeout: 15_000 });
    await expect
      .poll(() => page.locator('.cometchat-messages-wrapper .cometchat-delete-bubble').count(), { timeout: 15_000 })
      .toBeGreaterThan(deletedBefore);
  });

  test("Bob's reaction appears on Alice's message without a reload", async ({ page }) => {
    const text = `React to me [${Date.now()}]`;
    const id = await sendMessageToGroup({ guid: group.guid, as: PRIMARY_USER, text });
    await openGroup(page);
    const bubble = bubbleWithText(page, text);
    await expect(bubble).toBeVisible({ timeout: 15_000 });
    await expect(bubble.locator('.cometchat-reactions__chip')).toHaveCount(0);

    await restAsBob(`/messages/${String(id)}/reactions/${encodeURIComponent('🎉')}`, 'POST');

    await expect(bubble.locator('.cometchat-reactions__chip').filter({ hasText: '🎉' })).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe('Realtime — conversation ordering (N5)', () => {
  test('a new message moves its conversation to the top of the list', async ({ page }) => {
    // Pinned conversations always sort first, so compare against the first
    // UNPINNED row, with a second throwaway group as the competitor.
    const filler = await createThrowawayGroup({ name: `E2E Ordering filler ${Date.now()}` });
    try {
      await sendMessageToGroup({ guid: filler.guid, as: PRIMARY_USER, text: `Filler start [${Date.now()}]` });
      await loginToApp(page);
      const unpinned = page
        .locator('.cometchat-conversations__item')
        .filter({ hasNot: page.locator('.cometchat-conversations__item-pin-indicator') });
      await expect(unpinned.first()).toBeVisible({ timeout: 30_000 });

      // The filler becomes the most recent unpinned conversation…
      await sendMessageToGroup({ guid: filler.guid, as: SECONDARY_USER, text: `Ordering filler [${Date.now()}]` });
      await expect(unpinned.first()).toContainText(filler.name, { timeout: 15_000 });

      // …until a message in the other group moves that one above it.
      const text = `Jump to top [${Date.now()}]`;
      await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text });
      await expect(unpinned.first()).toContainText(group.name, { timeout: 15_000 });
      await expect(unpinned.first()).toContainText(text);
      await expect(unpinned.nth(1)).toContainText(filler.name);
    } finally {
      await filler.dispose();
    }
  });
});
