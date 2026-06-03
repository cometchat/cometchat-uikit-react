import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCometChatUsers } from '../useCometChatUsers';

/* eslint-disable @typescript-eslint/unbound-method */

// --- Mock SDK ---
const mockFetchNext = vi.fn();
const mockBuild = vi.fn(() => ({ fetchNext: mockFetchNext }));
const mockSetSearchKeyword = vi.fn().mockReturnThis();
const mockSetLimit = vi.fn(() => ({ build: mockBuild, setSearchKeyword: mockSetSearchKeyword }));

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    UsersRequestBuilder: vi.fn(() => ({
      setLimit: mockSetLimit,
      setSearchKeyword: mockSetSearchKeyword,
      build: mockBuild,
    })),
    UserListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    ConnectionListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    addUserListener: vi.fn(),
    removeUserListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
  },
}));

function createMockUser(uid: string, name = 'User', status = 'offline') {
  return {
    getUid: () => uid,
    getName: () => name,
    getStatus: () => status,
    getAvatar: () => `https://example.com/${uid}.png`,
  } as unknown as CometChat.User;
}

describe('useCometChatUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchNext.mockResolvedValue([createMockUser('u1'), createMockUser('u2')]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches first page on mount and transitions to loaded', async () => {
    const { result } = renderHook(() => useCometChatUsers());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });
    expect(result.current.users).toHaveLength(2);
    expect(result.current.hasMore).toBe(true);
  });

  it('sets fetchState to empty when first fetch returns empty array', async () => {
    mockFetchNext.mockResolvedValue([]);
    const onEmpty = vi.fn();

    const { result } = renderHook(() => useCometChatUsers({ onEmpty }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('empty');
    });
    expect(onEmpty).toHaveBeenCalled();
  });

  it('sets fetchState to error on SDK error', async () => {
    mockFetchNext.mockRejectedValue(new Error('Network error'));
    const onError = vi.fn();

    const { result } = renderHook(() => useCometChatUsers({ onError }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('error');
    });
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('selectUser adds user to selection', async () => {
    const { result } = renderHook(() => useCometChatUsers());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const user = createMockUser('u1');
    act(() => {
      result.current.selectUser(user);
    });

    expect(result.current.selectedUserIds).toContain('u1');
    expect(result.current.selectedUsersMap.get('u1')).toBe(user);
  });

  it('deselectUser removes user from selection', async () => {
    const { result } = renderHook(() => useCometChatUsers());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const user = createMockUser('u1');
    act(() => {
      result.current.selectUser(user);
    });
    act(() => {
      result.current.deselectUser('u1');
    });

    expect(result.current.selectedUserIds).not.toContain('u1');
  });

  it('clearSelection empties selection', async () => {
    const { result } = renderHook(() => useCometChatUsers());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    act(() => {
      result.current.selectUser(createMockUser('u1'));
      result.current.selectUser(createMockUser('u2'));
    });
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedUserIds).toEqual([]);
  });

  it('setSearchText resets list and re-fetches', async () => {
    const { result } = renderHook(() => useCometChatUsers());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    mockFetchNext.mockResolvedValue([createMockUser('u3', 'Alice')]);

    act(() => {
      result.current.setSearchText('alice');
    });

    await waitFor(() => {
      expect(result.current.users).toHaveLength(1);
    });
    expect(result.current.searchText).toBe('alice');
  });

  it('does not attach user status listener when hideUserStatus is true', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');

    renderHook(() => useCometChatUsers({ hideUserStatus: true }));

    await waitFor(() => {
      // Wait for initial fetch
    });

    // Should not have added a user listener (only connection listener)
    const userListenerCalls = vi
      .mocked(CometChat.addUserListener)
      .mock.calls.filter(call => (call[0] as string).includes('status'));
    expect(userListenerCalls).toHaveLength(0);
  });

  it('cleans up listeners on unmount', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');

    const { unmount } = renderHook(() => useCometChatUsers());

    await waitFor(() => {
      // Wait for initial fetch
    });

    unmount();

    expect(CometChat.removeConnectionListener).toHaveBeenCalled();
  });

  it('handleItemClick calls onItemClick callback', async () => {
    const onItemClick = vi.fn();
    const { result } = renderHook(() => useCometChatUsers({ onItemClick }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const user = createMockUser('u1');
    act(() => {
      result.current.handleItemClick(user);
    });

    expect(onItemClick).toHaveBeenCalledWith(user);
  });

  it('handleItemClick in multiple mode toggles selection', async () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() => useCometChatUsers({ selectionMode: 'multiple', onSelect }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const user = result.current.users[0]!;
    act(() => {
      result.current.handleItemClick(user);
    });

    expect(result.current.selectedUserIds).toContain(user.getUid());
    expect(onSelect).toHaveBeenCalledWith(user, true);
  });

  it('handleItemClick in multiple mode deselects already-selected user', async () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() => useCometChatUsers({ selectionMode: 'multiple', onSelect }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const user = result.current.users[0]!;
    // Select then deselect
    act(() => {
      result.current.handleItemClick(user);
    });
    act(() => {
      result.current.handleItemClick(user);
    });

    expect(result.current.selectedUserIds).not.toContain(user.getUid());
    expect(onSelect).toHaveBeenLastCalledWith(user, false);
  });

  it('handleItemClick with shiftKey in multiple mode selects range', async () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() => useCometChatUsers({ selectionMode: 'multiple', onSelect }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    // Click first user to set anchor
    const firstUser = result.current.users[0]!;
    act(() => {
      result.current.handleItemClick(firstUser);
    });

    // Shift-click second user to select range
    const secondUser = result.current.users[1]!;
    act(() => {
      result.current.handleItemClick(secondUser, { shiftKey: true });
    });

    expect(result.current.selectedUserIds).toContain(firstUser.getUid());
    expect(result.current.selectedUserIds).toContain(secondUser.getUid());
  });

  it('handleItemClick in single mode selects user and clears previous', async () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() => useCometChatUsers({ selectionMode: 'single', onSelect }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const firstUser = result.current.users[0]!;
    const secondUser = result.current.users[1]!;

    act(() => {
      result.current.handleItemClick(firstUser);
    });
    expect(result.current.selectedUserIds).toContain(firstUser.getUid());

    act(() => {
      result.current.handleItemClick(secondUser);
    });
    expect(result.current.selectedUserIds).toContain(secondUser.getUid());
    expect(result.current.selectedUserIds).not.toContain(firstUser.getUid());
  });

  it('selectRange adds multiple users to selection', async () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() => useCometChatUsers({ selectionMode: 'multiple', onSelect }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const users = [createMockUser('u1'), createMockUser('u2')];
    act(() => {
      result.current.selectRange(users);
    });

    expect(result.current.selectedUserIds).toContain('u1');
    expect(result.current.selectedUserIds).toContain('u2');
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('deselectRange removes multiple users from selection', async () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() => useCometChatUsers({ selectionMode: 'multiple', onSelect }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    const users = [createMockUser('u1'), createMockUser('u2')];
    act(() => {
      result.current.selectRange(users);
    });
    act(() => {
      result.current.deselectRange(['u1', 'u2']);
    });

    expect(result.current.selectedUserIds).not.toContain('u1');
    expect(result.current.selectedUserIds).not.toContain('u2');
  });

  it('setActiveUser updates activeUserId', async () => {
    const { result } = renderHook(() => useCometChatUsers());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    act(() => {
      result.current.setActiveUser('u1');
    });

    expect(result.current.activeUserId).toBe('u1');

    act(() => {
      result.current.setActiveUser(null);
    });

    expect(result.current.activeUserId).toBeNull();
  });

  it('fetchNext appends more users to the list', async () => {
    const { result } = renderHook(() => useCometChatUsers());

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });
    expect(result.current.users).toHaveLength(2);

    mockFetchNext.mockResolvedValue([createMockUser('u3'), createMockUser('u4')]);

    await act(async () => {
      await result.current.fetchNext();
    });

    expect(result.current.users).toHaveLength(4);
  });

  it('fetchNext is no-op when hasMore is false', async () => {
    mockFetchNext.mockResolvedValueOnce([]); // First fetch returns empty
    const { result } = renderHook(() => useCometChatUsers());

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

  it('user status listener updates user when onUserOnline fires', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');

    renderHook(() => useCometChatUsers({ hideUserStatus: false }));

    await waitFor(() => {
      // Wait for initial fetch and listener setup
    });

    // Get the UserListener callbacks that were passed to addUserListener
    const addUserListenerCalls = vi.mocked(CometChat.addUserListener).mock.calls;
    const statusListenerCall = addUserListenerCalls.find(call =>
      (call[0] as string).includes('status')
    );
    expect(statusListenerCall).toBeDefined();

    // The second argument is the UserListener mock which received the callbacks
    const listenerCallbacks = vi.mocked(CometChat.UserListener).mock.calls[0]?.[0] as
      | { onUserOnline?: (user: unknown) => void; onUserOffline?: (user: unknown) => void }
      | undefined;
    expect(listenerCallbacks?.onUserOnline).toBeDefined();
    expect(listenerCallbacks?.onUserOffline).toBeDefined();

    // Invoke the callback — should not throw
    const updatedUser = createMockUser('u1', 'User', 'online');
    act(() => {
      listenerCallbacks?.onUserOnline?.(updatedUser);
    });
  });

  it('connection listener triggers re-fetch when onConnected fires', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');

    renderHook(() => useCometChatUsers());

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
    mockFetchNext.mockResolvedValue([createMockUser('u5')]);

    // Invoke onConnected — should trigger re-fetch
    act(() => {
      connListenerCallbacks?.onConnected?.();
    });

    await waitFor(() => {
      expect(mockFetchNext.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });
});
