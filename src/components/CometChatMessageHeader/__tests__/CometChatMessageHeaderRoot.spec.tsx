import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { render, screen, fireEvent } from '@testing-library/react';
import { CometChatMessageHeaderRoot } from '../CometChatMessageHeaderRoot';
import { useCometChatMessageHeaderContext } from '../CometChatMessageHeader.context';
import { covers } from '../../../testing/covers';

// Lets a test turn Pinned Messages on, which is otherwise off by default in this environment.
const pinSaveFeatures = vi.hoisted(() => ({ pinMessage: false, saveMessage: false }));
vi.mock('../../../hooks/usePinSaveFeatures', () => ({
  usePinSaveFeatures: () => pinSaveFeatures,
}));

// Mock dependencies
vi.mock('../../../hooks/useLoggedInUser', () => ({
  useLoggedInUser: () => ({
    getUid: () => 'logged-in-user',
    getName: () => 'Me',
  }),
}));

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => {
      const translations: Record<string, string> = {
        message_header_online: 'Online',
        message_header_offline: 'Offline',
        message_header_members: 'Members',
        message_header_member: 'Member',
        message_header_typing: 'typing...',
        accessibility_back: 'Go back',
        accessibility_voice_call: 'Voice call',
        accessibility_video_call: 'Video call',
        accessibility_search: 'Search',
        accessibility_conversation_summary: 'Conversation summary',
        accessibility_click_for_details: 'Click for details',
        call_button_voice_hover: 'Voice call',
        call_button_video_hover: 'Video call',
        ai_conversation_summary_title: 'Conversation summary',
        accessibility_message_header: 'Message header',
      };
      return translations[key] ?? key;
    },
    language: 'en-us',
  }),
}));

vi.mock('../../../CometChatUIKit/CometChatUIKit', () => ({
  CometChatUIKit: {
    getSettings: () => ({
      isCallingEnabled: () => true,
    }),
    getLoggedInUser: () => ({
      getUid: () => 'logged-in-user',
      getName: () => 'Me',
    }),
  },
}));

vi.mock('../../../hooks/useCometChatEvents', () => ({
  useCometChatEvents: vi.fn(),
}));

vi.mock('../../../hooks/usePublishEvent', () => ({
  usePublishEvent: () => vi.fn(),
}));

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    addUserListener: vi.fn(),
    removeUserListener: vi.fn(),
    addMessageListener: vi.fn(),
    removeMessageListener: vi.fn(),
    addGroupListener: vi.fn(),
    removeGroupListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
    addCallListener: vi.fn(),
    removeCallListener: vi.fn(),
    UserListener: vi.fn().mockImplementation((cb: unknown) => cb),
    MessageListener: vi.fn().mockImplementation((cb: unknown) => cb),
    GroupListener: vi.fn().mockImplementation((cb: unknown) => cb),
    ConnectionListener: vi.fn().mockImplementation((cb: unknown) => cb),
    CallListener: vi.fn().mockImplementation((cb: unknown) => cb),
    RECEIVER_TYPE: { GROUP: 'group', USER: 'user' },
    CALL_TYPE: { AUDIO: 'audio', VIDEO: 'video' },
    CALL_STATUS: {
      ONGOING: 'ongoing',
      ENDED: 'ended',
      INITIATED: 'initiated',
      CANCELLED: 'cancelled',
      REJECTED: 'rejected',
      UNANSWERED: 'unanswered',
      BUSY: 'busy',
    },
    USER_STATUS: { ONLINE: 'online', OFFLINE: 'offline' },
    CATEGORY_MESSAGE: 'message',
    CATEGORY_CUSTOM: 'custom',
    CATEGORY_ACTION: 'action',
    CATEGORY_CALL: 'call',
    CATEGORY_INTERACTIVE: 'interactive',
    MessageCategory: { AGENTIC: 'agentic' },
    ModerationStatus: {
      PENDING: 'pending',
      APPROVED: 'approved',
      DISAPPROVED: 'disapproved',
      UNMODERATED: 'unmoderated',
    },
    MESSAGE_TYPE: {
      TEXT: 'text',
      IMAGE: 'image',
      VIDEO: 'video',
      AUDIO: 'audio',
      FILE: 'file',
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
    GROUP_MEMBER_SCOPE: { ADMIN: 'admin', MODERATOR: 'moderator', PARTICIPANT: 'participant' },
    GROUP_TYPE: { PRIVATE: 'private', PASSWORD: 'password', PUBLIC: 'public' },
    CALL_MODE: {
      DEFAULT: 'default',
      GRID: 'grid',
      SINGLE: 'single',
      SPOTLIGHT: 'spotlight',
      TILE: 'tile',
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
    getLoggedinUser: vi.fn().mockResolvedValue({
      getUid: () => 'logged-in-user',
      getName: () => 'Me',
    }),
    initiateCall: vi.fn(),
    rejectCall: vi.fn(),
    Call: vi.fn(),
  },
}));

function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    getUid: () => overrides.uid ?? 'user-1',
    getName: () => overrides.name ?? 'John Doe',
    getAvatar: () => overrides.avatar ?? 'https://example.com/avatar.png',
    getStatus: () => overrides.status ?? 'online',
    getLastActiveAt: () => overrides.lastActiveAt ?? 0,
    getBlockedByMe: () => overrides.blockedByMe ?? false,
    getHasBlockedMe: () => overrides.hasBlockedMe ?? false,
  } as unknown as CometChat.User;
}

function createMockGroup(overrides: Record<string, unknown> = {}) {
  return {
    getGuid: () => overrides.guid ?? 'group-1',
    getName: () => overrides.name ?? 'Design Team',
    getIcon: () => overrides.icon ?? '',
    getMembersCount: () => overrides.membersCount ?? 12,
  } as unknown as CometChat.Group;
}

describe('CometChatMessageHeaderRoot', () => {
  it('renders default layout when no children provided', () => {
    render(<CometChatMessageHeaderRoot user={createMockUser()} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders children when provided (compound composition)', () => {
    render(
      <CometChatMessageHeaderRoot user={createMockUser()}>
        <div data-testid="custom-child">Custom content</div>
      </CometChatMessageHeaderRoot>
    );
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    expect(screen.getByText('Custom content')).toBeInTheDocument();
  });

  it('provides context values to children', () => {
    function ContextConsumer() {
      const ctx = useCometChatMessageHeaderContext();
      return (
        <div>
          <span data-testid="display-name">{ctx.displayName}</span>
          <span data-testid="is-user">{String(ctx.isUserConversation)}</span>
        </div>
      );
    }

    render(
      <CometChatMessageHeaderRoot user={createMockUser()}>
        <ContextConsumer />
      </CometChatMessageHeaderRoot>
    );

    expect(screen.getByTestId('display-name')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('is-user')).toHaveTextContent('true');
  });

  it('provides group context values', () => {
    function ContextConsumer() {
      const ctx = useCometChatMessageHeaderContext();
      return (
        <div>
          <span data-testid="display-name">{ctx.displayName}</span>
          <span data-testid="is-group">{String(ctx.isGroupConversation)}</span>
          <span data-testid="member-count">{ctx.groupMemberCount}</span>
        </div>
      );
    }

    render(
      <CometChatMessageHeaderRoot group={createMockGroup()}>
        <ContextConsumer />
      </CometChatMessageHeaderRoot>
    );

    expect(screen.getByTestId('display-name')).toHaveTextContent('Design Team');
    expect(screen.getByTestId('is-group')).toHaveTextContent('true');
    expect(screen.getByTestId('member-count')).toHaveTextContent('12');
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatMessageHeaderRoot user={createMockUser()} className="my-custom-class" />
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('my-custom-class');
  });

  it('has role="banner"', () => {
    render(<CometChatMessageHeaderRoot user={createMockUser()} />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('has aria-label with user name and status', () => {
    render(<CometChatMessageHeaderRoot user={createMockUser()} />);
    const banner = screen.getByRole('banner');
    expect(banner).toHaveAttribute('aria-label');
    const label = banner.getAttribute('aria-label') ?? '';
    expect(label).toContain('John Doe');
  });

  it('has aria-label with group name and member count', () => {
    render(<CometChatMessageHeaderRoot group={createMockGroup()} />);
    const banner = screen.getByRole('banner');
    const label = banner.getAttribute('aria-label') ?? '';
    expect(label).toContain('Design Team');
    expect(label).toContain('12');
    expect(label).toContain('Members');
  });

  it('falls back to a generic aria-label when neither a user nor a group is given', () => {
    render(<CometChatMessageHeaderRoot />);
    expect(screen.getByRole('banner')).toHaveAttribute('aria-label', 'Message header');
  });

  it('renders back button when hideBackButton is false (default)', () => {
    render(<CometChatMessageHeaderRoot user={createMockUser()} />);
    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
  });

  it('does not render back button when hideBackButton is true', () => {
    render(<CometChatMessageHeaderRoot user={createMockUser()} hideBackButton={true} />);
    expect(screen.queryByRole('button', { name: 'Go back' })).not.toBeInTheDocument();
  });

  it('calls onItemClick when content area is clicked', () => {
    const onItemClick = vi.fn();
    render(<CometChatMessageHeaderRoot user={createMockUser()} onItemClick={onItemClick} />);
    const contentArea = screen.getByRole('button', { name: /Click for details/i });
    fireEvent.click(contentArea);
    expect(onItemClick).toHaveBeenCalledTimes(1);
  });

  it('calls onItemClick when Enter is pressed on content area', () => {
    const onItemClick = vi.fn();
    render(<CometChatMessageHeaderRoot user={createMockUser()} onItemClick={onItemClick} />);
    const contentArea = screen.getByRole('button', { name: /Click for details/i });
    fireEvent.keyDown(contentArea, { key: 'Enter' });
    expect(onItemClick).toHaveBeenCalledTimes(1);
  });

  it('calls onItemClick when Space is pressed on content area', () => {
    const onItemClick = vi.fn();
    render(<CometChatMessageHeaderRoot user={createMockUser()} onItemClick={onItemClick} />);
    const contentArea = screen.getByRole('button', { name: /Click for details/i });
    fireEvent.keyDown(contentArea, { key: ' ' });
    expect(onItemClick).toHaveBeenCalledTimes(1);
  });

  it('renders "Online" subtitle for online user', () => {
    render(<CometChatMessageHeaderRoot user={createMockUser({ status: 'online' })} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  describe('lastActiveAtDateTimeFormat', () => {
    const DAY = 24 * 60 * 60;
    const now = () => Math.floor(Date.now() / 1000);
    const offline = (lastActiveAt: number) => createMockUser({ status: 'offline', lastActiveAt });
    const lastSeen = () => {
      const label = screen.getByText('message_header_last_seen');
      return label.parentElement?.textContent?.replace('message_header_last_seen', '').trim();
    };

    it('without it, an older time reads as day, month and time', () => {
      covers('CometChatMessageHeader.lastActiveAtDateTimeFormat', 'default');
      render(<CometChatMessageHeaderRoot user={offline(now() - 10 * DAY)} />);
      expect(lastSeen()).toMatch(/^\d{1,2} month_\w+_short message_header_at \d{1,2}:\d{2} [AP]M$/);
    });

    it('formats the time with it, and a part it leaves out keeps the default', () => {
      covers('CometChatMessageHeader.lastActiveAtDateTimeFormat', 'set');
      const format = { otherDays: 'DD/MM/YYYY' };
      const tenDaysAgo = now() - 10 * DAY;
      const date = new Date(tenDaysAgo * 1000);
      const pad = (n: number) => String(n).padStart(2, '0');

      const { unmount } = render(
        <CometChatMessageHeaderRoot
          user={offline(tenDaysAgo)}
          lastActiveAtDateTimeFormat={format}
        />
      );
      expect(lastSeen()).toBe(
        `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${String(date.getFullYear())}`
      );
      unmount();

      // Within the hour the format has nothing of its own, so the relative default stays.
      render(
        <CometChatMessageHeaderRoot
          user={offline(now() - 5 * 60)}
          lastActiveAtDateTimeFormat={format}
        />
      );
      expect(lastSeen()).toBe('5 message_header_minutes_ago');
    });
  });

  it('renders member count for group', () => {
    render(<CometChatMessageHeaderRoot group={createMockGroup({ membersCount: 5 })} />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText(/Members/)).toBeInTheDocument();
  });

  it('renders "1 Member" for single member group', () => {
    render(<CometChatMessageHeaderRoot group={createMockGroup({ membersCount: 1 })} />);
    expect(screen.getByText(/1/)).toBeInTheDocument();
    expect(screen.getByText(/Member$/)).toBeInTheDocument();
  });

  it('renders call buttons when not hidden', () => {
    render(
      <CometChatMessageHeaderRoot
        user={createMockUser()}
        hideVoiceCallButton={false}
        hideVideoCallButton={false}
      />
    );
    expect(screen.getByRole('button', { name: 'Voice call' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Video call' })).toBeInTheDocument();
  });

  it('does not render call buttons when hidden', () => {
    render(
      <CometChatMessageHeaderRoot user={createMockUser()} hideVoiceCallButton hideVideoCallButton />
    );
    expect(screen.queryByRole('button', { name: 'Voice call' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Video call' })).not.toBeInTheDocument();
  });

  it('renders search button when showSearchOption is true', () => {
    render(<CometChatMessageHeaderRoot user={createMockUser()} showSearchOption />);
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('renders summary button when showConversationSummaryButton is true', () => {
    render(
      <CometChatMessageHeaderRoot
        user={createMockUser()}
        showConversationSummaryButton
        showSearchOption={false}
      />
    );
    expect(screen.getByRole('button', { name: 'Conversation summary' })).toBeInTheDocument();
  });

  /*
   * How the three trailing options are presented, across the combinations that used to be wrong.
   *
   * The menu was gated on search — `search && (summary || pinned)` — so turning off
   * `conversationAndAdvancedSearch` also took Pinned Messages with it, even though the two
   * features are unrelated. It is gated on how many options exist now.
   */
  describe('trailing options presentation', () => {
    const MORE_ICON = '.cometchat-message-header__menu-button-icon--more';
    const SEARCH_BUTTON = '.cometchat-message-header__menu-button--search';

    afterEach(() => {
      pinSaveFeatures.pinMessage = false;
    });

    it('offers pinned messages through the menu when search is off', () => {
      pinSaveFeatures.pinMessage = true;
      const { container } = render(
        <CometChatMessageHeaderRoot
          user={createMockUser()}
          showSearchOption={false}
          onPinnedMessagesClicked={vi.fn()}
        />
      );

      expect(container.querySelector(MORE_ICON)).not.toBeNull();
      expect(container.querySelector(SEARCH_BUTTON)).toBeNull();
    });

    it('gives search its own button when it is the only option', () => {
      const { container } = render(
        <CometChatMessageHeaderRoot user={createMockUser()} showSearchOption />
      );

      expect(container.querySelector(SEARCH_BUTTON)).not.toBeNull();
      expect(container.querySelector(MORE_ICON)).toBeNull();
    });

    it('folds search into the menu once pinned messages joins it', () => {
      pinSaveFeatures.pinMessage = true;
      const { container } = render(
        <CometChatMessageHeaderRoot
          user={createMockUser()}
          showSearchOption
          onPinnedMessagesClicked={vi.fn()}
        />
      );

      expect(container.querySelector(MORE_ICON)).not.toBeNull();
      expect(container.querySelector(SEARCH_BUTTON)).toBeNull();
    });

    it('renders nothing in the menu slot when every option is off', () => {
      const { container } = render(
        <CometChatMessageHeaderRoot user={createMockUser()} showSearchOption={false} />
      );

      expect(container.querySelector(MORE_ICON)).toBeNull();
      expect(container.querySelector(SEARCH_BUTTON)).toBeNull();
    });
  });
});
