import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CometChatUsersList } from '../CometChatUsersList';
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

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
let intersectionCallback: ((entries: { isIntersecting: boolean }[]) => void) | null = null;
vi.stubGlobal(
  'IntersectionObserver',
  vi.fn((callback: (entries: { isIntersecting: boolean }[]) => void) => {
    intersectionCallback = callback;
    return {
      observe: mockObserve,
      disconnect: mockDisconnect,
      unobserve: vi.fn(),
    };
  })
);

function createMockUser(uid: string, name: string, status = 'online') {
  return {
    getUid: () => uid,
    getName: () => name,
    getStatus: () => status,
    getAvatar: () => `https://example.com/${uid}.png`,
    getBlockedByMe: () => false,
    getHasBlockedMe: () => false,
  } as unknown as CometChat.User;
}

function createMockContext(
  overrides: Partial<CometChatUsersContextValue> = {}
): CometChatUsersContextValue {
  return {
    users: [
      createMockUser('u1', 'Alice'),
      createMockUser('u2', 'Bob'),
      createMockUser('u3', 'Charlie'),
    ],
    fetchState: 'loaded',
    hasMore: true,
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

describe('CometChatUsersList', () => {
  it('renders user items from context', () => {
    const ctx = createMockContext();
    render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersList />
      </CometChatUsersContext.Provider>
    );
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('renders section headers for different first letters', () => {
    const ctx = createMockContext();
    render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersList />
      </CometChatUsersContext.Provider>
    );
    // A, B, C section headers
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('does not render duplicate section headers for same letter', () => {
    const ctx = createMockContext({
      users: [
        createMockUser('u1', 'Alice'),
        createMockUser('u2', 'Amy'),
        createMockUser('u3', 'Bob'),
      ],
    });
    render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersList />
      </CometChatUsersContext.Provider>
    );
    // Only one "A" header for Alice and Amy
    const aHeaders = screen.getAllByText('A');
    expect(aHeaders).toHaveLength(1);
  });

  it('renders sentinel element when hasMore is true', () => {
    const ctx = createMockContext({ hasMore: true });
    render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersList />
      </CometChatUsersContext.Provider>
    );
    expect(mockObserve).toHaveBeenCalled();
  });

  it('does not render sentinel when hasMore is false', () => {
    mockObserve.mockClear();
    const ctx = createMockContext({ hasMore: false });
    render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersList />
      </CometChatUsersContext.Provider>
    );
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it('uses custom itemView when provided', () => {
    const ctx = createMockContext();
    render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersList
          itemView={user => (
            <div key={user.getUid()} data-testid="custom">
              {user.getName()}
            </div>
          )}
        />
      </CometChatUsersContext.Provider>
    );
    expect(screen.getAllByTestId('custom')).toHaveLength(3);
  });

  it('has role="listbox" with aria-label', () => {
    const ctx = createMockContext();
    render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersList />
      </CometChatUsersContext.Provider>
    );
    expect(screen.getByRole('listbox', { name: 'Users list' })).toBeInTheDocument();
  });

  it('calls fetchNext when IntersectionObserver fires with isIntersecting', () => {
    const fetchNext = vi.fn();
    const ctx = createMockContext({ hasMore: true, fetchState: 'loaded', fetchNext });
    render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersList />
      </CometChatUsersContext.Provider>
    );

    // Simulate the sentinel entering the viewport
    if (intersectionCallback) {
      intersectionCallback([{ isIntersecting: true }]);
    }

    expect(fetchNext).toHaveBeenCalled();
  });

  it('does not call fetchNext when not intersecting', () => {
    const fetchNext = vi.fn();
    const ctx = createMockContext({ hasMore: true, fetchState: 'loaded', fetchNext });
    render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersList />
      </CometChatUsersContext.Provider>
    );

    // Simulate the sentinel NOT entering the viewport
    if (intersectionCallback) {
      intersectionCallback([{ isIntersecting: false }]);
    }

    expect(fetchNext).not.toHaveBeenCalled();
  });
});
