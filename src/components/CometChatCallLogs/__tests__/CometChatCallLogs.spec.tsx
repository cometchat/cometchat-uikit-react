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

vi.mock('../../base/CometChatDate', () => ({
  CometChatDate: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="date-root">{children}</div>
    ),
    Text: () => <span data-testid="date-text">Jan 1, 12:00 PM</span>,
  },
}));

vi.mock('../../CometChatOutgoingCall/CometChatOutgoingCall', () => ({
  CometChatOutgoingCall: (props: { onCallCanceled?: () => void }) => (
    <div data-testid="outgoing-call">
      <button onClick={props.onCallCanceled}>Cancel</button>
    </div>
  ),
}));

vi.mock('../../CometChatOngoingCall/CometChatOngoingCall', () => ({
  CometChatOngoingCall: (props: { sessionID: string; onCallEnded?: () => void }) => (
    <div data-testid="ongoing-call" data-session-id={props.sessionID}>
      <button onClick={props.onCallEnded}>End</button>
    </div>
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

describe('CometChatCallLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCometChatCallLogs.mockReturnValue({
      callList: [],
      fetchState: 'idle',
      loggedInUser: mockLoggedInUser,
      fetchNext: vi.fn(),
      handleCallButtonClick: vi.fn(),
      cancelOutgoingCall: vi.fn(),
      closeCallScreen: vi.fn(),
      showOutgoingCallScreen: false,
      showOngoingCall: false,
      activeCallObj: null,
      callSessionId: null,
    });
  });

  // ─── Loading state ──────────────────────────────────────────────

  describe('loading state', () => {
    it('renders loading shimmer when fetchState is loading', () => {
      mockUseCometChatCallLogs.mockReturnValue({
        callList: [],
        fetchState: 'loading',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

      const { container } = render(<CometChatCallLogs />);
      // Shimmer items should be rendered
      expect(container.querySelectorAll('[class*="shimmer-item"]').length).toBeGreaterThan(0);
    });

    it('renders loading shimmer when fetchState is idle', () => {
      mockUseCometChatCallLogs.mockReturnValue({
        callList: [],
        fetchState: 'idle',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

      const { container } = render(<CometChatCallLogs />);
      expect(container.querySelectorAll('[class*="shimmer"]').length).toBeGreaterThan(0);
    });

    it('renders custom loadingView when provided', () => {
      mockUseCometChatCallLogs.mockReturnValue({
        callList: [],
        fetchState: 'loading',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

      render(
        <CometChatCallLogs loadingView={<div data-testid="custom-loading">Loading...</div>} />
      );
      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
    });
  });

  // ─── Empty state ────────────────────────────────────────────────

  describe('empty state', () => {
    it('renders empty state when fetchState is empty', () => {
      mockUseCometChatCallLogs.mockReturnValue({
        callList: [],
        fetchState: 'empty',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

      render(<CometChatCallLogs />);
      expect(screen.getByText('No Call Logs Yet')).toBeInTheDocument();
    });

    it('renders custom emptyView when provided', () => {
      mockUseCometChatCallLogs.mockReturnValue({
        callList: [],
        fetchState: 'empty',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

      render(<CometChatCallLogs emptyView={<div data-testid="custom-empty">No calls</div>} />);
      expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
    });
  });

  // ─── Error state ────────────────────────────────────────────────

  describe('error state', () => {
    it('renders error state when fetchState is error', () => {
      mockUseCometChatCallLogs.mockReturnValue({
        callList: [],
        fetchState: 'error',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

      render(<CometChatCallLogs />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders custom errorView when provided', () => {
      mockUseCometChatCallLogs.mockReturnValue({
        callList: [],
        fetchState: 'error',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

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

      mockUseCometChatCallLogs.mockReturnValue({
        callList: calls,
        fetchState: 'loaded',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

      render(<CometChatCallLogs />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('renders the header with title', () => {
      mockUseCometChatCallLogs.mockReturnValue({
        callList: [buildMockCallLog()],
        fetchState: 'loaded',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

      render(<CometChatCallLogs />);
      expect(screen.getByText('Call Logs')).toBeInTheDocument();
    });
  });

  // ─── Callbacks ──────────────────────────────────────────────────

  describe('callbacks', () => {
    it('calls onItemClick when a call log item is clicked', () => {
      const onItemClick = vi.fn();
      const calls = [buildMockCallLog({ receiverName: 'Alice' })];

      mockUseCometChatCallLogs.mockReturnValue({
        callList: calls,
        fetchState: 'loaded',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

      render(<CometChatCallLogs onItemClick={onItemClick} />);
      fireEvent.click(screen.getByText('Alice'));

      expect(onItemClick).toHaveBeenCalledWith(calls[0]);
    });

    it('calls handleCallButtonClick when trailing view is clicked', () => {
      const handleCallButtonClick = vi.fn();
      const calls = [buildMockCallLog({ type: 'audio' })];

      mockUseCometChatCallLogs.mockReturnValue({
        callList: calls,
        fetchState: 'loaded',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick,
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

      render(<CometChatCallLogs />);
      const callButton = screen.getByRole('button', { name: 'Voice call' });
      fireEvent.click(callButton);

      expect(handleCallButtonClick).toHaveBeenCalledWith(calls[0]);
    });
  });

  // ─── Custom views ──────────────────────────────────────────────

  describe('custom views', () => {
    it('renders custom itemView when provided', () => {
      const calls = [buildMockCallLog()];

      mockUseCometChatCallLogs.mockReturnValue({
        callList: calls,
        fetchState: 'loaded',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

      render(
        <CometChatCallLogs itemView={() => <div data-testid="custom-item">Custom Item</div>} />
      );
      expect(screen.getByTestId('custom-item')).toBeInTheDocument();
    });

    it('renders custom leadingView when provided', () => {
      const calls = [buildMockCallLog()];

      mockUseCometChatCallLogs.mockReturnValue({
        callList: calls,
        fetchState: 'loaded',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

      render(
        <CometChatCallLogs
          leadingView={() => <div data-testid="custom-leading">Custom Leading</div>}
        />
      );
      expect(screen.getByTestId('custom-leading')).toBeInTheDocument();
    });

    it('renders custom titleView when provided', () => {
      const calls = [buildMockCallLog()];

      mockUseCometChatCallLogs.mockReturnValue({
        callList: calls,
        fetchState: 'loaded',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

      render(
        <CometChatCallLogs titleView={() => <div data-testid="custom-title">Custom Title</div>} />
      );
      expect(screen.getByTestId('custom-title')).toBeInTheDocument();
    });

    it('renders custom subtitleView when provided', () => {
      const calls = [buildMockCallLog()];

      mockUseCometChatCallLogs.mockReturnValue({
        callList: calls,
        fetchState: 'loaded',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

      render(
        <CometChatCallLogs
          subtitleView={() => <div data-testid="custom-subtitle">Custom Subtitle</div>}
        />
      );
      expect(screen.getByTestId('custom-subtitle')).toBeInTheDocument();
    });

    it('renders custom trailingView when provided', () => {
      const calls = [buildMockCallLog()];

      mockUseCometChatCallLogs.mockReturnValue({
        callList: calls,
        fetchState: 'loaded',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

      render(
        <CometChatCallLogs
          trailingView={() => <div data-testid="custom-trailing">Custom Trailing</div>}
        />
      );
      expect(screen.getByTestId('custom-trailing')).toBeInTheDocument();
    });
  });

  // ─── Outgoing call overlay ──────────────────────────────────────

  describe('outgoing call overlay', () => {
    it('renders CometChatOutgoingCall when showOutgoingCallScreen is true', () => {
      const activeCallObj = {
        getSessionId: () => 'session-out',
        getType: () => 'audio',
      } as unknown as CometChat.Call;

      mockUseCometChatCallLogs.mockReturnValue({
        callList: [],
        fetchState: 'loaded',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: true,
        showOngoingCall: false,
        activeCallObj,
        callSessionId: null,
      });

      render(<CometChatCallLogs />);
      expect(screen.getByTestId('outgoing-call')).toBeInTheDocument();
    });

    it('calls cancelOutgoingCall when outgoing call is canceled', () => {
      const cancelOutgoingCall = vi.fn();
      const activeCallObj = {
        getSessionId: () => 'session-out',
        getType: () => 'audio',
      } as unknown as CometChat.Call;

      mockUseCometChatCallLogs.mockReturnValue({
        callList: [],
        fetchState: 'loaded',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall,
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: true,
        showOngoingCall: false,
        activeCallObj,
        callSessionId: null,
      });

      render(<CometChatCallLogs />);
      fireEvent.click(screen.getByText('Cancel'));

      expect(cancelOutgoingCall).toHaveBeenCalled();
    });
  });

  // ─── Ongoing call overlay ──────────────────────────────────────

  describe('ongoing call overlay', () => {
    it('renders CometChatOngoingCall when showOngoingCall is true', () => {
      mockUseCometChatCallLogs.mockReturnValue({
        callList: [],
        fetchState: 'loaded',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: true,
        activeCallObj: null,
        callSessionId: 'session-ongoing',
      });

      render(<CometChatCallLogs />);
      expect(screen.getByTestId('ongoing-call')).toBeInTheDocument();
      expect(screen.getByTestId('ongoing-call')).toHaveAttribute(
        'data-session-id',
        'session-ongoing'
      );
    });

    it('calls closeCallScreen when ongoing call ends', () => {
      const closeCallScreen = vi.fn();

      mockUseCometChatCallLogs.mockReturnValue({
        callList: [],
        fetchState: 'loaded',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen,
        showOutgoingCallScreen: false,
        showOngoingCall: true,
        activeCallObj: null,
        callSessionId: 'session-ongoing',
      });

      render(<CometChatCallLogs />);
      fireEvent.click(screen.getByText('End'));

      expect(closeCallScreen).toHaveBeenCalled();
    });
  });

  // ─── Infinite scroll ───────────────────────────────────────────

  describe('infinite scroll', () => {
    it('calls fetchNext when scrolled near bottom', () => {
      const fetchNext = vi.fn();
      const calls = Array.from({ length: 20 }, (_, i) =>
        buildMockCallLog({ receiverName: `User ${i}`, sessionId: `s${i}` })
      );

      mockUseCometChatCallLogs.mockReturnValue({
        callList: calls,
        fetchState: 'loaded',
        loggedInUser: mockLoggedInUser,
        fetchNext,
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

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

      mockUseCometChatCallLogs.mockReturnValue({
        callList: calls,
        fetchState: 'loaded',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

      render(<CometChatCallLogs />);
      expect(screen.getByRole('button', { name: 'Voice call' })).toBeInTheDocument();
    });

    it('trailing view has correct aria-label for video calls', () => {
      const calls = [buildMockCallLog({ type: 'video' })];

      mockUseCometChatCallLogs.mockReturnValue({
        callList: calls,
        fetchState: 'loaded',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

      render(<CometChatCallLogs />);
      expect(screen.getByRole('button', { name: 'Video call' })).toBeInTheDocument();
    });

    it('call log items are keyboard accessible', () => {
      const onItemClick = vi.fn();
      const calls = [buildMockCallLog({ receiverName: 'Alice' })];

      mockUseCometChatCallLogs.mockReturnValue({
        callList: calls,
        fetchState: 'loaded',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick: vi.fn(),
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

      render(<CometChatCallLogs onItemClick={onItemClick} />);
      const item = screen.getByText('Alice').closest('[role="button"]');
      expect(item).toHaveAttribute('tabindex', '0');

      if (item) {
        fireEvent.keyDown(item, { key: 'Enter' });
        expect(onItemClick).toHaveBeenCalledWith(calls[0]);
      }
    });

    it('trailing view responds to keyboard Enter', () => {
      const handleCallButtonClick = vi.fn();
      const calls = [buildMockCallLog({ type: 'audio' })];

      mockUseCometChatCallLogs.mockReturnValue({
        callList: calls,
        fetchState: 'loaded',
        loggedInUser: mockLoggedInUser,
        fetchNext: vi.fn(),
        handleCallButtonClick,
        cancelOutgoingCall: vi.fn(),
        closeCallScreen: vi.fn(),
        showOutgoingCallScreen: false,
        showOngoingCall: false,
        activeCallObj: null,
        callSessionId: null,
      });

      render(<CometChatCallLogs />);
      const callButton = screen.getByRole('button', { name: 'Voice call' });
      fireEvent.keyDown(callButton, { key: 'Enter' });

      expect(handleCallButtonClick).toHaveBeenCalledWith(calls[0]);
    });
  });

  // ─── displayName ───────────────────────────────────────────────

  it('has correct displayName', () => {
    expect(CometChatCallLogs.displayName).toBe('CometChatCallLogs');
  });
});
