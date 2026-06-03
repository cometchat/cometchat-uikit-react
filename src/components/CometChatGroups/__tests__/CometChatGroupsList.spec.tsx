import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CometChatGroupsList } from '../CometChatGroupsList';
import { CometChatGroupsContext } from '../CometChatGroups.context';
import type { CometChatGroupsContextValue } from '../CometChatGroups.types';

// --- Mock SDK ---
vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    GroupsRequestBuilder: vi.fn(),
    GroupListener: vi.fn(),
    ConnectionListener: vi.fn(),
    addGroupListener: vi.fn(),
    removeGroupListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
  },
}));

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
vi.stubGlobal(
  'IntersectionObserver',
  vi.fn(() => {
    return {
      observe: mockObserve,
      disconnect: mockDisconnect,
      unobserve: vi.fn(),
    };
  })
);

function createMockGroup(guid: string, name = 'Group', type = 'public', membersCount = 5) {
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
      createMockGroup('g1', 'Alpha Team'),
      createMockGroup('g2', 'Beta Squad'),
      createMockGroup('g3', 'Charlie Group'),
    ],
    fetchState: 'loaded',
    hasMore: true,
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

describe('CometChatGroupsList', () => {
  it('renders group items from context', () => {
    const ctx = createMockContext();
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsList />
      </CometChatGroupsContext.Provider>
    );
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('renders empty when no groups', () => {
    const ctx = createMockContext({ groups: [] });
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsList />
      </CometChatGroupsContext.Provider>
    );
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('has role="listbox" with aria-label', () => {
    const ctx = createMockContext();
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsList />
      </CometChatGroupsContext.Provider>
    );
    expect(screen.getByRole('listbox', { name: 'Groups list' })).toBeInTheDocument();
  });

  it('items have role="option"', () => {
    const ctx = createMockContext();
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsList />
      </CometChatGroupsContext.Provider>
    );
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
  });

  it('renders sentinel element when hasMore is true', () => {
    const ctx = createMockContext({ hasMore: true });
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsList />
      </CometChatGroupsContext.Provider>
    );
    expect(mockObserve).toHaveBeenCalled();
  });

  it('does not render sentinel when hasMore is false', () => {
    mockObserve.mockClear();
    const ctx = createMockContext({ hasMore: false });
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsList />
      </CometChatGroupsContext.Provider>
    );
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it('uses custom itemView when provided', () => {
    const ctx = createMockContext();
    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsList
          itemView={group => (
            <div key={group.getGuid()} data-testid="custom">
              {group.getName()}
            </div>
          )}
        />
      </CometChatGroupsContext.Provider>
    );
    expect(screen.getAllByTestId('custom')).toHaveLength(3);
  });
});
