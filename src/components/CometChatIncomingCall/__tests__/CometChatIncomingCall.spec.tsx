/* eslint-disable @typescript-eslint/unbound-method */
/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { CometChatIncomingCall } from '../CometChatIncomingCall';
import { CometChat } from '@cometchat/chat-sdk-javascript';

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    addCallListener: vi.fn(),
    removeCallListener: vi.fn(),
    acceptCall: vi.fn(),
    rejectCall: vi.fn(),
    clearActiveCall: vi.fn(),
    CALL_STATUS: {
      REJECTED: 'rejected',
      CANCELLED: 'cancelled',
    },
    CallListener: vi.fn().mockImplementation((cb: unknown) => cb),
  },
}));

// The component reads the logged-in user synchronously via CometChatUIKit.
vi.mock('../../../CometChatUIKit/CometChatUIKit', () => ({
  CometChatUIKit: {
    getLoggedInUser: vi.fn(() => ({ getUid: () => 'me-uid' })),
  },
}));

vi.mock('../../base/CometChatAvatar/CometChatAvatar', () => ({
  CometChatAvatar: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="avatar-root">{children}</div>
    ),
    Image: () => <div data-testid="avatar-image" />,
    Initials: () => <div data-testid="avatar-initials" />,
  },
}));

vi.mock('../../CometChatOngoingCall/CometChatOngoingCall', () => ({
  CometChatOngoingCall: (props: { sessionID: string; onCallEnded?: () => void }) => (
    <div data-testid="ongoing-call" data-session-id={props.sessionID}>
      <button onClick={props.onCallEnded}>End Call</button>
    </div>
  ),
}));

vi.mock('../../../resources/CometChatSoundManager/CometChatSoundManager', () => ({
  CometChatSoundManager: {
    onIncomingCall: vi.fn(),
    pause: vi.fn(),
  },
}));

vi.mock('../../../hooks/usePublishEvent', () => ({
  usePublishEvent: () => vi.fn(),
}));

vi.mock('../../../context/GlobalConfigContext', () => ({
  useGlobalConfig: () => ({
    disableSoundForCalls: false,
    customSoundForCalls: undefined,
  }),
}));

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => {
      const map: Record<string, string> = {
        accessibility_incoming_call_from: '{type} call from {name}',
        incoming_call_confirm_no: 'Decline',
        incoming_call_confirm_yes: 'Accept',
      };
      return map[key] ?? key;
    },
  }),
}));

// Helper to build a mock call object
function buildMockCall(
  overrides: {
    sessionId?: string;
    senderName?: string;
    senderAvatar?: string;
    type?: string;
    initiatorUid?: string;
  } = {}
) {
  return {
    getSessionId: () => overrides.sessionId ?? 'session-123',
    // Default sender is someone else ('alice'), not the logged-in user ('me-uid').
    getSender: () => ({
      getUid: () => overrides.initiatorUid ?? 'alice',
      getName: () => overrides.senderName ?? 'Alice',
      getAvatar: () => overrides.senderAvatar ?? 'https://example.com/avatar.png',
    }),
    getType: () => overrides.type ?? 'audio',
    getReceiver: () => ({
      getName: () => 'Me',
      getAvatar: () => '',
    }),
  } as unknown as CometChat.Call;
}

/** Helper to simulate an incoming call via the SDK listener */
function simulateIncomingCall(call?: CometChat.Call) {
  const listenerCallbacks = vi.mocked(CometChat.addCallListener).mock.calls[0]?.[1] as {
    onIncomingCallReceived: (call: CometChat.Call) => void;
    onIncomingCallCancelled: () => void;
    onOutgoingCallAccepted: (call: CometChat.Call) => void;
    onOutgoingCallRejected: () => void;
  };
  act(() => {
    listenerCallbacks.onIncomingCallReceived(call ?? buildMockCall());
  });
  return listenerCallbacks;
}

describe('CometChatIncomingCall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Rendering ──────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders nothing when there is no incoming call', () => {
      const { container } = render(<CometChatIncomingCall />);
      expect(container.firstChild).toBeNull();
    });

    it('renders the incoming call card when a call is received', () => {
      render(<CometChatIncomingCall />);
      simulateIncomingCall(buildMockCall({ senderName: 'Bob' }));

      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Incoming Voice Call')).toBeInTheDocument();
      expect(screen.getByText('Accept')).toBeInTheDocument();
      expect(screen.getByText('Decline')).toBeInTheDocument();
    });

    it('renders video call subtitle for video calls', () => {
      render(<CometChatIncomingCall />);
      simulateIncomingCall(buildMockCall({ type: 'video' }));

      expect(screen.getByText('Incoming Video Call')).toBeInTheDocument();
    });

    it('does NOT render when the call is initiated by the logged-in user', () => {
      const { container } = render(<CometChatIncomingCall />);
      // Self-initiated call (sender === logged-in user 'me-uid') must be ignored.
      simulateIncomingCall(buildMockCall({ initiatorUid: 'me-uid' }));

      expect(container.firstChild).toBeNull();
      expect(screen.queryByText('Accept')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<CometChatIncomingCall className="custom-class" />);
      simulateIncomingCall();

      const root = screen.getByRole('alertdialog');
      expect(root.className).toContain('custom-class');
    });
  });

  // ─── Accessibility ──────────────────────────────────────────────

  describe('accessibility', () => {
    it('has role="alertdialog" with aria-label', () => {
      render(<CometChatIncomingCall />);
      simulateIncomingCall(buildMockCall({ senderName: 'Alice' }));

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAttribute('aria-label', 'Voice call from Alice');
    });

    it('accept button has aria-label', () => {
      render(<CometChatIncomingCall />);
      simulateIncomingCall();

      const acceptBtn = screen.getByText('Accept');
      expect(acceptBtn).toHaveAttribute('aria-label', 'Accept');
    });

    it('decline button has aria-label', () => {
      render(<CometChatIncomingCall />);
      simulateIncomingCall();

      const declineBtn = screen.getByText('Decline');
      expect(declineBtn).toHaveAttribute('aria-label', 'Decline');
    });
  });

  // ─── SDK Listener ───────────────────────────────────────────────

  describe('SDK listener', () => {
    it('attaches a call listener on mount', () => {
      render(<CometChatIncomingCall />);
      expect(vi.mocked(CometChat.addCallListener)).toHaveBeenCalled();
    });

    it('removes the call listener on unmount', () => {
      const { unmount } = render(<CometChatIncomingCall />);
      unmount();
      expect(vi.mocked(CometChat.removeCallListener)).toHaveBeenCalled();
    });

    it('clears incoming call when onIncomingCallCancelled fires', () => {
      render(<CometChatIncomingCall />);
      const callbacks = simulateIncomingCall();

      expect(screen.getByText('Accept')).toBeInTheDocument();

      act(() => {
        callbacks.onIncomingCallCancelled();
      });

      expect(screen.queryByText('Accept')).not.toBeInTheDocument();
    });
  });

  // ─── Accept call ───────────────────────────────────────────────

  describe('accept call', () => {
    it('calls CometChat.acceptCall on accept button click', async () => {
      vi.mocked(CometChat.acceptCall).mockResolvedValue({
        getSessionId: () => 'session-123',
      } as unknown as CometChat.Call);

      render(<CometChatIncomingCall />);
      simulateIncomingCall();

      fireEvent.click(screen.getByText('Accept'));

      await waitFor(() => {
        expect(vi.mocked(CometChat.acceptCall)).toHaveBeenCalledWith('session-123');
      });
    });

    it('shows ongoing call screen after accepting', async () => {
      vi.mocked(CometChat.acceptCall).mockResolvedValue({
        getSessionId: () => 'session-123',
      } as unknown as CometChat.Call);

      render(<CometChatIncomingCall />);
      simulateIncomingCall();

      fireEvent.click(screen.getByText('Accept'));

      await waitFor(() => {
        expect(screen.getByTestId('ongoing-call')).toBeInTheDocument();
      });
    });

    it('calls custom onAccept handler when provided', () => {
      const onAccept = vi.fn();
      render(<CometChatIncomingCall onAccept={onAccept} />);
      const mockCall = buildMockCall();
      simulateIncomingCall(mockCall);

      fireEvent.click(screen.getByText('Accept'));

      expect(onAccept).toHaveBeenCalledWith(mockCall);
      expect(vi.mocked(CometChat.acceptCall)).not.toHaveBeenCalled();
    });

    it('calls onError when acceptCall fails', async () => {
      const onError = vi.fn();
      const error = new Error('Accept failed');
      vi.mocked(CometChat.acceptCall).mockRejectedValue(error);

      render(<CometChatIncomingCall onError={onError} />);
      simulateIncomingCall();

      fireEvent.click(screen.getByText('Accept'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });
  });

  // ─── Decline call ──────────────────────────────────────────────

  describe('decline call', () => {
    it('calls CometChat.rejectCall on decline button click', async () => {
      vi.mocked(CometChat.rejectCall).mockResolvedValue({} as unknown as CometChat.Call);

      render(<CometChatIncomingCall />);
      simulateIncomingCall();

      fireEvent.click(screen.getByText('Decline'));

      await waitFor(() => {
        expect(vi.mocked(CometChat.rejectCall)).toHaveBeenCalledWith('session-123', 'rejected');
      });
    });

    it('hides the incoming call card after declining', async () => {
      vi.mocked(CometChat.rejectCall).mockResolvedValue({} as unknown as CometChat.Call);

      render(<CometChatIncomingCall />);
      simulateIncomingCall();

      fireEvent.click(screen.getByText('Decline'));

      await waitFor(() => {
        expect(screen.queryByText('Accept')).not.toBeInTheDocument();
      });
    });

    it('calls custom onDecline handler when provided', () => {
      const onDecline = vi.fn();
      render(<CometChatIncomingCall onDecline={onDecline} />);
      const mockCall = buildMockCall();
      simulateIncomingCall(mockCall);

      fireEvent.click(screen.getByText('Decline'));

      expect(onDecline).toHaveBeenCalledWith(mockCall);
      expect(vi.mocked(CometChat.rejectCall)).not.toHaveBeenCalled();
    });
  });

  // ─── Custom views ──────────────────────────────────────────────

  describe('custom views', () => {
    it('renders custom itemView when provided', () => {
      const itemView = () => <div data-testid="custom-item">Custom Item</div>;
      render(<CometChatIncomingCall itemView={itemView} />);
      simulateIncomingCall();

      expect(screen.getByTestId('custom-item')).toBeInTheDocument();
    });

    it('renders custom leadingView when provided', () => {
      const leadingView = () => <div data-testid="custom-leading">Custom Avatar</div>;
      render(<CometChatIncomingCall leadingView={leadingView} />);
      simulateIncomingCall();

      expect(screen.getByTestId('custom-leading')).toBeInTheDocument();
    });

    it('renders custom titleView when provided', () => {
      const titleView = () => <div data-testid="custom-title">Custom Title</div>;
      render(<CometChatIncomingCall titleView={titleView} />);
      simulateIncomingCall();

      expect(screen.getByTestId('custom-title')).toBeInTheDocument();
    });

    it('renders custom subtitleView when provided', () => {
      const subtitleView = () => <div data-testid="custom-subtitle">Custom Subtitle</div>;
      render(<CometChatIncomingCall subtitleView={subtitleView} />);
      simulateIncomingCall();

      expect(screen.getByTestId('custom-subtitle')).toBeInTheDocument();
    });

    it('renders custom trailingView when provided', () => {
      const trailingView = () => <div data-testid="custom-trailing">Custom Trailing</div>;
      render(<CometChatIncomingCall trailingView={trailingView} />);
      simulateIncomingCall();

      expect(screen.getByTestId('custom-trailing')).toBeInTheDocument();
    });
  });

  // ─── onCallEnded ───────────────────────────────────────────────

  describe('onCallEnded', () => {
    it('calls onCallEnded callback when ongoing call ends', async () => {
      const onCallEnded = vi.fn();
      vi.mocked(CometChat.acceptCall).mockResolvedValue({
        getSessionId: () => 'session-123',
      } as unknown as CometChat.Call);

      render(<CometChatIncomingCall onCallEnded={onCallEnded} />);
      simulateIncomingCall();

      fireEvent.click(screen.getByText('Accept'));

      await waitFor(() => {
        expect(screen.getByTestId('ongoing-call')).toBeInTheDocument();
      });

      // Simulate call ended from ongoing call component
      fireEvent.click(screen.getByText('End Call'));

      expect(onCallEnded).toHaveBeenCalled();
    });
  });

  // ─── displayName ───────────────────────────────────────────────

  it('has correct displayName', () => {
    expect(CometChatIncomingCall.displayName).toBe('CometChatIncomingCall');
  });
});
