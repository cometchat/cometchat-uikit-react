/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CometChatOutgoingCall } from '../CometChatOutgoingCall';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
  },
}));

vi.mock('../../base/CometChatAvatar/CometChatAvatar', () => ({
  CometChatAvatar: {
    Root: ({ children, name }: { children: React.ReactNode; name: string }) => (
      <div data-testid="avatar-root" data-name={name}>
        {children}
      </div>
    ),
    Image: () => <div data-testid="avatar-image" />,
    Initials: () => <div data-testid="avatar-initials" />,
  },
}));

vi.mock('../../../resources/CometChatSoundManager/CometChatSoundManager', () => ({
  CometChatSoundManager: {
    onOutgoingCall: vi.fn(),
    pause: vi.fn(),
  },
}));

vi.mock('../../../constants/CometChatUIKitConstants', () => ({
  CometChatUIKitConstants: {
    MessageReceiverType: {
      user: 'user',
      group: 'group',
    },
  },
}));

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => {
      const map: Record<string, string> = {
        accessibility_outgoing_call: 'Outgoing call',
        calls_outgoing_call: 'Calling...',
        outgoing_call_end: 'End call',
      };
      return map[key] ?? key;
    },
  }),
}));

// Helper to build a mock call object
function buildMockCall(
  overrides: {
    receiverName?: string;
    receiverAvatar?: string;
    receiverType?: string;
    type?: string;
  } = {}
) {
  const receiverType = overrides.receiverType ?? 'user';
  return {
    getReceiver: () => ({
      getName: () => overrides.receiverName ?? 'Bob',
      getAvatar: () => overrides.receiverAvatar ?? 'https://example.com/bob.png',
      getIcon: () => 'https://example.com/group-icon.png',
    }),
    getReceiverType: () => receiverType,
    getType: () => overrides.type ?? 'audio',
    getSessionId: () => 'session-456',
  } as unknown as CometChat.Call;
}

describe('CometChatOutgoingCall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Rendering ──────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the receiver name', () => {
      render(<CometChatOutgoingCall call={buildMockCall({ receiverName: 'Charlie' })} />);
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('renders "Calling..." subtitle', () => {
      render(<CometChatOutgoingCall call={buildMockCall()} />);
      expect(screen.getByText('Calling...')).toBeInTheDocument();
    });

    it('renders the avatar with receiver name', () => {
      render(<CometChatOutgoingCall call={buildMockCall({ receiverName: 'Dave' })} />);
      expect(screen.getByTestId('avatar-root')).toHaveAttribute('data-name', 'Dave');
    });

    it('renders the cancel button', () => {
      render(<CometChatOutgoingCall call={buildMockCall()} />);
      expect(screen.getByRole('button', { name: 'End call' })).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<CometChatOutgoingCall call={buildMockCall()} className="my-custom" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog.className).toContain('my-custom');
    });
  });

  // ─── Accessibility ──────────────────────────────────────────────

  describe('accessibility', () => {
    it('has role="dialog" with aria-label', () => {
      render(<CometChatOutgoingCall call={buildMockCall()} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'Outgoing call');
    });

    it('cancel button has aria-label', () => {
      render(<CometChatOutgoingCall call={buildMockCall()} />);
      const btn = screen.getByRole('button', { name: 'End call' });
      expect(btn).toBeInTheDocument();
    });
  });

  // ─── Sound management ──────────────────────────────────────────

  describe('sound management', () => {
    it('plays outgoing call sound on mount', async () => {
      const { CometChatSoundManager } =
        await import('../../../resources/CometChatSoundManager/CometChatSoundManager');

      render(<CometChatOutgoingCall call={buildMockCall()} />);

      vi.runAllTimers();

      expect(CometChatSoundManager.onOutgoingCall).toHaveBeenCalled();
    });

    it('does not play sound when disableSoundForCalls is true', async () => {
      const { CometChatSoundManager } =
        await import('../../../resources/CometChatSoundManager/CometChatSoundManager');

      render(<CometChatOutgoingCall call={buildMockCall()} disableSoundForCalls={true} />);

      vi.runAllTimers();

      expect(CometChatSoundManager.onOutgoingCall).not.toHaveBeenCalled();
    });

    it('passes custom sound URL to sound manager', async () => {
      const { CometChatSoundManager } =
        await import('../../../resources/CometChatSoundManager/CometChatSoundManager');

      render(
        <CometChatOutgoingCall
          call={buildMockCall()}
          customSoundForCalls="https://example.com/ring.mp3"
        />
      );

      vi.runAllTimers();

      expect(CometChatSoundManager.onOutgoingCall).toHaveBeenCalledWith(
        'https://example.com/ring.mp3'
      );
    });

    it('pauses sound on unmount', async () => {
      const { CometChatSoundManager } =
        await import('../../../resources/CometChatSoundManager/CometChatSoundManager');

      const { unmount } = render(<CometChatOutgoingCall call={buildMockCall()} />);
      vi.runAllTimers();

      unmount();

      expect(CometChatSoundManager.pause).toHaveBeenCalled();
    });
  });

  // ─── Cancel handler ────────────────────────────────────────────

  describe('cancel handler', () => {
    it('calls onCallCanceled when cancel button is clicked', async () => {
      const { CometChatSoundManager } =
        await import('../../../resources/CometChatSoundManager/CometChatSoundManager');
      const onCallCanceled = vi.fn();

      render(<CometChatOutgoingCall call={buildMockCall()} onCallCanceled={onCallCanceled} />);

      fireEvent.click(screen.getByRole('button', { name: 'End call' }));

      expect(CometChatSoundManager.pause).toHaveBeenCalled();
      expect(onCallCanceled).toHaveBeenCalled();
    });

    it('pauses sound when cancel is clicked even without callback', async () => {
      const { CometChatSoundManager } =
        await import('../../../resources/CometChatSoundManager/CometChatSoundManager');

      render(<CometChatOutgoingCall call={buildMockCall()} />);

      fireEvent.click(screen.getByRole('button', { name: 'End call' }));

      expect(CometChatSoundManager.pause).toHaveBeenCalled();
    });
  });

  // ─── Custom views ──────────────────────────────────────────────

  describe('custom views', () => {
    it('renders custom titleView when provided', () => {
      render(
        <CometChatOutgoingCall
          call={buildMockCall()}
          titleView={<div data-testid="custom-title">Custom Title</div>}
        />
      );
      expect(screen.getByTestId('custom-title')).toBeInTheDocument();
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    it('renders custom subtitleView when provided', () => {
      render(
        <CometChatOutgoingCall
          call={buildMockCall()}
          subtitleView={<div data-testid="custom-subtitle">Ringing...</div>}
        />
      );
      expect(screen.getByTestId('custom-subtitle')).toBeInTheDocument();
      expect(screen.queryByText('Calling...')).not.toBeInTheDocument();
    });

    it('renders custom avatarView when provided', () => {
      render(
        <CometChatOutgoingCall
          call={buildMockCall()}
          avatarView={<div data-testid="custom-avatar">Custom Avatar</div>}
        />
      );
      expect(screen.getByTestId('custom-avatar')).toBeInTheDocument();
      expect(screen.queryByTestId('avatar-root')).not.toBeInTheDocument();
    });

    it('renders custom cancelButtonView when provided', () => {
      render(
        <CometChatOutgoingCall
          call={buildMockCall()}
          cancelButtonView={<button data-testid="custom-cancel">Cancel</button>}
        />
      );
      expect(screen.getByTestId('custom-cancel')).toBeInTheDocument();
    });
  });

  // ─── displayName ───────────────────────────────────────────────

  it('has correct displayName', () => {
    expect(CometChatOutgoingCall.displayName).toBe('CometChatOutgoingCall');
  });
});
