import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { CometChatGroups } from '../CometChatGroups';
import { CometChatGroupsContext } from '../CometChatGroups.context';
import type { CometChatGroupsContextValue } from '../CometChatGroups.types';

expect.extend(toHaveNoViolations);

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
    getLoggedinUser: vi.fn().mockResolvedValue({ getUid: () => 'logged-in-user' }),
  },
}));

function createMockGroup(guid: string, name: string, type = 'public', membersCount = 5) {
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
    groups: [
      createMockGroup('g1', 'Alpha Team', 'public'),
      createMockGroup('g2', 'Beta Squad', 'private'),
    ],
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

describe('CometChatGroups accessibility', () => {
  it('passes axe-core audit with loaded groups', async () => {
    const ctx = createMockContext();
    const { container } = render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroups.List />
      </CometChatGroupsContext.Provider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('list has role="listbox" with aria-label', () => {
    const ctx = createMockContext();
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroups.List />
      </CometChatGroupsContext.Provider>
    );
    const list = screen.getByRole('listbox', { name: 'Groups list' });
    expect(list).toBeInTheDocument();
  });

  it('items have role="option" with aria-selected', () => {
    const ctx = createMockContext({ selectedGroupIds: ['g1'] });
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroups.List />
      </CometChatGroupsContext.Provider>
    );
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('loading state has aria-busy="true"', () => {
    render(<CometChatGroups.LoadingState />);
    const loading = screen.getByRole('status');
    expect(loading).toHaveAttribute('aria-busy', 'true');
  });

  it('empty state has role="status"', () => {
    render(<CometChatGroups.EmptyState />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('error state has role="status"', () => {
    render(<CometChatGroups.ErrorState />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('type badges have aria-label', () => {
    const ctx = createMockContext({
      groups: [
        createMockGroup('g1', 'Private Group', 'private'),
        createMockGroup('g2', 'Password Group', 'password'),
      ],
    });
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroups.List />
      </CometChatGroupsContext.Provider>
    );
    expect(screen.getByLabelText('Private group')).toBeInTheDocument();
    expect(screen.getByLabelText('Password protected group')).toBeInTheDocument();
  });
});
