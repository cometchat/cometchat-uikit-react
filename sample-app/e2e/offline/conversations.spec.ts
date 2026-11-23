/**
 * Conversation list (TEST-PLAN §9.6, 05-conversations): own pending and failed
 * previews, pins by (type, with), unread counts after catch-up.
 */
import { expect, test } from '../helpers/test';
import {
  ACKED,
  CONVERSATION_ROW,
  conversationRow,
  expectHolds,
  expectRowState,
  fault,
  login,
  network,
  openChat,
  push,
  resetServer,
  row,
  typeAndSend,
} from './helpers';

test.beforeEach(async ({ request, context }) => {
  await resetServer(request, {
    users: ['alex', 'sam', 'bea', 'cara'],
    conversations: [{ with: 'sam' }, { with: 'bea' }, { with: 'cara' }],
    messages: [
      { with: 'sam', count: 2, from: 'alternate', startAt: 1_700_000_000 },
      { with: 'bea', count: 2, from: 'alternate', startAt: 1_700_000_100 },
      { with: 'cara', count: 2, from: 'alternate', startAt: 1_700_000_200 },
    ],
  });
  await context.clearCookies();
});

async function order(page: import('@playwright/test').Page): Promise<string[]> {
  return page
    .locator(CONVERSATION_ROW)
    .evaluateAll(els => els.map(e => e.getAttribute('data-cc-with') ?? ''));
}

test('UIT-CONV-02: a waiting send moves its chat to the top with a sending preview', async ({
  page,
  request,
}) => {
  await login(page);
  expect((await order(page))[0]).toBe('cara');
  await openChat(page, 'sam');
  await network(request, 'offline');
  await typeAndSend(page, 'moves sam up');
  await expectRowState(row(page, 'moves sam up'), 'sending', 10_000);
  await expect.poll(async () => (await order(page))[0], { timeout: 10_000 }).toBe('sam');
  await expect(conversationRow(page, 'sam')).toHaveAttribute('data-cc-preview-state', 'sending');
  await expect(conversationRow(page, 'sam')).toContainText('moves sam up');
  await network(request, 'online');
  await expect(conversationRow(page, 'sam')).toHaveAttribute('data-cc-preview-state', ACKED, {
    timeout: 45_000,
  });
});

test('UIT-CONV-03: a failed last message shows a not-sent mark on the preview', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'bea');
  await fault(request, {
    match: { method: 'POST', path: '/messages' },
    kind: 'status',
    status: 422,
    body: { error: { code: 'ERR_MESSAGE_INVALID', message: 'refused' } },
    times: 1,
  });
  await typeAndSend(page, 'preview fails');
  await expectRowState(row(page, 'preview fails'), 'failed');
  await expect(conversationRow(page, 'bea')).toHaveAttribute('data-cc-preview-state', 'failed', {
    timeout: 15_000,
  });
});

test('UIT-CONV-05: a pin from another device, matched by (type, with), floats the right row', async ({
  page,
  request,
}) => {
  await login(page);
  await network(request, 'offline');
  await push(request, { frame: 'conversationPin', with: 'sam', by: 'alex', action: 'pinned' });
  await network(request, 'online');
  await push(request, { frame: 'conversationPin', with: 'SAM', by: 'alex', action: 'pinned' });
  await expect(conversationRow(page, 'sam')).toHaveAttribute('data-cc-pinned', 'true', {
    timeout: 45_000,
  });
  await expect.poll(async () => (await order(page))[0], { timeout: 10_000 }).toBe('sam');
  await expect(conversationRow(page, 'bea')).toHaveAttribute('data-cc-pinned', 'false');
});

test('UIT-CONV-09: five messages missed in a closed chat count 5 unread after catch-up, not 10', async ({
  page,
  request,
}) => {
  await login(page);
  await expect(conversationRow(page, 'bea')).toHaveAttribute('data-cc-unread', /\d+/);
  const before = Number(await conversationRow(page, 'bea').getAttribute('data-cc-unread'));
  await network(request, 'offline');
  await push(
    request,
    [1, 2, 3, 4, 5].map(i => ({
      frame: 'message',
      from: 'bea',
      toUser: 'alex',
      text: `missed ${String(i)}`,
    }))
  );
  await network(request, 'online');
  await expect(conversationRow(page, 'bea')).toHaveAttribute('data-cc-unread', String(before + 5), {
    timeout: 45_000,
  });
  // ...and stays 5: nothing counts the same messages again.
  await expectHolds(
    () =>
      expect(conversationRow(page, 'bea')).toHaveAttribute('data-cc-unread', String(before + 5), {
        timeout: 100,
      }),
    { for: 5_000 }
  );
});

test('UIT-CONV-04: a live message in another chat bumps it and raises its unread count', async ({
  page,
  request,
}) => {
  await login(page);
  await openChat(page, 'cara');
  const before = Number(await conversationRow(page, 'sam').getAttribute('data-cc-unread'));
  await push(request, { frame: 'message', from: 'sam', toUser: 'alex', text: 'live bump' });
  await expect.poll(async () => (await order(page))[0], { timeout: 20_000 }).toBe('sam');
  await expect(conversationRow(page, 'sam')).toHaveAttribute('data-cc-unread', String(before + 1));
});
