/**
 * Every removal of a queued send rejects the `CometChatUIKit.send*` Promise
 * with the documented `ERROR_OFFLINE_MESSAGE_DISCARDED`, never with the
 * removal's reason ('DISCARDED' / 'QUEUE_OVERFLOW') as the error code.
 *
 * `isQuietRejection` matches only that code, so with the reason as the code the
 * kit surfaced a removal as an error: deleting a queued group-call message
 * reached `handleError` in `useCometChatCallButtons` and the user saw an error
 * for their own Delete. An integrator matching the documented code missed it
 * as well.
 *
 * Review: Aanshi B2 / Prajwal `send.ts:303` + `:289` on #2460. Nothing asserted
 * this code before.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OfflineHub } from '../hub';
import { discardUnsentMessage, isQuietRejection, sendWithStatePromise } from '../send';
import {
  installOfflineSdk,
  offlineMessage,
  sendScripts,
  textMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('the statics Promise rejects every removal with ERROR_OFFLINE_MESSAGE_DISCARDED', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    fake.connected = false;
    // The outbox events reach the hub only through its registered SDK listeners.
    OfflineHub.getInstance().start();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('the user deletes the queued row while the Promise waits', async () => {
    fake.scriptSend(sendScripts.queued('LD1'));
    const queued = textMessage('delete me');
    queued.setMuid('MD1');
    const promise = sendWithStatePromise(queued, 'text');
    await flush();

    // The user taps Delete: discardLocalMessage resolves and the hub reports the
    // one `discarded` transition (the SDK fires no outbox event for a success).
    offlineMessage(queued, { localMessageId: 'LD1', status: 'PENDING' });
    expect(await discardUnsentMessage(queued)).toBe('removed');

    const error = await promise.then(
      () => null,
      (e: unknown) => e
    );
    expect(error).not.toBeNull();
    expect(error).toMatchObject({ code: 'ERROR_OFFLINE_MESSAGE_DISCARDED' });
    // The kit shows nothing for it: that is what the call buttons check.
    expect(isQuietRejection(error)).toBe(true);
  });

  it.each([
    ['DISCARDED', 'MD2', 'LD2'],
    ['QUEUE_OVERFLOW', 'MD3', 'LD3'],
  ])('the outbox removes the row with %s', async (reason, muid, localId) => {
    fake.scriptSend(sendScripts.queued(localId));
    const queued = textMessage(`outbox ${reason}`);
    queued.setMuid(muid);
    const promise = sendWithStatePromise(queued, 'text');
    await flush();

    fake.fire('offline', 'onOutboxMessageFailed', queued, reason);

    const error = await promise.then(
      () => null,
      (e: unknown) => e
    );
    expect(error).toMatchObject({ code: 'ERROR_OFFLINE_MESSAGE_DISCARDED' });
    expect(isQuietRejection(error)).toBe(true);
  });

  it('a removal the outbox reported before the first answer settled is still the DISCARDED code', async () => {
    // The outbox removes the row inside the send's own callback turn, so by the
    // time the first answer settles the hub already holds `discarded`
    // (the `already === 'discarded'` early return).
    fake.scriptSend((listener, message) => {
      offlineMessage(message, { localMessageId: 'LD4', status: 'PENDING' });
      listener.onMessagePending?.(message);
      OfflineHub.getInstance().reportSendState(message, 'discarded', { reason: 'DISCARDED' });
      listener.onError?.({ code: 'FAILED_TO_FETCH' });
    });
    const queued = textMessage('already gone');
    queued.setMuid('MD4');

    const error = await sendWithStatePromise(queued, 'text').then(
      () => null,
      (e: unknown) => e
    );
    expect(error).toMatchObject({ code: 'ERROR_OFFLINE_MESSAGE_DISCARDED' });
    expect(isQuietRejection(error)).toBe(true);
  });

  it("the rejection's message is a sentence and the row rides as sentMessage", async () => {
    fake.scriptSend(sendScripts.queued('LD6'));
    const queued = textMessage('readable');
    queued.setMuid('MD6');
    const promise = sendWithStatePromise(queued, 'text');
    await flush();

    offlineMessage(queued, { localMessageId: 'LD6', status: 'PENDING' });
    expect(await discardUnsentMessage(queued)).toBe('removed');

    const error = (await promise.then(
      () => null,
      (e: unknown) => e
    )) as Error & { sentMessage?: unknown };
    // The regression: the row was assigned over `Error.message`, so an
    // integrator logging `error.message` got `[object Object]`.
    expect(typeof error.message).toBe('string');
    expect(error.message).toContain('removed');
    expect(String(error)).not.toContain('[object Object]');
    expect(error.sentMessage).toBe(queued);
  });

  it('a real send failure reads as an error too, with the reason as its code', async () => {
    fake.scriptSend(sendScripts.queued('LD7'));
    const failing = textMessage('readable failure');
    failing.setMuid('MD7');
    const promise = sendWithStatePromise(failing, 'text');
    await flush();

    fake.fire('offline', 'onOutboxMessageFailed', failing, 'PERMANENT');

    const error = (await promise.then(
      () => null,
      (e: unknown) => e
    )) as Error & { code?: unknown; sentMessage?: unknown };
    expect(error.code).toBe('PERMANENT');
    expect(typeof error.message).toBe('string');
    expect(String(error)).not.toContain('[object Object]');
    expect(error.sentMessage).toBe(failing);
  });

  it('a real send failure still rejects with the SDK reason, not the discard code', async () => {
    fake.scriptSend(sendScripts.queued('LD5'));
    const failing = textMessage('failed');
    failing.setMuid('MD5');
    const promise = sendWithStatePromise(failing, 'text');
    await flush();

    fake.fire('offline', 'onOutboxMessageFailed', failing, 'PERMANENT');

    const error = await promise.then(
      () => null,
      (e: unknown) => e
    );
    expect(error).toMatchObject({ code: 'PERMANENT' });
    expect(isQuietRejection(error)).toBe(false);
  });
});
