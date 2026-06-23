/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CometChatCallLogs } from '../CometChatCallLogs';
import { CometChat } from '@cometchat/chat-sdk-javascript';

// Mock the hook to control component state
const mockUseCometChatCallLogs = vi.fn();

vi.mock('../useCometChatCallLogs', () => ({
  useCometChatCallLogs: (...args: unknown[]) => mockUseCometChatCallLogs(...args),
}));

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    CALL_TYPE: { VIDEO: 'video', AUDIO: 'audio' },
    CALL_STATUS: {
      CANCELLED: 'cancelled',
      REJECTED: 'rejected',
      ONGOING: 'ongoing',
      ENDED: 'ended',
      INITIATED: 'initiated',
      UNANSWERED: 'unanswered',
      BUSY: 'busy',
    },
    CALL_MODE: {
      DEFAULT: 'DEFAULT',
      GRID: 'GRID',
      SINGLE: 'SINGLE',
      SPOTLIGHT: 'SPOTLIGHT',
      TILE: 'TILE',
    },
    CATEGORY_MESSAGE: 'message',
    CATEGORY_CUSTOM: 'custom',
    CATEGORY_ACTION: 'action',
    CATEGORY_CALL: 'call',
    CATEGORY_INTERACTIVE: 'interactive',
    MessageCategory: { AGENTIC: 'agentic' },
    MESSAGE_TYPE: {
      TEXT: 'text',
      FILE: 'file',
      IMAGE: 'image',
      AUDIO: 'audio',
      VIDEO: 'video',
      ASSISTANT: 'assistant',
      TOOL_ARGUMENTS: 'tool_arguments',
      TOOL_RESULT: 'tool_result',
    },
    ACTION_TYPE: {
      MEMBER_JOINED: 'joined',
      MEMBER_LEFT: 'left',
      MEMBER_ADDED: 'added',
      MEMBER_BANNED: 'banned',
      MEMBER_UNBANNED: 'unbanned',
      MEMBER_KICKED: 'kicked',
      MEMBER_INVITED: 'invited',
      MEMBER_SCOPE_CHANGED: 'scopeChanged',
    },
    GROUP_MEMBER_SCOPE: { ADMIN: 'admin', PARTICIPANT: 'participant', MODERATOR: 'moderator' },
    GROUP_TYPE: { PRIVATE: 'private', PASSWORD: 'password', PUBLIC: 'public' },
    USER_STATUS: { ONLINE: 'online', OFFLINE: 'offline' },
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
    ModerationStatus: {
      PENDING: 'pending',
      APPROVED: 'approved',
      DISAPPROVED: 'disapproved',
      UNMODERATED: 'unmoderated',
    },
    GoalType: { ALL_OF: 'allOf', ANY_OF: 'anyOf', ANY_ACTION: 'anyAction', NONE: 'none' },
    AI_ASSISTANT_EVENTS: {
      RUN_STARTED: 'run_started',
      TEXT_MESSAGE_START: 'text_message_start',
      TEXT_MESSAGE_CONTENT: 'text_message_content',
      TEXT_MESSAGE_END: 'text_message_end',
      RUN_FINISHED: 'run_finished',
      TOOL_CALL_STARTED: 'tool_call_start',
      TOOL_CALL_ENDED: 'tool_call_end',
      TOOL_CALL_ARGUMENT: 'tool_call_args',
      TOOL_CALL_RESULT: 'tool_call_result',
    },
  },
}));

vi.mock('../../base/CometChatAvatar/CometChatAvatar', () => ({
  CometChatAvatar: Object.assign(
    ({ name }: { name: string }) => <div data-testid="avatar-root" data-name={name} />,
    {
      Root: ({ children, name }: { children: React.ReactNode; name: string }) => (
        <div data-testid="avatar-root" data-name={name}>
          {children}
        </div>
      ),
      Image: () => <div data-testid="avatar-image" />,
      Initials: () => <div data-testid="avatar-initials" />,
    }
  ),
}));

vi.mock('../../base/CometChatDate', () => ({
  CometChatDate: Object.assign(() => <span data-testid="date-text">Jan 1, 12:00 PM</span>, {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="date-root">{children}</div>
    ),
    Text: () => <span data-testid="date-text">Jan 1, 12:00 PM</span>,
  }),
}));

// CometChatCallButtons is rendered in the default trailing view and manages
// the entire call lifecycle (outgoing + ongoing) internally. Mock it to keep
// this suite focused on CometChatCallLogs.
vi.mock('../../CometChatCallButtons/CometChatCallButtons', () => ({
  CometChatCallButtons: (props: {
    hideVoiceCallButton?: boolean;
    hideVideoCallButton?: boolean;
  }) => (
    <div
      data-testid="call-buttons"
      data-hide-voice={String(props.hideVoiceCallButton)}
      data-hide-video={String(props.hideVideoCallButton)}
    />
  ),
}));

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => {
      const map: Record<string, string> = {
        call_logs_title: 'Call Logs',
        component_error_title: 'Something went wrong',
        accessibility_video_call: 'Video call',
        accessibility_voice_call: 'Voice call',
      };
      return map[key] ?? key;
    },
  }),
}));

// Helper to build a mock call log entry
function buildMockCallLog(
  overrides: {
    sessionId?: string;
    initiatorUid?: string;
    receiverUid?: string;
    receiverName?: string;
    type?: string;
    status?: string;
    initiatedAt?: number;
  } = {}
) {
  return {
    getSessionID: () => overrides.sessionId ?? 'session-1',
    getInitiator: () => ({
      getUid: () => overrides.initiatorUid ?? 'user-1',
      getName: () => 'Initiator',
      getAvatar: () => 'https://example.com/initiator.png',
    }),
    getReceiver: () => ({
      getUid: () => overrides.receiverUid ?? 'user-2',
      getName: () => overrides.receiverName ?? 'Receiver',
      getAvatar: () => 'https://example.com/receiver.png',
      getIcon: () => '',
    }),
    getType: () => overrides.type ?? 'audio',
    getStatus: () => overrides.status ?? 'ended',
    getInitiatedAt: () => overrides.initiatedAt ?? 1700000000,
    getCallInitiator: () => ({
      getUid: () => overrides.initiatorUid ?? 'user-1',
    }),
    type: overrides.type ?? 'audio',
    initiatedAt: overrides.initiatedAt ?? 1700000000,
  };
}

const mockLoggedInUser = {
  getUid: () => 'user-1',
  getName: () => 'Me',
} as unknown as CometChat.User;

/**
 * Build the value returned by the (mocked) useCometChatCallLogs hook.
 * The hook now only exposes list/fetch state — call initiation is handled by
 * CometChatCallButtons in the trailing view.
 */
function buildHookValue(
  overrides: Partial<{
    callList: unknown[];
    fetchState: string;
    hasMore: boolean;
    error: string | null;
    loggedInUser: CometChat.User | null;
    fetchNext: () => void;
  }> = {}
) {
  return {
    callList: [],
    fetchState: 'idle',
    hasMore: true,
    error: null,
    loggedInUser: mockLoggedInUser,
    fetchNext: vi.fn(),
    ...overrides,
  };
}

describe('CometChatCallLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCometChatCallLogs.mockReturnValue(buildHookValue());
  });

  // ─── Loading state ──────────────────────────────────────────────

  describe('loading state', () => {
    it('renders loading shimmer when fetchState is loading', () => {
      mockUseCometChatCallLogs.mockReturnValue(buildHookValue({ fetchState: 'loading' }));

      const { container } = render(<CometChatCallLogs />);
      // Shimmer items should be rendered
      expect(container.querySelectorAll('[class*="shimmer-item"]').length).toBeGreaterThan(0);
    });

    it('renders loading shimmer when fetchState is idle', () => {
      mockUseCometChatCallLogs.mockReturnValue(buildHookValue({ fetchState: 'idle' }));

      const { container } = render(<CometChatCallLogs />);
      expect(container.querySelectorAll('[class*="shimmer"]').length).toBeGreaterThan(0);
    });

    it('renders custom loadingView when provided', () => {
      mockUseCometChatCallLogs.mockReturnValue(buildHookValue({ fetchState: 'loading' }));

      render(
        <CometChatCallLogs loadingView={<div data-testid="custom-loading">Loading...</div>} />
      );
      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
    });
  });

  // ─── Empty state ────────────────────────────────────────────────

  describe('empty state', () => {
    it('renders empty state when fetchState is empty', () => {
      mockUseCometChatCallLogs.mockReturnValue(buildHookValue({ fetchState: 'empty' }));

      render(<CometChatCallLogs />);
      expect(screen.getByText('No Call Logs Yet')).toBeInTheDocument();
    });

    it('renders custom emptyView when provided', () => {
      mockUseCometChatCallLogs.mockReturnValue(buildHookValue({ fetchState: 'empty' }));

      render(<CometChatCallLogs emptyView={<div data-testid="custom-empty">No calls</div>} />);
      expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
    });
  });

  // ─── Error state ────────────────────────────────────────────────

  describe('error state', () => {
    it('renders error state when fetchState is error', () => {
      mockUseCometChatCallLogs.mockReturnValue(buildHookValue({ fetchState: 'error' }));

      render(<CometChatCallLogs />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders custom errorView when provided', () => {
      mockUseCometChatCallLogs.mockReturnValue(buildHookValue({ fetchState: 'error' }));

      render(<CometChatCallLogs errorView={<div data-testid="custom-error">Error!</div>} />);
      expect(screen.getByTestId('custom-error')).toBeInTheDocument();
    });
  });

  // ─── Loaded state (list rendering) ─────────────────────────────

  describe('loaded state', () => {
    it('renders call log items when fetchState is loaded', () => {
      const calls = [
        buildMockCallLog({ receiverName: 'Alice', sessionId: 's1' }),
        buildMockCallLog({ receiverName: 'Bob', sessionId: 's2' }),
      ];

      mockUseCometChatCallLogs.mockReturnValue(
        buildHookValue({ callList: calls, fetchState: 'loaded' })
      );

      render(<CometChatCallLogs />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('renders the header with title', () => {
      mockUseCometChatCallLogs.mockReturnValue(
        buildHookValue({ callList: [buildMockCallLog()], fetchState: 'loaded' })
      );

      render(<CometChatCallLogs />);
      expect(screen.getByText('Call Logs')).toBeInTheDocument();
    });
  });

  // ─── Callbacks ──────────────────────────────────────────────────

  describe('callbacks', () => {
    it('calls onItemClick when a call log item is clicked', () => {
      const onItemClick = vi.fn();
      const calls = [buildMockCallLog({ receiverName: 'Alice' })];

      mockUseCometChatCallLogs.mockReturnValue(
        buildHookValue({ callList: calls, fetchState: 'loaded' })
      );

      render(<CometChatCallLogs onItemClick={onItemClick} />);
      fireEvent.click(screen.getByText('Alice'));

      expect(onItemClick).toHaveBeenCalledWith(calls[0]);
    });

    it('calls onCallButtonClicked when trailing view is clicked', () => {
      const onCallButtonClicked = vi.fn();
      const calls = [buildMockCallLog({ type: 'audio' })];

      mockUseCometChatCallLogs.mockReturnValue(
        buildHookValue({ callList: calls, fetchState: 'loaded' })
      );

      render(<CometChatCallLogs onCallButtonClicked={onCallButtonClicked} />);
      const callButton = screen.getByRole('button', { name: 'Voice call' });
      fireEvent.click(callButton);

      expect(onCallButtonClicked).toHaveBeenCalledWith(calls[0]);
    });
  });

  // ─── Custom views ──────────────────────────────────────────────

  describe('custom views', () => {
    it('renders custom itemView when provided', () => {
      const calls = [buildMockCallLog()];

      mockUseCometChatCallLogs.mockReturnValue(
        buildHookValue({ callList: calls, fetchState: 'loaded' })
      );

      render(
        <CometChatCallLogs itemView={() => <div data-testid="custom-item">Custom Item</div>} />
      );
      expect(screen.getByTestId('custom-item')).toBeInTheDocument();
    });

    it('renders custom leadingView when provided', () => {
      const calls = [buildMockCallLog()];

      mockUseCometChatCallLogs.mockReturnValue(
        buildHookValue({ callList: calls, fetchState: 'loaded' })
      );

      render(
        <CometChatCallLogs
          leadingView={() => <div data-testid="custom-leading">Custom Leading</div>}
        />
      );
      expect(screen.getByTestId('custom-leading')).toBeInTheDocument();
    });

    it('renders custom titleView when provided', () => {
      const calls = [buildMockCallLog()];

      mockUseCometChatCallLogs.mockReturnValue(
        buildHookValue({ callList: calls, fetchState: 'loaded' })
      );

      render(
        <CometChatCallLogs titleView={() => <div data-testid="custom-title">Custom Title</div>} />
      );
      expect(screen.getByTestId('custom-title')).toBeInTheDocument();
    });

    it('renders custom subtitleView when provided', () => {
      const calls = [buildMockCallLog()];

      mockUseCometChatCallLogs.mockReturnValue(
        buildHookValue({ callList: calls, fetchState: 'loaded' })
      );

      render(
        <CometChatCallLogs
          subtitleView={() => <div data-testid="custom-subtitle">Custom Subtitle</div>}
        />
      );
      expect(screen.getByTestId('custom-subtitle')).toBeInTheDocument();
    });

    it('renders custom trailingView when provided', () => {
      const calls = [buildMockCallLog()];

      mockUseCometChatCallLogs.mockReturnValue(
        buildHookValue({ callList: calls, fetchState: 'loaded' })
      );

      render(
        <CometChatCallLogs
          trailingView={() => <div data-testid="custom-trailing">Custom Trailing</div>}
        />
      );
      expect(screen.getByTestId('custom-trailing')).toBeInTheDocument();
    });
  });

  // ─── Trailing call buttons ─────────────────────────────────────
  // Call initiation now lives in CometChatCallButtons, rendered in the
  // default trailing view when no onCallButtonClicked/trailingView is given.

  describe('trailing call buttons', () => {
    it('renders CometChatCallButtons in the default trailing view', () => {
      const calls = [buildMockCallLog({ type: 'audio' })];

      mockUseCometChatCallLogs.mockReturnValue(
        buildHookValue({ callList: calls, fetchState: 'loaded' })
      );

      render(<CometChatCallLogs />);
      expect(screen.getByTestId('call-buttons')).toBeInTheDocument();
    });

    it('hides the video button for audio call logs', () => {
      const calls = [buildMockCallLog({ type: 'audio' })];

      mockUseCometChatCallLogs.mockReturnValue(
        buildHookValue({ callList: calls, fetchState: 'loaded' })
      );

      render(<CometChatCallLogs />);
      const buttons = screen.getByTestId('call-buttons');
      expect(buttons).toHaveAttribute('data-hide-video', 'true');
      expect(buttons).toHaveAttribute('data-hide-voice', 'false');
    });

    it('hides the voice button for video call logs', () => {
      const calls = [buildMockCallLog({ type: 'video' })];

      mockUseCometChatCallLogs.mockReturnValue(
        buildHookValue({ callList: calls, fetchState: 'loaded' })
      );

      render(<CometChatCallLogs />);
      const buttons = screen.getByTestId('call-buttons');
      expect(buttons).toHaveAttribute('data-hide-voice', 'true');
      expect(buttons).toHaveAttribute('data-hide-video', 'false');
    });
  });

  // ─── Infinite scroll ───────────────────────────────────────────

  describe('infinite scroll', () => {
    it('calls fetchNext when scrolled near bottom', () => {
      const fetchNext = vi.fn();
      const calls = Array.from({ length: 20 }, (_, i) =>
        buildMockCallLog({ receiverName: `User ${i}`, sessionId: `s${i}` })
      );

      mockUseCometChatCallLogs.mockReturnValue(
        buildHookValue({ callList: calls, fetchState: 'loaded', fetchNext })
      );

      const { container } = render(<CometChatCallLogs />);
      const listEl = container.querySelector('[class*="call-logs__list"]');

      if (listEl) {
        // Simulate scroll near bottom
        Object.defineProperty(listEl, 'scrollTop', { value: 900 });
        Object.defineProperty(listEl, 'scrollHeight', { value: 1000 });
        Object.defineProperty(listEl, 'clientHeight', { value: 60 });

        fireEvent.scroll(listEl);
        expect(fetchNext).toHaveBeenCalled();
      }
    });
  });

  // ─── Accessibility ──────────────────────────────────────────────

  describe('accessibility', () => {
    it('trailing view has correct aria-label for audio calls', () => {
      const calls = [buildMockCallLog({ type: 'audio' })];

      mockUseCometChatCallLogs.mockReturnValue(
        buildHookValue({ callList: calls, fetchState: 'loaded' })
      );

      render(<CometChatCallLogs onCallButtonClicked={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Voice call' })).toBeInTheDocument();
    });

    it('trailing view has correct aria-label for video calls', () => {
      const calls = [buildMockCallLog({ type: 'video' })];

      mockUseCometChatCallLogs.mockReturnValue(
        buildHookValue({ callList: calls, fetchState: 'loaded' })
      );

      render(<CometChatCallLogs onCallButtonClicked={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Video call' })).toBeInTheDocument();
    });

    it('call log items are keyboard accessible', () => {
      const onItemClick = vi.fn();
      const calls = [buildMockCallLog({ receiverName: 'Alice' })];

      mockUseCometChatCallLogs.mockReturnValue(
        buildHookValue({ callList: calls, fetchState: 'loaded' })
      );

      render(<CometChatCallLogs onItemClick={onItemClick} />);
      const item = screen.getByText('Alice').closest('[role="button"]');
      expect(item).toHaveAttribute('tabindex', '0');

      if (item) {
        fireEvent.keyDown(item, { key: 'Enter' });
        expect(onItemClick).toHaveBeenCalledWith(calls[0]);
      }
    });

    it('trailing view responds to keyboard Enter', () => {
      const onCallButtonClicked = vi.fn();
      const calls = [buildMockCallLog({ type: 'audio' })];

      mockUseCometChatCallLogs.mockReturnValue(
        buildHookValue({ callList: calls, fetchState: 'loaded' })
      );

      render(<CometChatCallLogs onCallButtonClicked={onCallButtonClicked} />);
      const callButton = screen.getByRole('button', { name: 'Voice call' });
      fireEvent.keyDown(callButton, { key: 'Enter' });

      expect(onCallButtonClicked).toHaveBeenCalledWith(calls[0]);
    });
  });

  // ─── displayName ───────────────────────────────────────────────

  it('has correct displayName', () => {
    expect(CometChatCallLogs.displayName).toBe('CometChatCallLogs');
  });
});
