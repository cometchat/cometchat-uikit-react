import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CometChatMessageHeaderRoot } from '../CometChatMessageHeaderRoot';
import { useCometChatMessageHeaderContext } from '../CometChatMessageHeader.context';

// Mock dependencies
vi.mock('../../../hooks/useLoggedInUser', () => ({
  useLoggedInUser: () => ({
    getUid: () => 'logged-in-user',
    getName: () => 'Me',
  }),
}));

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        message_header_online: 'Online',
        message_header_offline: 'Offline',
        message_header_members: 'Members',
        message_header_member: 'Member',
        message_header_typing: 'typing...',
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
    CALL_STATUS: { CANCELLED: 'cancelled' },
    USER_STATUS: { ONLINE: 'online', OFFLINE: 'offline' },
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
  } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.User;
}

function createMockGroup(overrides: Record<string, unknown> = {}) {
  return {
    getGuid: () => overrides.guid ?? 'group-1',
    getName: () => overrides.name ?? 'Design Team',
    getIcon: () => overrides.icon ?? '',
    getMembersCount: () => overrides.membersCount ?? 12,
  } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.Group;
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
});
