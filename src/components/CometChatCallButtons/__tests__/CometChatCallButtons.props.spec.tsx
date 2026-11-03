/**
 * The public props of <CometChatCallButtons />, one case each: the prop is set (or left out) on the
 * real component and the test checks what it changes. Only the SDKs are mocked: the Chat SDK's call
 * listener and call calls, and the optional Calls SDK where the kit holds it once loaded (as the other
 * call specs do). The real outgoing and ongoing call screens run.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCallButtons } from '../CometChatCallButtons';
import { GlobalConfigProvider } from '../../../context/GlobalConfigContext';
import { buildGroup, buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

interface CallHandlers {
  onOutgoingCallAccepted: (call: CometChat.Call) => void;
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
    initiateCall: vi.fn(),
    rejectCall: vi.fn(),
    clearActiveCall: vi.fn(),
    endCall: vi.fn(),
    sendCustomMessage: vi.fn(),
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

// The real SDK's constants and models (Call, CustomMessage), with the calls the buttons make mocked.
vi.mock('@cometchat/chat-sdk-javascript', async () => {
  const { CometChat } = await vi.importActual<typeof import('@cometchat/chat-sdk-javascript')>('@cometchat/chat-sdk-javascript');
  return {
    CometChat: Object.assign({}, CometChat, {
      CallListener: vi.fn((callbacks: unknown) => callbacks),
      addCallListener: sdk.addCallListener,
      removeCallListener: sdk.removeCallListener,
      initiateCall: sdk.initiateCall,
      rejectCall: sdk.rejectCall,
      clearActiveCall: sdk.clearActiveCall,
      endCall: sdk.endCall,
      sendCustomMessage: sdk.sendCustomMessage,
      getLoggedinUser: sdk.getLoggedinUser,
    }),
  };
});

// The optional Calls SDK, as the kit holds it once loaded.
vi.mock('../../../CometChatUIKit/CometChatCalls', () => ({ CometChatUIKitCalls: calls }));

const me = { getUid: () => 'me', getName: () => 'Me', getAuthToken: () => 'auth-token' };
const bob = buildUser({ uid: 'bob', name: 'Bob' }) as unknown as CometChat.User;
const design = buildGroup({ guid: 'design', name: 'Design' }) as unknown as CometChat.Group;

/** The call CometChat.initiateCall returns for a call to Bob. */
function placed(type: 'audio' | 'video') {
  return {
    getSessionId: () => 'session-1',
    getType: () => type,
    getReceiver: () => bob,
    getReceiverType: () => 'user',
    getSender: () => me,
  } as unknown as CometChat.Call;
}

const voice = () => screen.getByRole('button', { name: 'Voice call' });
const video = () => screen.getByRole('button', { name: 'Video call' });
const ongoingCall = () => screen.queryByRole('dialog', { name: 'Ongoing call' });
const outgoingCall = () => screen.queryByRole('dialog', { name: 'Outgoing call' });

/** Bob picks up: the SDK's call listener reports the call accepted. */
function bobAnswers() {
  const [listener] = [...sdk.callListeners.values()] as CallHandlers[];
  if (sdk.callListeners.size !== 1 || !listener) {
    throw new Error(`expected one call listener, found ${String(sdk.callListeners.size)}`);
  }
  act(() => {
    listener.onOutgoingCallAccepted({ getSessionId: () => 'session-1', getSender: () => bob } as unknown as CometChat.Call);
  });
}

/** Waits until the ongoing call has joined its session; returns joinSession's arguments. */
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

/** Lets pending SDK promises settle. */
const settle = () => act(() => Promise.resolve());

/** Renders, and lets the logged-in user resolve (the buttons re-render when it does). */
async function renderSettled(ui: React.ReactElement) {
  const view = render(ui);
  await settle();
  return view;
}

beforeEach(() => {
  sdk.callListeners.clear();
  sdk.addCallListener.mockClear();
  sdk.initiateCall.mockReset().mockResolvedValue(placed('audio'));
  sdk.rejectCall.mockReset().mockResolvedValue({});
  sdk.clearActiveCall.mockClear();
  sdk.endCall.mockReset().mockResolvedValue({});
  sdk.sendCustomMessage.mockReset().mockImplementation((message: unknown) => Promise.resolve(message));
  sdk.getLoggedinUser.mockReset().mockResolvedValue(me);
  calls.generateToken.mockReset().mockResolvedValue({ token: 'call-token' });
  calls.joinSession.mockClear();
  calls.leaveSession.mockClear();
  calls.listeners.clear();
});

describe('CometChatCallButtons props', () => {
  describe('who is called', () => {
    it('user: a click calls that user, and the outgoing call screen shows them', async () => {
      covers('CometChatCallButtons.user', 'set');
      covers('CometChatCallButtons.group', 'default');
      sdk.initiateCall.mockResolvedValue(placed('video'));
      render(<CometChatCallButtons user={bob} />);
      fireEvent.click(video());

      const outgoing = await screen.findByRole('dialog', { name: 'Outgoing call' });
      expect(within(outgoing).getByText('Bob')).toBeInTheDocument();
      expect(sdk.initiateCall).toHaveBeenCalledTimes(1);
      const [call] = sdk.initiateCall.mock.calls[0] as [CometChat.Call];
      expect(call.getReceiverId()).toBe('bob');
      expect(call.getReceiverType()).toBe('user');
      expect(call.getType()).toBe('video');
      expect(sdk.sendCustomMessage).not.toHaveBeenCalled();
      expect(voice()).toBeDisabled();
    });

    it("group: a click posts a meeting message to the group and joins the group's session", async () => {
      covers('CometChatCallButtons.group', 'set');
      covers('CometChatCallButtons.user', 'default');
      render(<CometChatCallButtons group={design} />);
      fireEvent.click(voice());

      const [, , frame] = await joined();
      expect(frame).toBe(ongoingCall());
      expect(calls.generateToken).toHaveBeenCalledWith('design', 'auth-token');
      expect(sdk.sendCustomMessage).toHaveBeenCalledTimes(1);
      const [message] = sdk.sendCustomMessage.mock.calls[0] as [CometChat.CustomMessage];
      expect(message.getReceiverId()).toBe('design');
      expect(message.getReceiverType()).toBe('group');
      expect(message.getType()).toBe('meeting');
      expect(message.getCustomData()).toEqual({ sessionID: 'design', sessionId: 'design', callType: 'audio' });
      expect(sdk.initiateCall).not.toHaveBeenCalled();
      expect(outgoingCall()).toBeNull();
    });

    it('with neither a user nor a group, the buttons call no one', async () => {
      covers('CometChatCallButtons.user', 'default');
      covers('CometChatCallButtons.group', 'default');
      await renderSettled(<CometChatCallButtons />);
      fireEvent.click(voice());
      fireEvent.click(video());
      await settle();
      expect(sdk.addCallListener).not.toHaveBeenCalled();
      expect(sdk.initiateCall).not.toHaveBeenCalled();
      expect(sdk.sendCustomMessage).not.toHaveBeenCalled();
      expect(outgoingCall()).toBeNull();
      expect(ongoingCall()).toBeNull();
    });
  });

  describe('call settings', () => {
    it('callSettingsBuilder: the answered call joins with these settings', async () => {
      covers('CometChatCallButtons.callSettingsBuilder', 'set');
      const settings = { sessionType: 'VIDEO', layout: 'SPOTLIGHT', startVideoPaused: true };
      sdk.initiateCall.mockResolvedValue(placed('video'));
      render(<CometChatCallButtons user={bob} callSettingsBuilder={settings} />);
      fireEvent.click(video());
      await screen.findByRole('dialog', { name: 'Outgoing call' });

      bobAnswers();
      const [token, joinedWith, frame] = await joined();
      expect(token).toBe('call-token');
      expect(joinedWith).toBe(settings);
      expect(frame).toBe(ongoingCall());
      expect(calls.generateToken).toHaveBeenCalledWith('session-1', 'auth-token');
      expect(outgoingCall()).toBeNull();
    });

    it("without callSettingsBuilder, the call joins with the app's global settings, else the defaults", async () => {
      covers('CometChatCallButtons.callSettingsBuilder', 'default');
      const view = render(<CometChatCallButtons group={design} />);
      fireEvent.click(voice());
      expect((await joined())[1]).toEqual(defaults('VOICE'));
      view.unmount();

      calls.joinSession.mockClear();
      const global = { sessionType: 'VOICE', layout: 'TILE' };
      render(
        <GlobalConfigProvider config={{ callSettingsBuilder: global }}>
          <CometChatCallButtons group={design} />
        </GlobalConfigProvider>
      );
      fireEvent.click(voice());
      expect((await joined())[1]).toBe(global);
    });
  });

  describe('callbacks', () => {
    it('onVoiceCallClick gets the user or group instead of a call being placed', async () => {
      covers('CometChatCallButtons.onVoiceCallClick', 'called');
      const onVoiceCallClick = vi.fn();
      const { rerender } = await renderSettled(<CometChatCallButtons user={bob} onVoiceCallClick={onVoiceCallClick} />);
      fireEvent.click(voice());
      expect(onVoiceCallClick).toHaveBeenCalledTimes(1);
      expect(onVoiceCallClick).toHaveBeenCalledWith(bob);

      rerender(<CometChatCallButtons group={design} onVoiceCallClick={onVoiceCallClick} />);
      fireEvent.click(voice());
      expect(onVoiceCallClick).toHaveBeenLastCalledWith(design);
      await settle();
      expect(sdk.initiateCall).not.toHaveBeenCalled();
      expect(sdk.sendCustomMessage).not.toHaveBeenCalled();
    });

    it('onVideoCallClick gets the user or group instead of a call being placed', async () => {
      covers('CometChatCallButtons.onVideoCallClick', 'called');
      const onVideoCallClick = vi.fn();
      const { rerender } = await renderSettled(<CometChatCallButtons user={bob} onVideoCallClick={onVideoCallClick} />);
      fireEvent.click(video());
      expect(onVideoCallClick).toHaveBeenCalledTimes(1);
      expect(onVideoCallClick).toHaveBeenCalledWith(bob);

      rerender(<CometChatCallButtons group={design} onVideoCallClick={onVideoCallClick} />);
      fireEvent.click(video());
      expect(onVideoCallClick).toHaveBeenLastCalledWith(design);
      await settle();
      expect(sdk.initiateCall).not.toHaveBeenCalled();
      expect(sdk.sendCustomMessage).not.toHaveBeenCalled();
    });

    it('onCallEnded fires when the call ends, and the buttons are ready for the next call', async () => {
      covers('CometChatCallButtons.onCallEnded', 'called');
      const onCallEnded = vi.fn();
      render(<CometChatCallButtons group={design} onCallEnded={onCallEnded} />);
      fireEvent.click(voice());
      await joined();
      expect(voice()).toBeDisabled();
      expect(onCallEnded).not.toHaveBeenCalled();

      const left = calls.listeners.get('onSessionLeft');
      if (!left) throw new Error('the call screen registered no onSessionLeft listener');
      act(() => {
        left();
      });
      expect(onCallEnded).toHaveBeenCalledTimes(1);
      expect(onCallEnded).toHaveBeenCalledWith();
      expect(ongoingCall()).toBeNull();
      expect(voice()).toBeEnabled();
    });

    it("onError gets the error when a call can't be placed", async () => {
      covers('CometChatCallButtons.onError', 'called');
      const onError = vi.fn();
      const busy = { code: 'ERR_BUSY', message: 'Bob is on another call' };
      sdk.initiateCall.mockRejectedValue(busy);
      const view = render(<CometChatCallButtons user={bob} onError={onError} />);
      fireEvent.click(video());
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(busy);
      });
      expect(outgoingCall()).toBeNull();
      view.unmount();

      const notSent = { code: 'ERR_NOT_A_MEMBER', message: 'not a member' };
      sdk.sendCustomMessage.mockRejectedValue(notSent);
      render(<CometChatCallButtons group={design} onError={onError} />);
      fireEvent.click(video());
      await waitFor(() => {
        expect(onError).toHaveBeenLastCalledWith(notSent);
      });
    });
  });

  describe('buttons', () => {
    it('hideVoiceCallButton removes the voice button; it is shown by default', async () => {
      covers('CometChatCallButtons.hideVoiceCallButton', 'true', 'false', 'default');
      const { unmount } = await renderSettled(<CometChatCallButtons user={bob} hideVoiceCallButton />);
      expect(screen.queryByRole('button', { name: 'Voice call' })).toBeNull();
      expect(video()).toBeInTheDocument();
      unmount();

      for (const props of [{ hideVoiceCallButton: false }, {}]) {
        const view = await renderSettled(<CometChatCallButtons user={bob} {...props} />);
        expect(voice()).toBeEnabled();
        expect(video()).toBeEnabled();
        view.unmount();
      }
    });

    it('hideVideoCallButton removes the video button; it is shown by default', async () => {
      covers('CometChatCallButtons.hideVideoCallButton', 'true', 'false', 'default');
      const { unmount } = await renderSettled(<CometChatCallButtons user={bob} hideVideoCallButton />);
      expect(screen.queryByRole('button', { name: 'Video call' })).toBeNull();
      expect(voice()).toBeInTheDocument();
      unmount();

      for (const props of [{ hideVideoCallButton: false }, {}]) {
        const view = await renderSettled(<CometChatCallButtons user={bob} {...props} />);
        expect(video()).toBeEnabled();
        expect(voice()).toBeEnabled();
        view.unmount();
      }
    });

    it('voiceCallButtonView replaces the voice button', async () => {
      covers('CometChatCallButtons.voiceCallButtonView', 'custom');
      await renderSettled(<CometChatCallButtons user={bob} voiceCallButtonView={<button type="button">Ring Bob</button>} />);
      expect(screen.getByRole('button', { name: 'Ring Bob' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Voice call' })).toBeNull();
      expect(video()).toBeInTheDocument();
    });

    it('videoCallButtonView replaces the video button', async () => {
      covers('CometChatCallButtons.videoCallButtonView', 'custom');
      await renderSettled(
        <CometChatCallButtons user={bob} videoCallButtonView={<button type="button">Face-time Bob</button>} />
      );
      expect(screen.getByRole('button', { name: 'Face-time Bob' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Video call' })).toBeNull();
      expect(voice()).toBeInTheDocument();
    });

    it('className is added to the buttons container; by default it has only its own class', async () => {
      covers('CometChatCallButtons.className', 'set', 'default');
      const { container, unmount } = await renderSettled(<CometChatCallButtons user={bob} className="header-calls" />);
      expect(container.firstElementChild).toHaveClass('cometchat-call-buttons', 'header-calls');
      unmount();

      const view = await renderSettled(<CometChatCallButtons user={bob} />);
      expect(view.container.firstElementChild?.getAttribute('class')).toBe('cometchat-call-buttons');
    });
  });
});
