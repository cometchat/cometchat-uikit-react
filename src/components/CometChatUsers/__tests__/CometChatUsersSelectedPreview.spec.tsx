import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CometChatUsersSelectedPreview } from '../CometChatUsersSelectedPreview';
import { CometChatUsersContext } from '../CometChatUsers.context';
import type { CometChatUsersContextValue } from '../CometChatUsers.types';

// --- Mock SDK ---
vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    UsersRequestBuilder: vi.fn(),
    UserListener: vi.fn(),
    ConnectionListener: vi.fn(),
    addUserListener: vi.fn(),
    removeUserListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
  },
}));

function createMockUser(uid: string, name: string) {
  return {
    getUid: () => uid,
    getName: () => name,
    getStatus: () => 'online',
    getAvatar: () => `https://example.com/${uid}.png`,
  } as unknown as CometChat.User;
}

function createMockContext(
  overrides: Partial<CometChatUsersContextValue> = {}
): CometChatUsersContextValue {
  return {
    users: [],
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

describe('CometChatUsersSelectedPreview', () => {
  it('renders nothing when selectionMode is not multiple', () => {
    const ctx = createMockContext({ selectionMode: 'none' });
    const { container } = render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersSelectedPreview />
      </CometChatUsersContext.Provider>
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when no users are selected', () => {
    const ctx = createMockContext({ selectionMode: 'multiple', selectedUserIds: [] });
    const { container } = render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersSelectedPreview />
      </CometChatUsersContext.Provider>
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders chips for selected users', () => {
    const user1 = createMockUser('u1', 'Alice Johnson');
    const user2 = createMockUser('u2', 'Bob Smith');
    const ctx = createMockContext({
      selectionMode: 'multiple',
      selectedUserIds: ['u1', 'u2'],
      selectedUsersMap: new Map([
        ['u1', user1],
        ['u2', user2],
      ]),
    });
    render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersSelectedPreview />
      </CometChatUsersContext.Provider>
    );
    // Shows first name only
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('calls deselectUser when close button is clicked', () => {
    const user1 = createMockUser('u1', 'Alice');
    const deselectUser = vi.fn();
    const ctx = createMockContext({
      selectionMode: 'multiple',
      selectedUserIds: ['u1'],
      selectedUsersMap: new Map([['u1', user1]]),
      deselectUser,
    });
    render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersSelectedPreview />
      </CometChatUsersContext.Provider>
    );

    const removeBtn = screen.getByRole('button', { name: 'Remove Alice' });
    fireEvent.click(removeBtn);

    expect(deselectUser).toHaveBeenCalledWith('u1');
  });

  it('renders custom chipView when provided', () => {
    const user1 = createMockUser('u1', 'Alice');
    const ctx = createMockContext({
      selectionMode: 'multiple',
      selectedUserIds: ['u1'],
      selectedUsersMap: new Map([['u1', user1]]),
    });
    render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersSelectedPreview
          chipView={user => (
            <span key={user.getUid()} data-testid="custom-chip">
              {user.getName()}
            </span>
          )}
        />
      </CometChatUsersContext.Provider>
    );
    expect(screen.getByTestId('custom-chip')).toBeInTheDocument();
  });

  it('has aria-label with count of selected users', () => {
    const user1 = createMockUser('u1', 'Alice');
    const user2 = createMockUser('u2', 'Bob');
    const ctx = createMockContext({
      selectionMode: 'multiple',
      selectedUserIds: ['u1', 'u2'],
      selectedUsersMap: new Map([
        ['u1', user1],
        ['u2', user2],
      ]),
    });
    render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersSelectedPreview />
      </CometChatUsersContext.Provider>
    );
    expect(screen.getByRole('group', { name: '2 users selected' })).toBeInTheDocument();
  });
});
