/**
 * A send in flight (R162 / S73, BEH-SEND-37 as rewritten 2026-11-03): the row
 * offers Retry and Delete like every unsent row. The JS SDK's message stays
 * PENDING while the outbox has it SENDING, so the kit does not guess: it asks
 * the SDK, which answers ERROR_OFFLINE_MESSAGE_IN_FLIGHT and changes nothing,
 * and the kit then shows the "Sending… try again in a moment" notice.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OfflineHub, type SendStateEvent } from '../hub';
import { unsentActionsOf } from '../rowState';
import {
  discardUnsentMessage,
  QUEUED_ANSWER_WAIT_MS,
  retryFailedMessage,
  sendWithState,
} from '../send';
import {
  installOfflineSdk,
  offlineMessage,
  sendScripts,
  textMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';

describe('a send in flight', () => {
  let fake: OfflineSdkFake;
  let notices: string[];
  let states: SendStateEvent[];

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    notices = [];
    states = [];
    OfflineHub.getInstance().notice.subscribe(n => notices.push(n.kind));
    OfflineHub.getInstance().sendState.subscribe(e => states.push(e));
  });

  afterEach(() => {
    vi.useRealTimers();
    fake.restore();
    OfflineHub.resetForTests();
  });

  const pendingOnly = sendScripts.queuedBehind('L1');

  it('connected and unanswered: Retry and Delete are offered (R162)', () => {
    const message = textMessage('hi');
    fake.scriptSend(pendingOnly);
    void sendWithState(message, 'text');
    expect(unsentActionsOf(message)).toEqual({ retry: true, discard: true });
  });

  it('an SDK SENDING status offers both too', () => {
    const message = offlineMessage(textMessage('hi'), { localMessageId: 'LS', status: 'SENDING' });
    expect(unsentActionsOf(message)).toEqual({ retry: true, discard: true });
  });

  it('Retry while it is sending: the SDK answers IN_FLIGHT, nothing changes, one notice', async () => {
    const message = textMessage('hi');
    fake.scriptSend(pendingOnly);
    void sendWithState(message, 'text');
    const before = states.length;
    fake.discardResult = 'reject';
    fake.rejectCode = 'ERROR_OFFLINE_MESSAGE_IN_FLIGHT';
    await retryFailedMessage(message);
    expect(fake.callsTo('retryMessage').map(a => a[0])).toEqual(['L1']);
    expect(notices).toEqual(['send_in_flight']);
    expect(states.slice(before)).toEqual([]);
    // No fresh send was made.
    expect(fake.callsTo('sendMessage')).toHaveLength(1);
  });

  it('Delete while it is sending: IN_FLIGHT, the row stays, one notice', async () => {
    const message = textMessage('hi');
    fake.scriptSend(pendingOnly);
    void sendWithState(message, 'text');
    const before = states.length;
    fake.discardResult = 'reject';
    fake.rejectCode = 'ERROR_OFFLINE_MESSAGE_IN_FLIGHT';
    expect(await discardUnsentMessage(message)).toBe('in-flight');
    expect(fake.callsTo('discardLocalMessage').map(a => a[0])).toEqual(['L1']);
    expect(notices).toEqual(['send_in_flight']);
    expect(states.slice(before)).toEqual([]);
  });

  it('Retry and Delete that the SDK accepts raise no in-flight notice', async () => {
    const message = offlineMessage(textMessage('hi'), { localMessageId: 'LP', status: 'PENDING' });
    await retryFailedMessage(message);
    expect(await discardUnsentMessage(message)).toBe('removed');
    expect(notices).toEqual([]);
  });

  it('a send waiting its turn while connected still settles as sending after the bound', async () => {
    vi.useFakeTimers();
    const message = textMessage('hi');
    fake.scriptSend(pendingOnly);
    let state = '';
    void sendWithState(message, 'text').then(r => {
      state = r.state;
    });
    await vi.advanceTimersByTimeAsync(QUEUED_ANSWER_WAIT_MS);
    expect(state).toBe('sending');
    expect(unsentActionsOf(message)).toEqual({ retry: true, discard: true });
  });
});

describe('sendWithState onPending', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('fires when the SDK takes the send, before any answer (BEH-SEND-09)', () => {
    const onPending = vi.fn();
    fake.scriptSend(sendScripts.queuedBehind('L1'));
    void sendWithState(textMessage('hi'), 'text', { onPending });
    expect(onPending).toHaveBeenCalledTimes(1);
  });

  it('does not fire for a send refused outright', () => {
    const onPending = vi.fn();
    fake.scriptSend(sendScripts.refused('ERR_BLOCKED'));
    void sendWithState(textMessage('hi'), 'text', { onPending });
    expect(onPending).not.toHaveBeenCalled();
  });
});

describe('Retry on a failed row', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('draws it as sending at once: the SDK resets it to PENDING with no callback', () => {
    const hub = OfflineHub.getInstance();
    const message = offlineMessage(textMessage('hi'), { localMessageId: 'L1', status: 'FAILED' });
    hub.reportSendState(message, 'failed', { reason: 'TRANSIENT' });
    void retryFailedMessage(message);
    expect(hub.stateOf('L1')).toBe('sending');
  });

  it('a refused retry (store unavailable) puts the row back to failed with its reason', async () => {
    const hub = OfflineHub.getInstance();
    const message = offlineMessage(textMessage('hi'), { localMessageId: 'L2', status: 'FAILED' });
    hub.reportSendState(message, 'failed', { reason: 'TRANSIENT' });
    fake.discardResult = 'reject';
    fake.rejectCode = 'ERROR_OFFLINE_STORE_UNAVAILABLE';
    await retryFailedMessage(message);
    expect(hub.stateOf('L2')).toBe('failed');
    expect(hub.failureReasonFor('L2')).toBe('TRANSIENT');
  });

  it('a retry answered not-connected keeps the clock; NOT_FOUND on a never-sent row removes it', async () => {
    const hub = OfflineHub.getInstance();
    const offline = offlineMessage(textMessage('a'), { localMessageId: 'L3', status: 'FAILED' });
    hub.reportSendState(offline, 'failed', { reason: 'TRANSIENT' });
    fake.discardResult = 'reject';
    fake.rejectCode = 'FAILED_TO_FETCH';
    await retryFailedMessage(offline);
    expect(hub.stateOf('L3')).toBe('sending');

    const gone = offlineMessage(textMessage('b'), { localMessageId: 'L4', status: 'FAILED' });
    hub.reportSendState(gone, 'failed', { reason: 'TRANSIENT' });
    fake.rejectCode = 'ERROR_OFFLINE_MESSAGE_NOT_FOUND';
    await retryFailedMessage(gone);
    expect(hub.stateOf('L4')).toBe('discarded');
  });
});
