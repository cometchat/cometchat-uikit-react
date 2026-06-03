import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CometChatGroupsContext } from '../CometChatGroups.context';
import { CometChatGroupsHeader } from '../CometChatGroupsHeader';
import { CometChatGroupsSearchBar } from '../CometChatGroupsSearchBar';
import { CometChatGroupsItem } from '../CometChatGroupsItem';
import { CometChatGroupsManager } from '../CometChatGroupsManager';
import type { CometChatGroupsContextValue } from '../CometChatGroups.types';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

// --- Mock SDK ---
vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    GroupsRequestBuilder: vi.fn(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setSearchKeyword: vi.fn().mockReturnThis(),
      build: vi.fn(() => ({ fetchNext: vi.fn().mockResolvedValue([]) })),
    })),
    GroupListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    ConnectionListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    addGroupListener: vi.fn(),
    removeGroupListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
    createGroup: vi.fn(),
    joinGroup: vi.fn(),
    leaveGroup: vi.fn(),
    deleteGroup: vi.fn(),
    getLoggedinUser: vi.fn().mockResolvedValue({ getUid: () => 'logged-in-user' }),
    GroupType: { Public: 'public', Private: 'private', Password: 'password' },
  },
}));

// --- Mock useCometChatGroups for Root tests ---
const mockHookReturn = {
  groups: [],
  fetchState: 'loaded' as const,
  hasMore: false,
  error: null,
  selectedGroupIds: [] as string[],
  selectedGroupsMap: new Map(),
  activeGroupId: null,
  searchText: '',
  fetchNext: vi.fn(),
  setSearchText: vi.fn(),
  selectGroup: vi.fn(),
  deselectGroup: vi.fn(),
  selectRange: vi.fn(),
  deselectRange: vi.fn(),
  clearSelection: vi.fn(),
  setActiveGroup: vi.fn(),
  handleItemClick: vi.fn(),
  createGroup: vi.fn(),
  joinGroup: vi.fn(),
  leaveGroup: vi.fn(),
  deleteGroup: vi.fn(),
};

vi.mock('../useCometChatGroups', () => ({
  useCometChatGroups: vi.fn(() => mockHookReturn),
}));

// --- Mock base components ---
vi.mock('../../base/CometChatAvatar/CometChatAvatar', () => ({
  CometChatAvatar: {
    Root: ({ name, children }: { name: string; children: React.ReactNode }) => (
      <div data-testid="avatar" data-name={name}>
        {children}
      </div>
    ),
    Image: () => <span data-testid="avatar-image" />,
    Initials: () => <span data-testid="avatar-initials" />,
  },
}));

vi.mock('../../base/CometChatCheckbox/CometChatCheckbox', () => ({
  CometChatCheckbox: ({
    checked,
    onChange,
    'aria-label': ariaLabel,
  }: {
    checked: boolean;
    onChange: (event: { checked: boolean; shiftKey?: boolean }) => void;
    'aria-label': string;
  }) => (
    <input
      type="checkbox"
      checked={checked}
      aria-label={ariaLabel}
      onChange={e => onChange({ checked: e.target.checked })}
      data-testid="checkbox"
    />
  ),
}));

vi.mock('../../base/CometChatRadioButton/CometChatRadioButton', () => ({
  CometChatRadioButton: ({
    checked,
    onChange,
    ariaLabel,
  }: {
    checked: boolean;
    onChange: () => void;
    ariaLabel: string;
    name: string;
  }) => (
    <input
      type="radio"
      checked={checked}
      aria-label={ariaLabel}
      onChange={onChange}
      data-testid="radio"
    />
  ),
}));

vi.mock('../../base/CometChatContextMenu/CometChatContextMenu', () => ({
  CometChatContextMenu: {
    Root: () => <div data-testid="context-menu" />,
  },
}));

vi.mock('../../base/CometChatSearchBar/CometChatSearchBar', () => ({
  CometChatSearchBar: {
    Root: ({
      placeholder,
      onChange,
      children,
    }: {
      placeholder: string;
      onChange: (text: string) => void;
      debounceMs?: number;
      children: React.ReactNode;
    }) => (
      <div data-testid="search-bar-root">
        <input
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          data-testid="search-input"
        />
        {children}
      </div>
    ),
    Icon: () => <span data-testid="search-icon" />,
    Input: () => <span data-testid="search-input-sub" />,
    ClearButton: () => <span data-testid="search-clear" />,
  },
}));

vi.mock('../../../assets/groups_empty_state.svg', () => ({
  default: 'empty-state-icon.svg',
}));

// --- Helpers ---

function createMockGroup(
  guid: string,
  name = 'Group',
  type = 'public',
  membersCount = 5
): CometChat.Group {
  return {
    getGuid: () => guid,
    getName: () => name,
    getType: () => type,
    getIcon: () => `https://example.com/${guid}.png`,
    getMembersCount: () => membersCount,
    getScope: () => 'admin',
    getOwner: () => 'owner-1',
    getHasJoined: () => true,
  } as unknown as CometChat.Group;
}

function createMockContext(
  overrides: Partial<CometChatGroupsContextValue> = {}
): CometChatGroupsContextValue {
  return {
    groups: [],
    fetchState: 'loaded',
    hasMore: false,
    error: null,
    selectedGroupIds: [],
    selectedGroupsMap: new Map(),
    activeGroupId: null,
    searchText: '',
    selectionMode: 'none',
    hideGroupType: false,
    hideSearch: false,
    options: undefined,
    fetchNext: vi.fn(),
    setSearchText: vi.fn(),
    selectGroup: vi.fn(),
    deselectGroup: vi.fn(),
    selectRange: vi.fn(),
    deselectRange: vi.fn(),
    clearSelection: vi.fn(),
    setActiveGroup: vi.fn(),
    handleItemClick: vi.fn(),
    createGroup: vi.fn(),
    joinGroup: vi.fn(),
    leaveGroup: vi.fn(),
    deleteGroup: vi.fn(),
    ...overrides,
  };
}

// =============================================================================
// CometChatGroupsRoot
// =============================================================================

describe('CometChatGroupsRoot', () => {
  // Import dynamically so the mock of useCometChatGroups is applied
  let CometChatGroupsRoot: typeof import('../CometChatGroupsRoot').CometChatGroupsRoot;

  beforeEach(async () => {
    const mod = await import('../CometChatGroupsRoot');
    CometChatGroupsRoot = mod.CometChatGroupsRoot;
  });

  it('renders default layout when no children provided (renders Header, SearchBar, List)', () => {
    Object.assign(mockHookReturn, {
      groups: [createMockGroup('g1', 'Test Group')],
      fetchState: 'loaded',
    });

    render(<CometChatGroupsRoot />);

    // Header renders with default title
    expect(screen.getByRole('heading', { name: 'Groups' })).toBeInTheDocument();
    // SearchBar renders
    expect(screen.getByTestId('search-bar-root')).toBeInTheDocument();
    // List renders with items
    expect(screen.getByRole('listbox', { name: 'Groups list' })).toBeInTheDocument();
  });

  it('renders custom children when provided', () => {
    render(
      <CometChatGroupsRoot>
        <div data-testid="custom-child">Custom Content</div>
      </CometChatGroupsRoot>
    );

    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    // Default layout should NOT render
    expect(screen.queryByRole('heading', { name: 'Groups' })).not.toBeInTheDocument();
  });

  it('shows LoadingState when fetchState is loading', () => {
    Object.assign(mockHookReturn, { fetchState: 'loading', groups: [] });

    render(<CometChatGroupsRoot />);

    const loading = screen.getByRole('status');
    expect(loading).toHaveAttribute('aria-busy', 'true');
  });

  it('shows ErrorState when fetchState is error', () => {
    Object.assign(mockHookReturn, { fetchState: 'error', groups: [], error: 'Network error' });

    render(<CometChatGroupsRoot />);

    expect(screen.getByText('Looks like something went wrong')).toBeInTheDocument();
  });

  it('shows EmptyState when fetchState is empty', () => {
    Object.assign(mockHookReturn, { fetchState: 'empty', groups: [] });

    render(<CometChatGroupsRoot />);

    expect(screen.getByText('No Groups Available')).toBeInTheDocument();
  });
});

// =============================================================================
// CometChatGroupsHeader
// =============================================================================

describe('CometChatGroupsHeader', () => {
  it('renders with default title "Groups"', () => {
    render(<CometChatGroupsHeader />);

    expect(screen.getByRole('heading', { name: 'Groups' })).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(<CometChatGroupsHeader title="My Teams" />);

    expect(screen.getByRole('heading', { name: 'My Teams' })).toBeInTheDocument();
  });

  it('renders custom children', () => {
    render(
      <CometChatGroupsHeader>
        <span data-testid="custom-header">Custom Header</span>
      </CometChatGroupsHeader>
    );

    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    // Default title should NOT render
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});

// =============================================================================
// CometChatGroupsSearchBar
// =============================================================================

describe('CometChatGroupsSearchBar', () => {
  it('renders search input with placeholder', () => {
    const ctx = createMockContext();
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsSearchBar />
      </CometChatGroupsContext.Provider>
    );

    expect(screen.getByPlaceholderText('Search groups')).toBeInTheDocument();
  });

  it('calls setSearchText from context on input change', () => {
    const setSearchText = vi.fn();
    const ctx = createMockContext({ setSearchText });
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsSearchBar />
      </CometChatGroupsContext.Provider>
    );

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'test query' } });

    expect(setSearchText).toHaveBeenCalledWith('test query');
  });
});

// =============================================================================
// CometChatGroupsItem
// =============================================================================

describe('CometChatGroupsItem', () => {
  it('renders group name and member count', () => {
    const group = createMockGroup('g1', 'Alpha Team', 'public', 12);
    const ctx = createMockContext();
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem group={group} />
      </CometChatGroupsContext.Provider>
    );

    expect(screen.getByText('Alpha Team')).toBeInTheDocument();
    expect(screen.getByText('12 message_header_members')).toBeInTheDocument();
  });

  it('calls handleItemClick on click', () => {
    const handleItemClick = vi.fn();
    const group = createMockGroup('g1', 'Alpha Team');
    const ctx = createMockContext({ handleItemClick });
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem group={group} />
      </CometChatGroupsContext.Provider>
    );

    fireEvent.click(screen.getByRole('option'));

    expect(handleItemClick).toHaveBeenCalledWith(
      group,
      expect.objectContaining({ shiftKey: false })
    );
  });

  it('calls handleItemClick on Enter key', () => {
    const handleItemClick = vi.fn();
    const group = createMockGroup('g1', 'Alpha Team');
    const ctx = createMockContext({ handleItemClick });
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem group={group} />
      </CometChatGroupsContext.Provider>
    );

    fireEvent.keyDown(screen.getByRole('option'), { key: 'Enter' });

    expect(handleItemClick).toHaveBeenCalledWith(
      group,
      expect.objectContaining({ shiftKey: false })
    );
  });

  it('calls handleItemClick on Space key', () => {
    const handleItemClick = vi.fn();
    const group = createMockGroup('g1', 'Alpha Team');
    const ctx = createMockContext({ handleItemClick });
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem group={group} />
      </CometChatGroupsContext.Provider>
    );

    fireEvent.keyDown(screen.getByRole('option'), { key: ' ' });

    expect(handleItemClick).toHaveBeenCalledWith(
      group,
      expect.objectContaining({ shiftKey: false })
    );
  });

  it('shows checkbox in multiple selection mode', () => {
    const group = createMockGroup('g1', 'Alpha Team');
    const ctx = createMockContext({ selectionMode: 'multiple' });
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem group={group} />
      </CometChatGroupsContext.Provider>
    );

    expect(screen.getByTestId('checkbox')).toBeInTheDocument();
  });

  it('shows radio button in single selection mode', () => {
    const group = createMockGroup('g1', 'Alpha Team');
    const ctx = createMockContext({ selectionMode: 'single' });
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem group={group} />
      </CometChatGroupsContext.Provider>
    );

    expect(screen.getByTestId('radio')).toBeInTheDocument();
  });

  it('shows type badge for private groups', () => {
    const group = createMockGroup('g1', 'Private Group', 'private');
    const ctx = createMockContext();
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem group={group} />
      </CometChatGroupsContext.Provider>
    );

    expect(screen.getByLabelText('Private group')).toBeInTheDocument();
  });

  it('shows type badge for password groups', () => {
    const group = createMockGroup('g1', 'Password Group', 'password');
    const ctx = createMockContext();
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem group={group} />
      </CometChatGroupsContext.Provider>
    );

    expect(screen.getByLabelText('Password protected group')).toBeInTheDocument();
  });

  it('does not show type badge for public groups', () => {
    const group = createMockGroup('g1', 'Public Group', 'public');
    const ctx = createMockContext();
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem group={group} />
      </CometChatGroupsContext.Provider>
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('applies active class when isActive', () => {
    const group = createMockGroup('g1', 'Alpha Team');
    const ctx = createMockContext({ activeGroupId: 'g1' });
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem group={group} />
      </CometChatGroupsContext.Provider>
    );

    const item = screen.getByRole('option');
    expect(item.className).toContain('cometchat-groups__item--active');
  });
});

// =============================================================================
// CometChatGroupsManager — GroupListener callbacks
// =============================================================================

describe('CometChatGroupsManager — GroupListener callbacks', () => {
  let addGroupListenerMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const sdk = await import('@cometchat/chat-sdk-javascript');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    addGroupListenerMock = vi.mocked(sdk.CometChat.addGroupListener);

    // CometChat.GroupListener is mocked to return the callbacks object directly
    // CometChat.addGroupListener is called with (listenerId, listenerInstance)
    // Since GroupListener mock returns the callbacks, we capture them from addGroupListener
    addGroupListenerMock.mockClear();
  });

  function attachAndCapture(
    callbacks: Parameters<typeof CometChatGroupsManager.attachGroupListener>[1]
  ) {
    const cleanup = CometChatGroupsManager.attachGroupListener('test-listener', callbacks);
    return cleanup;
  }

  it('GroupListener onGroupMemberJoined callback fires', () => {
    const onGroupMemberJoined = vi.fn();
    const cleanup = attachAndCapture({
      onGroupMemberJoined,
      onGroupMemberLeft: vi.fn(),
      onGroupMemberBanned: vi.fn(),
      onGroupMemberKicked: vi.fn(),
      onGroupMemberScopeChanged: vi.fn(),
    });

    // The addGroupListener was called with the listener object
    expect(addGroupListenerMock).toHaveBeenCalledWith('test-listener', expect.any(Object));

    // Get the listener callbacks that were passed to addGroupListener
    const listenerObj = addGroupListenerMock.mock.calls[0][1] as Record<
      string,
      (...args: unknown[]) => void
    >;

    // Invoke the callback
    const mockMessage = {} as CometChat.Action;
    const mockUser = { getUid: () => 'user-1' } as unknown as CometChat.User;
    const mockGroup = createMockGroup('g1', 'Test Group');

    listenerObj.onGroupMemberJoined(mockMessage, mockUser, mockGroup);

    expect(onGroupMemberJoined).toHaveBeenCalledWith(mockMessage, mockUser, mockGroup);

    cleanup();
  });

  it('GroupListener onGroupMemberLeft callback fires', () => {
    const onGroupMemberLeft = vi.fn();
    const cleanup = attachAndCapture({
      onGroupMemberJoined: vi.fn(),
      onGroupMemberLeft,
      onGroupMemberBanned: vi.fn(),
      onGroupMemberKicked: vi.fn(),
      onGroupMemberScopeChanged: vi.fn(),
    });

    const listenerObj = addGroupListenerMock.mock.calls[0][1] as Record<
      string,
      (...args: unknown[]) => void
    >;

    const mockMessage = {} as CometChat.Action;
    const mockUser = { getUid: () => 'user-1' } as unknown as CometChat.User;
    const mockGroup = createMockGroup('g1', 'Test Group');

    listenerObj.onGroupMemberLeft(mockMessage, mockUser, mockGroup);

    expect(onGroupMemberLeft).toHaveBeenCalledWith(mockMessage, mockUser, mockGroup);

    cleanup();
  });

  it('GroupListener onGroupMemberBanned callback fires', () => {
    const onGroupMemberBanned = vi.fn();
    const cleanup = attachAndCapture({
      onGroupMemberJoined: vi.fn(),
      onGroupMemberLeft: vi.fn(),
      onGroupMemberBanned,
      onGroupMemberKicked: vi.fn(),
      onGroupMemberScopeChanged: vi.fn(),
    });

    const listenerObj = addGroupListenerMock.mock.calls[0][1] as Record<
      string,
      (...args: unknown[]) => void
    >;

    const mockMessage = {} as CometChat.Action;
    const mockBannedUser = { getUid: () => 'user-2' } as unknown as CometChat.User;
    const mockBannedBy = { getUid: () => 'admin-1' } as unknown as CometChat.User;
    const mockGroup = createMockGroup('g1', 'Test Group');

    listenerObj.onGroupMemberBanned(mockMessage, mockBannedUser, mockBannedBy, mockGroup);

    expect(onGroupMemberBanned).toHaveBeenCalledWith(
      mockMessage,
      mockBannedUser,
      mockBannedBy,
      mockGroup
    );

    cleanup();
  });

  it('GroupListener onGroupMemberKicked callback fires', () => {
    const onGroupMemberKicked = vi.fn();
    const cleanup = attachAndCapture({
      onGroupMemberJoined: vi.fn(),
      onGroupMemberLeft: vi.fn(),
      onGroupMemberBanned: vi.fn(),
      onGroupMemberKicked,
      onGroupMemberScopeChanged: vi.fn(),
    });

    const listenerObj = addGroupListenerMock.mock.calls[0][1] as Record<
      string,
      (...args: unknown[]) => void
    >;

    const mockMessage = {} as CometChat.Action;
    const mockKickedUser = { getUid: () => 'user-3' } as unknown as CometChat.User;
    const mockKickedBy = { getUid: () => 'admin-1' } as unknown as CometChat.User;
    const mockGroup = createMockGroup('g1', 'Test Group');

    listenerObj.onGroupMemberKicked(mockMessage, mockKickedUser, mockKickedBy, mockGroup);

    expect(onGroupMemberKicked).toHaveBeenCalledWith(
      mockMessage,
      mockKickedUser,
      mockKickedBy,
      mockGroup
    );

    cleanup();
  });

  it('GroupListener onGroupMemberScopeChanged callback fires', () => {
    const onGroupMemberScopeChanged = vi.fn();
    const cleanup = attachAndCapture({
      onGroupMemberJoined: vi.fn(),
      onGroupMemberLeft: vi.fn(),
      onGroupMemberBanned: vi.fn(),
      onGroupMemberKicked: vi.fn(),
      onGroupMemberScopeChanged,
    });

    const listenerObj = addGroupListenerMock.mock.calls[0][1] as Record<
      string,
      (...args: unknown[]) => void
    >;

    const mockMessage = {} as CometChat.Action;
    const mockUser = { getUid: () => 'user-4' } as unknown as CometChat.User;
    const mockGroup = createMockGroup('g1', 'Test Group');

    listenerObj.onGroupMemberScopeChanged(mockMessage, mockUser, 'admin', 'participant', mockGroup);

    expect(onGroupMemberScopeChanged).toHaveBeenCalledWith(
      mockMessage,
      mockUser,
      'admin',
      'participant',
      mockGroup
    );

    cleanup();
  });
});
