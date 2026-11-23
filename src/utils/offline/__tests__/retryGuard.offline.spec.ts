/**
 * The Retry guard (`retryFailedMessageOnce`): a second tap on the same message
 * is ignored while its retry is in flight. As on Android, the guard lets go when
 * the retry answers (a fresh send once the SDK has taken it), on any final
 * transition of the message, and when the session ends or the cache is reset.
 *
 * The guard lives at module level, so every test uses its own muid.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { OfflineHub } from '../hub';
import { retryFailedMessageOnce } from '../send';
import {
  installOfflineSdk,
  offlineMessage,
  sendScripts,
  textMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';

const flush = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 0);
  });

describe('the Retry guard', () => {
  let fake: OfflineSdkFake;
  let notices: string[];

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    fake.retryResult = 'hold';
    notices = [];
    OfflineHub.getInstance().notice.subscribe(n => notices.push(n.kind));
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  /** A failed outbox row the SDK retries with `retryMessage`. */
  function failedRow(localMessageId: string, muid?: string): CometChat.TextMessage {
    const message = offlineMessage(textMessage('hi'), {
      localMessageId,
      status: 'FAILED',
      ...(muid !== undefined && { muid }),
    });
    OfflineHub.getInstance().reportSendState(message, 'failed', { reason: 'TRANSIENT' });
    return message;
  }

  const retries = () => fake.callsTo('retryMessage').map(a => a[0]);

  it('double tap: the second tap reaches no SDK call and shows no notice', async () => {
    const message = failedRow('L-dbl', 'M-dbl');
    retryFailedMessageOnce(message);
    retryFailedMessageOnce(message);
    expect(retries()).toEqual(['L-dbl']);
    expect(notices).toEqual([]);
    // Once the retry answers, a new tap is taken.
    fake.settleRetry();
    await flush();
    retryFailedMessageOnce(message);
    expect(retries()).toEqual(['L-dbl', 'L-dbl']);
  });

  it('final transition releases the guard, matched by local id', () => {
    const message = failedRow('L-fin');
    retryFailedMessageOnce(message);
    // A `sending` transition is not final: the guard holds.
    OfflineHub.getInstance().reportSendState(message, 'sending');
    retryFailedMessageOnce(message);
    expect(retries()).toEqual(['L-fin']);
    // The retry has not answered, but the row failed again.
    OfflineHub.getInstance().reportSendState(message, 'failed', { reason: 'TRANSIENT' });
    retryFailedMessageOnce(message);
    expect(retries()).toEqual(['L-fin', 'L-fin']);
  });

  it('final transition releases the guard, matched by muid', () => {
    const message = failedRow('L-fin-m', 'M-fin-m');
    retryFailedMessageOnce(message);
    // The same message under another local handle (a fresh send's) went out.
    const sent = offlineMessage(textMessage('hi'), { localMessageId: 'L-other', muid: 'M-fin-m' });
    OfflineHub.getInstance().reportSendState(sent, 'sent');
    retryFailedMessageOnce(message);
    expect(retries()).toEqual(['L-fin-m', 'L-fin-m']);
  });

  it('session end releases the guard (logout, user switch)', () => {
    const message = failedRow('L-end', 'M-end');
    retryFailedMessageOnce(message);
    OfflineHub.getInstance().endSession();
    retryFailedMessageOnce(message);
    expect(retries()).toEqual(['L-end', 'L-end']);
  });

  it('cache reset releases the guard', () => {
    OfflineHub.getInstance().start();
    const message = failedRow('L-reset', 'M-reset');
    retryFailedMessageOnce(message);
    fake.fire('cacheReset', 'onOfflineCacheReset', 'SCHEMA_CHANGED', 0);
    retryFailedMessageOnce(message);
    expect(retries()).toEqual(['L-reset', 'L-reset']);
  });

  it('direct retry released on hand-over: once the SDK takes the fresh send, not when it finishes', () => {
    const message = offlineMessage(textMessage('hi'), { muid: 'M-direct' });
    const hub = OfflineHub.getInstance();
    // The row the list ends up holding: the copy the fresh send went out as,
    // which the hub reports `sending` for (matched to the row by muid). The
    // message handed to Retry is never changed in place (Prajwal send.ts:367),
    // so the new local handle is on that copy, not on `message`.
    let row: CometChat.BaseMessage = message;
    hub.sendState.subscribe(event => {
      if (event.state === 'sending' && event.localMessageId) row = event.message;
    });
    hub.reportSendState(message, 'failed', { reason: 'ERR', direct: true });
    // Connected and queued behind another message: pending, then silence.
    fake.scriptSend(sendScripts.queuedBehind('L-direct'));
    retryFailedMessageOnce(message);
    expect(fake.callsTo('sendMessage')).toHaveLength(1);
    expect(retries()).toEqual([]);
    expect(row).not.toBe(message);
    // The fresh send is the outbox's now: the next tap on the row reaches the SDK.
    retryFailedMessageOnce(row);
    expect(retries()).toEqual(['L-direct']);
    expect(fake.callsTo('sendMessage')).toHaveLength(1);
  });

  it('stale settle keeps newer guard: a late answer of an old retry does not let a newer one go', async () => {
    const message = failedRow('L-stale', 'M-stale');
    retryFailedMessageOnce(message);
    OfflineHub.getInstance().endSession();
    retryFailedMessageOnce(message);
    expect(retries()).toEqual(['L-stale', 'L-stale']);
    // The first retry answers now; the second is still in flight.
    fake.settleRetry();
    await flush();
    retryFailedMessageOnce(message);
    expect(retries()).toEqual(['L-stale', 'L-stale']);
  });
});
