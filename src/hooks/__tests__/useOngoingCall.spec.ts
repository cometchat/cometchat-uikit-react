/**
 * Unit tests for useOngoingCall: joining a session (token, settings, listeners),
 * the Calls SDK's leave events, ending a call for default and direct calling,
 * listener cleanup, and error reporting.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

type Listener = () => void;
type Fn = ReturnType<typeof vi.fn>;
interface CallsSdkMock {
  generateToken: Fn;
  joinSession: Fn;
  leaveSession: Fn;
  addEventListener: Fn;
}

const mocks = vi.hoisted(() => {
  class CometChatException {
    constructor(public code: string) {}
  }
  const listeners = new Map<string, () => void>();
  const unsubscribe = vi.fn();
  return {
    CometChatException,
    listeners,
    unsubscribe,
    calls: null as CallsSdkMock | null,
    sdk: {
      getLoggedinUser: vi.fn(),
      endCall: vi.fn(),
      clearActiveCall: vi.fn(),
    },
  };
});

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: mocks.sdk,
  CometChatException: mocks.CometChatException,
}));

vi.mock('../../CometChatUIKit/CometChatCalls', () => ({
  get CometChatUIKitCalls() {
    return mocks.calls;
  },
}));

import { useOngoingCall, type UseOngoingCallOptions } from '../useOngoingCall';

function installCallsSdk(): CallsSdkMock {
  const calls: CallsSdkMock = {
    generateToken: vi.fn().mockResolvedValue({ token: 'tok-1' }),
    joinSession: vi.fn(),
    leaveSession: vi.fn(),
    addEventListener: vi.fn((name: string, cb: Listener) => {
      mocks.listeners.set(name, cb);
      return mocks.unsubscribe;
    }),
  };
  mocks.calls = calls;
  return calls;
}

function fire(name: string) {
  const listener = mocks.listeners.get(name);
  if (!listener) throw new Error(`no "${name}" listener registered`);
  act(() => {
    listener();
  });
}

function setup(options: Partial<UseOngoingCallOptions> = {}) {
  const onCallEnded = vi.fn();
  const onError = vi.fn();
  const hook = renderHook(() =>
    useOngoingCall({ sessionId: 's1', onCallEnded, onError, ...options })
  );
  return { ...hook, onCallEnded, onError };
}

const frame = document.createElement('div');

describe('useOngoingCall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listeners.clear();
    mocks.sdk.getLoggedinUser.mockResolvedValue({ getUid: () => 'me' });
    mocks.sdk.endCall.mockResolvedValue(undefined);
    installCallsSdk();
  });

  describe('startCall', () => {
    it('generates a token, joins with video settings and marks the call active', async () => {
      const calls = installCallsSdk();
      const { result } = setup();
      expect(result.current.isCallActive).toBe(false);

      await act(() => result.current.startCall(frame));

      expect(calls.generateToken).toHaveBeenCalledWith('s1');
      expect(calls.joinSession).toHaveBeenCalledWith(
        'tok-1',
        expect.objectContaining({ sessionType: 'VIDEO' }),
        frame
      );
      expect(result.current.isCallActive).toBe(true);
      expect([...mocks.listeners.keys()].sort()).toEqual([
        'onLeaveSessionButtonClicked',
        'onSessionLeft',
      ]);
    });

    it('joins audio-only calls as a voice session', async () => {
      const calls = installCallsSdk();
      const { result } = setup({ isAudioOnly: true });
      await act(() => result.current.startCall(frame));
      expect(calls.joinSession).toHaveBeenCalledWith(
        'tok-1',
        expect.objectContaining({ sessionType: 'VOICE' }),
        frame
      );
    });

    it('uses the latest session id', async () => {
      const calls = installCallsSdk();
      const { result, rerender } = renderHook(
        (props: { sessionId: string }) => useOngoingCall(props),
        {
          initialProps: { sessionId: 's1' },
        }
      );
      rerender({ sessionId: 's2' });
      await act(() => result.current.startCall(frame));
      expect(calls.generateToken).toHaveBeenCalledWith('s2');
    });

    it('reports when the Calls SDK is not installed', async () => {
      mocks.calls = null;
      const { result, onError } = setup();
      await act(() => result.current.startCall(frame));
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Calls SDK not available') })
      );
      expect(result.current.isCallActive).toBe(false);
    });

    it('reports a failed token request and stays inactive', async () => {
      const calls = installCallsSdk();
      calls.generateToken.mockRejectedValue(new mocks.CometChatException('ERR_TOKEN'));
      const { result, onError } = setup();
      await act(() => result.current.startCall(frame));
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'ERR_TOKEN' }));
      expect(calls.joinSession).not.toHaveBeenCalled();
      expect(result.current.isCallActive).toBe(false);
    });

    // Known issue: the "No logged-in user found" error is a plain Error, and the catch only
    // forwards CometChatException instances, so the caller is never told why the call didn't start.
    it.fails('reports when nobody is logged in', async () => {
      mocks.sdk.getLoggedinUser.mockResolvedValue(null);
      const { result, onError } = setup();
      await act(() => result.current.startCall(frame));
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('leave events from the call screen', () => {
    it('session left: clears the active call (default calling) and reports the end', async () => {
      const { result, onCallEnded } = setup();
      await act(() => result.current.startCall(frame));
      fire('onSessionLeft');
      expect(mocks.sdk.clearActiveCall).toHaveBeenCalled();
      expect(result.current.isCallActive).toBe(false);
      expect(onCallEnded).toHaveBeenCalledTimes(1);
    });

    it('session left with direct calling does not touch the active call', async () => {
      const { result, onCallEnded } = setup({ isDirectCalling: true });
      await act(() => result.current.startCall(frame));
      fire('onSessionLeft');
      expect(mocks.sdk.clearActiveCall).not.toHaveBeenCalled();
      expect(onCallEnded).toHaveBeenCalledTimes(1);
    });

    it('leave button: ends the call on the server, then leaves the session', async () => {
      const calls = installCallsSdk();
      const { result, onCallEnded } = setup();
      await act(() => result.current.startCall(frame));
      fire('onLeaveSessionButtonClicked');
      await waitFor(() => expect(onCallEnded).toHaveBeenCalledTimes(1));
      expect(mocks.sdk.endCall).toHaveBeenCalledWith('s1');
      expect(calls.leaveSession).toHaveBeenCalled();
      expect(result.current.isCallActive).toBe(false);
    });

    it('leave button: reports a failed server end and keeps the session', async () => {
      const calls = installCallsSdk();
      mocks.sdk.endCall.mockRejectedValue(new mocks.CometChatException('ERR_END'));
      const { result, onError, onCallEnded } = setup();
      await act(() => result.current.startCall(frame));
      fire('onLeaveSessionButtonClicked');
      await waitFor(() =>
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'ERR_END' }))
      );
      expect(calls.leaveSession).not.toHaveBeenCalled();
      expect(onCallEnded).not.toHaveBeenCalled();
    });

    it('leave button with direct calling leaves without a server call', async () => {
      const calls = installCallsSdk();
      const { result, onCallEnded } = setup({ isDirectCalling: true });
      await act(() => result.current.startCall(frame));
      fire('onLeaveSessionButtonClicked');
      expect(mocks.sdk.endCall).not.toHaveBeenCalled();
      expect(calls.leaveSession).toHaveBeenCalled();
      expect(onCallEnded).toHaveBeenCalledTimes(1);
    });
  });

  describe('endCall / endSession', () => {
    it('endCall ends on the server, leaves and reports the end', async () => {
      const calls = installCallsSdk();
      const { result, onCallEnded } = setup();
      await act(() => result.current.startCall(frame));
      await act(() => result.current.endCall());
      expect(mocks.sdk.endCall).toHaveBeenCalledWith('s1');
      expect(calls.leaveSession).toHaveBeenCalled();
      expect(mocks.unsubscribe).toHaveBeenCalledTimes(2);
      expect(result.current.isCallActive).toBe(false);
      expect(onCallEnded).toHaveBeenCalledTimes(1);
    });

    it('endCall reports a server failure and keeps the call', async () => {
      mocks.sdk.endCall.mockRejectedValue(new mocks.CometChatException('ERR_END'));
      const { result, onError, onCallEnded } = setup();
      await act(() => result.current.startCall(frame));
      await act(() => result.current.endCall());
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'ERR_END' }));
      expect(onCallEnded).not.toHaveBeenCalled();
      expect(result.current.isCallActive).toBe(true);
    });

    it('endCall with direct calling skips the server', async () => {
      const { result, onCallEnded } = setup({ isDirectCalling: true });
      await act(() => result.current.endCall());
      expect(mocks.sdk.endCall).not.toHaveBeenCalled();
      expect(onCallEnded).toHaveBeenCalledTimes(1);
    });

    it('endSession leaves locally even without the Calls SDK', () => {
      mocks.calls = null;
      const { result } = setup();
      act(() => {
        result.current.endSession();
      });
      expect(result.current.isCallActive).toBe(false);
    });
  });

  it('replaces listeners when a call is restarted and removes them on unmount', async () => {
    const { result, unmount } = setup();
    await act(() => result.current.startCall(frame));
    await act(() => result.current.startCall(frame));
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(2);
    unmount();
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(4);
  });
});
