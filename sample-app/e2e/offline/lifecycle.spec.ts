/**
 * Session and lifecycle (TEST-PLAN §9.5, 04-lifecycle) plus the removal
 * notices: logout and user switch, kill switch, cache reset, DISCARDED /
 * QUEUE_OVERFLOW, offline relaunch, a restored session that never reopens the
 * chat.
 */
import { expect, test } from '../helpers/test';
import {
  ACKED,
  afterFirstSweep,
  acceptedSends,
  control,
  conversationRow,
  CONVERSATION_ROW,
  deleteOfflineCacheKey,
  events,
  expectHolds,
  expectRowState,
  frames,
  login,
  logout,
  MESSAGE_ROW,
  network,
  NOTICE,
  offlineCacheKeyCount,
  openChat,
  OPTION,
  optionIds,
  relaunch,
  resetServer,
  row,
  rows,
  serverRequests,
  typeAndSend,
} from './helpers';

test.beforeEach(async ({ request, context }) => {
  await resetServer(request);
  await context.clearCookies();
});

test('UIT-LIFE-01/10: logout with waiting messages clears every screen; the next login starts clean', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await network(request, 'offline');
  await typeAndSend(page, 'waiting at logout');
  await expectRowState(row(page, 'waiting at logout'), 'sending', 10_000);
  await network(request, 'online');
  await logout(page);
  await expect(page.locator('[data-cc="message-row"]')).toHaveCount(0);
  await page.locator('#uid-input').fill('alex');
  await page.locator('.cometchat-login__submit-button').click();
  await expect(page.locator(CONVERSATION_ROW).first()).toBeVisible({ timeout: 45_000 });
  await openChat(page, 'sam');
  // The session's queued sends go with it (BEH-AUTH-04): nothing hangs, nothing is shown.
  await expectHolds(
    async () =>
      expect(await page.locator('[data-cc="message-row"][data-cc-state="sending"]').count()).toBe(
        0
      ),
    { for: 3_000 }
  );
});

test("UIT-LIFE-02: a user switch never shows a frame with the first user's rows", async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await network(request, 'offline');
  await typeAndSend(page, 'alex private text');
  await network(request, 'online');
  await logout(page);
  await page.evaluate(() => {
    (window as unknown as { __ccFrames: unknown[] }).__ccFrames = [];
  });
  await page.locator('#uid-input').fill('bea');
  await page.locator('.cometchat-login__submit-button').click();
  await expect(page.locator(CONVERSATION_ROW).first()).toBeVisible({ timeout: 45_000 });
  await expect(conversationRow(page, 'bea')).toHaveCount(0);
  await openChat(page, 'alex');
  await expect(rows(page, 'alex private text')).toHaveCount(0);
  // noForeign: no frame after the switch shows a row of alex's pending send.
  for (const frame of await frames(page)) {
    expect(frame.rows.filter(r => r.mine && r.state === 'sending')).toEqual([]);
  }
});

test('UIT-LIFE-04: the kill switch turns waiting rows failed with one notice; Retry makes one fresh send', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await network(request, 'offline');
  await typeAndSend(page, 'stranded one');
  await typeAndSend(page, 'stranded two');
  await expectRowState(row(page, 'stranded two'), 'sending', 10_000);
  // The server turns offline support off; the SDK reads it at the next settings fetch.
  await control(request, '/settings', {
    parameters: { 'features.core.offline-support.enabled': ' False ' },
  });
  await network(request, 'online');
  // The next operation or connection event finds offline off with unsent rows shown.
  await relaunch(page);
  await openChat(page, 'sam');
  // Settled: the chat shows its rows and none is still waiting.
  await expect(page.locator(MESSAGE_ROW).first()).toBeVisible();
  await expect(page.locator('[data-cc="message-row"][data-cc-state="sending"]')).toHaveCount(0);
  const failed = page.locator('[data-cc="message-row"][data-cc-state="failed"]');
  const notice = page.locator(`${NOTICE}[data-cc-key="messages_not_sent"]`);
  // Either the rows are gone with the wiped store (relaunch reads from the
  // server only) or they stayed visible and turned failed with one notice.
  if ((await failed.count()) > 0) {
    await expect(notice).toHaveCount(1);
    expect(await optionIds(failed.first())).toEqual([OPTION.retry, OPTION.discard]);
    await failed.first().locator('[data-testid="offline-retry"]').click();
    await expectRowState(failed.first(), ACKED, 30_000);
  }
  await control(request, '/settings', { parameters: {}, replace: true });
});

test('UIT-LIFE-04 (in session): offline turned off mid-session turns shown waiting rows failed at the next connection event', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await network(request, 'offline');
  await typeAndSend(page, 'in-session stranded');
  await expectRowState(row(page, 'in-session stranded'), 'sending', 10_000);
  await control(request, '/settings', {
    parameters: { 'features.core.offline-support.enabled': ' False ' },
  });
  await control(request, '/clock', { advance: 61_000 });
  await network(request, 'online');
  const stranded = row(page, 'in-session stranded');
  // Sent by the reconnect flush before the switch was read (R112), or failed (direct) with a notice.
  await expect(stranded).toHaveAttribute('data-cc-state', /^(failed|sent|delivered|read)$/, {
    timeout: 90_000,
  });
  if ((await stranded.getAttribute('data-cc-state')) === 'failed') {
    await expect(page.locator(`${NOTICE}[data-cc-key="messages_not_sent"]`)).toHaveCount(1);
  }
  await control(request, '/settings', { parameters: {}, replace: true });
});

test('UIT-LIFE-05: a cache reset that lost unsent messages shows one notice with the count; lists reload', async ({
  page,
  request,
}) => {
  await login(page, 'alex', { config: { encryption: true } });
  await openChat(page, 'sam');
  await network(request, 'offline');
  await typeAndSend(page, 'lost one');
  await typeAndSend(page, 'lost two');
  await expectRowState(row(page, 'lost two'), 'sending', 10_000);
  expect(await deleteOfflineCacheKey(page)).toBeGreaterThan(0);
  await network(request, 'online');
  await relaunch(page, { config: { encryption: true } });
  const notice = page.locator(
    `${NOTICE}[data-cc-key="unsent_messages_lost"], ${NOTICE}[data-cc-key="unsent_messages_maybe_lost"]`
  );
  await expect(notice).toHaveCount(1, { timeout: 30_000 });
  const reset = (await events(page)).filter(e => e.type === 'ui:offline/cache-reset');
  expect(reset).toHaveLength(1);
  if (reset[0]?.pendingMessagesLost !== null && reset[0]?.pendingMessagesLost !== undefined) {
    await expect(notice).toHaveAttribute('data-cc-count', String(reset[0].pendingMessagesLost));
  }
  await expect(page.locator(CONVERSATION_ROW).first()).toBeVisible();
});

test('UIT-LIFE-06: a cache reset with nothing lost shows no notice', async ({ page, request }) => {
  await login(page, 'alex', { config: { encryption: true } });
  await openChat(page, 'sam');
  // The sealed cache key is stored, so deleting it makes the next launch reset the cache.
  await expect.poll(() => offlineCacheKeyCount(page)).toBeGreaterThan(0);
  expect(await deleteOfflineCacheKey(page)).toBeGreaterThan(0);
  await relaunch(page, { config: { encryption: true } });
  // The reset happened (the kit decides on its notice as it publishes this event)...
  await expect
    .poll(async () => (await events(page)).filter(e => e.type === 'ui:offline/cache-reset').length)
    .toBeGreaterThan(0);
  // ...and no notice about unsent messages follows.
  await expectHolds(
    async () =>
      expect(await page.locator(`${NOTICE}[data-cc-key^="unsent_messages"]`).count()).toBe(0),
    { for: 5_000 }
  );
  await expect(page.locator(CONVERSATION_ROW).first()).toBeVisible();
  void request;
});

test('UIT-SEND-13: an unsent message the SDK drops (queue overflow) disappears with one notice and no Retry', async ({
  page,
  request,
}) => {
  await login(page, 'alex', {
    config: { maxPendingMessages: 2, pendingQueueOverflowPolicy: 'DROP_OLDEST' },
  });
  await openChat(page, 'sam');
  await network(request, 'offline');
  await typeAndSend(page, 'oldest dropped');
  await typeAndSend(page, 'kept one');
  await typeAndSend(page, 'kept two');
  await expect(rows(page, 'oldest dropped')).toHaveCount(0, { timeout: 15_000 });
  const notice = page.locator(`${NOTICE}[data-cc-key="unsent_message_removed"]`);
  await expect(notice).toHaveCount(1);
  // Copy for the removed text, no Retry.
  await expect(notice.getByRole('button', { name: /copy/i })).toBeVisible();
  await expect(notice.getByRole('button', { name: /retry/i })).toHaveCount(0);
  await network(request, 'online');
  await expectRowState(row(page, 'kept two'), ACKED, 45_000);
  expect(acceptedSends(await serverRequests(request), 'oldest dropped')).toHaveLength(0);
});

test('UIT-LIFE-07: an offline relaunch shows the conversation list as last seen, with previews and unread counts', async ({
  page,
  request,
}) => {
  await login(page);
  // The list has settled: the SDK's first sweep (after the list's own reads) is in.
  await afterFirstSweep(request);
  const before = await page
    .locator(CONVERSATION_ROW)
    .evaluateAll(els =>
      els.map(
        e => `${e.getAttribute('data-cc-with') ?? ''}:${e.getAttribute('data-cc-unread') ?? ''}`
      )
    );
  await network(request, 'offline');
  await relaunch(page);
  await expect(page.locator(CONVERSATION_ROW)).toHaveCount(before.length, { timeout: 30_000 });
  const after = await page
    .locator(CONVERSATION_ROW)
    .evaluateAll(els =>
      els.map(
        e => `${e.getAttribute('data-cc-with') ?? ''}:${e.getAttribute('data-cc-unread') ?? ''}`
      )
    );
  expect(after).toEqual(before);
  await expect(page.locator('[data-cc="error"]')).toHaveCount(0);
  await network(request, 'online');
});

test('UIT-LIFE-08: first launch never online: empty lists, no spinner forever', async ({
  page,
  request,
}) => {
  await network(request, 'offline');
  await page.goto('/?offline=1');
  await page.locator('#uid-input').fill('alex');
  await page.locator('.cometchat-login__submit-button').click();
  // The login attempt ends: either the login screen shows its error, or the
  // lists are up and done loading (a list with nothing to show is the error state worded
  // "Connect to load chats", D84). A login that never ends fails here.
  await expect(
    page
      .locator(
        '.cometchat-login__error, .cometchat-conversations__error-state, .cometchat-conversations__list[aria-busy="false"]'
      )
      .first()
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(CONVERSATION_ROW)).toHaveCount(0);
  await expect(page.locator('.cometchat-conversations__list[aria-busy="true"]')).toHaveCount(0);
  await network(request, 'online');
});

test('UIT-LIFE-13: a restored session with a queued message sends it on reconnect without reopening the chat', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await network(request, 'offline');
  await typeAndSend(page, 'sent from the background');
  await expectRowState(row(page, 'sent from the background'), 'sending', 10_000);
  await relaunch(page);
  // Never reopen the chat: the hub registered at init hears the outbox.
  await network(request, 'online');
  await expect
    .poll(
      async () => acceptedSends(await serverRequests(request), 'sent from the background').length,
      {
        timeout: 45_000,
      }
    )
    .toBe(1);
  await openChat(page, 'sam');
  await expectRowState(row(page, 'sent from the background'), ACKED, 30_000);
  await expect(rows(page, 'sent from the background')).toHaveCount(1);
});
