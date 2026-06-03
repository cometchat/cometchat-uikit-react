import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCometChatGroups } from '../useCometChatGroups';

/* eslint-disable @typescript-eslint/unbound-method */

// --- Mock SDK ---
const mockFetchNext = vi.fn();
const mockBuild = vi.fn(() => ({ fetchNext: mockFetchNext }));
const mockSetSearchKeyword = vi.fn().mockReturnThis();
const mockSetLimit = vi.fn(() => ({ build: mockBuild, setSearchKeyword: mockSetSearchKeyword }));

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    GroupsRequestBuilder: vi.fn(() => ({
      setLimit: mockSetLimit,
      setSearchKeyword: mockSetSearchKeyword,
      build: mockBuild,
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

describe('useCometChatGroups', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockFetchNext.mockResolvedValue([createMockGroup('g1'), createMockGroup('g2')]);
    // Re-set getLoggedinUser mock after clearAllMocks
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');
    vi.mocked(CometChat.getLoggedinUser).mockResolvedValue({
      getUid: () => 'logged-in-user',
    } as unknown as CometChat.User);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches first page on mount and transitions to loaded', async () => {
    const { result } = renderHook(() => useCometChatGroups());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });
    expect(result.current.groups).toHaveLength(2);
    expect(result.current.hasMore).toBe(true);
  });

  it('sets fetchState to empty when first fetch returns empty array', async () => {
    mockFetchNext.mockResolvedValue([]);
    const onEmpty = vi.fn();

    const { result } = renderHook(() => useCometChatGroups({ onEmpty }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('empty');
    });
    expect(onEmpty).toHaveBeenCalled();
  });

  it('sets fetchState to error on SDK error', async () => {
    mockFetchNext.mockRejectedValue(new Error('Network error'));
    const onError = vi.fn();

    const { result } = renderHook(() => useCometChatGroups({ onError }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('error');
    });
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('selectGroup adds group to selection', async () => {
    const { result } = renderHook(() => useCometChatGroups());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const group = createMockGroup('g1');
    act(() => {
      result.current.selectGroup(group);
    });

    expect(result.current.selectedGroupIds).toContain('g1');
    expect(result.current.selectedGroupsMap.get('g1')).toBe(group);
  });

  it('deselectGroup removes group from selection', async () => {
    const { result } = renderHook(() => useCometChatGroups());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const group = createMockGroup('g1');
    act(() => {
      result.current.selectGroup(group);
    });
    act(() => {
      result.current.deselectGroup('g1');
    });

    expect(result.current.selectedGroupIds).not.toContain('g1');
  });

  it('clearSelection empties selection', async () => {
    const { result } = renderHook(() => useCometChatGroups());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    act(() => {
      result.current.selectGroup(createMockGroup('g1'));
      result.current.selectGroup(createMockGroup('g2'));
    });
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedGroupIds).toEqual([]);
  });

  it('setSearchText resets list and re-fetches', async () => {
    const { result } = renderHook(() => useCometChatGroups());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    mockFetchNext.mockResolvedValue([createMockGroup('g3', 'Dev Team')]);

    act(() => {
      result.current.setSearchText('dev');
    });

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(1);
    });
    expect(result.current.searchText).toBe('dev');
  });

  it('handleItemClick calls onItemClick callback', async () => {
    const onItemClick = vi.fn();
    const { result } = renderHook(() => useCometChatGroups({ onItemClick }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const group = createMockGroup('g1');
    act(() => {
      result.current.handleItemClick(group);
    });

    expect(onItemClick).toHaveBeenCalledWith(group);
  });

  it('handleItemClick in multiple mode toggles selection', async () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useCometChatGroups({ selectionMode: 'multiple', onSelect })
    );

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const group = result.current.groups[0]!;
    act(() => {
      result.current.handleItemClick(group);
    });

    expect(result.current.selectedGroupIds).toContain(group.getGuid());
    expect(onSelect).toHaveBeenCalledWith(group, true);
  });

  it('handleItemClick in multiple mode deselects already-selected group', async () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useCometChatGroups({ selectionMode: 'multiple', onSelect })
    );

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const group = result.current.groups[0]!;
    // Select then deselect
    act(() => {
      result.current.handleItemClick(group);
    });
    act(() => {
      result.current.handleItemClick(group);
    });

    expect(result.current.selectedGroupIds).not.toContain(group.getGuid());
    expect(onSelect).toHaveBeenLastCalledWith(group, false);
  });

  it('handleItemClick with shiftKey in multiple mode selects range', async () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useCometChatGroups({ selectionMode: 'multiple', onSelect })
    );

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    // Click first group to set anchor
    const firstGroup = result.current.groups[0]!;
    act(() => {
      result.current.handleItemClick(firstGroup);
    });

    // Shift-click second group to select range
    const secondGroup = result.current.groups[1]!;
    act(() => {
      result.current.handleItemClick(secondGroup, { shiftKey: true });
    });

    expect(result.current.selectedGroupIds).toContain(firstGroup.getGuid());
    expect(result.current.selectedGroupIds).toContain(secondGroup.getGuid());
  });

  it('handleItemClick in single mode selects group and clears previous', async () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() => useCometChatGroups({ selectionMode: 'single', onSelect }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const firstGroup = result.current.groups[0]!;
    const secondGroup = result.current.groups[1]!;

    act(() => {
      result.current.handleItemClick(firstGroup);
    });
    expect(result.current.selectedGroupIds).toContain(firstGroup.getGuid());

    act(() => {
      result.current.handleItemClick(secondGroup);
    });
    expect(result.current.selectedGroupIds).toContain(secondGroup.getGuid());
    expect(result.current.selectedGroupIds).not.toContain(firstGroup.getGuid());
  });

  it('createGroup adds group to list', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');
    const createdGroup = createMockGroup('g-new', 'New Group');
    vi.mocked(CometChat.createGroup).mockResolvedValue(createdGroup);

    const { result } = renderHook(() => useCometChatGroups());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    await act(async () => {
      await result.current.createGroup(createdGroup);
    });

    expect(result.current.groups[0]?.getGuid()).toBe('g-new');
  });

  it('joinGroup updates group in list', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');
    const joinedGroup = createMockGroup('g1', 'Group', 'public', 10);
    vi.mocked(CometChat.joinGroup).mockResolvedValue(joinedGroup);

    const { result } = renderHook(() => useCometChatGroups());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    await act(async () => {
      await result.current.joinGroup('g1', 'public');
    });

    const updatedGroup = result.current.groups.find(g => g.getGuid() === 'g1');
    expect(updatedGroup?.getMembersCount()).toBe(10);
  });

  it('leaveGroup removes group from list', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');
    vi.mocked(CometChat.leaveGroup).mockResolvedValue(true);

    const { result } = renderHook(() => useCometChatGroups());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const initialLength = result.current.groups.length;

    await act(async () => {
      await result.current.leaveGroup('g1');
    });

    expect(result.current.groups.length).toBe(initialLength - 1);
    expect(result.current.groups.find(g => g.getGuid() === 'g1')).toBeUndefined();
  });

  it('deleteGroup removes group from list', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');
    vi.mocked(CometChat.deleteGroup).mockResolvedValue(true);

    const { result } = renderHook(() => useCometChatGroups());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const initialLength = result.current.groups.length;

    await act(async () => {
      await result.current.deleteGroup('g1');
    });

    expect(result.current.groups.length).toBe(initialLength - 1);
    expect(result.current.groups.find(g => g.getGuid() === 'g1')).toBeUndefined();
  });

  it('cleans up listeners on unmount', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');

    const { unmount } = renderHook(() => useCometChatGroups());

    await waitFor(() => {
      // Wait for initial fetch
    });

    unmount();

    expect(CometChat.removeConnectionListener).toHaveBeenCalled();
    expect(CometChat.removeGroupListener).toHaveBeenCalled();
  });

  it('connection listener triggers re-fetch when onConnected fires', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');

    renderHook(() => useCometChatGroups());

    await waitFor(() => {
      // Wait for initial fetch
    });

    // Get the ConnectionListener callbacks
    const connListenerCallbacks = vi.mocked(CometChat.ConnectionListener).mock.calls[0]?.[0] as
      | { onConnected?: () => void }
      | undefined;
    expect(connListenerCallbacks?.onConnected).toBeDefined();

    // Reset mock to track new fetch calls
    const callsBefore = mockFetchNext.mock.calls.length;
    mockFetchNext.mockResolvedValue([createMockGroup('g5')]);

    // Invoke onConnected — should trigger re-fetch
    act(() => {
      connListenerCallbacks?.onConnected?.();
    });

    await waitFor(() => {
      expect(mockFetchNext.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  it('fetchNext appends more groups to the list', async () => {
    const { result } = renderHook(() => useCometChatGroups());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });
    expect(result.current.groups).toHaveLength(2);

    mockFetchNext.mockResolvedValue([createMockGroup('g3'), createMockGroup('g4')]);

    await act(async () => {
      await result.current.fetchNext();
    });

    expect(result.current.groups).toHaveLength(4);
  });

  it('fetchNext is no-op when hasMore is false', async () => {
    mockFetchNext.mockResolvedValueOnce([]); // First fetch returns empty
    const { result } = renderHook(() => useCometChatGroups());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('empty');
    });
    expect(result.current.hasMore).toBe(false);

    const callCountBefore = mockFetchNext.mock.calls.length;
    await act(async () => {
      await result.current.fetchNext();
    });

    // Should not have made another fetch call
    expect(mockFetchNext.mock.calls.length).toBe(callCountBefore);
  });

  it('selectRange adds multiple groups to selection', async () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useCometChatGroups({ selectionMode: 'multiple', onSelect })
    );

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const groups = [createMockGroup('g1'), createMockGroup('g2')];
    act(() => {
      result.current.selectRange(groups);
    });

    expect(result.current.selectedGroupIds).toContain('g1');
    expect(result.current.selectedGroupIds).toContain('g2');
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('deselectRange removes multiple groups from selection', async () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() =>
      useCometChatGroups({ selectionMode: 'multiple', onSelect })
    );

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const groups = [createMockGroup('g1'), createMockGroup('g2')];
    act(() => {
      result.current.selectRange(groups);
    });
    act(() => {
      result.current.deselectRange(['g1', 'g2']);
    });

    expect(result.current.selectedGroupIds).not.toContain('g1');
    expect(result.current.selectedGroupIds).not.toContain('g2');
  });

  it('setActiveGroup updates activeGroupId', async () => {
    const { result } = renderHook(() => useCometChatGroups());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    act(() => {
      result.current.setActiveGroup('g1');
    });

    expect(result.current.activeGroupId).toBe('g1');

    act(() => {
      result.current.setActiveGroup(null);
    });

    expect(result.current.activeGroupId).toBeNull();
  });
});
