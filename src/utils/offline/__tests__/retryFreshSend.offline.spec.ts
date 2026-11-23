/**
 * A fresh-send retry (a failed-direct row, or one with no local handle) must not
 * change the message object the row holds in list state.
 *
 * `withoutLocalHandle` strips `localMessageId` and rewrites `data` for the new
 * send. It used to do that in place, on the object passed in from the row, so
 * the rendered row changed before any state was dispatched: memoized bubbles
 * and the identity lookups (`findRowIndex`, `hub.stateOf`) saw a row whose local
 * id had vanished, and a fresh send that failed before `onMessagePending` was
 * reported with `localMessageId: ''`, leaving only the muid to tie it back.
 *
 * Review: Prajwal `send.ts:367` on #2460.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OfflineHub } from '../hub';
import { retryFailedMessage } from '../send';
import { localIdOf, muidOf } from '../identity';
import {
  installOfflineSdk,
  offlineMessage,
  sendScripts,
  textMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';

describe('a fresh-send retry leaves the row in list state untouched', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    // Offline: the SDK answers `onMessagePending` and the send settles at once,
    // rather than waiting out the connected-send bound.
    fake.connected = false;
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('keeps the row object, its local handle and its data; the SDK gets a copy without them', async () => {
    const row = offlineMessage(textMessage('hi'), { muid: 'M-fresh', localMessageId: 'L-fresh' });
    // The wire field the SDK sends, which the row carries back from the server.
    row.setData({ text: 'hi', localMessageId: 'L-fresh' } as never);
    // A failed-direct row: not in the outbox, so Retry is a fresh send.
    OfflineHub.getInstance().reportSendState(row, 'failed', { reason: 'ERR', direct: true });
    fake.scriptSend(sendScripts.queuedBehind('L-new'));

    await retryFailedMessage(row);

    const sends = fake.callsTo('sendMessage');
    expect(sends).toHaveLength(1);
    const sent = sends[0]?.[0] as CometChatMessageLike;

    // A different object reached the SDK …
    expect(sent).not.toBe(row);
    // … with the old handle stripped from it and from its data …
    expect((sent as unknown as { localMessageId?: unknown }).localMessageId).toBeUndefined();
    expect(sent.getData()).not.toHaveProperty('localMessageId');
    // … and the muid kept, so the row keeps its render key.
    expect(muidOf(sent as never)).toBe('M-fresh');

    // The row the list holds is unchanged: this is the regression.
    expect(localIdOf(row)).toBe('L-fresh');
    expect(row.getData()).toMatchObject({ localMessageId: 'L-fresh' });
  });

  it('a row whose handle lives only in data keeps it, so the hub still finds its state', async () => {
    // A server-parsed copy carries the handle in `data.localMessageId` only
    // (SDK ask A4), and `localIdOf` falls back to it. Rewriting `data` in place
    // took that row's identity away: `hub.stateOf(localIdOf(row))` then looked up
    // the empty string.
    const row = textMessage('nope');
    row.setMuid('M-data');
    row.setData({ text: 'nope', localMessageId: 'L-data' } as never);
    OfflineHub.getInstance().reportSendState(row, 'failed', { reason: 'ERR', direct: true });
    expect(localIdOf(row)).toBe('L-data');
    // Refused with no pending first: the direct-failure path.
    fake.scriptSend(sendScripts.refused('ERR_SOMETHING'));

    await retryFailedMessage(row);

    expect(localIdOf(row)).toBe('L-data');
    expect(OfflineHub.getInstance().stateOf(localIdOf(row))).toBe('failed');
  });
});

/** The message members this spec reads, reached without the SDK's 4.3 types. */
interface CometChatMessageLike {
  getData(): Record<string, unknown>;
}
