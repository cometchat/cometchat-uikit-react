import { test, expect, Page } from '../helpers/test';
import { loginToApp, PRIMARY_USER, SECONDARY_USER } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { openConversationFromList, selectGroupByName, waitForChatOpen } from '../helpers/navigation';
import { restBase, sendMessageToGroup, userHeaders } from '../helpers/pinSave';

/**
 * E2E — telling Alice about messages she hasn't seen (catalog C2).
 *
 * A throwaway group with enough history to scroll. At the bottom, a new message from Bob
 * simply appears; scrolled up, it is counted on the scroll-to-bottom button instead, which
 * takes her to it; and a chat she left with unread messages opens at a "New" divider above
 * the first of them.
 */

const HISTORY = 25;
let group: ThrowawayGroup;
let tag: string;

test.beforeEach(async () => {
  tag = String(Date.now());
  group = await createThrowawayGroup({ name: `E2E New messages ${tag}`, owner: PRIMARY_USER, members: [SECONDARY_USER] });
  // Alternating senders, ending with Bob: sending a message marks it read for its sender, so the
  // newest message must be someone else's for Alice to have anything to read.
  for (let i = 1; i <= HISTORY; i++) {
    await sendMessageToGroup({
      guid: group.guid,
      as: (HISTORY - i) % 2 ? PRIMARY_USER : SECONDARY_USER,
      text: `History ${String(i)} of a conversation long enough to scroll [${tag}]`,
    });
  }
});

test.afterEach(async () => {
  await group.dispose();
});

const scroller = (page: Page) =>
  page.locator('.cometchat-messages-wrapper .cometchat-message-list__scroll-container').first();
const bubble = (page: Page, text: string) =>
  page.locator('.cometchat-messages-wrapper .cometchat-message-bubble__wrapper').filter({ hasText: text }).first();
const toBottom = (page: Page) => page.locator('.cometchat-messages-wrapper .cometchat-message-list__scroll-to-bottom').first();

/** Open the group from the Chats list (it is near the top), working around a blank first load. */
async function openGroup(page: Page) {
  await page.locator('.cometchat-tab-component__tab:has-text("Chats")').first().click();
  await openConversationFromList(page, group.name);
  await expect(bubble(page, `History ${String(HISTORY)} `)).toBeInViewport({ timeout: 15_000 });
}

/** Alice's unread count for the group, as the server sees it. */
async function unreadOnServer(): Promise<number> {
  const res = await fetch(`${restBase()}/conversations/group_${group.guid}`, { headers: userHeaders(PRIMARY_USER) });
  const body = (await res.json()) as { data?: { unreadMessageCount?: string | number } };
  return Number(body.data?.unreadMessageCount ?? NaN);
}

test('at the bottom, a new message just appears', async ({ page }) => {
  await loginToApp(page);
  await openGroup(page);

  const fresh = `Arrived at the bottom [${tag}]`;
  await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text: fresh });
  await expect(bubble(page, fresh)).toBeInViewport({ timeout: 15_000 });
  await expect(toBottom(page)).toBeHidden();
});

test('scrolled up, new messages are counted on the scroll-to-bottom button, which takes Alice to them', async ({
  page,
}) => {
  await loginToApp(page);
  await openGroup(page);

  await scroller(page).evaluate(el => {
    el.scrollTop = 0;
  });
  await expect(toBottom(page)).toBeVisible({ timeout: 10_000 });
  await expect(toBottom(page)).toHaveAccessibleName('Scroll to bottom');

  const first = `First while away [${tag}]`;
  const second = `Second while away [${tag}]`;
  await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text: first });
  await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text: second });

  const badge = toBottom(page).locator('.cometchat-message-list__scroll-to-bottom-badge');
  await expect(badge).toHaveText('2', { timeout: 15_000 });
  await expect(toBottom(page)).toHaveAccessibleName('Scroll to bottom, 2 new messages');

  await toBottom(page).click();
  await expect(bubble(page, second)).toBeInViewport({ timeout: 15_000 });
  await expect(bubble(page, first)).toBeVisible();
  await expect(toBottom(page)).toBeHidden({ timeout: 10_000 });
});

test('a chat left with unread messages opens at a "New" divider above the first of them', async ({ page }) => {
  // The server has at times counted one message fewer than were sent. A trace has no WebSocket
  // frames, so keep the read receipts Alice's client sends, to see whether it read one.
  const receipts: string[] = [];
  page.on('websocket', ws => {
    ws.on('framesent', ({ payload }) => {
      if (typeof payload === 'string' && /read|receipt/i.test(payload)) {
        receipts.push(`${new Date().toISOString()} ${payload.slice(0, 500)}`);
      }
    });
  });
  await loginToApp(page);
  // Reading the chat is saved in the background; wait for it, or a later message may be counted
  // as read too and the divider has nothing to follow.
  const read = page.waitForResponse(
    r => r.url().includes(`/groups/${group.guid}/conversation/read`) && r.request().method() === 'POST'
  );
  await openGroup(page);
  expect((await read).ok(), 'the read is saved').toBe(true);
  await expect.poll(unreadOnServer, { timeout: 15_000 }).toBe(0);

  await selectGroupByName(page, 'Design Team');
  await waitForChatOpen(page, 'Design Team');

  const unread = [1, 2, 3].map(i => `Unread ${String(i)} [${tag}]`);
  const sent: string[] = [];
  for (const text of unread) {
    const id = await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text });
    sent.push(`${new Date().toISOString()} sent ${String(id)}: ${text}`);
  }
  try {
    await expect.poll(unreadOnServer, { timeout: 15_000 }).toBe(unread.length);
  } catch (error) {
    const res = await fetch(`${restBase()}/conversations/group_${group.guid}`, { headers: userHeaders(PRIMARY_USER) });
    await test.info().attach('unread diagnosis', {
      contentType: 'text/plain',
      body: [...sent, '', 'Read receipts sent:', ...receipts, '', 'Conversation:', await res.text()].join('\n'),
    });
    throw error;
  }

  await page.locator('.cometchat-tab-component__tab:has-text("Chats")').first().click();
  await openConversationFromList(page, group.name);

  const divider = page.locator('.cometchat-messages-wrapper .cometchat-message-list__new-message-divider');
  await expect(divider).toHaveCount(1, { timeout: 15_000 });
  await expect(divider).toHaveAccessibleName('New');
  await expect(bubble(page, unread[0] ?? '')).toBeInViewport({ timeout: 15_000 });

  // In the list, the divider sits between the last message Alice read and the first she didn't.
  const order = await page
    .locator(
      '.cometchat-messages-wrapper .cometchat-message-list__new-message-divider, ' +
        '.cometchat-messages-wrapper .cometchat-message-bubble__wrapper'
    )
    .evaluateAll(els =>
      els.map(el =>
        el.classList.contains('cometchat-message-list__new-message-divider') ? 'divider' : (el.textContent ?? '')
      )
    );
  const at = order.indexOf('divider');
  expect(order[at - 1]).toContain(`History ${String(HISTORY)} `);
  expect(order[at + 1]).toContain(unread[0]);
});
