import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { CometChatUsers } from '../CometChatUsers';
import { CometChatUsersContext } from '../CometChatUsers.context';
import type { CometChatUsersContextValue } from '../CometChatUsers.types';

expect.extend(toHaveNoViolations);

// --- Mock SDK ---
vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    UsersRequestBuilder: vi.fn(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setSearchKeyword: vi.fn().mockReturnThis(),
      build: vi.fn(() => ({ fetchNext: vi.fn().mockResolvedValue([]) })),
    })),
    UserListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    ConnectionListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    addUserListener: vi.fn(),
    removeUserListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
  },
}));

function createMockUser(uid: string, name: string, status = 'online') {
  return {
    getUid: () => uid,
    getName: () => name,
    getStatus: () => status,
    getAvatar: () => `https://example.com/${uid}.png`,
  } as unknown as CometChat.User;
}

function createMockContext(
  overrides: Partial<CometChatUsersContextValue> = {}
): CometChatUsersContextValue {
  return {
    users: [createMockUser('u1', 'Alice'), createMockUser('u2', 'Bob', 'offline')],
    fetchState: 'loaded',
    hasMore: false,
    error: null,
    selectedUserIds: [],
    selectedUsersMap: new Map(),
    activeUserId: null,
    searchText: '',
    selectionMode: 'none',
    hideUserStatus: false,
    sectionHeaderKey: 'getName',
    hideSearch: false,
    showSectionHeader: true,
    showSelectedUsersPreview: false,
    showScrollbar: false,
    options: undefined,
    fetchNext: vi.fn(),
    setSearchText: vi.fn(),
    selectUser: vi.fn(),
    deselectUser: vi.fn(),
    selectRange: vi.fn(),
    deselectRange: vi.fn(),
    clearSelection: vi.fn(),
    setActiveUser: vi.fn(),
    handleItemClick: vi.fn(),
    ...overrides,
  };
}

describe('CometChatUsers accessibility', () => {
  it('passes axe-core audit with loaded users', async () => {
    const ctx = createMockContext();
    const { container } = render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsers.List />
      </CometChatUsersContext.Provider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('list has role="listbox" with aria-label', () => {
    const ctx = createMockContext();
    render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsers.List />
      </CometChatUsersContext.Provider>
    );
    const list = screen.getByRole('listbox', { name: 'Users list' });
    expect(list).toBeInTheDocument();
  });

  it('items have role="option" with aria-selected', () => {
    const ctx = createMockContext({ selectedUserIds: ['u1'] });
    render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsers.List />
      </CometChatUsersContext.Provider>
    );
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('loading state has aria-busy="true"', () => {
    const ctx = createMockContext({ fetchState: 'loading' });
    render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsers.LoadingState />
      </CometChatUsersContext.Provider>
    );
    const loading = screen.getByRole('status');
    expect(loading).toHaveAttribute('aria-busy', 'true');
  });

  it('empty state has role="status"', () => {
    const ctx = createMockContext({ fetchState: 'empty', users: [] });
    render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsers.EmptyState />
      </CometChatUsersContext.Provider>
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('error state has role="status"', () => {
    const ctx = createMockContext({ fetchState: 'error', error: 'Network error' });
    render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsers.ErrorState />
      </CometChatUsersContext.Provider>
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('section header has role="presentation" and is aria-hidden', () => {
    render(<CometChatUsers.SectionHeader letter="A" />);
    const header = screen.getByText('A').closest('[role="presentation"]');
    expect(header).toBeInTheDocument();
    expect(header).toHaveAttribute('aria-hidden', 'true');
  });

  it('selected preview chip close buttons have aria-label', () => {
    const ctx = createMockContext({
      selectionMode: 'multiple',
      selectedUserIds: ['u1'],
      selectedUsersMap: new Map([['u1', createMockUser('u1', 'Alice')]]),
    });
    render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsers.SelectedPreview />
      </CometChatUsersContext.Provider>
    );
    expect(screen.getByRole('button', { name: 'Remove Alice' })).toBeInTheDocument();
  });
});
