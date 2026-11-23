/**
 * A queued send the server refuses must reach the screen — and the integrator —
 * with the reason the SDK stamped on the row.
 *
 * From 4.3.1 the per-send `onError` carries the server's own error rather than a
 * coded `MessageFailureReason`, so `failureReasonFromError` answers `''`, the
 * empty reason is dropped from `ui:message/send-state-changed`
 * (`hub.ts` `emitStateChanged`), and the global `onOutboxMessageFailed(row,
 * 'PERMANENT')` that follows is discarded as not a forward transition
 * (`hub.ts` `reportSendState`). The failure then carried no reason at all: no
 * `queue_full` / byte-overflow notice, and nothing for an integrator to switch on.
 *
 * Review: Aanshi D4 / `send.ts:217` on #2460. Nothing asserted this before.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatUIEvent } from '../../../context/CometChatEvents.types';
import { OfflineHub } from '../hub';
import { sendWithState } from '../send';
import {
  installOfflineSdk,
  offlineMessage,
  sendScripts,
  textMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

/** The per-send listener the kit handed the SDK. */
function perSendListener(fake: OfflineSdkFake): { onError?: (error: unknown) => void } {
  return fake.callsTo('sendMessage')[0]?.[1] as { onError?: (error: unknown) => void };
}

describe('a server-refused queued send keeps its failure reason', () => {
  let fake: OfflineSdkFake;
  let events: CometChatUIEvent[];
  let states: { state: string; reason?: string; direct?: boolean }[];

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    // Offline when the row is queued, so the send settles on `onMessagePending`
    // instead of waiting out the connected-send bound.
    fake.connected = false;
    const hub = OfflineHub.getInstance();
    hub.start();
    events = [];
    states = [];
    hub.setPublicEmit(event => events.push(event));
    hub.sendState.subscribe(event =>
      states.push({
        state: event.state,
        ...(event.reason !== undefined && { reason: event.reason }),
        ...(event.direct !== undefined && { direct: event.direct }),
      })
    );
  });

  afterEach(() => {
    OfflineHub.getInstance().setPublicEmit(null);
    fake.restore();
    OfflineHub.resetForTests();
  });

  /** The reason on the public `ui:message/send-state-changed` for `state`. */
  const publicReason = (state: string) =>
    events
      .filter(
        (event): event is CometChatUIEvent & { state: string; reason?: string } =>
          event.type === 'ui:message/send-state-changed' &&
          (event as { state?: string }).state === state
      )
      .map(event => event.reason);

  /** Queue `message`, then let the SDK refuse it the way 4.3.1 does. */
  async function refuseQueued(
    message: CometChat.BaseMessage,
    localMessageId: string,
    failureReason: string,
    error: unknown
  ): Promise<void> {
    fake.scriptSend(sendScripts.queuedBehind(localMessageId));
    const result = await sendWithState(message, 'text');
    expect(result.state).toBe('sending');
    // The outbox drains on reconnect and the server refuses the row: the SDK
    // stamps the reason on it and calls the per-send `onError` with the server's
    // own error, which carries no `MessageFailureReason`.
    offlineMessage(message, { localMessageId, status: 'FAILED', failureReason });
    perSendListener(fake).onError?.(error);
    // The global outbox callback follows, with the reason — and is dropped,
    // because the row is already `failed`.
    fake.fire('offline', 'onOutboxMessageFailed', message, failureReason);
    await flush();
  }

  it('the failed transition carries the reason the SDK stamped, not an empty one', async () => {
    const queued = textMessage('refused by the server');
    queued.setMuid('MR1');

    await refuseQueued(queued, 'LR1', 'PERMANENT', {
      code: 'ERR_BLOCKED_BY_EXTENSION',
      message: 'Message blocked',
    });

    // This is the regression: the public event used to have no `reason` at all.
    expect(publicReason('failed')).toEqual(['PERMANENT']);
    expect(states).toContainEqual({ state: 'failed', reason: 'PERMANENT' });
    // And the reason is the one Retry reads back for the row.
    expect(OfflineHub.getInstance().failureReasonFor('LR1')).toBe('PERMANENT');
  });

  it('a reason the error itself carries still wins over the stamped one', async () => {
    const queued = textMessage('coded error');
    queued.setMuid('MR2');

    // The 4.3.0 shape: the reason is the error's own code. The row happens to
    // carry a staler one; the error is the SDK's answer to this send.
    await refuseQueued(queued, 'LR2', 'PERMANENT', { code: 'TRANSIENT' });

    expect(publicReason('failed')).toEqual(['TRANSIENT']);
  });

  it('a stamped queue-full is treated as the refusal it is, with its notice', async () => {
    const notices: string[] = [];
    OfflineHub.getInstance().notice.subscribe(notice => notices.push(notice.kind));
    const queued = textMessage('no room');
    queued.setMuid('MR3');

    // iOS answers `onMessagePending` before refusing a full queue (SDK A7), and
    // 4.3.1 then reports the refusal with the server error only.
    await refuseQueued(queued, 'LR3', 'QUEUE_FULL', { code: 'ERR_SOMETHING' });

    expect(publicReason('failed')).toEqual(['QUEUE_FULL']);
    expect(states).toContainEqual({ state: 'failed', reason: 'QUEUE_FULL', direct: true });
    expect(notices).toEqual(['queue_full']);
  });
});
