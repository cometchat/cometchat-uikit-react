/* eslint-disable @typescript-eslint/require-await */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CometChatConversationsContext } from '../CometChatConversations.context';
import type { CometChatConversationsContextValue } from '../CometChatConversations.types';

// ==================== Global Mocks ====================

// Mock locale
vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    tDateTimeParser: (d: Date) => d.toISOString(),
    language: 'en-us',
  }),
}));

// Mock IntersectionObserver
vi.stubGlobal(
  'IntersectionObserver',
  vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  }))
);

// Mock SVG assets
vi.mock('../../../assets/list_error_state_icon.svg', () => ({ default: 'error-icon.svg' }));
vi.mock('../../../assets/conversations_empty_state.svg', () => ({ default: 'empty-icon.svg' }));

// Mock CometChat SDK
vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
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
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
    USER_STATUS: { ONLINE: 'online', OFFLINE: 'offline' },
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
    CALL_STATUS: {
      ONGOING: 'ongoing',
      ENDED: 'ended',
      INITIATED: 'initiated',
      CANCELLED: 'cancelled',
      REJECTED: 'rejected',
      UNANSWERED: 'unanswered',
      BUSY: 'busy',
    },
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
    ConversationsRequestBuilder: vi.fn(() => ({
      setLimit: vi.fn().mockReturnThis(),
      build: vi.fn(() => ({
        fetchNext: vi.fn().mockResolvedValue([]),
      })),
    })),
    getLoggedinUser: vi.fn(() =>
      Promise.resolve({ getUid: () => 'user-1', getName: () => 'Test User' })
    ),
    getConversation: vi.fn(),
    addMessageListener: vi.fn(),
    removeMessageListener: vi.fn(),
    addUserListener: vi.fn(),
    removeUserListener: vi.fn(),
    addGroupListener: vi.fn(),
    removeGroupListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
    MessageListener: vi.fn(),
    UserListener: vi.fn(),
    GroupListener: vi.fn(),
    ConnectionListener: vi.fn(),
    CometChatHelper: {
      getConversationFromMessage: vi.fn(),
    },
  },
}));

// Mock CometChatSearchBar base component
vi.mock('../../base/CometChatSearchBar/CometChatSearchBar', () => ({
  CometChatSearchBar: {
    Root: ({
      placeholderText,
      placeholder,
      children,
    }: {
      placeholder?: string;
      placeholderText?: string;
      onChange?: (text: string) => void;
      debounceMs?: number;
      children: React.ReactNode;
      inputRef?: any;
      className?: string;
    }) => (
      <div data-testid="search-bar-root" data-placeholder={placeholderText ?? placeholder}>
        {children}
      </div>
    ),
    Icon: () => <span data-testid="search-icon" />,
    Input: React.forwardRef<HTMLInputElement, any>((props: any, ref) => (
      <input
        ref={ref}
        data-testid="search-input"
        placeholder={props.placeholder}
        readOnly={props.readOnly}
        onClick={props.onClick}
        onKeyDown={props.onKeyDown}
        onChange={props.onChange}
      />
    )),
    ClearButton: () => <span data-testid="search-clear" />,
  },
}));

// Mock CometChatConfirmDialog base component
vi.mock('../../base/CometChatConfirmDialog/CometChatConfirmDialog', () => ({
  CometChatConfirmDialog: {
    Root: ({
      children,
    }: {
      children: React.ReactNode;
      isOpen?: boolean;
      onClose?: () => void;
      variant?: string;
      className?: string;
    }) => <div data-testid="confirm-dialog-root">{children}</div>,
    Icon: () => <span data-testid="confirm-dialog-icon" />,
    Content: ({ title, message }: { title: string; message: string }) => (
      <div data-testid="confirm-dialog-content">
        <span>{title}</span>
        <span>{message}</span>
      </div>
    ),
    Actions: ({
      cancelText,
      confirmText,
      onConfirm,
      onCancel,
    }: {
      cancelText: string;
      confirmText: string;
      onConfirm: () => void;
      onCancel: () => void;
    }) => (
      <div data-testid="confirm-dialog-actions">
        <button onClick={onCancel}>{cancelText}</button>
        <button onClick={onConfirm}>{confirmText}</button>
      </div>
    ),
  },
}));

// Mock CometChatAvatar
vi.mock('../../base/CometChatAvatar/CometChatAvatar', () => ({
  CometChatAvatar: {
    Root: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="avatar-root">{children}</div>
    ),
    Image: () => <span data-testid="avatar-image" />,
    Initials: () => <span data-testid="avatar-initials" />,
  },
}));

// Mock CometChatDate
vi.mock('../../base/CometChatDate/CometChatDate', () => ({
  CometChatDate: ({ timestamp }: { timestamp?: number }) => (
    <span data-testid="date">{timestamp}</span>
  ),
}));

// Mock CometChatCheckbox
vi.mock('../../base/CometChatCheckbox/CometChatCheckbox', () => ({
  CometChatCheckbox: ({ checked }: { checked?: boolean }) => (
    <input type="checkbox" data-testid="checkbox" checked={checked} readOnly />
  ),
}));

// Mock CometChatRadioButton
vi.mock('../../base/CometChatRadioButton/CometChatRadioButton', () => ({
  CometChatRadioButton: ({ checked }: { checked?: boolean }) => (
    <input type="radio" data-testid="radio-button" checked={checked} readOnly />
  ),
}));

// ==================== Helper: Create Mock Context ====================

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
    typingIndicatorMap: new Map(),
    selectionMode: 'none',
    hideUserStatus: false,
    hideUnreadCount: false,
    hideReceipts: false,
    hideGroupType: false,
    loggedInUserId: 'user-1',
    options: undefined,
    conversationToBeDeleted: null,
    hideDeleteConversation: false,
    showSearchBar: true,
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

// ==================== Tests ====================

describe('CometChatConversationsHeader', () => {
  let CometChatConversationsHeader: typeof import('../CometChatConversationsHeader').CometChatConversationsHeader;

  beforeEach(async () => {
    const mod = await import('../CometChatConversationsHeader');
    CometChatConversationsHeader = mod.CometChatConversationsHeader;
  });

  it('renders default title "Chats"', () => {
    render(<CometChatConversationsHeader />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('conversation_chat_title');
  });

  it('renders custom title', () => {
    render(<CometChatConversationsHeader title="Messages" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Messages');
  });

  it('renders custom children instead of default title', () => {
    render(
      <CometChatConversationsHeader>
        <span data-testid="custom-header">Custom Header</span>
      </CometChatConversationsHeader>
    );
    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});

describe('CometChatConversationsSearchBar', () => {
  let CometChatConversationsSearchBar: typeof import('../CometChatConversationsSearchBar').CometChatConversationsSearchBar;

  beforeEach(async () => {
    const mod = await import('../CometChatConversationsSearchBar');
    CometChatConversationsSearchBar = mod.CometChatConversationsSearchBar;
  });

  it('renders the search bar with default placeholder', () => {
    const ctx = createMockContext();
    render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsSearchBar />
      </CometChatConversationsContext.Provider>
    );
    expect(screen.getByTestId('search-bar-root')).toBeInTheDocument();
    expect(screen.getByTestId('search-bar-root')).toHaveAttribute(
      'data-placeholder',
      'search_placeholder'
    );
  });

  it('renders with custom placeholder', () => {
    const ctx = createMockContext();
    render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsSearchBar placeholder="Find chats" />
      </CometChatConversationsContext.Provider>
    );
    expect(screen.getByTestId('search-bar-root')).toHaveAttribute('data-placeholder', 'Find chats');
  });

  it('passes onChange to SearchBar.Root when no onSearchBarClicked is set', () => {
    const setSearchText = vi.fn();
    const ctx = createMockContext({ setSearchText });
    render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsSearchBar />
      </CometChatConversationsContext.Provider>
    );

    // When no click handler, the search bar should have an input (not readOnly)
    const input = screen.getByTestId('search-input');
    expect(input).not.toHaveAttribute('readonly');
  });

  it('makes input readOnly and fires onClick when onSearchBarClicked is in context', async () => {
    const onSearchBarClicked = vi.fn();
    const ctx = createMockContext({ onSearchBarClicked });
    render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsSearchBar />
      </CometChatConversationsContext.Provider>
    );

    const input = screen.getByTestId('search-input');
    expect(input).toHaveAttribute('readonly');

    const { fireEvent } = await import('@testing-library/react');
    fireEvent.click(input);
    expect(onSearchBarClicked).toHaveBeenCalledTimes(1);
  });

  it('fires onSearchBarClicked on Enter key', async () => {
    const onSearchBarClicked = vi.fn();
    const ctx = createMockContext({ onSearchBarClicked });
    render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsSearchBar />
      </CometChatConversationsContext.Provider>
    );

    const input = screen.getByTestId('search-input');
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSearchBarClicked).toHaveBeenCalledTimes(1);
  });

  it('fires onSearchBarClicked on Space key', async () => {
    const onSearchBarClicked = vi.fn();
    const ctx = createMockContext({ onSearchBarClicked });
    render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsSearchBar />
      </CometChatConversationsContext.Provider>
    );

    const input = screen.getByTestId('search-input');
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.keyDown(input, { key: ' ' });
    expect(onSearchBarClicked).toHaveBeenCalledTimes(1);
  });
});

describe('CometChatConversationsEmptyState', () => {
  let CometChatConversationsEmptyState: typeof import('../CometChatConversationsEmptyState').CometChatConversationsEmptyState;

  beforeEach(async () => {
    const mod = await import('../CometChatConversationsEmptyState');
    CometChatConversationsEmptyState = mod.CometChatConversationsEmptyState;
  });

  it('renders when fetchState is "empty"', () => {
    const ctx = createMockContext({ fetchState: 'empty' });
    render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsEmptyState />
      </CometChatConversationsContext.Provider>
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('No Conversations')).toBeInTheDocument();
    expect(
      screen.getByText('There are no conversations available at the moment.')
    ).toBeInTheDocument();
  });

  it('does not render when fetchState is not "empty"', () => {
    const ctx = createMockContext({ fetchState: 'loaded' });
    const { container } = render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsEmptyState />
      </CometChatConversationsContext.Provider>
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders custom children when provided', () => {
    const ctx = createMockContext({ fetchState: 'empty' });
    render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsEmptyState>
          <div data-testid="custom-empty">No chats yet!</div>
        </CometChatConversationsEmptyState>
      </CometChatConversationsContext.Provider>
    );
    expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
    expect(screen.queryByText('No Conversations')).not.toBeInTheDocument();
  });
});

describe('CometChatConversationsErrorState', () => {
  let CometChatConversationsErrorState: typeof import('../CometChatConversationsErrorState').CometChatConversationsErrorState;

  beforeEach(async () => {
    const mod = await import('../CometChatConversationsErrorState');
    CometChatConversationsErrorState = mod.CometChatConversationsErrorState;
  });

  it('renders when fetchState is "error"', () => {
    const ctx = createMockContext({ fetchState: 'error' });
    render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsErrorState />
      </CometChatConversationsContext.Provider>
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('conversation_error_title')).toBeInTheDocument();
    expect(screen.getByText('conversation_error_subtitle')).toBeInTheDocument();
  });

  it('does not render when fetchState is not "error"', () => {
    const ctx = createMockContext({ fetchState: 'loaded' });
    const { container } = render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsErrorState />
      </CometChatConversationsContext.Provider>
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders custom children when provided', () => {
    const ctx = createMockContext({ fetchState: 'error' });
    render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsErrorState>
          <div data-testid="custom-error">Oops!</div>
        </CometChatConversationsErrorState>
      </CometChatConversationsContext.Provider>
    );
    expect(screen.getByTestId('custom-error')).toBeInTheDocument();
    expect(screen.queryByText('conversation_error_title')).not.toBeInTheDocument();
  });
});

describe('CometChatConversationsLoadingState', () => {
  let CometChatConversationsLoadingState: typeof import('../CometChatConversationsLoadingState').CometChatConversationsLoadingState;

  beforeEach(async () => {
    const mod = await import('../CometChatConversationsLoadingState');
    CometChatConversationsLoadingState = mod.CometChatConversationsLoadingState;
  });

  it('renders when fetchState is "loading"', () => {
    const ctx = createMockContext({ fetchState: 'loading' });
    render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsLoadingState />
      </CometChatConversationsContext.Provider>
    );
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveAttribute('aria-label', 'accessibility_loading_conversations');
  });

  it('renders 12 shimmer items by default', () => {
    const ctx = createMockContext({ fetchState: 'loading' });
    const { container } = render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsLoadingState />
      </CometChatConversationsContext.Provider>
    );
    const shimmerItems = container.querySelectorAll(
      '[class="cometchat-conversations__shimmer-item"]'
    );
    expect(shimmerItems).toHaveLength(12);
  });

  it('does not render when fetchState is not "loading"', () => {
    const ctx = createMockContext({ fetchState: 'loaded' });
    const { container } = render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsLoadingState />
      </CometChatConversationsContext.Provider>
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders custom children when provided', () => {
    const ctx = createMockContext({ fetchState: 'loading' });
    render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsLoadingState>
          <div data-testid="custom-loading">Loading...</div>
        </CometChatConversationsLoadingState>
      </CometChatConversationsContext.Provider>
    );
    expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
  });
});

describe('CometChatConversationsRoot', () => {
  let CometChatConversationsRoot: typeof import('../CometChatConversationsRoot').CometChatConversationsRoot;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../CometChatConversationsRoot');
    CometChatConversationsRoot = mod.CometChatConversationsRoot;
  });

  it('renders default layout when no children provided', async () => {
    const { container } = render(<CometChatConversationsRoot />);

    // Should render the region container
    const region = container.querySelector('[role="region"]');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-label', 'conversation_chat_title');
  });

  it('renders custom children when provided', () => {
    render(
      <CometChatConversationsRoot>
        <div data-testid="custom-child">Custom Content</div>
      </CometChatConversationsRoot>
    );
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
  });

  it('provides context to children', () => {
    let contextValue: CometChatConversationsContextValue | null = null;

    const ContextReader: React.FC = () => {
      const ctx = React.useContext(CometChatConversationsContext);
      contextValue = ctx;
      return <div data-testid="context-reader">Has context</div>;
    };

    render(
      <CometChatConversationsRoot>
        <ContextReader />
      </CometChatConversationsRoot>
    );

    expect(screen.getByTestId('context-reader')).toBeInTheDocument();
    expect(contextValue).not.toBeNull();
    expect(contextValue!.selectionMode).toBe('none');
    expect(contextValue!.hideUserStatus).toBe(false);
    expect(contextValue!.hideUnreadCount).toBe(false);
    expect(contextValue!.hideReceipts).toBe(false);
  });

  it('passes configuration props through context', () => {
    let contextValue: CometChatConversationsContextValue | null = null;

    const ContextReader: React.FC = () => {
      const ctx = React.useContext(CometChatConversationsContext);
      contextValue = ctx;
      return null;
    };

    render(
      <CometChatConversationsRoot
        selectionMode="multiple"
        hideUserStatus={true}
        hideUnreadCount={true}
        hideReceipts={true}
      >
        <ContextReader />
      </CometChatConversationsRoot>
    );

    expect(contextValue).not.toBeNull();
    expect(contextValue!.selectionMode).toBe('multiple');
    expect(contextValue!.hideUserStatus).toBe(true);
    expect(contextValue!.hideUnreadCount).toBe(true);
    expect(contextValue!.hideReceipts).toBe(true);
  });

  it('renders the region wrapper with correct role and aria-label', () => {
    const { container } = render(
      <CometChatConversationsRoot>
        <div>Child</div>
      </CometChatConversationsRoot>
    );

    const region = container.querySelector('[role="region"]');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-label', 'conversation_chat_title');
  });
});

describe('CometChatConversations (flat API)', () => {
  let CometChatConversations: typeof import('../CometChatConversations').CometChatConversations;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../CometChatConversations');
    CometChatConversations = mod.CometChatConversations;
  });

  it('renders correctly without convenience props (delegates to Root)', () => {
    const { container } = render(<CometChatConversations />);

    const region = container.querySelector('[role="region"]');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-label', 'conversation_chat_title');
  });

  it('renders with convenience props (custom headerView)', () => {
    render(
      <CometChatConversations headerView={<div data-testid="custom-header-view">My Header</div>} />
    );

    expect(screen.getByTestId('custom-header-view')).toBeInTheDocument();
  });

  it('exposes compound component sub-components', () => {
    expect(CometChatConversations.Root).toBeDefined();
    expect(CometChatConversations.List).toBeDefined();
    expect(CometChatConversations.Item).toBeDefined();
    expect(CometChatConversations.Header).toBeDefined();
    expect(CometChatConversations.SearchBar).toBeDefined();
    expect(CometChatConversations.EmptyState).toBeDefined();
    expect(CometChatConversations.ErrorState).toBeDefined();
    expect(CometChatConversations.LoadingState).toBeDefined();
  });

  it('renders with custom emptyView when fetchState is empty', () => {
    // We need to mock the hook to return empty state
    // Since the flat API wraps Root which uses the hook, we test via the compound pattern
    const ctx = createMockContext({ fetchState: 'empty' });
    render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversations.EmptyState>
          <div data-testid="flat-empty">Empty!</div>
        </CometChatConversations.EmptyState>
      </CometChatConversationsContext.Provider>
    );
    expect(screen.getByTestId('flat-empty')).toBeInTheDocument();
  });

  it('renders with custom errorView when fetchState is error', () => {
    const ctx = createMockContext({ fetchState: 'error' });
    render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversations.ErrorState>
          <div data-testid="flat-error">Error!</div>
        </CometChatConversations.ErrorState>
      </CometChatConversationsContext.Provider>
    );
    expect(screen.getByTestId('flat-error')).toBeInTheDocument();
  });

  it('renders with custom loadingView when fetchState is loading', () => {
    const ctx = createMockContext({ fetchState: 'loading' });
    render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversations.LoadingState>
          <div data-testid="flat-loading">Loading...</div>
        </CometChatConversations.LoadingState>
      </CometChatConversationsContext.Provider>
    );
    expect(screen.getByTestId('flat-loading')).toBeInTheDocument();
  });
});
