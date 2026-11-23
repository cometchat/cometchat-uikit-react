/**
 * Offline OFF parity (TEST-PLAN §9.1, 00-off, UIK-GATE-02/03): with the SDK's
 * offline support not configured the kit behaves exactly as the release
 * before it: sends fail as before, reconnect catch-up requests are today's,
 * nothing is queued, cached or stored, and the menus are today's.
 *
 * The full recorded-baseline comparison (TEST-PLAN §5) needs a recording made
 * on the baseline release; these cases assert the same properties directly.
 */
import { expect, test } from '../helpers/test';
import {
  acceptedSends,
  chatReads,
  clearEvents,
  clearFaults,
  control,
  events,
  expectHolds,
  expectRowState,
  indexedDbNames,
  login,
  messageSends,
  network,
  openChat,
  optionIds,
  OPTION,
  requestMark,
  requestsAfter,
  resetServer,
  RETRY_BUTTON,
  row,
  serverRequests,
  typeAndSend,
} from './helpers';

const OFF = { offline: false };

test.beforeEach(async ({ request, context }) => {
  await resetServer(request);
  await context.clearCookies();
});

test('UIT-OFF-02: device offline with offline off: the send fails as before; nothing is queued or cached', async ({
  page,
  request,
}) => {
  await login(page, 'alex', OFF);
  await openChat(page, 'sam');
  expect(chatReads(await serverRequests(request), 'sam').length).toBeGreaterThanOrEqual(1);
  await network(request, 'offline');
  await typeAndSend(page, 'sent with offline off');
  const failed = row(page, 'sent with offline off');
  await expect(failed.locator('.cometchat-receipts-error')).toBeVisible({ timeout: 30_000 });
  // Today's failed row: no offline Retry button, no offline menu.
  await expect(failed.locator(RETRY_BUTTON)).toHaveCount(0);
  const ids = await optionIds(failed);
  expect(ids).not.toContain(OPTION.retry);
  expect(ids).not.toContain(OPTION.discard);
  await network(request, 'online');
  await expectHolds(
    async () =>
      expect(acceptedSends(await serverRequests(request), 'sent with offline off')).toHaveLength(0),
    { for: 12_000 }
  );
});

test("UIT-OFF-03: socket drop and reconnect with offline off runs today's catch-up fetch", async ({
  page,
  request,
}) => {
  await login(page, 'alex', OFF);
  await openChat(page, 'sam');
  await typeAndSend(page, 'anchor before drop');
  await expectRowState(row(page, 'anchor before drop'), /^(sent|delivered|read)$/);
  const mark = await requestMark(request);
  await control(request, '/socket', { action: 'drop' });
  await expect
    .poll(async () => chatReads(await requestsAfter(request, mark), 'sam').length, {
      timeout: 60_000,
    })
    .toBeGreaterThanOrEqual(1);
  // Today's cursor anchors on the newest acked row's id, never 0.
  for (const read of chatReads(await requestsAfter(request, mark), 'sam')) {
    expect(read.query?.['id']).not.toBe('0');
  }
});

test('UIT-OFF-04: offline off creates no offline database and emits no offline event', async ({
  page,
  request,
}) => {
  await login(page, 'alex', OFF);
  await clearEvents(page);
  await openChat(page, 'sam');
  await typeAndSend(page, 'plain send');
  await expectRowState(row(page, 'plain send'), /^(sent|delivered|read)$/);
  const dbs = await indexedDbNames(page);
  expect(dbs.filter(n => /offline|outbox/i.test(n))).toEqual([]);
  const offlineEvents = (await events(page)).filter(
    e => e.type === 'ui:message/send-state-changed' || e.type === 'ui:offline/cache-reset'
  );
  expect(offlineEvents).toEqual([]);
  // Today's send events: one inprogress then one success.
  const sent = (await events(page)).filter(e => e.type === 'ui:message/sent');
  expect(sent.map(e => e.status)).toEqual(['inprogress', 'success']);
  // No local handle on the wire (BEH-SEND-34).
  for (const send of messageSends(await serverRequests(request), 'plain send')) {
    expect(JSON.stringify(send.body)).not.toContain('localMessageId');
  }
});

test("UIT-OFF-01 (menus): with offline off a sent message offers today's menu", async ({
  page,
}) => {
  await login(page, 'alex', OFF);
  await openChat(page, 'sam');
  await typeAndSend(page, 'menu with offline off');
  await expectRowState(row(page, 'menu with offline off'), /^(sent|delivered|read)$/);
  const ids = await optionIds(row(page, 'menu with offline off'));
  expect(ids).not.toContain(OPTION.retry);
  expect(ids).not.toContain(OPTION.discard);
  expect(ids.length).toBeGreaterThan(2);
});

test('UIT-OFF-08: with offline off a chat switch destroys the composer tray as today', async ({
  page,
  request,
}) => {
  await login(page, 'alex', OFF);
  await openChat(page, 'sam');
  await control(request, '/fault', {
    match: { method: 'POST', path: '^/uploads/' },
    kind: 'noResponse',
    times: 'always',
  });
  const chooser = page.waitForEvent('filechooser', { timeout: 5_000 });
  await page.locator('.cometchat-message-composer__attachment-button').first().click();
  await page
    .locator('.cometchat-message-composer__attachment-option')
    .filter({
      has: page.locator('.cometchat-message-composer__attachment-option-title', {
        hasText: /file/i,
      }),
    })
    .first()
    .click();
  await (await chooser).setFiles([new URL('../fixtures/test-file.pdf', import.meta.url).pathname]);
  await expect(page.locator('[data-cc="composer-tray-tile"]').first()).toBeVisible();
  await openChat(page, 'bea');
  await openChat(page, 'sam');
  await expect(page.locator('[data-cc="composer-tray-tile"]')).toHaveCount(0);
  await clearFaults(request);
});
