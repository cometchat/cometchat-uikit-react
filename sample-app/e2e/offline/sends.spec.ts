/**
 * Offline sends (TEST-PLAN §9.3, 02-sends): queued sends, the ack in place,
 * restart persistence, refusals, duplicate prevention and the public events.
 */
import { expect, test } from '../helpers/test';
import {
  acceptedSends,
  chooseOption,
  ACKED,
  clearEvents,
  clearFaults,
  control,
  conversationRow,
  events,
  expectHolds,
  expectNoDuplicateKey,
  expectRowState,
  expectSocketEvent,
  fault,
  frames,
  login,
  MESSAGE_LIST,
  messageSends,
  network,
  NOTICE,
  openChat,
  OPTION,
  optionIds,
  relaunch,
  requestMark,
  resetServer,
  RETRY_BUTTON,
  row,
  rows,
  serverRequests,
  typeAndSend,
} from './helpers';

test.beforeEach(async ({ request, context }) => {
  await resetServer(request);
  await context.clearCookies();
});

test('UIT-SEND-01/02/03: offline sends appear at once as not sent yet, in compose order, and each turns sent in place on reconnect', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await network(request, 'offline');

  for (const text of ['first offline', 'second offline', 'third offline']) {
    await typeAndSend(page, text);
    await expectRowState(row(page, text), 'sending', 10_000);
  }
  // In compose order, at the bottom.
  const order = await page
    .locator('[data-cc="message-row"]')
    .evaluateAll(els => els.map(e => e.textContent ?? ''));
  const index = (t: string) => order.findIndex(text => text.includes(t));
  expect(index('first offline')).toBeLessThan(index('second offline'));
  expect(index('second offline')).toBeLessThan(index('third offline'));
  expect(index('third offline')).toBe(order.length - 1);
  // Queued is not failed (BEH-SEND-10): no error, no Retry button.
  await expect(row(page, 'first offline').locator(RETRY_BUTTON)).toHaveCount(0);
  const keyBefore = await row(page, 'first offline').getAttribute('data-cc-key');

  await network(request, 'online');
  for (const text of ['first offline', 'second offline', 'third offline']) {
    await expectRowState(row(page, text), ACKED, 45_000);
    await expect(rows(page, text)).toHaveCount(1);
  }
  // Same render key from compose to ack (no remount, UIK-SEND-08).
  expect(keyBefore).not.toBeNull();
  await expect(row(page, 'first offline')).toHaveAttribute('data-cc-key', keyBefore ?? '');
  // Each went to the server once, in order.
  const all = await serverRequests(request);
  const seqs = ['first offline', 'second offline', 'third offline'].map(t => {
    const accepted = acceptedSends(all, t);
    expect(accepted, `${t} accepted once`).toHaveLength(1);
    return Number(accepted[0]?.seq);
  });
  expect(seqs).toEqual([...seqs].sort((a, b) => a - b));
  expectNoDuplicateKey(await frames(page));
});

test('UIT-SEND-11: exactly one inprogress and one success per message on the offline path', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await clearEvents(page);
  await network(request, 'offline');
  await typeAndSend(page, 'events once');
  await expectRowState(row(page, 'events once'), 'sending', 10_000);
  await network(request, 'online');
  await expectRowState(row(page, 'events once'), ACKED, 45_000);
  const sent = (await events(page)).filter(e => e.type === 'ui:message/sent');
  expect(sent.filter(e => e.status === 'inprogress')).toHaveLength(1);
  expect(sent.filter(e => e.status === 'success')).toHaveLength(1);
  expect(sent.filter(e => e.status === 'error')).toHaveLength(0);
});

test('UIT-SEND-04/12: a send the server refuses shows failed; it is never re-sent without a tap', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await fault(request, {
    match: { method: 'POST', path: '/messages' },
    kind: 'status',
    status: 422,
    body: { error: { code: 'ERR_MESSAGE_INVALID', message: 'refused for the test' } },
    times: 'always',
  });
  await typeAndSend(page, 'refused for good');
  await expectRowState(row(page, 'refused for good'), 'failed');
  // Two reconnects: the kit and the SDK never send it again by themselves.
  for (let i = 0; i < 2; i++) {
    const mark = await requestMark(request);
    await network(request, 'offline');
    // The flip cuts the socket: the SDK has a reconnect to make.
    await expectSocketEvent(request, mark, 'close');
    await network(request, 'online');
    await expectHolds(
      async () =>
        expect(messageSends(await serverRequests(request), 'refused for good')).toHaveLength(1),
      { for: 12_000 }
    );
  }
  expect(messageSends(await serverRequests(request), 'refused for good')).toHaveLength(1);
  await expectRowState(row(page, 'refused for good'), 'failed', 1_000);
  await clearFaults(request);
});

test('UIT-SEND-05: a failed message is failed on the very first frame after a relaunch', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await fault(request, {
    match: { method: 'POST', path: '/messages' },
    kind: 'status',
    status: 400,
    body: { error: { code: 'ERR_BAD_REQUEST', message: 'refused' } },
    times: 1,
  });
  await typeAndSend(page, 'failed across restart');
  await expectRowState(row(page, 'failed across restart'), 'failed');

  await relaunch(page);
  await openChat(page, 'sam');
  await expectRowState(row(page, 'failed across restart'), 'failed', 20_000);
  // firstFrameWith: the first frame that shows the row already shows it failed.
  const log = await frames(page);
  const key = await row(page, 'failed across restart').getAttribute('data-cc-key');
  const first = log.flatMap(f => f.rows).find(r => r.key === key);
  expect(first?.state).toBe('failed');
});

test('UIT-SEND-06 / UIT-LIFE-09: a queued message survives a restart as not sent yet and goes when online', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await network(request, 'offline');
  await typeAndSend(page, 'queued across restart');
  await expectRowState(row(page, 'queued across restart'), 'sending', 10_000);

  await relaunch(page);
  await openChat(page, 'sam');
  await expectRowState(row(page, 'queued across restart'), 'sending', 20_000);
  const key = await row(page, 'queued across restart').getAttribute('data-cc-key');
  const first = (await frames(page)).flatMap(f => f.rows).find(r => r.key === key);
  expect(first?.state).toBe('sending');

  await network(request, 'online');
  await expectRowState(row(page, 'queued across restart'), ACKED, 45_000);
  await expect(rows(page, 'queued across restart')).toHaveCount(1);
  expect(acceptedSends(await serverRequests(request), 'queued across restart')).toHaveLength(1);
});

test('UIT-SEND-08: queue full refuses the third send as failed (direct) with a notice; the queued two are untouched', async ({
  page,
  request,
}) => {
  await login(page, 'alex', { config: { maxPendingMessages: 2 } });
  await openChat(page, 'sam');
  await network(request, 'offline');
  await typeAndSend(page, 'queued one');
  await typeAndSend(page, 'queued two');
  await typeAndSend(page, 'over the cap');
  await expectRowState(row(page, 'over the cap'), 'failed', 15_000);
  await expect(page.locator(`${NOTICE}[data-cc-key="queue_full"]`)).toBeVisible();
  await expectRowState(row(page, 'queued one'), 'sending', 1_000);
  await expectRowState(row(page, 'queued two'), 'sending', 1_000);
  // Failed (direct): Retry (a fresh send) and Delete.
  expect(await optionIds(row(page, 'over the cap'))).toEqual([OPTION.retry, OPTION.discard]);

  await network(request, 'online');
  await expectRowState(row(page, 'queued one'), ACKED, 45_000);
  await expectRowState(row(page, 'queued two'), ACKED, 45_000);
  // Nothing re-sends the refused one by itself.
  await expectHolds(
    async () => expect(acceptedSends(await serverRequests(request), 'over the cap')).toHaveLength(0),
    { for: 5_000 }
  );
  expect(acceptedSends(await serverRequests(request), 'over the cap')).toHaveLength(0);
});

test('UIT-SEND-16: a double-tap on send sends one message', async ({ page, request }) => {
  await login(page);
  await openChat(page, 'sam');
  const input = page.locator('[data-cc="composer-input"]').first();
  await input.click();
  await input.pressSequentially('double tap');
  const sendButton = page.locator('.cometchat-message-composer__send-button').first();
  await sendButton.dblclick();
  await expectRowState(row(page, 'double tap'), ACKED, 30_000);
  // A chat's sends go in order: once a later send is acked, a second send of
  // the double tap would already be in the server log.
  await typeAndSend(page, 'the next message');
  await expectRowState(row(page, 'the next message'), ACKED, 30_000);
  await expect(rows(page, 'double tap')).toHaveCount(1);
  expect(acceptedSends(await serverRequests(request), 'double tap')).toHaveLength(1);
});

test('UIT-SEND-17: a 503 fails the message (transient); later messages in that chat still send', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await fault(request, {
    match: { method: 'POST', path: '/messages' },
    kind: 'status',
    status: 503,
    body: { error: { code: 'ERR_SERVICE_UNAVAILABLE', message: 'down' } },
    times: 1,
  });
  await typeAndSend(page, 'hit a 503');
  await expectRowState(row(page, 'hit a 503'), 'failed');
  expect(await optionIds(row(page, 'hit a 503'))).toEqual([OPTION.retry, OPTION.discard]);
  await typeAndSend(page, 'after the 503');
  await expectRowState(row(page, 'after the 503'), ACKED, 30_000);
});

test('UIT-SEND-18: Retry while still offline keeps the row not sent yet; it sends on reconnect', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await fault(request, {
    match: { method: 'POST', path: '/messages' },
    kind: 'status',
    status: 503,
    body: { error: { code: 'ERR_SERVICE_UNAVAILABLE', message: 'down' } },
    times: 1,
  });
  await typeAndSend(page, 'retry offline');
  await expectRowState(row(page, 'retry offline'), 'failed');
  await network(request, 'offline');
  await row(page, 'retry offline').locator(RETRY_BUTTON).click();
  await expectRowState(row(page, 'retry offline'), 'sending', 10_000);
  await network(request, 'online');
  await expectRowState(row(page, 'retry offline'), ACKED, 45_000);
  expect(acceptedSends(await serverRequests(request), 'retry offline')).toHaveLength(1);
});

test('UIT-SEND-20: a reply written offline keeps its quote and is delivered as a reply', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  const target = page.locator('[data-cc="message-row"][data-cc-mine="false"]').last();
  await chooseOption(page, target, /^Reply$/);
  await network(request, 'offline');
  await typeAndSend(page, 'reply written offline');
  const reply = row(page, 'reply written offline');
  await expectRowState(reply, 'sending', 10_000);
  await expect(reply.locator('[class*="reply"], [class*="quote"]').first()).toBeVisible();
  await network(request, 'online');
  await expectRowState(reply, ACKED, 45_000);
  const accepted = acceptedSends(await serverRequests(request), 'reply written offline');
  expect(accepted).toHaveLength(1);
  expect(JSON.stringify(accepted[0]?.body)).toContain('quotedMessageId');
});

test('UIT-SEND-22: a lost ack never duplicates the local row', async ({ page, request }) => {
  await login(page);
  await openChat(page, 'sam');
  await fault(request, {
    match: { method: 'POST', path: '/messages' },
    kind: 'dropResponse',
    times: 1,
  });
  await typeAndSend(page, 'lost ack');
  // The server stored it but the answer was cut: the SDK keeps it queued and
  // sends it again on the next reconnect (at most one server-side duplicate).
  await expect
    .poll(async () => messageSends(await serverRequests(request), 'lost ack').length)
    .toBeGreaterThan(0);
  const mark = await requestMark(request);
  await network(request, 'offline');
  // The flip cuts the socket: the next connect is a reconnect.
  await expectSocketEvent(request, mark, 'close');
  await network(request, 'online');
  await expectRowState(row(page, 'lost ack'), ACKED, 45_000);
  const mine = page.locator('[data-cc="message-row"][data-cc-mine="true"]', {
    hasText: 'lost ack',
  });
  await expectHolds(
    async () => {
      const count = await mine.count();
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThanOrEqual(2); // the accepted V1 duplicate, never a stuck local copy
      expect(
        await mine.evaluateAll(els => els.filter(e => e.getAttribute('data-cc-id') === '').length)
      ).toBe(0);
    },
    { for: 3_000 }
  );
  expectNoDuplicateKey(await frames(page));
});

test('UIT-SEND-14: a stuck chat never holds up another chat', async ({ page, request }) => {
  await login(page);
  await openChat(page, 'sam');
  // Hold sam's send with no answer: that chat waits.
  await fault(request, {
    match: { method: 'POST', path: '/messages', body: { receiver: 'sam' } },
    kind: 'noResponse',
    times: 1,
  });
  await typeAndSend(page, 'stuck in sam');
  await openChat(page, 'bea');
  await typeAndSend(page, 'free in bea');
  await expectRowState(row(page, 'free in bea'), ACKED, 30_000);
  await control(request, '/release', {});
});

test('UIT-SEND-15: a queued send through the CometChatUIKit static helper gets a sending row and its Promise never rejects for being queued', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await network(request, 'offline');
  // CometChatUIKit.sendTextMessage through the page (the static helper's Promise).
  const settled = await page.evaluate(async () => {
    const kit = (
      window as unknown as {
        __ccKit?: { sendText?: (to: string, text: string) => Promise<unknown> };
      }
    ).__ccKit;
    if (!kit?.sendText) return 'no-hook';
    let state = 'pending';
    kit.sendText('sam', 'static helper offline').then(
      () => {
        state = 'resolved';
      },
      () => {
        state = 'rejected';
      }
    );
    await new Promise(resolve => setTimeout(resolve, 3_000));
    return state;
  });
  test.skip(settled === 'no-hook', 'the sample app exposes no static-send hook in this build');
  expect(settled).not.toBe('rejected');
  await expectRowState(row(page, 'static helper offline'), 'sending', 10_000);
  await network(request, 'online');
  await expectRowState(row(page, 'static helper offline'), ACKED, 45_000);
  expect(acceptedSends(await serverRequests(request), 'static helper offline')).toHaveLength(1);
});

test('an acked send keeps the chat row, its peer and the new preview; the app stays up', async ({
  page,
}) => {
  const crashes: string[] = [];
  page.on('pageerror', error => crashes.push(error.message));
  await login(page);
  await openChat(page, 'sam');
  await typeAndSend(page, 'ack keeps the row');
  await expectRowState(row(page, 'ack keeps the row'), ACKED);
  await expect(conversationRow(page, 'sam')).toContainText('ack keeps the row');
  await expect(page.locator(MESSAGE_LIST).first()).toBeVisible();
  expect(crashes).toEqual([]);
});
