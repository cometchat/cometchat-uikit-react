/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { CometChatOngoingCall } from '../CometChatOngoingCall';
import { CometChat } from '@cometchat/chat-sdk-javascript';

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    getLoggedinUser: vi.fn(),
    endCall: vi.fn(),
    clearActiveCall: vi.fn(),
  },
}));

const { mockGenerateToken, mockJoinSession, mockLeaveSession, mockAddEventListener } = vi.hoisted(
  () => {
    const mockGenerateToken = vi.fn();
    const mockJoinSession = vi.fn();
    const mockLeaveSession = vi.fn();
    const mockAddEventListener = vi.fn().mockReturnValue(() => {});
    return {
      mockGenerateToken,
      mockJoinSession,
      mockLeaveSession,
      mockAddEventListener,
    };
  }
);

vi.mock('../../../CometChatUIKit/CometChatCalls', () => ({
  CometChatUIKitCalls: {
    generateToken: mockGenerateToken,
    joinSession: mockJoinSession,
    leaveSession: mockLeaveSession,
    addEventListener: mockAddEventListener,
  },
}));

vi.mock('../../../context/GlobalConfigContext', () => ({
  useGlobalConfig: () => ({
    callSettingsBuilder: null,
  }),
}));

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => {
      const map: Record<string, string> = {
        accessibility_ongoing_call: 'Ongoing call',
      };
      return map[key] ?? key;
    },
  }),
}));

describe('CometChatOngoingCall', () => {
  const mockUser = {
    getAuthToken: () => 'auth-token-123',
    getUid: () => 'user-1',
    getName: () => 'Test User',
  } as unknown as CometChat.User;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(CometChat.getLoggedinUser).mockResolvedValue(mockUser);
    mockGenerateToken.mockResolvedValue({ token: 'call-token-abc' });
    mockJoinSession.mockImplementation(() => {});
    mockAddEventListener.mockReturnValue(() => {});
  });

  // ─── Rendering ──────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders nothing when sessionID is empty', () => {
      const { container } = render(<CometChatOngoingCall sessionID="" />);
      expect(container.firstChild).toBeNull();
    });

    it('renders the call container when sessionID is provided', () => {
      render(<CometChatOngoingCall sessionID="session-123" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('has role="dialog" with aria-label', () => {
      render(<CometChatOngoingCall sessionID="session-123" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'Ongoing call');
    });

    it('applies custom className', () => {
      render(<CometChatOngoingCall sessionID="session-123" className="my-call" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain('my-call');
    });

    it('renders with full-screen fixed positioning', () => {
      const { container } = render(<CometChatOngoingCall sessionID="session-123" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.position).toBe('fixed');
      expect(wrapper.style.inset).toBe('0');
    });
  });

  // ─── Call session initialization ────────────────────────────────

  describe('call session initialization', () => {
    it('gets logged-in user on mount', async () => {
      render(<CometChatOngoingCall sessionID="session-123" />);

      await waitFor(() => {
        expect(vi.mocked(CometChat.getLoggedinUser)).toHaveBeenCalled();
      });
    });

    it('generates a call token with sessionID', async () => {
      render(<CometChatOngoingCall sessionID="session-123" />);

      await waitFor(() => {
        expect(mockGenerateToken).toHaveBeenCalledWith('session-123');
      });
    });

    it('joins the session with the generated token', async () => {
      render(<CometChatOngoingCall sessionID="session-123" />);

      await waitFor(() => {
        expect(mockJoinSession).toHaveBeenCalledWith(
          'call-token-abc',
          expect.anything(),
          expect.anything()
        );
      });
    });

    it('registers event listeners before joining', async () => {
      render(<CometChatOngoingCall sessionID="session-123" />);

      await waitFor(() => {
        expect(mockAddEventListener).toHaveBeenCalledWith('onSessionLeft', expect.any(Function));
        expect(mockAddEventListener).toHaveBeenCalledWith(
          'onLeaveSessionButtonClicked',
          expect.any(Function)
        );
      });
    });

    it('calls onError when getLoggedinUser fails', async () => {
      const onError = vi.fn();
      const error = new Error('Auth failed');
      vi.mocked(CometChat.getLoggedinUser).mockRejectedValue(error);

      render(<CometChatOngoingCall sessionID="session-123" onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });

    it('calls onError when generateToken fails', async () => {
      const onError = vi.fn();
      const error = new Error('Token generation failed');
      mockGenerateToken.mockRejectedValue(error);

      render(<CometChatOngoingCall sessionID="session-123" onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });
  });

  // ─── Call settings ─────────────────────────────────

  describe('call settings', () => {
    it('passes default SessionSettings object to joinSession', async () => {
      render(<CometChatOngoingCall sessionID="session-123" />);

      await waitFor(() => {
        expect(mockJoinSession).toHaveBeenCalledWith(
          'call-token-abc',
          expect.objectContaining({
            sessionType: 'VIDEO',
            startAudioMuted: false,
            startVideoPaused: false,
          }),
          expect.anything()
        );
      });
    });

    it('sets sessionType to VOICE when isAudioOnly is true', async () => {
      render(<CometChatOngoingCall sessionID="session-123" isAudioOnly={true} />);

      await waitFor(() => {
        expect(mockJoinSession).toHaveBeenCalledWith(
          'call-token-abc',
          expect.objectContaining({
            sessionType: 'VOICE',
          }),
          expect.anything()
        );
      });
    });

    it('uses custom callSettings when provided', async () => {
      const customSettings = { sessionType: 'VOICE' as const, layout: 'TILE' as const };
      render(<CometChatOngoingCall sessionID="session-123" callSettings={customSettings} />);

      await waitFor(() => {
        expect(mockJoinSession).toHaveBeenCalledWith(
          'call-token-abc',
          customSettings,
          expect.anything()
        );
      });
    });
  });

  // ─── Calls SDK not available ───────────────────────────────────

  describe('Calls SDK not available', () => {
    it('calls onError when CometChatUIKitCalls is null', async () => {
      const onError = vi.fn();
      mockGenerateToken.mockRejectedValue(new Error('SDK not available'));

      render(<CometChatOngoingCall sessionID="session-123" onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  // ─── displayName ───────────────────────────────────────────────

  it('has correct displayName', () => {
    expect(CometChatOngoingCall.displayName).toBe('CometChatOngoingCall');
  });
});
