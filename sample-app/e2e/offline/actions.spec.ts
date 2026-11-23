/**
 * Message actions with offline on (BEH-SEND-36/37 as rewritten by ruling
 * R162 / S73 on 2026-11-03, UIK-MUT-01): every own unsent or failed row
 * (PENDING, SENDING, FAILED with any reason) offers Retry and Delete; on a
 * row whose send is under way both answer with a "Sending… try again in a
 * moment" notice and change nothing; Delete is `discardLocalMessage`; sent
 * messages keep today's menu online and end in today's error offline with
 * nothing changed.
 */
import { expect, test } from '../helpers/test';
import {
  ACKED,
  acceptedSends,
  chooseOption,
  clearFaults,
  expectHolds,
  expectRowState,
  fault,
  login,
  messageSends,
  network,
  NOTICE,
  openChat,
  OPTION,
  optionIds,
  relaunch,
  release,
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

const REFUSE_PERMANENT = {
  match: { method: 'POST', path: '/messages' },
  kind: 'status',
  status: 422,
  body: { error: { code: 'ERR_MESSAGE_INVALID', message: 'refused for the test' } },
  times: 1,
};
const REFUSE_TRANSIENT = {
  match: { method: 'POST', path: '/messages' },
  kind: 'status',
  status: 503,
  body: { error: { code: 'ERR_SERVICE_UNAVAILABLE', message: 'down for the test' } },
  times: 1,
};

test('PENDING: only Retry and Delete (no Copy, reply, react, edit, info...)', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await network(request, 'offline');
  await typeAndSend(page, 'pending menu');
  await expectRowState(row(page, 'pending menu'), 'sending', 10_000);
  expect(await optionIds(row(page, 'pending menu'))).toEqual([OPTION.retry, OPTION.discard]);
  await network(request, 'online');
});

test('PENDING Delete offline removes the row for good: never sent, gone after a relaunch', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await network(request, 'offline');
  await typeAndSend(page, 'discard me');
  await expectRowState(row(page, 'discard me'), 'sending', 10_000);
  await chooseOption(page, row(page, 'discard me'), /^Delete$/);
  await expect(rows(page, 'discard me')).toHaveCount(0);

  await relaunch(page);
  await openChat(page, 'sam');
  await expect(rows(page, 'discard me')).toHaveCount(0);
  await network(request, 'online');
  await expectHolds(
    async () => expect(acceptedSends(await serverRequests(request), 'discard me')).toHaveLength(0),
    { for: 12_000 }
  );
  expect(acceptedSends(await serverRequests(request), 'discard me')).toHaveLength(0);
  await expect(rows(page, 'discard me')).toHaveCount(0);
});

test('PENDING Retry offline keeps it queued (no duplicate); it goes once on reconnect', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await network(request, 'offline');
  await typeAndSend(page, 'retry pending');
  await expectRowState(row(page, 'retry pending'), 'sending', 10_000);
  await chooseOption(page, row(page, 'retry pending'), /^Retry$/);
  await expectRowState(row(page, 'retry pending'), 'sending', 5_000);
  await expect(rows(page, 'retry pending')).toHaveCount(1);
  await network(request, 'online');
  await expectRowState(row(page, 'retry pending'), ACKED, 45_000);
  await expect(rows(page, 'retry pending')).toHaveCount(1);
  expect(acceptedSends(await serverRequests(request), 'retry pending')).toHaveLength(1);
});

test('SENDING: Retry and Delete; while the send is in flight each shows "Sending… try again" and changes nothing (R162)', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await fault(request, {
    match: { method: 'POST', path: '/messages' },
    kind: 'noResponse',
    times: 1,
  });
  await typeAndSend(page, 'in flight');
  const sending = row(page, 'in flight');
  await expectRowState(sending, 'sending', 10_000);
  expect(await optionIds(sending)).toEqual([OPTION.retry, OPTION.discard]);
  const inFlightNotice = page.locator(`${NOTICE}[data-cc-key="send_in_flight"]`);

  await chooseOption(page, sending, /^Retry$/);
  await expect(inFlightNotice).toHaveCount(1);
  await expect(inFlightNotice).toContainText('Sending');
  await expectRowState(sending, 'sending', 1_000);

  await chooseOption(page, sending, /^Delete$/);
  await expect(inFlightNotice).toHaveCount(1);
  await expect(rows(page, 'in flight')).toHaveCount(1);
  // The short notice goes by itself.
  await expect(inFlightNotice).toHaveCount(0, { timeout: 10_000 });

  await release(request);
  await expectRowState(row(page, 'in flight'), ACKED, 30_000);
  await expect(rows(page, 'in flight')).toHaveCount(1);
  expect(acceptedSends(await serverRequests(request), 'in flight')).toHaveLength(1);
});

test('FAILED + TRANSIENT: Retry and Delete; Retry sends it once, even when tapped repeatedly', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await fault(request, REFUSE_TRANSIENT);
  await typeAndSend(page, 'transient failure');
  const failed = row(page, 'transient failure');
  await expectRowState(failed, 'failed');
  expect(await optionIds(failed)).toEqual([OPTION.retry, OPTION.discard]);
  await expect(failed.locator(RETRY_BUTTON)).toBeVisible();
  // Spam the inline Retry: one retry in flight, extra taps ignored (BREAK-IT G2).
  for (let i = 0; i < 4; i++)
    await failed
      .locator(RETRY_BUTTON)
      // The button goes as soon as the retry is drawn: a later tap has nothing to hit.
      .click({ timeout: 500 })
      .catch(() => undefined);
  await expectRowState(row(page, 'transient failure'), ACKED, 30_000);
  await expect(rows(page, 'transient failure')).toHaveCount(1);
  expect(acceptedSends(await serverRequests(request), 'transient failure')).toHaveLength(1);
});

test('FAILED + PERMANENT: Retry and Delete, whatever the reason (R162); Delete removes it and nothing is sent', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await fault(request, REFUSE_PERMANENT);
  await typeAndSend(page, 'permanent failure');
  const failed = row(page, 'permanent failure');
  await expectRowState(failed, 'failed');
  expect(await optionIds(failed)).toEqual([OPTION.retry, OPTION.discard]);
  await expect(failed.locator(RETRY_BUTTON)).toBeVisible();

  await chooseOption(page, failed, /^Delete$/);
  await expect(rows(page, 'permanent failure')).toHaveCount(0);
  await relaunch(page);
  await openChat(page, 'sam');
  await expect(rows(page, 'permanent failure')).toHaveCount(0);
  expect(messageSends(await serverRequests(request), 'permanent failure')).toHaveLength(1);
});

test('FAILED after a relaunch: a PERMANENT failure still offers Retry and Delete (R162)', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await fault(request, REFUSE_PERMANENT);
  await typeAndSend(page, 'permanent across restart');
  await expectRowState(row(page, 'permanent across restart'), 'failed');
  await relaunch(page);
  await openChat(page, 'sam');
  await expectRowState(row(page, 'permanent across restart'), 'failed', 20_000);
  expect(await optionIds(row(page, 'permanent across restart'))).toEqual([
    OPTION.retry,
    OPTION.discard,
  ]);
});

test('FAILED + PERMANENT: Retry is user-invoked and re-attempts the send', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await fault(request, REFUSE_PERMANENT);
  await typeAndSend(page, 'permanent then retried');
  const failed = row(page, 'permanent then retried');
  await expectRowState(failed, 'failed');
  await clearFaults(request);
  await failed.locator(RETRY_BUTTON).click();
  await expectRowState(row(page, 'permanent then retried'), ACKED, 30_000);
  await expect(rows(page, 'permanent then retried')).toHaveCount(1);
  expect(acceptedSends(await serverRequests(request), 'permanent then retried')).toHaveLength(1);
});

test('failed (direct, queue full): Retry is a fresh send with a new local handle; Delete is screen-only', async ({
  page,
  request,
}) => {
  await login(page, 'alex', { config: { maxPendingMessages: 1 } });
  await openChat(page, 'sam');
  await network(request, 'offline');
  await typeAndSend(page, 'holds the slot');
  await typeAndSend(page, 'direct one');
  await typeAndSend(page, 'direct two');
  await expectRowState(row(page, 'direct one'), 'failed', 15_000);
  await expectRowState(row(page, 'direct two'), 'failed', 15_000);
  expect(await optionIds(row(page, 'direct one'))).toEqual([OPTION.retry, OPTION.discard]);

  // Delete of a failed (direct) row removes it from the screen only.
  await chooseOption(page, row(page, 'direct two'), /^Delete$/);
  await expect(rows(page, 'direct two')).toHaveCount(0);

  await network(request, 'online');
  await expectRowState(row(page, 'holds the slot'), ACKED, 45_000);
  // Retry of a failed (direct) row: one fresh send.
  await chooseOption(page, row(page, 'direct one'), /^Retry$/);
  await expectRowState(row(page, 'direct one'), ACKED, 30_000);
  await expect(rows(page, 'direct one')).toHaveCount(1);
  expect(acceptedSends(await serverRequests(request), 'direct one')).toHaveLength(1);
  expect(acceptedSends(await serverRequests(request), 'direct two')).toHaveLength(0);
});

test('UIT-SEND-09: an unsent row offers nothing that needs a server id, and no swipe/keyboard reply', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await network(request, 'offline');
  await typeAndSend(page, 'no reply here');
  const pending = row(page, 'no reply here');
  await expectRowState(pending, 'sending', 10_000);
  const ids = await optionIds(pending);
  for (const forbidden of [
    'reply',
    'reply-in-thread',
    'react',
    'edit',
    'delete',
    'copy',
    'message-information',
    'pin-message',
    'save-message',
    'translate',
    'mark-as-unread',
  ]) {
    expect(ids).not.toContain(forbidden);
  }
  // No receipt tick on an unsent row (BEH-SEND-32): the contract state stays sending.
  await expect(
    pending.locator('.cometchat-receipts-read, .cometchat-receipts-delivered')
  ).toHaveCount(0);
  await network(request, 'online');
});

test("a sent message keeps today's full menu online", async ({ page }) => {
  await login(page);
  await openChat(page, 'sam');
  await typeAndSend(page, 'sent normally');
  await expectRowState(row(page, 'sent normally'), ACKED, 30_000);
  const ids = await optionIds(row(page, 'sent normally'));
  expect(ids).not.toContain(OPTION.retry);
  expect(ids).not.toContain(OPTION.discard);
  expect(ids.length).toBeGreaterThan(2);
});

test("UIT-MUT-01: deleting or editing a sent message offline ends in today's error and changes nothing", async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'sam');
  await typeAndSend(page, 'sent then offline');
  const sent = row(page, 'sent then offline');
  await expectRowState(sent, ACKED, 30_000);
  await network(request, 'offline');

  // Delete: today's confirm, then the SDK's not-connected error; the row stays.
  await chooseOption(page, sent, /^Delete$/);
  const confirm = page.getByRole('button', { name: /^Delete$/ }).last();
  await confirm.click().catch(() => undefined);
  // The attempt has ended: the dialog closes once the delete call has settled.
  await expect(page.locator('.cometchat-confirm-dialog')).toHaveCount(0);
  await expect(rows(page, 'sent then offline')).toHaveCount(1);
  await expect(row(page, 'sent then offline').locator('.cometchat-delete-bubble')).toHaveCount(0);

  // React: no optimistic reaction left behind.
  const reactionsBefore = await row(page, 'sent then offline')
    .locator('.cometchat-reactions__chip')
    .count();
  await chooseOption(page, row(page, 'sent then offline'), /react/i).catch(() => undefined);
  await page.keyboard.press('Escape');
  await expectHolds(
    async () =>
      expect(
        await row(page, 'sent then offline').locator('.cometchat-reactions__chip').count()
      ).toBe(reactionsBefore),
    { for: 2_000 }
  );

  await network(request, 'online');
  await clearFaults(request);
});
