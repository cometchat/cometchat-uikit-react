/**
 * Reconnect and sync (TEST-PLAN §9.4, 03-sync): with offline on the lists make
 * no fetch of their own on reconnect; the SDK's sweep delivers what was missed.
 */
import { expect, test } from '../helpers/test';
import {
  afterFirstSweep,
  ACKED,
  acceptedSends,
  chatReads,
  control,
  expectHolds,
  expectNoDuplicateKey,
  expectRowState,
  expectSocketEvent,
  frames,
  login,
  network,
  openChat,
  push,
  requestMark,
  requestsAfter,
  resetServer,
  seed,
  row,
  rows,
  serverRequests,
  typeAndSend,
} from './helpers';

test.beforeEach(async ({ request, context }) => {
  await resetServer(request, {
    users: ['alex', 'sam', 'bea'],
    groups: [{ guid: 'team', name: 'Team', members: ['alex', 'sam', 'bea'], owner: 'sam' }],
    conversations: [{ with: 'sam' }, { with: 'bea' }, { with: { guid: 'team' } }],
    messages: [
      { with: 'sam', count: 4, from: 'alternate' },
      { with: 'bea', count: 2, from: 'alternate' },
      { with: { guid: 'team' }, count: 2, from: 'sam' },
    ],
  });
  await context.clearCookies();
});

test("UIT-SYNC-01: reconnect makes no message-list or conversation-list fetch of the kit's own", async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  // The opening reads are done: the chat's first page and the SDK's first sweep.
  await expect
    .poll(async () =>
      chatReads(await serverRequests(request), 'sam').some(r => r.outcome === 'answered')
    )
    .toBe(true);
  await afterFirstSweep(request);
  const beforeOffline = await requestMark(request);
  await network(request, 'offline');
  // The flip cut the socket: coming back online is a reconnect.
  await expectSocketEvent(request, beforeOffline, 'close');
  const mark = await requestMark(request);
  await network(request, 'online');
  const expectNoOwnFetch = async () => {
    const after = await requestsAfter(request, mark);
    expect(
      chatReads(after, 'sam'),
      JSON.stringify(after.map(r => `${r.method} ${r.path}`))
    ).toHaveLength(0);
    // The SDK's sweep reads conversations once with its own page size; the list adds none.
    const listReads = after.filter(
      r => r.method === 'GET' && r.path === '/conversations' && r.query?.['per_page'] === '30'
    );
    expect(listReads).toHaveLength(0);
    // At most one read receipt for the open chat.
    const receipts = after.filter(
      r => r.method === 'POST' && /\/users\/sam\/conversation\/read$/.test(r.path)
    );
    expect(receipts.length).toBeLessThanOrEqual(1);
  };
  // The kit could fetch on the connect or after the sweep it hears about, so
  // the whole reconnect window is watched.
  await expectHolds(expectNoOwnFetch, { for: 15_000 });
});

test('UIT-SYNC-02: messages sent by others while offline appear in the open chat after reconnect, in order', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await afterFirstSweep(request);
  await network(request, 'offline');
  await push(request, [
    { frame: 'message', from: 'sam', toUser: 'alex', text: 'missed one' },
    { frame: 'message', from: 'sam', toUser: 'alex', text: 'missed two' },
  ]);
  await network(request, 'online');
  await expect(row(page, 'missed two')).toBeVisible({ timeout: 45_000 });
  await expect(rows(page, 'missed one')).toHaveCount(1);
  const order = await page
    .locator('[data-cc="message-row"]')
    .evaluateAll(els => els.map(e => e.textContent ?? ''));
  expect(order.findIndex(t => t.includes('missed one'))).toBeLessThan(
    order.findIndex(t => t.includes('missed two'))
  );
  expectNoDuplicateKey(await frames(page));
});

test('UIT-SYNC-05: socket flapping sends nothing twice and loses nothing', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await network(request, 'offline');
  await typeAndSend(page, 'through the tunnel');
  await expectRowState(row(page, 'through the tunnel'), 'sending', 10_000);
  // Nothing is sent twice or lost at any point of the flapping, not only at its end.
  const nothingTwiceNothingLost = async () => {
    expect(await rows(page, 'through the tunnel').count()).toBe(1);
    expect(
      acceptedSends(await serverRequests(request), 'through the tunnel').length
    ).toBeLessThanOrEqual(1);
  };
  for (let i = 0; i < 4; i++) {
    await network(request, 'online');
    await expectHolds(nothingTwiceNothingLost, { for: 700 });
    await network(request, 'offline');
    await expectHolds(nothingTwiceNothingLost, { for: 700 });
  }
  await network(request, 'online');
  await expectRowState(row(page, 'through the tunnel'), ACKED, 60_000);
  await expect(rows(page, 'through the tunnel')).toHaveCount(1);
  expect(
    acceptedSends(await serverRequests(request), 'through the tunnel').length
  ).toBeLessThanOrEqual(1);
});

test('UIT-SYNC-12: a live message during the cooldown and an older swept one both show, in time order', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await afterFirstSweep(request);
  await network(request, 'offline');
  await push(request, { frame: 'message', from: 'sam', toUser: 'alex', text: 'older swept' });
  await network(request, 'online');
  // Reconnect again at once: the sweep is deferred by its cooldown; a live message arrives first.
  const beforeDrop = await requestMark(request);
  await control(request, '/socket', { action: 'drop' });
  // Live: the push goes once the SDK's socket is back and logged in.
  await expectSocketEvent(request, beforeDrop, 'auth');
  await push(request, { frame: 'message', from: 'sam', toUser: 'alex', text: 'newer live' });
  await expect(row(page, 'newer live')).toBeVisible({ timeout: 30_000 });
  await expect(row(page, 'older swept')).toBeVisible({ timeout: 45_000 });
  const order = await page
    .locator('[data-cc="message-row"]')
    .evaluateAll(els => els.map(e => e.textContent ?? ''));
  expect(order.findIndex(t => t.includes('older swept'))).toBeLessThan(
    order.findIndex(t => t.includes('newer live'))
  );
});

test('UIT-SYNC-13: kicked from a group while offline, the action row shows after catch-up and the composer is disabled', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'team', 'Team');
  await afterFirstSweep(request);
  await network(request, 'offline');
  // The action row as the sweep's changelog delivers it. A `groupMember` push only
  // sends a live frame and stores no row, so offline it would never come back, and
  // the fake server hides a group's rows from someone no longer in it.
  const user = (uid: string, name: string) => ({
    entityType: 'user',
    entity: { uid, name, status: 'offline', role: 'default' },
  });
  await seed(request, {
    messages: [
      {
        group: 'team',
        from: 'sam',
        category: 'action',
        type: 'groupMember',
        text: 'kicked',
        extra: { action: 'kicked' },
        data: {
          action: 'kicked',
          entities: {
            by: user('sam', 'Sam'),
            on: user('alex', 'Alex'),
            for: { entityType: 'group', entity: { guid: 'team', name: 'Team', type: 'public' } },
          },
        },
      },
    ],
  });
  await network(request, 'online');
  await expect(
    page.locator('[data-cc="message-row"]', { hasText: /kicked|removed/i }).first()
  ).toBeVisible({
    timeout: 45_000,
  });
  // As for a live kick: the host tells the user, then closes the chat.
  await page.getByRole('button', { name: 'Understood' }).click({ timeout: 15_000 });
  await expect(page.locator('[data-cc="composer-input"]')).toHaveCount(0, { timeout: 15_000 });
});
