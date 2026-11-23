/**
 * UIK-SEND-10: the group call's "meeting" message goes through the same send
 * helper as every other send with offline on. With offline off it keeps
 * today's Promise-form call.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatCallButtons } from '../useCometChatCallButtons';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { OfflineHub } from '../../../utils/offline/hub';
import {
  installOfflineSdk,
  sendScripts,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';

const me = new CometChat.User({ uid: 'me', name: 'Me' });
const group = new CometChat.Group('team', 'Team', 'public');

describe('useCometChatCallButtons: the group call message', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(me);
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(me);
    vi.spyOn(CometChat, 'addCallListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'removeCallListener').mockImplementation(() => undefined);
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    vi.restoreAllMocks();
  });

  function startCall(onError = vi.fn()) {
    const { result } = renderHook(() => useCometChatCallButtons({ group, onError }));
    act(() => {
      void result.current.initiateAudioCall();
    });
    return { result, onError };
  }

  it('offline on: sent with the three-phase listener, so it queues', async () => {
    fake.scriptSend(sendScripts.sent('L1', 9));
    const states: string[] = [];
    OfflineHub.getInstance().sendState.subscribe(event => states.push(event.state));
    startCall();
    await waitFor(() => {
      expect(fake.callsTo('sendCustomMessage')).toHaveLength(1);
    });
    const [message, listener] = fake.callsTo('sendCustomMessage')[0] ?? [];
    expect((message as CometChat.CustomMessage).getType()).toBe('meeting');
    expect((message as CometChat.CustomMessage).getMuid()).toBeTruthy();
    expect(listener).toBeDefined();
    await waitFor(() => {
      expect(states).toEqual(['sending', 'sent']);
    });
  });

  it('offline on: a queued call message is not an error', async () => {
    fake.scriptSend(sendScripts.queued('L1'));
    const { onError } = startCall();
    await waitFor(() => {
      expect(fake.callsTo('sendCustomMessage')).toHaveLength(1);
    });
    await new Promise(resolve => {
      setTimeout(resolve, 10);
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it('offline on: a logout while the call message is queued is not an error', async () => {
    fake.scriptSend(sendScripts.queued('L1'));
    const { onError } = startCall();
    await waitFor(() => {
      expect(fake.callsTo('sendCustomMessage')).toHaveLength(1);
    });
    OfflineHub.getInstance().endSession();
    await new Promise(resolve => {
      setTimeout(resolve, 10);
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it('offline on: a refused call message reaches onError', async () => {
    fake.scriptSend(sendScripts.refused('ERR_BLOCKED'));
    const { onError } = startCall();
    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  it('offline off: today’s Promise form, with no listener', async () => {
    fake.setEnabled(false);
    startCall();
    await waitFor(() => {
      expect(fake.callsTo('sendCustomMessage')).toHaveLength(1);
    });
    expect(fake.callsTo('sendCustomMessage')[0]?.[1]).toBeUndefined();
  });
});
