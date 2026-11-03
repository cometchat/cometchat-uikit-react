/**
 * The public props of <CometChatOngoingCall />, one case each: the prop is set (or left out) on the
 * real component and the test checks what it changes. Only the SDKs are mocked: the Chat SDK's login
 * and call calls, and the optional Calls SDK where the kit holds it once loaded (as the other call
 * specs do). Kit events go through a small in-memory bus.
 *
 * `callSettingsBuilder` is not claimed: the component never reads it.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatOngoingCall } from '../CometChatOngoingCall';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import type { CometChatEvent } from '../../../context/CometChatEvents.types';
import { GlobalConfigProvider } from '../../../context/GlobalConfigContext';
import { covers } from '../../../testing/covers';

const sdk = vi.hoisted(() => ({
  getLoggedinUser: vi.fn(),
  endCall: vi.fn(),
  clearActiveCall: vi.fn(),
}));

/** The Calls SDK: the session's event listeners are kept so a test can fire them. */
const calls = vi.hoisted(() => {
  const listeners = new Map<string, () => void>();
  return {
    listeners,
    generateToken: vi.fn(),
    joinSession: vi.fn(),
    leaveSession: vi.fn(),
    addEventListener: vi.fn((name: string, listener: () => void) => {
      listeners.set(name, listener);
      return () => {
        listeners.delete(name);
      };
    }),
  };
});

// The real SDK's constants (the kit reads them on import), with the calls the component makes mocked.
vi.mock('@cometchat/chat-sdk-javascript', async () => {
  const { CometChat } = await vi.importActual<typeof import('@cometchat/chat-sdk-javascript')>('@cometchat/chat-sdk-javascript');
  return {
    CometChat: Object.assign({}, CometChat, {
      getLoggedinUser: sdk.getLoggedinUser,
      endCall: sdk.endCall,
      clearActiveCall: sdk.clearActiveCall,
    }),
  };
});

// The optional Calls SDK, as the kit holds it once loaded.
vi.mock('../../../CometChatUIKit/CometChatCalls', () => ({ CometChatUIKitCalls: calls }));

const me = { getUid: () => 'me', getName: () => 'Me', getAuthToken: () => 'auth-token' };

/** The settings the component builds when it is given none. */
const defaults = (sessionType: 'VIDEO' | 'VOICE') => ({
  sessionType,
  startAudioMuted: false,
  startVideoPaused: false,
  hideControlPanel: false,
  hideLeaveSessionButton: false,
  hideToggleAudioButton: false,
  hideToggleVideoButton: false,
});

/** Waits until the call has joined its session; returns joinSession's arguments. */
async function joined() {
  await waitFor(() => {
    expect(calls.joinSession).toHaveBeenCalled();
  });
  return calls.joinSession.mock.calls[0] as [string, unknown, HTMLElement];
}

/** The Calls SDK reports a session event. */
function fire(name: 'onSessionLeft' | 'onLeaveSessionButtonClicked') {
  const listener = calls.listeners.get(name);
  if (!listener) throw new Error(`no "${name}" listener registered`);
  act(() => {
    listener();
  });
}

/** The kit's event bus, in memory. */
const handlers = new Set<(event: CometChatEvent) => void>();
const bus = {
  subscribe: (handler: (event: CometChatEvent) => void) => {
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
    };
  },
  publish: vi.fn(),
};
const Bus: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <CometChatEventsContext.Provider value={bus}>{children}</CometChatEventsContext.Provider>
);
function emit(event: CometChatEvent) {
  act(() => {
    handlers.forEach(handler => {
      handler(event);
    });
  });
}
const endedCall = (sessionId: string) => ({ getSessionId: () => sessionId }) as unknown as CometChat.Call;

const callScreen = () => screen.getByRole('dialog', { name: 'Ongoing call' });

beforeEach(() => {
  sdk.getLoggedinUser.mockReset().mockResolvedValue(me);
  sdk.endCall.mockReset().mockResolvedValue({});
  sdk.clearActiveCall.mockClear();
  calls.generateToken.mockReset().mockResolvedValue({ token: 'call-token' });
  calls.joinSession.mockClear();
  calls.leaveSession.mockClear();
  calls.addEventListener.mockClear();
  calls.listeners.clear();
});

describe('CometChatOngoingCall props', () => {
  it('sessionID: the call joins that session, and only the end of that call ends it', async () => {
    covers('CometChatOngoingCall.sessionID', 'set');
    const onCallEnded = vi.fn();
    render(
      <Bus>
        <CometChatOngoingCall sessionID="session-1" onCallEnded={onCallEnded} />
      </Bus>
    );
    const [token, , frame] = await joined();
    expect(calls.generateToken).toHaveBeenCalledWith('session-1', 'auth-token');
    expect(token).toBe('call-token');
    expect(frame).toBe(callScreen());

    emit({ type: 'call/ended', call: endedCall('another-session') });
    expect(onCallEnded).not.toHaveBeenCalled();
    emit({ type: 'call/ended', call: endedCall('session-1') });
    expect(onCallEnded).toHaveBeenCalledTimes(1);
    expect(calls.leaveSession).toHaveBeenCalledTimes(1);
  });

  describe('call settings', () => {
    it('callSettings are the settings the call joins with', async () => {
      covers('CometChatOngoingCall.callSettings', 'set');
      const settings = { sessionType: 'VOICE', layout: 'SIDEBAR', startAudioMuted: true } as const;
      render(<CometChatOngoingCall sessionID="session-1" callSettings={settings} />);
      const [, joinedWith] = await joined();
      expect(joinedWith).toBe(settings);
    });

    it('without callSettings, the call joins with default video settings', async () => {
      covers('CometChatOngoingCall.callSettings', 'default');
      render(<CometChatOngoingCall sessionID="session-1" />);
      const [, joinedWith] = await joined();
      expect(joinedWith).toEqual(defaults('VIDEO'));
    });

    it("callSettings win over the app's global call settings", async () => {
      covers('CometChatOngoingCall.callSettings', 'overrides-context');
      const global = { sessionType: 'VIDEO', layout: 'TILE' };
      const own = { sessionType: 'VOICE', layout: 'SPOTLIGHT' } as const;

      // The global setting alone is what the call joins with…
      const view = render(
        <GlobalConfigProvider config={{ callSettingsBuilder: global }}>
          <CometChatOngoingCall sessionID="session-1" />
        </GlobalConfigProvider>
      );
      expect((await joined())[1]).toBe(global);
      view.unmount();

      // …until the prop is set.
      calls.joinSession.mockClear();
      render(
        <GlobalConfigProvider config={{ callSettingsBuilder: global }}>
          <CometChatOngoingCall sessionID="session-1" callSettings={own} />
        </GlobalConfigProvider>
      );
      expect((await joined())[1]).toBe(own);
    });

    it('isAudioOnly makes the default session a voice call; it is a video call by default', async () => {
      covers('CometChatOngoingCall.isAudioOnly', 'true', 'false', 'default');
      for (const [props, sessionType] of [
        [{ isAudioOnly: true }, 'VOICE'],
        [{ isAudioOnly: false }, 'VIDEO'],
        [{}, 'VIDEO'],
      ] as const) {
        calls.joinSession.mockClear();
        const view = render(<CometChatOngoingCall sessionID="session-1" {...props} />);
        expect((await joined())[1]).toEqual(defaults(sessionType));
        view.unmount();
      }
    });
  });

  describe('leaving', () => {
    it('isDirectCalling: leaving only leaves the session; there is no call to end or clear', async () => {
      covers('CometChatOngoingCall.isDirectCalling', 'true');
      const onCallEnded = vi.fn();
      render(<CometChatOngoingCall sessionID="meeting-1" isDirectCalling onCallEnded={onCallEnded} />);
      await joined();

      fire('onLeaveSessionButtonClicked');
      expect(calls.leaveSession).toHaveBeenCalledTimes(1);
      expect(onCallEnded).toHaveBeenCalledTimes(1);
      fire('onSessionLeft');
      await act(() => Promise.resolve());
      expect(sdk.endCall).not.toHaveBeenCalled();
      expect(sdk.clearActiveCall).not.toHaveBeenCalled();
    });

    it('without isDirectCalling (or false), leaving ends the call and clears it', async () => {
      covers('CometChatOngoingCall.isDirectCalling', 'false', 'default');
      for (const props of [{ isDirectCalling: false }, {}]) {
        sdk.endCall.mockClear();
        sdk.clearActiveCall.mockClear();
        calls.leaveSession.mockClear();
        calls.joinSession.mockClear();
        const onCallEnded = vi.fn();
        const view = render(<CometChatOngoingCall sessionID="session-1" onCallEnded={onCallEnded} {...props} />);
        await joined();

        fire('onLeaveSessionButtonClicked');
        await waitFor(() => {
          expect(onCallEnded).toHaveBeenCalledTimes(1);
        });
        expect(sdk.endCall).toHaveBeenCalledWith('session-1');
        expect(calls.leaveSession).toHaveBeenCalledTimes(1);
        expect(sdk.clearActiveCall).toHaveBeenCalledTimes(1);
        view.unmount();
      }
    });
  });

  describe('callbacks', () => {
    it('onCallEnded fires when the session is left', async () => {
      covers('CometChatOngoingCall.onCallEnded', 'called');
      const onCallEnded = vi.fn();
      render(<CometChatOngoingCall sessionID="session-1" onCallEnded={onCallEnded} />);
      await joined();
      expect(onCallEnded).not.toHaveBeenCalled();

      fire('onSessionLeft');
      expect(onCallEnded).toHaveBeenCalledTimes(1);
      expect(onCallEnded).toHaveBeenCalledWith();
    });

    it('onError gets the error when no call token can be had, or the call cannot be ended', async () => {
      covers('CometChatOngoingCall.onError', 'called');
      const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const noToken = { code: 'ERR_TOKEN', message: 'no token' };
      calls.generateToken.mockRejectedValueOnce(noToken);
      const onError = vi.fn();
      const view = render(<CometChatOngoingCall sessionID="session-1" onError={onError} />);
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(noToken);
      });
      expect(calls.joinSession).not.toHaveBeenCalled();
      view.unmount();

      const cannotEnd = { code: 'ERR_END', message: 'cannot end' };
      sdk.endCall.mockRejectedValueOnce(cannotEnd);
      onError.mockClear();
      render(<CometChatOngoingCall sessionID="session-1" onError={onError} />);
      await joined();
      fire('onLeaveSessionButtonClicked');
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(cannotEnd);
      });
      quiet.mockRestore();
    });
  });

  it('className is added to the call screen; by default it has only its own class', async () => {
    covers('CometChatOngoingCall.className', 'set', 'default');
    const { unmount } = render(<CometChatOngoingCall sessionID="session-1" className="fullscreen-call" />);
    await joined();
    expect(callScreen()).toHaveClass('cometchat-ongoing-call', 'fullscreen-call');
    unmount();

    render(<CometChatOngoingCall sessionID="session-1" />);
    await joined();
    expect(callScreen().getAttribute('class')).toBe('cometchat-ongoing-call');
  });
});
