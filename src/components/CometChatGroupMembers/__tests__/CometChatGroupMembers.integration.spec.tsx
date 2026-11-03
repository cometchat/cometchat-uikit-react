import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupMembers } from '../CometChatGroupMembers';
import { GlobalConfigProvider } from '../../../context/GlobalConfigContext';
import { covers } from '../../../testing/covers';

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
    GROUP_TYPE: { PRIVATE: 'private', PASSWORD: 'password', PUBLIC: 'public' },
    CALL_MODE: {
      DEFAULT: 'default',
      GRID: 'grid',
      SINGLE: 'single',
      SPOTLIGHT: 'spotlight',
      TILE: 'tile',
    },
    GoalType: { ALL_OF: 'allOf', ANY_OF: 'anyOf', ANY_ACTION: 'anyAction', NONE: 'none' },
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
    USER_STATUS: { ONLINE: 'online', OFFLINE: 'offline' },
    CALL_STATUS: {
      ONGOING: 'ongoing',
      ENDED: 'ended',
      INITIATED: 'initiated',
      CANCELLED: 'cancelled',
      REJECTED: 'rejected',
      UNANSWERED: 'unanswered',
      BUSY: 'busy',
    },
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
    getLocalizedString: (key: string) => {
      const translations: Record<string, string> = {
        group_members_header: 'Members',
        accessibility_back: 'Back',
        group_members_admin: 'Admin',
        group_members_moderator: 'Moderator',
        group_members_owner: 'Owner',
        group_members_participant: 'Participant',
        group_members_empty: 'No Members Found',
        group_members_error: 'Something Went Wrong',
        group_members_search_placeholder: 'Search members',
        member_scope_owner: 'Owner',
        empty_title: 'No Members Found',
        error_title: 'OOPS!',
        error_subtitle: 'Looks like something went wrong',
        member_empty_title: 'No Members Found',
        member_error_title: 'OOPS!',
        member_error_subtitle: 'Looks like something went wrong',
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
    Root: ({
      children,
      items = [],
    }: {
      children?: React.ReactNode;
      items?: { id: string; title: string; onClick?: () => void }[];
    }) => (
      <div data-testid="context-menu">
        {items.map(item => (
          <button key={item.id} data-testid={`option-${item.id}`} onClick={item.onClick}>
            {item.title}
          </button>
        ))}
        {children}
      </div>
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
    getBlockedByMe: () => false,
    getHasBlockedMe: () => false,
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

  it('hides the default header when hideHeader is set', async () => {
    covers('CometChatGroupMembers.hideHeader', 'true');
    const members = [createMockMember('u1', 'Alice', 'participant')];
    mockFetchNext.mockResolvedValueOnce(members);

    render(<CometChatGroupMembers group={createMockGroup()} hideHeader />);

    // Members still render, but the "Members" title should not.
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
    expect(screen.queryByText('Members')).not.toBeInTheDocument();
  });

  it('shows a back button only when onBack is set, and calls it on click', async () => {
    covers('CometChatGroupMembers.onBack', 'called');
    mockFetchNext.mockResolvedValueOnce([createMockMember('u1', 'Alice')]);
    const group = createMockGroup();
    const onBack = vi.fn();

    const { rerender } = render(<CometChatGroupMembers group={group} />);
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();

    rerender(<CometChatGroupMembers group={group} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('hides the list scrollbar by default and when showScrollbar is false, shows it when true', async () => {
    covers('CometChatGroupMembers.showScrollbar', 'default', 'false', 'true');
    const hidden = async (props: { showScrollbar?: boolean }) => {
      mockFetchNext.mockResolvedValueOnce([createMockMember('u1', 'Alice')]);
      const { container, unmount } = render(
        <CometChatGroupMembers group={createMockGroup()} {...props} />
      );
      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });
      const list = container.querySelector('.cometchat-group-members__list');
      if (!list) throw new Error('the list did not render');
      const result = list.classList.contains('cometchat-group-members__list--hide-scrollbar');
      unmount();
      return result;
    };

    expect(await hidden({})).toBe(true);
    expect(await hidden({ showScrollbar: false })).toBe(true);
    expect(await hidden({ showScrollbar: true })).toBe(false);
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

    await waitFor(
      () => {
        expect(screen.getByText('Owner')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('Moderator')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

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

    await waitFor(
      () => {
        expect(screen.getByText('No Members Found')).toBeInTheDocument();
      },
      { timeout: 5000, interval: 100 }
    );
  });

  it('renders error state when fetch fails', async () => {
    mockFetchNext.mockRejectedValueOnce(new Error('Network error'));

    render(<CometChatGroupMembers.Root group={createMockGroup()} />);

    await waitFor(
      () => {
        expect(screen.getByText('OOPS!')).toBeInTheDocument();
      },
      { timeout: 5000, interval: 100 }
    );
  });

  it('renders checkboxes in multiple selection mode', async () => {
    covers('CometChatGroupMembers.selectionMode', 'multiple');
    const members = [createMockMember('u1', 'Alice')];
    mockFetchNext.mockResolvedValueOnce(members);

    render(<CometChatGroupMembers.Root group={createMockGroup()} selectionMode="multiple" />);

    await waitFor(() => {
      expect(screen.getByTestId('checkbox')).toBeInTheDocument();
    });
  });

  it('renders radio buttons in single selection mode', async () => {
    covers('CometChatGroupMembers.selectionMode', 'single');
    const members = [createMockMember('u1', 'Alice')];
    mockFetchNext.mockResolvedValueOnce(members);

    render(<CometChatGroupMembers.Root group={createMockGroup()} selectionMode="single" />);

    await waitFor(() => {
      expect(screen.getByTestId('radio')).toBeInTheDocument();
    });
  });

  it('calls onItemClick when a member is clicked', async () => {
    covers('CometChatGroupMembers.onItemClick', 'called');
    const onItemClick = vi.fn();
    const members = [createMockMember('u1', 'Alice')];
    mockFetchNext.mockResolvedValueOnce(members);

    render(<CometChatGroupMembers.Root group={createMockGroup()} onItemClick={onItemClick} />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Alice'));
    expect(onItemClick).toHaveBeenCalledWith(members[0]);
  });

  it('calls onError when fetch fails', async () => {
    covers('CometChatGroupMembers.onError', 'called');
    const onError = vi.fn();
    mockFetchNext.mockRejectedValueOnce(new Error('Fail'));

    render(<CometChatGroupMembers.Root group={createMockGroup()} onError={onError} />);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it('calls onEmpty when no members are returned', async () => {
    covers('CometChatGroupMembers.onEmpty', 'called');
    const onEmpty = vi.fn();
    mockFetchNext.mockResolvedValueOnce([]);

    render(<CometChatGroupMembers.Root group={createMockGroup()} onEmpty={onEmpty} />);

    await waitFor(() => {
      expect(onEmpty).toHaveBeenCalled();
    });
  });

  it('renders custom children when provided (compound composition)', () => {
    covers('CometChatGroupMembers.children', 'custom');
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
    expect(region).toHaveAttribute('aria-label', 'Members');
  });

  it('renders status indicators when hideUserStatus is false', async () => {
    covers('CometChatGroupMembers.hideUserStatus', 'false');
    const members = [createMockMember('u1', 'Alice', 'participant', 'online')];
    mockFetchNext.mockResolvedValueOnce(members);

    render(<CometChatGroupMembers.Root group={createMockGroup()} hideUserStatus={false} />);

    await waitFor(() => {
      expect(screen.getByTestId('status-online')).toBeInTheDocument();
    });
  });

  it('hides status indicators when hideUserStatus is true', async () => {
    covers('CometChatGroupMembers.hideUserStatus', 'true');
    const members = [createMockMember('u1', 'Alice', 'participant', 'online')];
    mockFetchNext.mockResolvedValueOnce(members);

    render(<CometChatGroupMembers.Root group={createMockGroup()} hideUserStatus={true} />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('status-online')).not.toBeInTheDocument();
  });
});

/** The i-th element, or a clear failure when there are fewer. */
function nth(elements: HTMLElement[], i: number): HTMLElement {
  const element = elements[i];
  if (!element) throw new Error(`expected at least ${String(i + 1)} elements, found ${String(elements.length)}`);
  return element;
}

describe('CometChatGroupMembers props', () => {
  const group = createMockGroup();
  const alice = createMockMember('u1', 'Alice');
  const bob = createMockMember('u2', 'Bob');
  const builders = () => vi.mocked(CometChat.GroupMembersRequestBuilder).mock.results.map(r => r.value as Record<string, ReturnType<typeof vi.fn>>);
  const loaded = () => screen.findByText('Alice');

  /** A request builder an app passes in, returning its own members. */
  function appBuilder(members: CometChat.GroupMember[]) {
    const fetchNext = vi.fn().mockResolvedValue(members);
    const builder = { setSearchKeyword: vi.fn(), build: vi.fn(() => ({ fetchNext })) };
    builder.setSearchKeyword.mockReturnValue(builder);
    return builder;
  }
  const asBuilder = (b: ReturnType<typeof appBuilder>) => b as unknown as CometChat.GroupMembersRequestBuilder;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchNext.mockResolvedValue([alice, bob]);
  });

  it("fetches the group's members, 30 at a time, with no search keyword by default", async () => {
    covers('CometChatGroupMembers.group', 'set');
    covers('CometChatGroupMembers.groupMemberRequestBuilder', 'default');
    covers('CometChatGroupMembers.searchKeyword', 'default');
    render(<CometChatGroupMembers group={group} />);
    await loaded();
    expect(CometChat.GroupMembersRequestBuilder).toHaveBeenCalledWith('group-1');
    expect(builders()[0]?.setLimit).toHaveBeenCalledWith(30);
    expect(builders()[0]?.setSearchKeyword).not.toHaveBeenCalled();
  });

  it("an app's members builder is the one fetched from", async () => {
    covers('CometChatGroupMembers.groupMemberRequestBuilder', 'used');
    const builder = appBuilder([createMockMember('c', 'Carol')]);
    render(<CometChatGroupMembers group={group} groupMemberRequestBuilder={asBuilder(builder)} />);
    expect(await screen.findByText('Carol')).toBeInTheDocument();
    expect(mockFetchNext).not.toHaveBeenCalled();
  });

  it('searchKeyword filters the first fetch', async () => {
    covers('CometChatGroupMembers.searchKeyword', 'set');
    covers('CometChatGroupMembers.searchRequestBuilder', 'default');
    render(<CometChatGroupMembers group={group} searchKeyword="al" />);
    await loaded();
    expect(builders()[0]?.setSearchKeyword).toHaveBeenCalledWith('al');
  });

  it("a search uses the app's search builder", async () => {
    covers('CometChatGroupMembers.searchRequestBuilder', 'used');
    const search = appBuilder([createMockMember('d', 'Dana')]);
    render(<CometChatGroupMembers group={group} searchKeyword="da" searchRequestBuilder={asBuilder(search)} />);
    expect(await screen.findByText('Dana')).toBeInTheDocument();
    expect(search.setSearchKeyword).toHaveBeenCalledWith('da');
    expect(mockFetchNext).not.toHaveBeenCalled();
  });

  it('onSelect reports the picked member', async () => {
    covers('CometChatGroupMembers.onSelect', 'called');
    const onSelect = vi.fn();
    render(<CometChatGroupMembers group={group} selectionMode="multiple" onSelect={onSelect} />);
    await loaded();
    fireEvent.click(nth(screen.getAllByTestId('checkbox'), 0));
    expect(onSelect).toHaveBeenCalledWith(alice, true);
  });

  it('by default rows have no checkbox or radio button', async () => {
    covers('CometChatGroupMembers.selectionMode', 'default', 'none');
    for (const props of [{ selectionMode: 'none' as const }, {}]) {
      const view = render(<CometChatGroupMembers group={group} {...props} />);
      await loaded();
      expect(screen.queryAllByTestId('checkbox')).toHaveLength(0);
      expect(screen.queryAllByTestId('radio')).toHaveLength(0);
      view.unmount();
    }
  });

  it('the header and the search box show by default', async () => {
    covers('CometChatGroupMembers.hideHeader', 'false', 'default');
    covers('CometChatGroupMembers.hideSearch', 'false', 'default');
    for (const props of [{ hideHeader: false, hideSearch: false }, {}]) {
      const view = render(<CometChatGroupMembers group={group} {...props} />);
      await loaded();
      expect(screen.getByText('Members')).toBeInTheDocument();
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
      view.unmount();
    }
  });

  it('hideSearch removes the search box', async () => {
    covers('CometChatGroupMembers.hideSearch', 'true');
    render(<CometChatGroupMembers group={group} hideSearch />);
    await loaded();
    expect(screen.queryByTestId('search-bar')).toBeNull();
  });

  it("status shows by default; the prop wins over the app's global setting", async () => {
    covers('CometChatGroupMembers.hideUserStatus', 'default', 'overrides-context');
    let view = render(<CometChatGroupMembers group={group} />);
    await loaded();
    expect(screen.getAllByTestId('status-online')).toHaveLength(2);
    view.unmount();

    view = render(
      <GlobalConfigProvider config={{ hideUserStatus: true }}>
        <CometChatGroupMembers group={group} />
      </GlobalConfigProvider>
    );
    await loaded();
    expect(screen.queryAllByTestId('status-online')).toHaveLength(0);
    view.unmount();

    render(
      <GlobalConfigProvider config={{ hideUserStatus: true }}>
        <CometChatGroupMembers group={group} hideUserStatus={false} />
      </GlobalConfigProvider>
    );
    await loaded();
    expect(screen.getAllByTestId('status-online')).toHaveLength(2);
  });

  describe("the owner's options on a member", () => {
    const optionIds = () => screen.queryAllByTestId(/^option-/).map(el => el.dataset.testid);

    it('kick, ban and change scope are all offered by default', async () => {
      covers('CometChatGroupMembers.hideKickMemberOption', 'false', 'default');
      covers('CometChatGroupMembers.hideBanMemberOption', 'false', 'default');
      covers('CometChatGroupMembers.hideScopeChangeOption', 'false', 'default');
      for (const props of [{ hideKickMemberOption: false, hideBanMemberOption: false, hideScopeChangeOption: false }, {}]) {
        const view = render(<CometChatGroupMembers group={group} {...props} />);
        await loaded();
        await waitFor(() => {
          expect(new Set(optionIds())).toEqual(new Set(['option-kick', 'option-ban', 'option-change-scope']));
        });
        view.unmount();
      }
    });

    it.each([
      ['hideKickMemberOption', 'option-kick'],
      ['hideBanMemberOption', 'option-ban'],
      ['hideScopeChangeOption', 'option-change-scope'],
    ] as const)('%s removes that option and keeps the others', async (prop, id) => {
      covers('CometChatGroupMembers.hideKickMemberOption', 'true');
      covers('CometChatGroupMembers.hideBanMemberOption', 'true');
      covers('CometChatGroupMembers.hideScopeChangeOption', 'true');
      render(<CometChatGroupMembers group={group} {...{ [prop]: true }} />);
      await loaded();
      await waitFor(() => {
        expect(optionIds().length).toBeGreaterThan(0);
      });
      expect(optionIds()).not.toContain(id);
      expect(new Set(optionIds()).size).toBe(2);
    });

    it("options replaces them with the app's own, acting on that member", async () => {
      covers('CometChatGroupMembers.options', 'set', 'default');
      const onClick = vi.fn();
      render(<CometChatGroupMembers group={group} options={() => [{ id: 'dm', title: 'Message', onClick }]} />);
      await loaded();
      const dms = screen.getAllByTestId('option-dm');
      expect(dms).toHaveLength(2);
      expect(optionIds()).not.toContain('option-kick');
      fireEvent.click(nth(dms, 1));
      expect(onClick).toHaveBeenCalledWith(bob);
    });
  });

  describe('views', () => {
    it('custom loading, error and empty views fill those states', async () => {
      covers('CometChatGroupMembers.loadingView', 'custom');
      covers('CometChatGroupMembers.errorView', 'custom');
      covers('CometChatGroupMembers.emptyView', 'custom');
      const views = { loadingView: <i>wait</i>, errorView: <i>broken</i>, emptyView: <i>nobody</i> };

      mockFetchNext.mockReturnValueOnce(new Promise(() => {}));
      let view = render(<CometChatGroupMembers group={group} {...views} />);
      expect(await screen.findByText('wait')).toBeInTheDocument();
      view.unmount();

      mockFetchNext.mockRejectedValueOnce(new Error('Fail'));
      view = render(<CometChatGroupMembers group={group} {...views} />);
      expect(await screen.findByText('broken')).toBeInTheDocument();
      view.unmount();

      mockFetchNext.mockResolvedValueOnce([]);
      render(<CometChatGroupMembers group={group} {...views} />);
      expect(await screen.findByText('nobody')).toBeInTheDocument();
    });

    it('a custom header replaces the default one', async () => {
      covers('CometChatGroupMembers.headerView', 'custom');
      render(<CometChatGroupMembers group={group} headerView={<b>Team</b>} />);
      await loaded();
      expect(screen.getByText('Team')).toBeInTheDocument();
      expect(screen.queryByText('Members')).toBeNull();
    });

    it('another view prop keeps the default header', async () => {
      render(<CometChatGroupMembers group={group} emptyView={<i>nobody</i>} />);
      await loaded();
      expect(screen.getByText('Members')).toBeInTheDocument();
    });

    it('hideHeader still hides the header alongside a view prop', async () => {
      render(<CometChatGroupMembers group={group} hideHeader emptyView={<i>nobody</i>} />);
      await loaded();
      expect(screen.queryByText('Members')).toBeNull();
    });

    it('a custom item view draws each row', async () => {
      covers('CometChatGroupMembers.itemView', 'custom');
      render(<CometChatGroupMembers group={group} itemView={m => <p>row {m.getUid()}</p>} />);
      expect(await screen.findByText('row u1')).toBeInTheDocument();
      expect(screen.getByText('row u2')).toBeInTheDocument();
      expect(screen.queryByText('Alice')).toBeNull();
    });

    it('slot views fill their place in the default row', async () => {
      covers('CometChatGroupMembers.leadingView', 'custom');
      covers('CometChatGroupMembers.titleView', 'custom');
      covers('CometChatGroupMembers.subtitleView', 'custom');
      covers('CometChatGroupMembers.trailingView', 'custom');
      render(
        <CometChatGroupMembers
          group={group}
          leadingView={m => <span>L-{m.getUid()}</span>}
          titleView={m => <span>T-{m.getUid()}</span>}
          subtitleView={m => <span>S-{m.getUid()}</span>}
          trailingView={m => <span>R-{m.getUid()}</span>}
        />
      );
      for (const text of ['L-u1', 'T-u1', 'S-u1', 'R-u1']) {
        expect(await screen.findByText(text)).toBeInTheDocument();
      }
      expect(screen.queryByText('Alice')).toBeNull();
      expect(screen.queryByTestId('avatar-Alice')).toBeNull();
    });
  });
});
