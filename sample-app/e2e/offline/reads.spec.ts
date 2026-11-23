/**
 * Two-phase reads (TEST-PLAN §9.2, 01-reads, and §9.6 UIT-CONV-01): the cached
 * page paints first, the server page replaces it in place; offline the chat
 * opens from the device with "connect to load more" and never an error screen.
 */
import { expect, test, type Page } from '../helpers/test';
import {
  afterFirstSweep,
  ACKED,
  chatReads,
  clearFrames,
  CONVERSATION_ROW,
  expectNoBlank,
  expectNoDuplicateKey,
  expectHolds,
  expectNoFlash,
  expectRowState,
  fault,
  frames,
  listFooter,
  MESSAGE_ROW,
  login,
  MESSAGE_LIST,
  network,
  openChat,
  relaunch,
  release,
  requestMark,
  requestsAfter,
  resetServer,
  row,
  push,
  rows,
  seed,
  serverRequests,
  typeAndSend,
} from './helpers';

test.beforeEach(async ({ request, context }) => {
  await resetServer(request, {
    users: ['alex', 'sam', 'bea'],
    conversations: [{ with: 'sam' }, { with: 'bea' }],
    messages: [
      { with: 'sam', count: 60, from: 'alternate', text: 'history' },
      { with: 'bea', count: 3, from: 'alternate', text: 'bea says' },
      { with: 'sam', from: 'sam', text: 'will be edited', as: 'e1' },
    ],
  });
  await context.clearCookies();
});

test('UIT-READ-01 / UIT-CONV-01: online reopen paints cached rows first, then server rows in place; no duplicate, flash or blank', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await expect(row(page, 'history 60')).toBeVisible();
  await relaunch(page);
  await clearFrames(page);
  // Hold the server phase so the cached first paint is observable.
  await fault(request, {
    match: { method: 'GET', path: '/users/sam/messages' },
    kind: 'noResponse',
    times: 1,
  });
  await openChat(page, 'sam');
  await expect(row(page, 'history 60')).toBeVisible({ timeout: 10_000 });
  await release(request);
  // The held server page is answered...
  await expect
    .poll(async () =>
      chatReads(await serverRequests(request), 'sam').some(r => r.outcome === 'held')
    )
    .toBe(false);
  // ...and replaces the cached one: every frame of that stays whole.
  await expectHolds(
    async () => {
      const frameLog = await frames(page);
      expectNoDuplicateKey(frameLog);
      expectNoFlash(frameLog);
      expectNoBlank(frameLog);
    },
    { for: 3_000 }
  );
  const log = await frames(page);
  expect(log.length).toBeGreaterThan(0);
  expectNoDuplicateKey(log);
  expectNoFlash(log);
  expectNoBlank(log);
  await expect(page.locator('[data-cc="error"]')).toHaveCount(0);
});

test('UIT-READ-02/04: offline, a chat seen before opens from the device in order, footer connect-to-load-more, no error, no spinner', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await expect(row(page, 'history 60')).toBeVisible();
  await network(request, 'offline');
  await relaunch(page);
  await openChat(page, 'sam');
  await expect(row(page, 'history 60')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-cc="error"]')).toHaveCount(0);
  // Scroll to the top of what the cache has: the list says it needs a connection.
  await page
    .locator(MESSAGE_LIST)
    .first()
    .evaluate(el => {
      el.scrollTop = 0;
    });
  await expect.poll(() => listFooter(page), { timeout: 20_000 }).toBe('connect-to-load-more');
  // Every read settles (P6): the footer does not go back to loading.
  await expectHolds(async () => expect(await listFooter(page)).not.toBe('loading'), {
    for: 10_000,
  });
  await network(request, 'online');
});

test('UIT-READ-02b: a chat opened online is saved: reopened with the browser offline, it shows its history', async ({
  page,
  context,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await expect(row(page, 'history 60')).toBeVisible();
  await openChat(page, 'bea');
  await expect(row(page, 'bea says 3')).toBeVisible();
  await context.setOffline(true);
  await openChat(page, 'sam');
  await expect(row(page, 'history 60')).toBeVisible({ timeout: 20_000 });
  await expect(row(page, 'history 40')).toBeVisible();
  await expect(page.locator('[data-cc="error"]')).toHaveCount(0);
  await context.setOffline(false);
});

test('UIT-READ-02c: rows the kit filters on the client never dead-end a page or show the empty state, online or from the cache', async ({
  page,
  request,
  context,
}) => {
  await seed(request, {
    users: ['dee'],
    conversations: [{ with: 'dee' }],
    messages: [
      { with: 'dee', count: 3, from: 'dee', text: 'old visible' },
      // Two whole pages this list never shows (not in the kit's default types).
      {
        with: 'dee',
        count: 60,
        from: 'dee',
        text: 'hidden',
        type: 'hidden_kind',
        category: 'custom',
      },
    ],
  });
  await login(page);
  await openChat(page, 'dee');
  await expect(row(page, 'old visible 3')).toBeVisible({ timeout: 30_000 });
  await expect(rows(page, 'hidden')).toHaveCount(0);
  await expect(page.locator('[data-cc="empty"]')).toHaveCount(0);
  await openChat(page, 'bea');
  await context.setOffline(true);
  await openChat(page, 'dee');
  await expect(row(page, 'old visible 3')).toBeVisible({ timeout: 30_000 });
  await expect(rows(page, 'hidden')).toHaveCount(0);
  await context.setOffline(false);
});

test('UIT-READ-02d: a message deleted while away goes from the saved chat on the next online read', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await expect(row(page, 'will be edited')).toBeVisible();
  await openChat(page, 'bea');
  await network(request, 'offline');
  await push(request, { frame: 'delete', target: 'e1' });
  await network(request, 'online');
  await openChat(page, 'sam');
  await expect(row(page, 'history 60')).toBeVisible({ timeout: 20_000 });
  await expect(rows(page, 'will be edited')).toHaveCount(0, { timeout: 20_000 });
});

test('UIT-READ-03: offline at the top the row reads "Connect to load more"; online again the older page loads by itself, no tap (D84)', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  // Seen online first: the rows are in the device's cache before the network goes.
  await expect(row(page, 'history 60')).toBeVisible();
  await network(request, 'offline');
  await relaunch(page);
  await openChat(page, 'sam');
  await page
    .locator(MESSAGE_LIST)
    .first()
    .evaluate(el => {
      el.scrollTop = 0;
    });
  await expect.poll(() => listFooter(page), { timeout: 20_000 }).toBe('connect-to-load-more');
  await expect(page.locator('[data-testid="offline-load-more"] button')).toHaveText(
    'Connect to load more'
  );
  await network(request, 'online');
  await expect(row(page, 'history 1')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-testid="offline-load-more"]')).toHaveCount(0);
});

test('UIT-READ-06: a pending row survives every server phase (initial and older pages)', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await network(request, 'offline');
  await typeAndSend(page, 'pending through reads');
  await expectRowState(row(page, 'pending through reads'), 'sending', 10_000);
  await relaunch(page);
  await openChat(page, 'sam');
  await expectRowState(row(page, 'pending through reads'), 'sending', 20_000);
  // A server phase arrives (reads are refused offline; let only reads through).
  await network(request, 'online');
  await page
    .locator(MESSAGE_LIST)
    .first()
    .evaluate(el => {
      el.scrollTop = 0;
    });
  // Through the server phases that follow, the pending row is there exactly once.
  await expectHolds(
    async () => expect(await rows(page, 'pending through reads').count()).toBe(1),
    { for: 3_000 }
  );
  await expect(rows(page, 'pending through reads')).toHaveCount(1);
  await expectRowState(row(page, 'pending through reads'), /^(sending|sent|delivered|read)$/);
});

test('UIT-READ-07: switching chats during a slow read never shows chat A rows in chat B', async ({
  page,
  request,
}) => {
  await login(page);
  await fault(request, {
    match: { method: 'GET', path: '/users/sam/messages' },
    kind: 'noResponse',
    times: 1,
  });
  await page.locator(`${CONVERSATION_ROW}[data-cc-with="sam"]`).click();
  await openChat(page, 'bea');
  await expect(row(page, 'bea says 3')).toBeVisible();
  await release(request);
  // The held read of sam's chat is answered; its rows never come into bea's chat.
  await expect
    .poll(async () =>
      chatReads(await serverRequests(request), 'sam').some(r => r.outcome === 'held')
    )
    .toBe(false);
  await expectHolds(async () => expect(await rows(page, 'history').count()).toBe(0), {
    for: 3_000,
  });
});

test('UIT-READ-12: an empty cached page never ends history; the server page decides', async ({
  page,
  request,
}) => {
  await login(page);
  // bea's chat was never opened: its cache is empty; hold the server page.
  await fault(request, {
    match: { method: 'GET', path: '/users/bea/messages' },
    kind: 'noResponse',
    times: 1,
  });
  await openChat(page, 'bea');
  await expect(page.locator(`${MESSAGE_LIST}[data-cc-list-footer="end"]`)).toHaveCount(0);
  await release(request);
  await expect(row(page, 'bea says 3')).toBeVisible({ timeout: 20_000 });
});

test('UIT-READ-04b: a chat opened offline with nothing cached reads "Connect to load messages" (D84) and fills when the connection returns', async ({
  page,
  request,
}) => {
  await login(page);
  await network(request, 'offline');
  // bea's chat was never opened: its cache is empty, and the read ends offline.
  await openChat(page, 'bea');
  await expect(page.locator('[data-cc="error"]')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-cc="error"]')).toContainText('Connect to load messages');
  await expect(page.locator('[data-cc="error"] button')).toHaveCount(0);
  await expect(page.locator('[data-cc="empty"]')).toHaveCount(0);
  await network(request, 'online');
  await expect(row(page, 'bea says 3')).toBeVisible({ timeout: 45_000 });
  await expect(page.locator('[data-cc="error"]')).toHaveCount(0);
  await expect(page.locator('[data-cc="empty"]')).toHaveCount(0);
});

test('UIT-READ-15: the reconnect and paging cursors ignore rows without a server id (offline on)', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await network(request, 'offline');
  await typeAndSend(page, 'newest is unsent');
  await expectRowState(row(page, 'newest is unsent'), 'sending', 10_000);
  const mark = await requestMark(request);
  await network(request, 'online');
  await expectRowState(row(page, 'newest is unsent'), ACKED, 45_000);
  // No kit read anchored on id 0 (`id=0` or a missing id cursor).
  const reads = chatReads(await requestsAfter(request, mark), 'sam');
  for (const read of reads) expect(read.query?.['id']).not.toBe('0');
});

test('UIT-READ-13 / UIT-SYNC-03: an edit made while away shows the new text in place after reconnect; nothing is inserted', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await expect(row(page, 'will be edited')).toBeVisible();
  const before = await page.locator('[data-cc="message-row"]').count();
  await afterFirstSweep(request);
  await network(request, 'offline');
  await push(request, { frame: 'edit', target: 'e1', text: 'edited while away' });
  await network(request, 'online');
  await expect(row(page, 'edited while away')).toBeVisible({ timeout: 45_000 });
  await expect(rows(page, 'will be edited')).toHaveCount(0);
  expect(await page.locator('[data-cc="message-row"]').count()).toBe(before);
});

/** The texts of the message rows inside the list's visible area. */
async function rowsOnScreen(page: Page): Promise<string[]> {
  return page.locator(MESSAGE_LIST).first().evaluate((list, selector) => {
    const view = list.getBoundingClientRect();
    return Array.from(list.querySelectorAll(selector))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.bottom > view.top && r.top < view.bottom;
      })
      .map(el => (el.textContent ?? '').match(/unread history (\d+)/)?.[1] ?? '')
      .filter(Boolean);
  }, MESSAGE_ROW);
}

for (const offline of [true, false]) {
  test(`start from the first unread: 80 messages, 40 unread, the chat opens at the last read message (offline ${offline ? 'on' : 'off'})`, async ({
    page,
    request,
  }) => {
    await resetServer(request, {
      users: ['alex', 'sam', 'bea'],
      conversations: [{ with: 'sam', unreadCount: 40 }, { with: 'bea' }],
      messages: [
        { with: 'sam', count: 80, from: 'sam', text: 'unread history' },
        { with: 'bea', count: 3, from: 'alternate', text: 'bea says' },
      ],
    });
    await login(page, 'alex', { offline });
    await openChat(page, 'sam');
    const lastRead = page.locator(MESSAGE_ROW).filter({ hasText: /unread history 40\b/ });
    await expect(lastRead).toBeInViewport({ timeout: 20_000 });
    // It stays there: the list neither settles at the bottom nor pages newer by itself.
    await expect
      .poll(async () => Math.max(...(await rowsOnScreen(page)).map(Number)), { timeout: 5_000 })
      .toBeLessThan(60);
    await expect(lastRead).toBeInViewport();
  });
}

test('UIT-READ-03: offline at the top of a chat, then online again, the older page loads by itself (no tap, no scroll) (D84)', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await expect(row(page, 'history 60')).toBeVisible();
  await network(request, 'offline');
  const list = page.locator(MESSAGE_LIST).first();
  await list.evaluate(el => {
    el.scrollTop = 0;
  });
  await expect.poll(() => listFooter(page), { timeout: 20_000 }).toBe('connect-to-load-more');
  await network(request, 'online');
  // Once the SDK is connected again the blocked edge loads its page once, with no gesture.
  await expect(row(page, 'history 1')).toBeAttached({ timeout: 45_000 });
  await expect(page.locator('[data-testid="offline-load-more"]')).toHaveCount(0);
});
