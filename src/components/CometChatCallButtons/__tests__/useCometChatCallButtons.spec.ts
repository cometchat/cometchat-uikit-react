// useCometChatCallButtons: starting, cancelling and tracking 1-1 and group calls.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatEvent } from '../../../context/CometChatEvents.types';
import { useCometChatCallButtons } from '../useCometChatCallButtons';

interface CallHandlers {
  onIncomingCallReceived: (call: CometChat.Call) => void;
  onIncomingCallCancelled: (call: CometChat.Call) => void;
  onOutgoingCallAccepted: (call: CometChat.Call) => void;
  onOutgoingCallRejected: (call: CometChat.Call) => void;
}

const sdk = vi.hoisted(() => {
  const listeners = new Map<string, CallHandlers>();
  return {
    listeners,
    addCallListener: vi.fn((id: string, listener: CallHandlers) => {
      listeners.set(id, listener);
    }),
    removeCallListener: vi.fn((id: string) => {
      listeners.delete(id);
    }),
    initiateCall: vi.fn<(call: unknown) => Promise<CometChat.Call>>(),
    rejectCall: vi.fn<(sessionId: string, status: string) => Promise<unknown>>(),
    clearActiveCall: vi.fn(),
    sendCustomMessage: vi.fn<(message: unknown) => Promise<unknown>>(),
    publish: vi.fn<(event: CometChatEvent) => void>(),
    loggedInUser: { current: null as CometChat.User | null },
    eventHandler: { current: null as ((event: CometChatEvent) => void) | null },
  };
});

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    CALL_TYPE: { AUDIO: 'audio', VIDEO: 'video' },
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
    CALL_STATUS: { CANCELLED: 'cancelled' },
    CallListener: function CallListener(handlers: CallHandlers) {
      return handlers;
    },
    Call: class {
      constructor(
        public receiverId: string,
        public type: string,
        public receiverType: string
      ) {}
    },
    CustomMessage: class {
      metadata: Record<string, unknown> | null = null;
      updateConversation = false;
      sender: unknown = null;
      constructor(
        public receiverId: string,
        public receiverType: string,
        public type: string,
        public data: Record<string, unknown>
      ) {}
      setMetadata(metadata: Record<string, unknown>) {
        this.metadata = metadata;
      }
      shouldUpdateConversation(value: boolean) {
        this.updateConversation = value;
      }
      setSender(sender: unknown) {
        this.sender = sender;
      }
    },
    addCallListener: sdk.addCallListener,
    removeCallListener: sdk.removeCallListener,
    initiateCall: sdk.initiateCall,
    rejectCall: sdk.rejectCall,
    clearActiveCall: sdk.clearActiveCall,
    sendCustomMessage: sdk.sendCustomMessage,
  },
}));

vi.mock('../../../constants/CometChatUIKitConstants', () => ({
  CometChatUIKitConstants: { calls: { meeting: 'meeting' } },
}));

vi.mock('../../../hooks/useLoggedInUser', () => ({
  useLoggedInUser: () => sdk.loggedInUser.current,
}));

vi.mock('../../../hooks/usePublishEvent', () => ({
  usePublishEvent: () => sdk.publish,
}));

vi.mock('../../../hooks/useCometChatEvents', () => ({
  useCometChatEvents: (handler: (event: CometChatEvent) => void) => {
    sdk.eventHandler.current = handler;
  },
}));

const ME = { getUid: () => 'me' } as unknown as CometChat.User;
const BOB = { getUid: () => 'bob' } as unknown as CometChat.User;
const CAROL = { getUid: () => 'carol' } as unknown as CometChat.User;
const GROUP = { getGuid: () => 'g1' } as unknown as CometChat.Group;

function call(sessionId: string, senderUid = 'bob'): CometChat.Call {
  return {
    getSessionId: () => sessionId,
    getSender: () => ({ getUid: () => senderUid }),
  } as unknown as CometChat.Call;
}

function callListener(): CallHandlers {
  const [listener] = [...sdk.listeners.values()];
  if (sdk.listeners.size !== 1 || !listener) {
    throw new Error(`Expected one call listener, found ${String(sdk.listeners.size)}`);
  }
  return listener;
}

function emit(event: CometChatEvent) {
  const handler = sdk.eventHandler.current;
  if (!handler) throw new Error('useCometChatEvents handler was never registered');
  act(() => {
    handler(event);
  });
}

async function renderInOutgoingCall(outgoing = call('s1')) {
  sdk.initiateCall.mockResolvedValueOnce(outgoing);
  const hook = renderHook(() => useCometChatCallButtons({ user: BOB }));
  await act(async () => {
    await hook.result.current.initiateAudioCall();
  });
  return hook;
}

const IDLE = {
  activeCall: null,
  callButtonsDisabled: false,
  showOutgoingCallScreen: false,
  showOngoingCall: false,
  callSessionId: '',
  isDirectCalling: false,
  isGroupAudioCall: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  sdk.listeners.clear();
  sdk.loggedInUser.current = ME;
  sdk.eventHandler.current = null;
  sdk.rejectCall.mockResolvedValue({});
  sdk.sendCustomMessage.mockImplementation(message => Promise.resolve(message));
});

describe('setup', () => {
  it('starts idle with the buttons enabled', () => {
    const { result } = renderHook(() => useCometChatCallButtons({ user: BOB }));
    expect(result.current).toMatchObject(IDLE);
  });

  it('listens for calls while scoped and stops on unmount', () => {
    const { unmount } = renderHook(() => useCometChatCallButtons({ user: BOB }));
    expect(sdk.listeners.size).toBe(1);

    unmount();

    expect(sdk.listeners.size).toBe(0);
    expect(sdk.removeCallListener).toHaveBeenCalledWith(
      expect.stringContaining('CometChatCallButtons_call_')
    );
  });

  it('does not listen for calls without a user or group', () => {
    renderHook(() => useCometChatCallButtons({}));
    expect(sdk.addCallListener).not.toHaveBeenCalled();
  });

  it('resets the call state when the conversation changes', async () => {
    sdk.initiateCall.mockResolvedValueOnce(call('s1'));
    const { result, rerender } = renderHook(
      ({ user }: { user: CometChat.User }) => useCometChatCallButtons({ user }),
      { initialProps: { user: BOB } }
    );
    await act(async () => {
      await result.current.initiateAudioCall();
    });
    expect(result.current.showOutgoingCallScreen).toBe(true);

    rerender({ user: CAROL });

    expect(result.current).toMatchObject(IDLE);
  });
});

describe('1-1 calls', () => {
  it.each([
    ['initiateAudioCall', 'audio'],
    ['initiateVideoCall', 'video'],
  ] as const)('%s rings the user and shows the outgoing screen', async (method, type) => {
    const outgoing = call('s1');
    sdk.initiateCall.mockResolvedValueOnce(outgoing);
    const { result } = renderHook(() => useCometChatCallButtons({ user: BOB }));

    await act(async () => {
      await result.current[method]();
    });

    expect(sdk.initiateCall).toHaveBeenCalledWith(
      expect.objectContaining({
        receiverId: 'bob',
        type,
        receiverType: 'user',
      })
    );
    expect(sdk.publish).toHaveBeenCalledWith({
      type: 'ui:call/outgoing',
      call: outgoing,
    });
    expect(result.current).toMatchObject({
      activeCall: outgoing,
      callButtonsDisabled: true,
      showOutgoingCallScreen: true,
      showOngoingCall: false,
    });
  });

  it('reports a failed initiation through onError and stays idle', async () => {
    const error = { code: 'ERR_CALL', message: 'busy' };
    sdk.initiateCall.mockRejectedValueOnce(error);
    const onError = vi.fn();
    const { result } = renderHook(() => useCometChatCallButtons({ user: BOB, onError }));

    await act(async () => {
      await result.current.initiateVideoCall();
    });

    expect(onError).toHaveBeenCalledWith(error);
    expect(sdk.publish).not.toHaveBeenCalled();
    expect(result.current).toMatchObject(IDLE);
  });

  it('swallows a failed initiation when no onError is given', async () => {
    sdk.initiateCall.mockRejectedValueOnce(new Error('busy'));
    const { result } = renderHook(() => useCometChatCallButtons({ user: BOB, onError: null }));

    await act(async () => {
      await expect(result.current.initiateAudioCall()).resolves.toBeUndefined();
    });
    expect(result.current).toMatchObject(IDLE);
  });
});

describe('group calls', () => {
  it.each([
    ['initiateAudioCall', 'audio', true],
    ['initiateVideoCall', 'video', false],
  ] as const)(
    '%s posts a meeting message and joins the session directly',
    async (method, callType, isGroupAudioCall) => {
      const { result } = renderHook(() => useCometChatCallButtons({ group: GROUP }));

      await act(async () => {
        await result.current[method]();
      });

      expect(sdk.initiateCall).not.toHaveBeenCalled();
      expect(sdk.sendCustomMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          receiverId: 'g1',
          receiverType: 'group',
          type: 'meeting',
          data: { sessionID: 'g1', sessionId: 'g1', callType },
          metadata: { incrementUnreadCount: true },
          updateConversation: true,
          sender: ME,
        })
      );
      expect(result.current).toMatchObject({
        showOngoingCall: true,
        callSessionId: 'g1',
        isDirectCalling: true,
        isGroupAudioCall,
        callButtonsDisabled: true,
        showOutgoingCallScreen: false,
      });
      await waitFor(() => {
        expect(sdk.publish).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'ui:message/sent',
            status: 'success',
            message: expect.objectContaining({ type: 'meeting' }),
          })
        );
      });
    }
  );

  it('reports a failed meeting message through onError', async () => {
    const error = { code: 'ERR_NOT_A_MEMBER' };
    sdk.sendCustomMessage.mockRejectedValueOnce(error);
    const onError = vi.fn();
    const { result } = renderHook(() => useCometChatCallButtons({ group: GROUP, onError }));

    await act(async () => {
      await result.current.initiateVideoCall();
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
    expect(sdk.publish).not.toHaveBeenCalled();
  });

  it('leaves the sender to the SDK when no logged-in user is known', async () => {
    sdk.loggedInUser.current = null;
    const { result } = renderHook(() => useCometChatCallButtons({ group: GROUP }));

    await act(async () => {
      await result.current.initiateAudioCall();
    });

    expect(sdk.sendCustomMessage).toHaveBeenCalledWith(expect.objectContaining({ sender: null }));
  });
});

describe('cancelling and resetting', () => {
  it('does nothing when there is no outgoing call to cancel', async () => {
    const { result } = renderHook(() => useCometChatCallButtons({ user: BOB }));

    await act(async () => {
      await result.current.cancelOutgoingCall();
    });

    expect(sdk.rejectCall).not.toHaveBeenCalled();
    expect(sdk.clearActiveCall).not.toHaveBeenCalled();
  });

  it('cancels the ringing call, clears it from the SDK and resets', async () => {
    const { result } = await renderInOutgoingCall(call('s42'));

    await act(async () => {
      await result.current.cancelOutgoingCall();
    });

    expect(sdk.rejectCall).toHaveBeenCalledWith('s42', 'cancelled');
    expect(sdk.clearActiveCall).toHaveBeenCalled();
    expect(result.current).toMatchObject(IDLE);
  });

  it('still resets the UI and reports the error when cancelling fails', async () => {
    const error = { code: 'ERR_CALL_ENDED' };
    sdk.rejectCall.mockRejectedValueOnce(error);
    sdk.initiateCall.mockResolvedValueOnce(call('s1'));
    const onError = vi.fn();
    const { result } = renderHook(() => useCometChatCallButtons({ user: BOB, onError }));
    await act(async () => {
      await result.current.initiateAudioCall();
    });

    await act(async () => {
      await result.current.cancelOutgoingCall();
    });

    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current).toMatchObject(IDLE);
  });

  it('resetCallState returns to idle', async () => {
    const { result } = await renderInOutgoingCall();

    act(() => {
      result.current.resetCallState();
    });

    expect(result.current).toMatchObject(IDLE);
  });
});

describe('SDK call listener', () => {
  it('disables the buttons while an incoming call rings and re-enables when it is cancelled', () => {
    const { result } = renderHook(() => useCometChatCallButtons({ user: BOB }));

    act(() => {
      callListener().onIncomingCallReceived(call('in1', 'carol'));
    });
    expect(result.current.callButtonsDisabled).toBe(true);

    act(() => {
      callListener().onIncomingCallCancelled(call('in1', 'carol'));
    });
    expect(result.current.callButtonsDisabled).toBe(false);
  });

  it('moves to the ongoing call when our outgoing call is accepted', async () => {
    const { result } = await renderInOutgoingCall(call('s1', 'me'));

    act(() => {
      callListener().onOutgoingCallAccepted(call('s1', 'bob'));
    });

    expect(result.current).toMatchObject({
      showOngoingCall: true,
      callSessionId: 's1',
      isDirectCalling: false,
      showOutgoingCallScreen: false,
      callButtonsDisabled: true,
    });
  });

  it('ignores an acceptance whose sender is the logged-in user', async () => {
    const { result } = await renderInOutgoingCall(call('s1', 'me'));

    act(() => {
      callListener().onOutgoingCallAccepted(call('s1', 'me'));
    });

    expect(result.current.showOngoingCall).toBe(false);
    expect(result.current.showOutgoingCallScreen).toBe(true);
  });

  it('ignores an acceptance for a different session', async () => {
    const { result } = await renderInOutgoingCall(call('s1', 'me'));

    act(() => {
      callListener().onOutgoingCallAccepted(call('other-session', 'bob'));
    });

    expect(result.current.showOngoingCall).toBe(false);
    expect(result.current.showOutgoingCallScreen).toBe(true);
  });

  it('clears the call and resets when the callee rejects', async () => {
    const { result } = await renderInOutgoingCall();

    act(() => {
      callListener().onOutgoingCallRejected(call('s1', 'bob'));
    });

    expect(sdk.clearActiveCall).toHaveBeenCalled();
    expect(result.current).toMatchObject(IDLE);
  });
});

describe('UI call events', () => {
  it('re-enables the buttons after an incoming call is declined', () => {
    const { result } = renderHook(() => useCometChatCallButtons({ user: BOB }));
    act(() => {
      callListener().onIncomingCallReceived(call('in1', 'carol'));
    });

    emit({ type: 'ui:call/rejected', call: call('in1', 'carol') });

    expect(sdk.clearActiveCall).toHaveBeenCalled();
    expect(result.current.callButtonsDisabled).toBe(false);
  });

  it('clears the call and resets when a call ends', async () => {
    const { result } = renderHook(() => useCometChatCallButtons({ group: GROUP }));
    await act(async () => {
      await result.current.initiateVideoCall();
    });

    emit({ type: 'ui:call/ended' });

    expect(sdk.clearActiveCall).toHaveBeenCalled();
    expect(result.current).toMatchObject(IDLE);
  });

  it('ignores unrelated events', async () => {
    const { result } = await renderInOutgoingCall();
    const before = result.current;

    emit({ type: 'ui:conversation/read', conversationId: 'user_bob' });

    expect(sdk.clearActiveCall).not.toHaveBeenCalled();
    expect(result.current).toEqual(before);
  });
});
