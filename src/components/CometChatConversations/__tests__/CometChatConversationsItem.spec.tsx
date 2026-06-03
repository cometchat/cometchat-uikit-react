import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CometChatConversationsContext } from '../CometChatConversations.context';
import type { CometChatConversationsContextValue } from '../CometChatConversations.types';

// Mock IntersectionObserver
vi.stubGlobal(
  'IntersectionObserver',
  vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn(), unobserve: vi.fn() }))
);

// Mock base components
vi.mock('../../base/CometChatAvatar/CometChatAvatar', () => ({
  CometChatAvatar: {
    Root: ({ children, name }: { children?: React.ReactNode; name?: string }) => (
      <div data-testid="avatar" data-name={name}>
        {children}
      </div>
    ),
    Image: () => <span data-testid="avatar-image" />,
    Initials: () => <span data-testid="avatar-initials" />,
    StatusIndicator: ({ status }: { status?: string }) => (
      <span data-testid="status-indicator" data-status={status} />
    ),
  },
}));
vi.mock('../../base/CometChatCheckbox/CometChatCheckbox', () => ({
  CometChatCheckbox: (props: { checked?: boolean }) => (
    <input type="checkbox" data-testid="checkbox" checked={props.checked} readOnly />
  ),
}));
vi.mock('../../base/CometChatRadioButton/CometChatRadioButton', () => ({
  CometChatRadioButton: (props: { checked?: boolean }) => (
    <input type="radio" data-testid="radio" checked={props.checked} readOnly />
  ),
}));
vi.mock('../../base/CometChatConfirmDialog/CometChatConfirmDialog', () => ({
  CometChatConfirmDialog: {
    Root: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Icon: () => null,
    Content: () => null,
    Actions: () => null,
  },
}));
vi.mock('../../base/CometChatDate', () => ({
  CometChatDate: {
    Root: ({ children }: { children?: React.ReactNode }) => (
      <span data-testid="date">{children}</span>
    ),
    Text: () => <span>time</span>,
  },
}));

// Import the Item component after mocks
import { CometChatConversationsItem } from '../CometChatConversationsItem';

// --- Helpers ---

interface MockConversationOverrides {
  id?: string;
  type?: string;
  name?: string;
  avatar?: string;
  status?: string;
  lastMessageType?: string | null;
  lastMessageText?: string;
  lastMessageCategory?: string;
  lastMessageSentAt?: number;
  lastMessageSenderId?: string;
  lastMessageId?: number;
  lastMessageReadAt?: number;
  lastMessageDeliveredAt?: number;
  lastMessageDeletedAt?: number | null;
  unreadCount?: number;
  callStatus?: string;
}

function createMockConversation(overrides: MockConversationOverrides = {}) {
  const defaults = {
    id: 'conv-1',
    type: 'user',
    name: 'Alice',
    avatar: 'https://example.com/alice.png',
    status: 'online',
    lastMessageType: 'text' as string | null,
    lastMessageText: 'Hello',
    lastMessageCategory: 'message',
    lastMessageSentAt: Math.floor(Date.now() / 1000),
    lastMessageSenderId: 'other-user',
    lastMessageId: 123,
    lastMessageReadAt: 0,
    lastMessageDeliveredAt: 0,
    lastMessageDeletedAt: null as number | null,
    unreadCount: 0,
    callStatus: 'ended',
    ...overrides,
  };

  return {
    getConversationId: () => defaults.id,
    getConversationType: () => defaults.type,
    getConversationWith: () =>
      defaults.type === 'user'
        ? {
            getUid: () => defaults.id,
            getName: () => defaults.name,
            getAvatar: () => defaults.avatar,
            getStatus: () => defaults.status,
          }
        : {
            getGuid: () => defaults.id,
            getName: () => defaults.name,
            getIcon: () => defaults.avatar,
          },
    getLastMessage: () =>
      defaults.lastMessageType
        ? {
            getId: () => defaults.lastMessageId,
            getType: () => defaults.lastMessageType,
            getCategory: () => defaults.lastMessageCategory,
            getText: () => defaults.lastMessageText,
            getSentAt: () => defaults.lastMessageSentAt,
            getSender: () => ({
              getUid: () => defaults.lastMessageSenderId,
              getName: () => 'Sender',
            }),
            getReadAt: () => defaults.lastMessageReadAt,
            getDeliveredAt: () => defaults.lastMessageDeliveredAt,
            getDeletedAt: () => defaults.lastMessageDeletedAt,
            getConversationText: () => null,
            getMessage: () => 'Action message',
            getCallInitiator: () => ({
              getUid: () => defaults.lastMessageSenderId,
            }),
            getInitiator: () => ({
              getUid: () => defaults.lastMessageSenderId,
            }),
            getStatus: () => defaults.callStatus,
          }
        : null,
    getUnreadMessageCount: () => defaults.unreadCount,
  } as unknown as CometChat.Conversation;
}

function createMockContext(
  overrides: Partial<CometChatConversationsContextValue> = {}
): CometChatConversationsContextValue {
  return {
    conversations: [],
    fetchState: 'loaded',
    hasMore: false,
    error: null,
    selectedConversationIds: [],
    selectedConversationsMap: new Map(),
    activeConversationId: null,
    searchText: '',
    selectionMode: 'none',
    hideUserStatus: false,
    hideUnreadCount: false,
    hideReceipts: false,
    loggedInUserId: 'user-1',
    options: undefined,
    conversationToBeDeleted: null,
    fetchNext: vi.fn(),
    setSearchText: vi.fn(),
    selectConversation: vi.fn(),
    deselectConversation: vi.fn(),
    selectRange: vi.fn(),
    deselectRange: vi.fn(),
    clearSelection: vi.fn(),
    setActiveConversation: vi.fn(),
    handleItemClick: vi.fn(),
    deleteConversation: vi.fn(),
    setConversationToBeDeleted: vi.fn(),
    ...overrides,
  };
}

function renderWithContext(
  conversation: CometChat.Conversation,
  contextOverrides: Partial<CometChatConversationsContextValue> = {},
  itemProps: Partial<React.ComponentProps<typeof CometChatConversationsItem>> = {}
) {
  const ctx = createMockContext(contextOverrides);
  return {
    ctx,
    ...render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsItem conversation={conversation} {...itemProps} />
      </CometChatConversationsContext.Provider>
    ),
  };
}

// --- Tests ---

describe('CometChatConversationsItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Renders conversation name and avatar
  it('renders conversation name and avatar', () => {
    const conv = createMockConversation({ name: 'Alice', avatar: 'https://example.com/alice.png' });
    renderWithContext(conv);

    expect(screen.getByTestId('avatar')).toHaveAttribute('data-name', 'Alice');
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  // 2. Shows online status for user conversations
  it('shows online status for user conversations', () => {
    const conv = createMockConversation({ type: 'user', status: 'online' });
    renderWithContext(conv);

    const indicator = screen.getByTestId('status-indicator');
    expect(indicator).toHaveAttribute('data-status', 'online');
  });

  // 3. Does NOT show status for group conversations
  it('does NOT show status for group conversations', () => {
    const conv = createMockConversation({ type: 'group' });
    renderWithContext(conv);

    expect(screen.queryByTestId('status-indicator')).not.toBeInTheDocument();
  });

  // 4. Shows unread badge when unreadCount > 0
  it('shows unread badge when unreadCount > 0', () => {
    const conv = createMockConversation({ unreadCount: 5 });
    renderWithContext(conv);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  // 5. Hides unread badge when hideUnreadCount is true
  it('hides unread badge when hideUnreadCount is true', () => {
    const conv = createMockConversation({ unreadCount: 5 });
    renderWithContext(conv, { hideUnreadCount: true });

    expect(screen.queryByText('5')).not.toBeInTheDocument();
  });

  // 6. Shows "99+" when unread count exceeds 99
  it('shows "99+" when unread count exceeds 99', () => {
    const conv = createMockConversation({ unreadCount: 150 });
    renderWithContext(conv);

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  // 7. Shows receipt icon for messages sent by logged-in user
  it('shows receipt icon (sent/delivered/read) for messages sent by logged-in user', () => {
    const conv = createMockConversation({
      lastMessageSenderId: 'user-1',
      lastMessageDeliveredAt: 1000,
    });
    const { container } = renderWithContext(conv, { loggedInUserId: 'user-1' });

    const receiptEl = container.querySelector('[class*="cometchat-conversations__item-receipt"]');
    expect(receiptEl).toBeInTheDocument();
  });

  // 8. Does NOT show receipt for messages from others
  it('does NOT show receipt for messages from others', () => {
    const conv = createMockConversation({ lastMessageSenderId: 'other-user' });
    const { container } = renderWithContext(conv, { loggedInUserId: 'user-1' });

    const receiptEl = container.querySelector('[class*="cometchat-conversations__item-receipt--"]');
    expect(receiptEl).not.toBeInTheDocument();
  });

  // 9. Shows correct subtitle for text messages
  it('shows correct subtitle for text messages', () => {
    const conv = createMockConversation({
      lastMessageType: 'text',
      lastMessageText: 'Hello world',
      lastMessageCategory: 'message',
    });
    renderWithContext(conv);

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  // 10. Shows "Image" with icon for image messages
  it('shows "Image" with icon for image messages', () => {
    const conv = createMockConversation({
      lastMessageType: 'image',
      lastMessageCategory: 'message',
    });
    const { container } = renderWithContext(conv);

    expect(screen.getByText('Image')).toBeInTheDocument();
    const iconEl = container.querySelector(
      '[class*="cometchat-conversations__item-subtitle-icon--image"]'
    );
    expect(iconEl).toBeInTheDocument();
  });

  // 11. Shows "Video" with icon for video messages
  it('shows "Video" with icon for video messages', () => {
    const conv = createMockConversation({
      lastMessageType: 'video',
      lastMessageCategory: 'message',
    });
    const { container } = renderWithContext(conv);

    expect(screen.getByText('Video')).toBeInTheDocument();
    const iconEl = container.querySelector(
      '[class*="cometchat-conversations__item-subtitle-icon--video"]'
    );
    expect(iconEl).toBeInTheDocument();
  });

  // 12. Shows "Audio" with icon for audio messages
  it('shows "Audio" with icon for audio messages', () => {
    const conv = createMockConversation({
      lastMessageType: 'audio',
      lastMessageCategory: 'message',
    });
    const { container } = renderWithContext(conv);

    expect(screen.getByText('Audio')).toBeInTheDocument();
    const iconEl = container.querySelector(
      '[class*="cometchat-conversations__item-subtitle-icon--audio"]'
    );
    expect(iconEl).toBeInTheDocument();
  });

  // 13. Shows "File" with icon for file messages
  it('shows "File" with icon for file messages', () => {
    const conv = createMockConversation({
      lastMessageType: 'file',
      lastMessageCategory: 'message',
    });
    const { container } = renderWithContext(conv);

    expect(screen.getByText('File')).toBeInTheDocument();
    const iconEl = container.querySelector(
      '[class*="cometchat-conversations__item-subtitle-icon--file"]'
    );
    expect(iconEl).toBeInTheDocument();
  });

  // 14. Shows type for poll messages (plugin provides friendly name when registry available)
  it('shows "Poll" for poll messages', () => {
    const conv = createMockConversation({
      lastMessageType: 'extension_poll',
      lastMessageCategory: 'custom',
    });
    renderWithContext(conv);

    expect(screen.getByText('extension_poll')).toBeInTheDocument();
  });

  // 15. Shows type for sticker messages (plugin provides friendly name when registry available)
  it('shows "Sticker" for sticker messages', () => {
    const conv = createMockConversation({
      lastMessageType: 'extension_sticker',
      lastMessageCategory: 'custom',
    });
    renderWithContext(conv);

    expect(screen.getByText('extension_sticker')).toBeInTheDocument();
  });

  // 16. Shows type for whiteboard messages (plugin provides friendly name when registry available)
  it('shows "Collaborative Whiteboard" for whiteboard messages', () => {
    const conv = createMockConversation({
      lastMessageType: 'extension_whiteboard',
      lastMessageCategory: 'custom',
    });
    renderWithContext(conv);

    expect(screen.getByText('extension_whiteboard')).toBeInTheDocument();
  });

  // 17. Shows type for document messages (plugin provides friendly name when registry available)
  it('shows "Collaborative Document" for document messages', () => {
    const conv = createMockConversation({
      lastMessageType: 'extension_document',
      lastMessageCategory: 'custom',
    });
    renderWithContext(conv);

    expect(screen.getByText('extension_document')).toBeInTheDocument();
  });

  // 18. Shows "Voice call" for audio call messages
  it('shows "Voice call" for audio call messages', () => {
    const conv = createMockConversation({
      lastMessageType: 'audio',
      lastMessageCategory: 'call',
      callStatus: 'ended',
    });
    renderWithContext(conv);

    expect(screen.getByText('Voice call')).toBeInTheDocument();
  });

  // 19. Shows "Video call" for video call messages
  it('shows "Video call" for video call messages', () => {
    const conv = createMockConversation({
      lastMessageType: 'video',
      lastMessageCategory: 'call',
      callStatus: 'ended',
    });
    renderWithContext(conv);

    expect(screen.getByText('Video call')).toBeInTheDocument();
  });

  // 20. Shows "Click to start conversation" when no last message
  it('shows "Click to start conversation" when no last message', () => {
    const conv = createMockConversation({ lastMessageType: null });
    renderWithContext(conv);

    expect(screen.getByText('Click to start conversation')).toBeInTheDocument();
  });

  // 21. Shows "Message is deleted" for deleted messages
  it('shows "Message is deleted" for deleted messages', () => {
    const conv = createMockConversation({ lastMessageDeletedAt: 1000 });
    renderWithContext(conv);

    expect(screen.getByText('Message is deleted')).toBeInTheDocument();
  });

  // 22. Without formatters, raw markdown is rendered as-is (formatters provide the conversion)
  it('renders bold markdown in subtitle (**bold** → <b>)', () => {
    const conv = createMockConversation({
      lastMessageType: 'text',
      lastMessageText: '**bold text**',
      lastMessageCategory: 'message',
    });
    const { container } = renderWithContext(conv);

    const subtitleText = container.querySelector(
      '[class*="cometchat-conversations__item-subtitle-text"]'
    );
    expect(subtitleText).toBeInTheDocument();
    // Without a plugin registry providing formatters, raw text is rendered as-is
    expect(subtitleText?.textContent).toContain('**bold text**');
  });

  // 23. Shows delete button on hover (via CSS class)
  it('shows delete button on hover (via CSS class)', () => {
    const conv = createMockConversation();
    const { container } = renderWithContext(conv);

    const menuView = container.querySelector('[class*="cometchat-conversations__item-menu-view"]');
    expect(menuView).toBeInTheDocument();

    const deleteButton = screen.getByRole('button', { name: 'Delete conversation' });
    expect(deleteButton).toBeInTheDocument();
  });

  // 24. Calls setConversationToBeDeleted when delete button clicked
  it('calls setConversationToBeDeleted when delete button clicked', () => {
    const conv = createMockConversation();
    const { ctx } = renderWithContext(conv);

    const deleteButton = screen.getByRole('button', { name: 'Delete conversation' });
    fireEvent.click(deleteButton);

    expect(ctx.setConversationToBeDeleted).toHaveBeenCalledWith(conv);
  });

  // 25. Shows active state when conversation is active
  it('shows active state when conversation is active', () => {
    const conv = createMockConversation({ id: 'conv-1' });
    const { container } = renderWithContext(conv, { activeConversationId: 'conv-1' });

    const item = container.querySelector('[class*="cometchat-conversations__item--active"]');
    expect(item).toBeInTheDocument();
  });

  // 26. Shows selected state when conversation is selected
  it('shows selected state when conversation is selected', () => {
    const conv = createMockConversation({ id: 'conv-1' });
    const { container } = renderWithContext(conv, {
      selectedConversationIds: ['conv-1'],
    });

    const item = container.querySelector('[class*="cometchat-conversations__item--selected"]');
    expect(item).toBeInTheDocument();
  });
});

describe('CometChatConversationsItem — hideDeleteButton', () => {
  it('hides the delete button when hideDeleteButton is true', () => {
    const conv = createMockConversation();
    const { container } = renderWithContext(conv, {}, { hideDeleteButton: true });

    expect(screen.queryByRole('button', { name: 'Delete conversation' })).not.toBeInTheDocument();
    const menuView = container.querySelector('[class*="cometchat-conversations__item-menu-view"]');
    expect(menuView).not.toBeInTheDocument();
  });

  it('applies subtle-hover modifier class when hideDeleteButton is true', () => {
    const conv = createMockConversation();
    const { container } = renderWithContext(conv, {}, { hideDeleteButton: true });

    const item = container.querySelector('[class*="cometchat-conversations__item--subtle-hover"]');
    expect(item).toBeInTheDocument();
  });

  it('does NOT apply subtle-hover modifier when hideDeleteButton is false', () => {
    const conv = createMockConversation();
    const { container } = renderWithContext(conv);

    const item = container.querySelector('[class*="cometchat-conversations__item--subtle-hover"]');
    expect(item).not.toBeInTheDocument();
  });
});

describe('CometChatConversationsItem — context-optional (standalone usage)', () => {
  it('renders without crashing when no context provider is present', () => {
    const conv = createMockConversation({ name: 'Bob' });
    const { container } = render(<CometChatConversationsItem conversation={conv} />);

    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(container.querySelector('[role="option"]')).toBeInTheDocument();
  });

  it('uses prop values when no context is available', () => {
    const conv = createMockConversation({ name: 'Bob', status: 'online' });
    const { container } = render(
      <CometChatConversationsItem
        conversation={conv}
        hideUserStatus={true}
        hideDeleteButton={true}
      />
    );

    // Status indicator should be hidden
    expect(screen.queryByTestId('status-indicator')).not.toBeInTheDocument();
    // Delete button should be hidden
    expect(screen.queryByRole('button', { name: 'Delete conversation' })).not.toBeInTheDocument();
    // Item should still render
    expect(container.querySelector('[role="option"]')).toBeInTheDocument();
  });

  it('does not show selection controls when no context is available', () => {
    const conv = createMockConversation();
    render(<CometChatConversationsItem conversation={conv} />);

    expect(screen.queryByTestId('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByTestId('radio')).not.toBeInTheDocument();
  });
});
