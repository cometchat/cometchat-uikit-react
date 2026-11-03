import { test, expect } from '../helpers/test';
import { loginToApp, PRIMARY_USER, SECONDARY_USER } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { restBase, sendMessageToGroup, userHeaders } from '../helpers/pinSave';
import { bubblesContaining, conversationRow, openChatsTab, openGroupChat, unreadBadge } from './journey-helpers';

/**
 * Journey 1 — the network drops mid-session and comes back.
 *
 * While Alice is offline, Bob posts in the chat she has open, edits one of his
 * earlier messages, and posts in a second group. When she reconnects, the open
 * chat must catch up in order with no duplicates, the edit must apply, and the
 * other group's unread count must be right.
 */

let open: ThrowawayGroup;
let other: ThrowawayGroup;

test.beforeEach(async () => {
  open = await createThrowawayGroup({ name: `E2E Reconnect open ${Date.now()}` });
  other = await createThrowawayGroup({ name: `E2E Reconnect other ${Date.now()}` });
});

test.afterEach(async ({ page }) => {
  await page.context().setOffline(false);
  await open.dispose();
  await other.dispose();
});

test('missed messages, edits and unread counts catch up after a reconnect', async ({ page }) => {
  test.setTimeout(240_000);
  const tag = Date.now();
  const beforeEdit = `Before edit [${tag}]`;
  const editId = await sendMessageToGroup({ guid: open.guid, as: SECONDARY_USER, text: beforeEdit });
  await sendMessageToGroup({ guid: other.guid, as: PRIMARY_USER, text: `Other start [${tag}]` });

  await test.step('Alice opens the chat', async () => {
    await loginToApp(page);
    await openGroupChat(page, open.name);
    await expect(bubblesContaining(page, beforeEdit)).toHaveCount(1, { timeout: 15_000 });
  });

  const missed = [1, 2, 3].map(i => `Missed ${String(i)} [${tag}]`);
  const edited = `After edit [${tag}]`;

  await test.step('Bob acts while Alice is offline', async () => {
    await page.context().setOffline(true);
    for (const text of missed) await sendMessageToGroup({ guid: open.guid, as: SECONDARY_USER, text });
    const res = await fetch(`${restBase()}/messages/${String(editId)}`, {
      method: 'PUT',
      headers: userHeaders(SECONDARY_USER),
      body: JSON.stringify({ data: { text: edited } }),
    });
    expect(res.ok).toBe(true);
    await sendMessageToGroup({ guid: other.guid, as: SECONDARY_USER, text: `Other missed 1 [${tag}]` });
    await sendMessageToGroup({ guid: other.guid, as: SECONDARY_USER, text: `Other missed 2 [${tag}]` });
    // Nothing reaches the page while it is offline.
    await expect(bubblesContaining(page, missed[0])).toHaveCount(0);
  });

  await test.step('Alice reconnects: each missed message appears once, in order', async () => {
    await page.context().setOffline(false);
    for (const text of missed) await expect(bubblesContaining(page, text)).toHaveCount(1, { timeout: 30_000 });

    const order = await page
      .locator('.cometchat-messages-wrapper .cometchat-message-list .cometchat-message-bubble__wrapper')
      .evaluateAll((els, wanted) => els.map(e => wanted.findIndex(w => e.textContent?.includes(w))).filter(i => i >= 0), missed);
    expect(order).toEqual([0, 1, 2]);
  });

  await test.step('the edit made while offline is applied', async () => {
    await expect(bubblesContaining(page, edited)).toHaveCount(1, { timeout: 30_000 });
    await expect(bubblesContaining(page, beforeEdit)).toHaveCount(0);
  });

  await test.step("the other group's unread count reflects what was missed", async () => {
    // The server is the reference: it counts both messages missed while offline.
    // It updates the count after accepting a send, so read it until it settles.
    const serverUnread = async () => {
      const res = await fetch(`${restBase()}/users/${PRIMARY_USER}/conversations/group_${other.guid}`, {
        headers: userHeaders(PRIMARY_USER),
      });
      return Number(((await res.json()) as { data?: { unreadMessageCount?: number | string } }).data?.unreadMessageCount);
    };
    await expect.poll(serverUnread, { message: 'server-side unread count', timeout: 15_000 }).toBe(2);

    await openChatsTab(page);
    await expect(unreadBadge(conversationRow(page, other.name))).toHaveText('2', { timeout: 30_000 });
  });
});
