/**
 * UIK-SEND-03 / UIT-SEND-08: a send the outbox refuses because the queue is
 * full is failed (direct) with a "too many waiting" notice, shown once.
 *
 * Regression: the 4.3.0 SDK reports the refusal to the send's own `onError`
 * with Android's code `ERROR_PENDING_QUEUE_LIMIT` (not the `QUEUE_FULL`
 * reason), then to the global `onOutboxMessageFailed(message, 'QUEUE_FULL')`.
 * The kit read no reason from the first and deduped the second as an already
 * reported failure, so the notice never showed.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { OfflineHub, type OfflineNotice } from '../hub';
import { failureReasonFromError, sendWithState } from '../send';
import { unsentActionsOf } from '../rowState';
import {
  installOfflineSdk,
  offlineMessage,
  sendScripts,
  textMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';
import { CometChatMessageListOfflineNotices } from '../../../components/CometChatMessageList/CometChatMessageListOfflineNotices';

describe('queue full (UIK-SEND-03)', () => {
  let fake: OfflineSdkFake;
  let notices: OfflineNotice[];

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    fake.connected = false;
    notices = [];
    const hub = OfflineHub.getInstance();
    hub.start();
    hub.notice.subscribe(n => notices.push(n));
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it("reads QUEUE_FULL from the SDK's ERROR_PENDING_QUEUE_LIMIT code", () => {
    expect(failureReasonFromError({ code: 'ERROR_PENDING_QUEUE_LIMIT' })).toBe('QUEUE_FULL');
    expect(failureReasonFromError({ code: 'BYTE_OVERFLOW' })).toBe('BYTE_OVERFLOW');
    expect(failureReasonFromError({ code: 'ERR_SOMETHING_ELSE' })).toBe('');
  });

  it('per-send onError first, then the global failure: failed (direct), one queue_full notice', async () => {
    fake.scriptSend(sendScripts.queueFull('LQ'));
    const m = textMessage('over the cap');
    m.setMuid('MQ');
    const result = await sendWithState(m, 'text');
    expect(result).toMatchObject({ state: 'failed', direct: true, reason: 'QUEUE_FULL' });
    fake.fire('offline', 'onOutboxMessageFailed', m, 'QUEUE_FULL');
    expect(notices.map(n => n.kind)).toEqual(['queue_full']);
    expect(notices[0]?.message).toBe(m);
    const hub = OfflineHub.getInstance();
    expect(hub.directFailureOf(m)).toBe('QUEUE_FULL');
    expect(hub.stateOf('LQ')).toBe('failed');
    // Retry (a fresh send) and Delete.
    expect(unsentActionsOf(m)).toEqual({ retry: true, discard: true });
  });

  it('the global failure alone (no reason on the per-send error) still raises it once', async () => {
    fake.scriptSend((listener, message) => {
      offlineMessage(message, { localMessageId: 'LG', status: 'FAILED' });
      listener.onError?.({ code: 'ERR_UNKNOWN' });
    });
    const m = textMessage('refused');
    m.setMuid('MG');
    await sendWithState(m, 'text');
    expect(notices).toEqual([]);
    fake.fire('offline', 'onOutboxMessageFailed', m, 'QUEUE_FULL');
    fake.fire('offline', 'onOutboxMessageFailed', m, 'QUEUE_FULL');
    expect(notices.map(n => n.kind)).toEqual(['queue_full']);
    // The reason the outbox named is kept for the row.
    expect(OfflineHub.getInstance().directFailureOf(m)).toBe('QUEUE_FULL');
  });

  it('a second refused message gets its own notice; a logout forgets the first', async () => {
    const hub = OfflineHub.getInstance();
    const a = textMessage('a');
    a.setMuid('MA');
    fake.scriptSend(sendScripts.queueFull('LA'));
    await sendWithState(a, 'text');
    const b = textMessage('b');
    b.setMuid('MB');
    fake.scriptSend(sendScripts.queueFull('LB'));
    await sendWithState(b, 'text');
    expect(notices.map(n => n.kind)).toEqual(['queue_full', 'queue_full']);
    hub.endSession();
    hub.raiseRefusalNotice(a, 'QUEUE_FULL');
    expect(notices).toHaveLength(3);
    hub.raiseRefusalNotice(a, 'TRANSIENT');
    expect(notices).toHaveLength(3);
  });

  it('the message list shows it as [data-cc="notice"][data-cc-key="queue_full"]', async () => {
    const me = new CometChat.User({ uid: 'me', name: 'me' });
    const peer = new CometChat.User({ uid: 'peer', name: 'peer' });
    render(
      <CometChatMessageListOfflineNotices
        user={peer}
        group={undefined}
        parentMessageId={undefined}
        loggedInUser={me}
      />
    );
    fake.scriptSend(sendScripts.queueFull('LV'));
    const m = textMessage('over the cap', 'peer');
    m.setMuid('MV');
    await act(async () => {
      await sendWithState(m, 'text');
      fake.fire('offline', 'onOutboxMessageFailed', m, 'QUEUE_FULL');
    });
    const shown = await screen.findAllByTestId('offline-notice');
    expect(shown).toHaveLength(1);
    expect(shown[0]?.getAttribute('data-cc')).toBe('notice');
    expect(shown[0]?.getAttribute('data-cc-key')).toBe('queue_full');
  });
});
