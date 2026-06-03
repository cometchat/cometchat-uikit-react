import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CometChatGroupMembers } from '../CometChatGroupMembers';

// Mock IntersectionObserver
beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

// --- Mock CometChat SDK ---
const mockFetchNext = vi.fn();

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    GroupMembersRequestBuilder: vi.fn(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setSearchKeyword: vi.fn().mockReturnThis(),
      build: () => ({ fetchNext: mockFetchNext }),
    })),
    GroupListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    UserListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    ConnectionListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    addGroupListener: vi.fn(),
    removeGroupListener: vi.fn(),
    addUserListener: vi.fn(),
    removeUserListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
    kickGroupMember: vi.fn(),
    banGroupMember: vi.fn(),
    unbanGroupMember: vi.fn(),
    updateGroupMemberScope: vi.fn(),
    getLoggedinUser: vi.fn().mockResolvedValue({
      getUid: () => 'owner-uid',
      getName: () => 'Owner',
    }),
    GROUP_MEMBER_SCOPE: {
      ADMIN: 'admin',
      MODERATOR: 'moderator',
      PARTICIPANT: 'participant',
    },
  },
}));

vi.mock('../../../utils/CometChatLogger', () => ({
  CometChatLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        group_members_header: 'Members',
        group_members_admin: 'Admin',
        group_members_moderator: 'Moderator',
        group_members_owner: 'Owner',
        group_members_participant: 'Participant',
        group_members_empty: 'No Members Found',
        group_members_error: 'Something Went Wrong',
        group_members_search_placeholder: 'Search members',
      };
      return translations[key] ?? key;
    },
    language: 'en-us',
  }),
}));

// Mock base components to simplify rendering
vi.mock('../../base/CometChatAvatar/CometChatAvatar', () => ({
  CometChatAvatar: {
    Root: ({ children, name }: { children: React.ReactNode; name: string }) => (
      <div data-testid={`avatar-${name}`}>{children}</div>
    ),
    Image: () => <span data-testid="avatar-image" />,
    Initials: () => <span data-testid="avatar-initials" />,
    StatusIndicator: ({ status }: { status: string }) => <span data-testid={`status-${status}`} />,
  },
}));

vi.mock('../../base/CometChatCheckbox/CometChatCheckbox', () => ({
  CometChatCheckbox: ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (e: { checked: boolean }) => void;
  }) => (
    <input
      type="checkbox"
      data-testid="checkbox"
      checked={checked}
      onChange={() => onChange({ checked: !checked })}
    />
  ),
}));

vi.mock('../../base/CometChatRadioButton/CometChatRadioButton', () => ({
  CometChatRadioButton: ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <input type="radio" data-testid="radio" checked={checked} onChange={onChange} />
  ),
}));

vi.mock('../../base/CometChatContextMenu/CometChatContextMenu', () => ({
  CometChatContextMenu: {
    Root: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="context-menu">{children}</div>
    ),
    Trigger: ({ children }: { children?: React.ReactNode }) => (
      <button data-testid="context-menu-trigger">{children}</button>
    ),
    Dropdown: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="context-menu-dropdown">{children}</div>
    ),
    Item: ({ item }: { item: { id: string; title: string }; variant: string }) => (
      <button data-testid={`menu-item-${item.id}`}>{item.title}</button>
    ),
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
      onChange: (v: string) => void;
      debounceMs?: number;
      children?: React.ReactNode;
    }) => (
      <div data-testid="search-bar">
        <input
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          data-testid="search-input"
        />
        {children}
      </div>
    ),
    Icon: () => <span data-testid="search-icon" />,
    Input: () => null,
    ClearButton: () => null,
  },
}));

// --- Mock data factories ---
function createMockGroup() {
  return {
    getGuid: () => 'group-1',
    getName: () => 'Test Group',
    getOwner: () => 'owner-uid',
    getMembersCount: () => 5,
  } as unknown as CometChat.Group;
}

function createMockMember(uid: string, name: string, scope = 'participant', status = 'online') {
  return {
    getUid: () => uid,
    getName: () => name,
    getAvatar: () => '',
    getScope: () => scope,
    getStatus: () => status,
    setScope: vi.fn(),
    setStatus: vi.fn(),
    setName: vi.fn(),
    setAvatar: vi.fn(),
  } as unknown as CometChat.GroupMember;
}

describe('CometChatGroupMembers — Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the full compound component with header, search bar, and members', async () => {
    const members = [
      createMockMember('u1', 'Alice', 'admin'),
      createMockMember('u2', 'Bob', 'participant'),
    ];
    mockFetchNext.mockResolvedValueOnce(members);

    render(<CometChatGroupMembers.Root group={createMockGroup()} />);

    // Header should be visible
    await waitFor(() => {
      expect(screen.getByText('Members')).toBeInTheDocument();
    });

    // Search bar should be visible
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();

    // Members should be rendered
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('renders role badges for non-participant members', async () => {
    const members = [
      createMockMember('u1', 'Alice', 'owner'),
      createMockMember('u2', 'Bob', 'admin'),
      createMockMember('u3', 'Charlie', 'moderator'),
      createMockMember('u4', 'Diana', 'participant'),
    ];
    mockFetchNext.mockResolvedValueOnce(members);

    render(<CometChatGroupMembers.Root group={createMockGroup()} />);

    await waitFor(() => {
      expect(screen.getByText('Owner')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Moderator')).toBeInTheDocument();
    });

    // Participant should NOT have a badge
    expect(screen.queryByText('Participant')).not.toBeInTheDocument();
  });

  it('renders loading state (shimmer) when fetching', async () => {
    // Never resolve to keep in loading state
    mockFetchNext.mockReturnValueOnce(new Promise(() => {}));

    const { container } = render(<CometChatGroupMembers.Root group={createMockGroup()} />);

    await waitFor(() => {
      const shimmerItems = container.querySelectorAll('[class*="shimmer-item"]');
      expect(shimmerItems.length).toBeGreaterThan(0);
    });
  });

  it('renders empty state when no members returned', async () => {
    mockFetchNext.mockResolvedValueOnce([]);

    render(<CometChatGroupMembers.Root group={createMockGroup()} />);

    await waitFor(() => {
      expect(screen.getByText('No Members Found')).toBeInTheDocument();
    });
  });

  it('renders error state when fetch fails', async () => {
    mockFetchNext.mockRejectedValueOnce(new Error('Network error'));

    render(<CometChatGroupMembers.Root group={createMockGroup()} />);

    await waitFor(() => {
      // The error state renders "OOPS!" title and "Looks like something went wrong" subtitle
      expect(screen.getByText('OOPS!')).toBeInTheDocument();
      expect(screen.getByText('Looks like something went wrong')).toBeInTheDocument();
    });
  });

  it('renders checkboxes in multiple selection mode', async () => {
    const members = [createMockMember('u1', 'Alice')];
    mockFetchNext.mockResolvedValueOnce(members);

    render(<CometChatGroupMembers.Root group={createMockGroup()} selectionMode="multiple" />);

    await waitFor(() => {
      expect(screen.getByTestId('checkbox')).toBeInTheDocument();
    });
  });

  it('renders radio buttons in single selection mode', async () => {
    const members = [createMockMember('u1', 'Alice')];
    mockFetchNext.mockResolvedValueOnce(members);

    render(<CometChatGroupMembers.Root group={createMockGroup()} selectionMode="single" />);

    await waitFor(() => {
      expect(screen.getByTestId('radio')).toBeInTheDocument();
    });
  });

  it('calls onItemClick when a member is clicked', async () => {
    const onItemClick = vi.fn();
    const members = [createMockMember('u1', 'Alice')];
    mockFetchNext.mockResolvedValueOnce(members);

    render(<CometChatGroupMembers.Root group={createMockGroup()} onItemClick={onItemClick} />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Alice'));
    expect(onItemClick).toHaveBeenCalled();
  });

  it('calls onError when fetch fails', async () => {
    const onError = vi.fn();
    mockFetchNext.mockRejectedValueOnce(new Error('Fail'));

    render(<CometChatGroupMembers.Root group={createMockGroup()} onError={onError} />);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it('calls onEmpty when no members are returned', async () => {
    const onEmpty = vi.fn();
    mockFetchNext.mockResolvedValueOnce([]);

    render(<CometChatGroupMembers.Root group={createMockGroup()} onEmpty={onEmpty} />);

    await waitFor(() => {
      expect(onEmpty).toHaveBeenCalled();
    });
  });

  it('renders custom children when provided (compound composition)', () => {
    mockFetchNext.mockResolvedValueOnce([createMockMember('u1', 'Alice')]);

    render(
      <CometChatGroupMembers.Root group={createMockGroup()}>
        <div data-testid="custom-child">Custom Content</div>
      </CometChatGroupMembers.Root>
    );

    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    // Default header should NOT be rendered
    expect(screen.queryByText('Members')).not.toBeInTheDocument();
  });

  it('renders header with custom title', () => {
    mockFetchNext.mockResolvedValueOnce([]);

    render(
      <CometChatGroupMembers.Root group={createMockGroup()}>
        <CometChatGroupMembers.Header title="Group People" />
      </CometChatGroupMembers.Root>
    );

    expect(screen.getByText('Group People')).toBeInTheDocument();
  });

  it('has correct ARIA attributes on the container', () => {
    mockFetchNext.mockResolvedValueOnce([]);

    const { container } = render(<CometChatGroupMembers.Root group={createMockGroup()} />);

    const region = container.querySelector('[role="region"]');
    expect(region).toHaveAttribute('aria-label', 'Group Members');
  });

  it('renders status indicators when hideUserStatus is false', async () => {
    const members = [createMockMember('u1', 'Alice', 'participant', 'online')];
    mockFetchNext.mockResolvedValueOnce(members);

    render(<CometChatGroupMembers.Root group={createMockGroup()} hideUserStatus={false} />);

    await waitFor(() => {
      expect(screen.getByTestId('status-online')).toBeInTheDocument();
    });
  });

  it('hides status indicators when hideUserStatus is true', async () => {
    const members = [createMockMember('u1', 'Alice', 'participant', 'online')];
    mockFetchNext.mockResolvedValueOnce(members);

    render(<CometChatGroupMembers.Root group={createMockGroup()} hideUserStatus={true} />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('status-online')).not.toBeInTheDocument();
  });
});
