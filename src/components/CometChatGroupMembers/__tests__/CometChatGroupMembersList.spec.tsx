import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CometChatGroupMembersContext } from '../CometChatGroupMembers.context';
import { CometChatGroupMembersList } from '../CometChatGroupMembersList';
import type { CometChatGroupMembersContextValue } from '../CometChatGroupMembers.types';

// Mock IntersectionObserver for jsdom
beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

// Mock the CometChatGroupMembersItem to simplify testing
vi.mock('../CometChatGroupMembersItem', () => ({
  CometChatGroupMembersItem: ({ member }: { member: { getName: () => string } }) => (
    <div data-testid={`member-item-${member.getName()}`}>{member.getName()}</div>
  ),
}));

function createMockMember(uid: string, name: string) {
  return {
    getUid: () => uid,
    getName: () => name,
    getAvatar: () => '',
    getScope: () => 'participant',
    getStatus: () => 'online',
  } as unknown as CometChat.GroupMember;
}

function createMockContext(
  overrides: Partial<CometChatGroupMembersContextValue> = {}
): CometChatGroupMembersContextValue {
  return {
    group: { getGuid: () => 'g1' } as unknown as CometChat.Group,
    members: [],
    fetchState: 'loaded',
    hasMore: false,
    error: null,
    selectedMemberIds: [],
    selectedMembersMap: new Map(),
    activeMemberId: null,
    searchText: '',
    loggedInUser: null,
    loggedInUserScope: null,
    selectionMode: 'none',
    hideUserStatus: false,
    hideSearch: false,
    hideKickMemberOption: false,
    hideBanMemberOption: false,
    hideScopeChangeOption: false,
    options: undefined,
    fetchNext: vi.fn(),
    setSearchText: vi.fn(),
    selectMember: vi.fn(),
    deselectMember: vi.fn(),
    clearSelection: vi.fn(),
    setActiveMember: vi.fn(),
    handleItemClick: vi.fn(),
    kickMember: vi.fn(),
    banMember: vi.fn(),
    unbanMember: vi.fn(),
    changeScope: vi.fn(),
    ...overrides,
  };
}

function renderWithContext(
  ui: React.ReactElement,
  contextValue: CometChatGroupMembersContextValue
) {
  return render(
    <CometChatGroupMembersContext.Provider value={contextValue}>
      {ui}
    </CometChatGroupMembersContext.Provider>
  );
}

describe('CometChatGroupMembersList', () => {
  it('renders member items from context', () => {
    const members = [createMockMember('u1', 'Alice'), createMockMember('u2', 'Bob')];
    const ctx = createMockContext({ members });

    renderWithContext(<CometChatGroupMembersList />, ctx);

    expect(screen.getByTestId('member-item-Alice')).toBeInTheDocument();
    expect(screen.getByTestId('member-item-Bob')).toBeInTheDocument();
  });

  it('renders empty list when no members', () => {
    const ctx = createMockContext({ members: [] });

    const { container } = renderWithContext(<CometChatGroupMembersList />, ctx);

    const listbox = container.querySelector('[role="listbox"]');
    expect(listbox).toBeInTheDocument();
    expect(listbox?.children).toHaveLength(0);
  });

  it('renders sentinel element when hasMore is true', () => {
    const members = [createMockMember('u1', 'Alice')];
    const ctx = createMockContext({ members, hasMore: true });

    const { container } = renderWithContext(<CometChatGroupMembersList />, ctx);

    const sentinel = container.querySelector('[aria-hidden="true"]');
    expect(sentinel).toBeInTheDocument();
  });

  it('does not render sentinel when hasMore is false', () => {
    const members = [createMockMember('u1', 'Alice')];
    const ctx = createMockContext({ members, hasMore: false });

    const { container } = renderWithContext(<CometChatGroupMembersList />, ctx);

    const sentinel = container.querySelector('[class*="sentinel"]');
    expect(sentinel).not.toBeInTheDocument();
  });

  it('uses custom itemView when provided', () => {
    const members = [createMockMember('u1', 'Alice')];
    const ctx = createMockContext({ members });

    renderWithContext(
      <CometChatGroupMembersList
        itemView={member => <div data-testid="custom">{member.getName()}</div>}
      />,
      ctx
    );

    expect(screen.getByTestId('custom')).toBeInTheDocument();
    expect(screen.getByTestId('custom')).toHaveTextContent('Alice');
  });

  it('has correct ARIA attributes', () => {
    const ctx = createMockContext({ fetchState: 'loading' });

    const { container } = renderWithContext(<CometChatGroupMembersList />, ctx);

    const listbox = container.querySelector('[role="listbox"]');
    expect(listbox).toHaveAttribute('aria-label', 'Group members list');
    expect(listbox).toHaveAttribute('aria-busy', 'true');
  });
});
