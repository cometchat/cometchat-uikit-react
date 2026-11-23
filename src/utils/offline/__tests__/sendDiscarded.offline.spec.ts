/**
 * A send the SDK never answers on its listener must not hold the composer's
 * send lock for good. Android settles every open send quietly when the session
 * ends, and treats ERROR_OFFLINE_MESSAGE_DISCARDED as a quiet rejection (no
 * error shown): the row removal is the only signal.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { OfflineHub } from '../hub';
import { sendWithState, type OfflineSendResult } from '../send';
import {
  installOfflineSdk,
  textMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';

describe('a send nobody answers', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('settles quietly when the session ends (logout), so the composer is not held', async () => {
    // No script: the SDK takes the send and never calls the listener.
    let result: OfflineSendResult | null = null;
    void sendWithState(textMessage('hi'), 'text').then(r => {
      result = r;
    });
    await Promise.resolve();
    expect(result).toBeNull();
    OfflineHub.getInstance().endSession();
    await Promise.resolve();
    expect(result).not.toBeNull();
    // Not a failure: no error is shown for a logout.
    expect((result as OfflineSendResult | null)?.state).toBe('sending');
  });

  it('settles quietly when the SDK Promise rejects with ERROR_OFFLINE_MESSAGE_DISCARDED', async () => {
    vi.spyOn(CometChat as never, 'sendMessage').mockImplementation(() =>
      Promise.reject(Object.assign(new Error('discarded'), { code: 'ERROR_OFFLINE_MESSAGE_DISCARDED' }))
    );
    const result = await sendWithState(textMessage('hi'), 'text');
    expect(result.state).toBe('sending');
  });

  it('a rejection for any other reason alone does not settle it (the listener decides)', async () => {
    let settled = false;
    void sendWithState(textMessage('hi'), 'text').then(() => {
      settled = true;
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(false);
  });
});
