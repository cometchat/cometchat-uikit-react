/**
 * The public props of <CometChatIncomingCall />, one case each: the prop is set (or left out) on the
 * real component and the test checks what it changes. Only the SDKs are mocked: the Chat SDK's call
 * listener and call calls, and the optional Calls SDK where the kit holds it once loaded (as the other
 * call specs do). An accepted call opens the real ongoing-call screen; the ring tone is checked where
 * it reaches the browser, the audio element played.
 *
 * `callSettingsBuilder` 'set' is not claimed: the settings it builds never reach the call.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatIncomingCall } from '../CometChatIncomingCall';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import { GlobalConfigProvider } from '../../../context/GlobalConfigContext';
import { buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

interface CallHandlers {
  onIncomingCallReceived: (call: CometChat.Call) => void;
}

const sdk = vi.hoisted(() => {
  const callListeners = new Map<string, unknown>();
  return {
    callListeners,
    addCallListener: vi.fn((id: string, listener: unknown) => {
      callListeners.set(id, listener);
    }),
    removeCallListener: vi.fn((id: string) => {
      callListeners.delete(id);
    }),
    acceptCall: vi.fn(),
    rejectCall: vi.fn(),
    clearActiveCall: vi.fn(),
    endCall: vi.fn(),
    getLoggedinUser: vi.fn(),
  };
});

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
      CallListener: vi.fn((callbacks: unknown) => callbacks),
      addCallListener: sdk.addCallListener,
      removeCallListener: sdk.removeCallListener,
      acceptCall: sdk.acceptCall,
      rejectCall: sdk.rejectCall,
      clearActiveCall: sdk.clearActiveCall,
      endCall: sdk.endCall,
      getLoggedinUser: sdk.getLoggedinUser,
    }),
  };
});

// The optional Calls SDK, as the kit holds it once loaded.
vi.mock('../../../CometChatUIKit/CometChatCalls', () => ({ CometChatUIKitCalls: calls }));

const DEFAULT_RING = 'https://assets.cc-cluster-2.io/uikits/static/audio/incomingcall.wav';

// jsdom can't play audio; vitest.setup.ts stubs play, and this spy records which element.
const play = vi.spyOn(HTMLMediaElement.prototype, 'play');
const played = () => play.mock.contexts.map(audio => (audio as HTMLAudioElement).src);

const me = { getUid: () => 'me', getName: () => 'Me', getAuthToken: () => 'auth-token' };
const alice = buildUser({ uid: 'alice', name: 'Alice', avatar: 'https://example.com/alice.png' });

/** A call from Alice, as the SDK's call listener delivers it. */
function incoming(type: 'audio' | 'video' = 'audio') {
  return {
    getSessionId: () => 'session-1',
    getType: () => type,
    getSender: () => alice,
    getCallInitiator: () => alice,
    getReceiverType: () => 'user',
  } as unknown as CometChat.Call;
}

/** Alice calls: the SDK's call listener reports the call. */
function ring(call = incoming()) {
  const [listener] = [...sdk.callListeners.values()] as CallHandlers[];
  if (sdk.callListeners.size !== 1 || !listener) {
    throw new Error(`expected one call listener, found ${String(sdk.callListeners.size)}`);
  }
  act(() => {
    listener.onIncomingCallReceived(call);
  });
  return call;
}

const card = () => screen.getByRole('alertdialog', { name: 'Incoming voice call from Alice' });
const accept = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
};

/** Waits until an accepted call has joined its session; returns joinSession's arguments. */
async function joined() {
  await waitFor(() => {
    expect(calls.joinSession).toHaveBeenCalled();
  });
  return calls.joinSession.mock.calls[0] as [string, unknown, HTMLElement];
}

/** The settings the ongoing call builds when it is given none. */
const defaults = (sessionType: 'VIDEO' | 'VOICE') => ({
  sessionType,
  startAudioMuted: false,
  startVideoPaused: false,
  hideControlPanel: false,
  hideLeaveSessionButton: false,
  hideToggleAudioButton: false,
  hideToggleVideoButton: false,
});

/** The kit's event bus, recording what the component publishes. */
const bus = {
  subscribe: () => () => undefined,
  publish: vi.fn(),
};
const Bus: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <CometChatEventsContext.Provider value={bus}>{children}</CometChatEventsContext.Provider>
);

beforeEach(() => {
  sdk.callListeners.clear();
  sdk.acceptCall.mockReset().mockResolvedValue({ getSessionId: () => 'session-1' });
  sdk.rejectCall.mockReset().mockResolvedValue({ getSessionId: () => 'session-1' });
  sdk.clearActiveCall.mockClear();
  sdk.endCall.mockReset().mockResolvedValue({});
  sdk.getLoggedinUser.mockReset().mockResolvedValue(me);
  calls.generateToken.mockReset().mockResolvedValue({ token: 'call-token' });
  calls.joinSession.mockClear();
  calls.leaveSession.mockClear();
  calls.listeners.clear();
  bus.publish.mockClear();
  play.mockClear();
});

describe('CometChatIncomingCall props', () => {
  describe('ring tone', () => {
    it('disableSoundForCalls silences the ring tone; it rings by default', () => {
      covers('CometChatIncomingCall.disableSoundForCalls', 'true', 'false', 'default');
      const { unmount } = render(<CometChatIncomingCall disableSoundForCalls />);
      ring();
      expect(card()).toBeInTheDocument();
      expect(play).not.toHaveBeenCalled();
      unmount();

      for (const props of [{ disableSoundForCalls: false }, {}]) {
        play.mockClear();
        const view = render(<CometChatIncomingCall {...props} />);
        ring();
        expect(played()).toEqual([DEFAULT_RING]);
        expect((play.mock.contexts[0] as HTMLAudioElement).loop).toBe(true);
        view.unmount();
      }
    });

    it("disableSoundForCalls wins over the app's global sound setting", () => {
      covers('CometChatIncomingCall.disableSoundForCalls', 'overrides-context');
      // Silenced app-wide: no ring…
      let view = render(
        <GlobalConfigProvider config={{ disableSoundForCalls: true }}>
          <CometChatIncomingCall />
        </GlobalConfigProvider>
      );
      ring();
      expect(play).not.toHaveBeenCalled();
      view.unmount();

      // …unless the prop turns it back on,
      view = render(
        <GlobalConfigProvider config={{ disableSoundForCalls: true }}>
          <CometChatIncomingCall disableSoundForCalls={false} />
        </GlobalConfigProvider>
      );
      ring();
      expect(played()).toEqual([DEFAULT_RING]);
      view.unmount();

      // …and the prop silences an app that rings.
      play.mockClear();
      render(
        <GlobalConfigProvider config={{ disableSoundForCalls: false }}>
          <CometChatIncomingCall disableSoundForCalls />
        </GlobalConfigProvider>
      );
      ring();
      expect(play).not.toHaveBeenCalled();
    });

    it('customSoundForCalls is the tone that rings; by default the built-in one does', () => {
      covers('CometChatIncomingCall.customSoundForCalls', 'set', 'default');
      const { unmount } = render(<CometChatIncomingCall customSoundForCalls="https://example.com/ring.mp3" />);
      ring();
      expect(played()).toEqual(['https://example.com/ring.mp3']);
      unmount();

      play.mockClear();
      render(<CometChatIncomingCall />);
      ring();
      expect(played()).toEqual([DEFAULT_RING]);
    });

    it("customSoundForCalls wins over the app's global call sound", () => {
      covers('CometChatIncomingCall.customSoundForCalls', 'overrides-context');
      const config = { customSoundForCalls: 'https://example.com/app-ring.mp3' };
      const { unmount } = render(
        <GlobalConfigProvider config={config}>
          <CometChatIncomingCall />
        </GlobalConfigProvider>
      );
      ring();
      expect(played()).toEqual(['https://example.com/app-ring.mp3']);
      unmount();

      play.mockClear();
      render(
        <GlobalConfigProvider config={config}>
          <CometChatIncomingCall customSoundForCalls="https://example.com/ring.mp3" />
        </GlobalConfigProvider>
      );
      ring();
      expect(played()).toEqual(['https://example.com/ring.mp3']);
    });
  });

  describe('callbacks', () => {
    it('onAccept gets the call instead of the call being accepted', async () => {
      covers('CometChatIncomingCall.onAccept', 'called');
      const onAccept = vi.fn();
      render(<CometChatIncomingCall onAccept={onAccept} />);
      const call = ring();
      accept();
      expect(onAccept).toHaveBeenCalledTimes(1);
      expect(onAccept).toHaveBeenCalledWith(call);
      await act(() => Promise.resolve());
      expect(sdk.acceptCall).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog', { name: 'Ongoing call' })).toBeNull();
    });

    it('onDecline gets the call instead of the call being rejected, and the card closes', async () => {
      covers('CometChatIncomingCall.onDecline', 'called');
      const onDecline = vi.fn();
      render(
        <Bus>
          <CometChatIncomingCall onDecline={onDecline} />
        </Bus>
      );
      const call = ring();
      fireEvent.click(within(card()).getByRole('button', { name: 'Decline' }));
      expect(onDecline).toHaveBeenCalledTimes(1);
      expect(onDecline).toHaveBeenCalledWith(call);
      await act(() => Promise.resolve());
      expect(sdk.rejectCall).not.toHaveBeenCalled();
      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(bus.publish).toHaveBeenCalledWith({ type: 'ui:call/rejected', call });
    });

    it('onCallEnded fires when the accepted call ends, and the call screen closes', async () => {
      covers('CometChatIncomingCall.onCallEnded', 'called');
      const onCallEnded = vi.fn();
      render(
        <Bus>
          <CometChatIncomingCall onCallEnded={onCallEnded} />
        </Bus>
      );
      ring();
      accept();
      await joined();
      expect(sdk.acceptCall).toHaveBeenCalledWith('session-1');
      expect(screen.getByRole('dialog', { name: 'Ongoing call' })).toBeInTheDocument();
      expect(onCallEnded).not.toHaveBeenCalled();

      const left = calls.listeners.get('onSessionLeft');
      if (!left) throw new Error('the call screen registered no onSessionLeft listener');
      act(() => {
        left();
      });
      expect(onCallEnded).toHaveBeenCalledTimes(1);
      expect(onCallEnded).toHaveBeenCalledWith();
      expect(screen.queryByRole('dialog', { name: 'Ongoing call' })).toBeNull();
      expect(bus.publish).toHaveBeenCalledWith({ type: 'ui:call/ended' });
    });

    it('onError gets the error when the call cannot be accepted or rejected', async () => {
      covers('CometChatIncomingCall.onError', 'called');
      const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const onError = vi.fn();
      const cannotAccept = { code: 'ERR_ACCEPT', message: 'call is over' };
      sdk.acceptCall.mockRejectedValueOnce(cannotAccept);
      render(<CometChatIncomingCall onError={onError} />);
      ring();
      accept();
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(cannotAccept);
      });

      const cannotReject = { code: 'ERR_REJECT', message: 'call is over' };
      sdk.rejectCall.mockRejectedValueOnce(cannotReject);
      fireEvent.click(screen.getByRole('button', { name: 'Decline' }));
      await waitFor(() => {
        expect(onError).toHaveBeenLastCalledWith(cannotReject);
      });
      expect(sdk.rejectCall).toHaveBeenCalledWith('session-1', 'rejected');
      quiet.mockRestore();
    });
  });

  it('without callSettingsBuilder, the accepted call joins with default settings for its type', async () => {
    covers('CometChatIncomingCall.callSettingsBuilder', 'default');
    for (const [type, sessionType] of [
      ['audio', 'VOICE'],
      ['video', 'VIDEO'],
    ] as const) {
      calls.joinSession.mockClear();
      const view = render(<CometChatIncomingCall />);
      ring(incoming(type));
      accept();
      const [token, settings] = await joined();
      expect(token).toBe('call-token');
      expect(settings).toEqual(defaults(sessionType));
      view.unmount();
    }
  });

  describe('views', () => {
    it('itemView replaces the caller details on the card', () => {
      covers('CometChatIncomingCall.itemView', 'custom');
      const itemView = vi.fn((call: CometChat.Call) => <p>{call.getSender().getName()} is calling</p>);
      const { container } = render(<CometChatIncomingCall itemView={itemView} />);
      const call = ring();
      expect(itemView).toHaveBeenCalledWith(call);
      expect(within(card()).getByText('Alice is calling')).toBeInTheDocument();
      expect(container.querySelector('.cometchat-incoming-call__info')).toBeNull();
      expect(container.querySelector('.cometchat-avatar')).toBeNull();
      expect(screen.queryByText('Incoming Voice Call')).toBeNull();
    });

    it("leadingView replaces the caller's avatar", () => {
      covers('CometChatIncomingCall.leadingView', 'custom');
      const leadingView = vi.fn(() => <span>AL</span>);
      const { container } = render(<CometChatIncomingCall leadingView={leadingView} />);
      const call = ring();
      expect(leadingView).toHaveBeenCalledWith(call);
      expect(container.querySelector('.cometchat-incoming-call__avatar')).toHaveTextContent('AL');
      expect(container.querySelector('.cometchat-avatar')).toBeNull();
      expect(container.querySelector('.cometchat-incoming-call__title')).toHaveTextContent('Alice');
    });

    it("titleView replaces the caller's name", () => {
      covers('CometChatIncomingCall.titleView', 'custom');
      const titleView = vi.fn(() => <strong>Alice (work)</strong>);
      const { container } = render(<CometChatIncomingCall titleView={titleView} />);
      const call = ring();
      expect(titleView).toHaveBeenCalledWith(call);
      expect(within(card()).getByText('Alice (work)')).toBeInTheDocument();
      expect(container.querySelector('.cometchat-incoming-call__title')).toBeNull();
      expect(screen.getByText('Incoming Voice Call')).toBeInTheDocument();
    });

    it('subtitleView replaces the call type line', () => {
      covers('CometChatIncomingCall.subtitleView', 'custom');
      const subtitleView = vi.fn((call: CometChat.Call) => <em>{call.getType()} call, tap to answer</em>);
      const { container } = render(<CometChatIncomingCall subtitleView={subtitleView} />);
      const call = ring();
      expect(subtitleView).toHaveBeenCalledWith(call);
      expect(within(card()).getByText('audio call, tap to answer')).toBeInTheDocument();
      expect(container.querySelector('.cometchat-incoming-call__subtitle')).toBeNull();
      expect(screen.queryByText('Incoming Voice Call')).toBeNull();
    });

    it('trailingView fills the trailing section of the card', () => {
      covers('CometChatIncomingCall.trailingView', 'custom');
      const trailingView = vi.fn(() => <span>HD</span>);
      const { container } = render(<CometChatIncomingCall trailingView={trailingView} />);
      const call = ring();
      expect(trailingView).toHaveBeenCalledWith(call);
      expect(container.querySelector('.cometchat-incoming-call__trailing')).toHaveTextContent('HD');
      expect(container.querySelector('.cometchat-incoming-call__title')).toHaveTextContent('Alice');
    });
  });

  it('className is added to the card; by default the card has only its own class', () => {
    covers('CometChatIncomingCall.className', 'set', 'default');
    const { unmount } = render(<CometChatIncomingCall className="call-toast" />);
    ring();
    expect(card()).toHaveClass('cometchat-incoming-call', 'call-toast');
    unmount();

    render(<CometChatIncomingCall />);
    ring();
    expect(card().getAttribute('class')).toBe('cometchat-incoming-call');
  });
});
