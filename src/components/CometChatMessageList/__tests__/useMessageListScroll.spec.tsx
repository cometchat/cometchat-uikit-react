/**
 * Tests for useMessageListScroll.
 *
 * Mocks the Manager by stubbing methods on `refs.managerRef.current` and
 * observes dispatches to validate the logic around fetchPrevious/fetchNext,
 * markConversationAsReadIfUnread, goToMessage, and scrollToBottom.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// --- Stub CometChatMessageListManager so scrollToBottom's re-fetch path
// can instantiate a "new manager" without hitting the real SDK. ---
type MockManager = Record<string, ReturnType<typeof vi.fn> | (() => string)>;
const newManagerInstances: MockManager[] = [];
vi.mock('../CometChatMessageListManager', () => {
  return {
    CometChatMessageListManager: vi.fn().mockImplementation(() => {
      const inst: MockManager = {
        fetchPrevious: vi.fn().mockResolvedValue([]),
        fetchNext: vi.fn().mockResolvedValue([]),
        markConversationAsRead: vi.fn().mockResolvedValue(undefined),
        markAsDelivered: vi.fn().mockResolvedValue(undefined),
        markAsRead: vi.fn().mockResolvedValue(undefined),
        fetchAroundMessageId: vi.fn().mockResolvedValue({ messages: [], hasMoreNewer: false }),
        getConversation: vi.fn().mockResolvedValue({}),
        getReceiverId: () => '',
        getReceiverType: () => 'user',
      };
      newManagerInstances.push(inst);
      return inst;
    }),
  };
});

import { useMessageListScroll } from '../useMessageListScroll';
import type { MessageListRefs } from '../messageListRefs';
import type {
  CometChatMessageListAction,
  CometChatMessageListState,
  CometChatUseMessageListOptions,
} from '../CometChatMessageList.types';
import { initialMessageListState } from '../CometChatMessageList.types';
import { buildUser, buildGroup, buildTextMessage } from '../../../testing/mock-builders';

function makeRefs(
  initialState: CometChatMessageListState = initialMessageListState,
  options: Partial<CometChatUseMessageListOptions> = {}
) {
  const manager = {
    fetchPrevious: vi.fn().mockResolvedValue([]),
    fetchNext: vi.fn().mockResolvedValue([]),
    fetchAroundMessageId: vi.fn().mockResolvedValue({ messages: [], hasMoreNewer: false }),
    markConversationAsRead: vi.fn().mockResolvedValue(undefined),
    getConversation: vi.fn().mockResolvedValue({}),
  };
  const loggedInUser = options.loggedInUser ?? (buildUser({ uid: 'me' }) as never);
  const refs: MessageListRefs = {
    generationRef: { current: 0 },
    managerRef: { current: manager as never },
    isFetchingPrevRef: { current: false },
    isFetchingNextRef: { current: false },
    lastUnreadMarkedIdRef: { current: '' },
    groupRef: { current: undefined },
    stateRef: { current: initialState },
    optionsRef: {
      current: {
        loggedInUser,
        ...options,
      } as CometChatUseMessageListOptions,
    },
    initializeRef: { current: null },
  };
  return { refs, manager };
}

function useHarness(options: Parameters<typeof useMessageListScroll>[0], refs: MessageListRefs) {
  const [dispatched, setDispatched] = React.useState<CometChatMessageListAction[]>([]);
  const dispatchRef = React.useRef<((a: CometChatMessageListAction) => void) | null>(null);
  const dispatch = React.useCallback((action: CometChatMessageListAction) => {
    dispatchRef.current?.(action);
    setDispatched(list => [...list, action]);
  }, []);
  const api = useMessageListScroll(options, refs, dispatch);
  return { api, dispatched, dispatchRef };
}

describe('useMessageListScroll', () => {
  const user = buildUser({ uid: 'peer' });
  const group = buildGroup({ guid: 'room' });

  beforeEach(() => {
    vi.clearAllMocks();
    newManagerInstances.length = 0;
  });

  // ---------------------------------------------------------------------------
  // fetchPrevious
  // ---------------------------------------------------------------------------

  it('fetchPrevious dispatches START then SUCCESS on SDK success', async () => {
    const { refs, manager } = makeRefs();
    const msgs = [buildTextMessage({ id: 1 })];
    manager.fetchPrevious.mockResolvedValueOnce(msgs);

    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    await act(async () => {
      await result.current.api.fetchPrevious();
    });

    const types = result.current.dispatched.map(a => a.type);
    expect(types[0]).toBe('FETCH_PREVIOUS_START');
    expect(types).toContain('FETCH_PREVIOUS_SUCCESS');
  });

  it('fetchPrevious dispatches ERROR on SDK failure and calls onError', async () => {
    const { refs, manager } = makeRefs();
    manager.fetchPrevious.mockRejectedValueOnce(new Error('fetch failed'));
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useHarness(baseOptions({ user: user as never, onError }), refs)
    );

    await act(async () => {
      await result.current.api.fetchPrevious();
    });

    expect(result.current.dispatched.some(a => a.type === 'FETCH_PREVIOUS_ERROR')).toBe(true);
    expect(onError).toHaveBeenCalled();
  });

  it('fetchPrevious swallows stale results when generation changes', async () => {
    const { refs, manager } = makeRefs();
    manager.fetchPrevious.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve([buildTextMessage({ id: 1 })]);
          }, 10);
        })
    );

    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    const promise = act(async () => {
      await result.current.api.fetchPrevious();
    });

    // Change generation while fetch is in flight
    refs.generationRef.current += 1;

    await promise;

    // The stale FETCH_PREVIOUS_SUCCESS should be suppressed
    expect(result.current.dispatched.some(a => a.type === 'FETCH_PREVIOUS_SUCCESS')).toBe(false);
  });

  it('fetchPrevious is guarded by isFetchingPrevRef', async () => {
    const { refs, manager } = makeRefs();

    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    // Simulate a fetch already in flight
    refs.isFetchingPrevRef.current = true;

    await act(async () => {
      await result.current.api.fetchPrevious();
    });

    expect(manager.fetchPrevious).not.toHaveBeenCalled();
  });

  it('fetchPrevious is a no-op when manager is null', async () => {
    const { refs } = makeRefs();
    refs.managerRef.current = null;

    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    await act(async () => {
      await result.current.api.fetchPrevious();
    });

    expect(result.current.dispatched).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // fetchNext
  // ---------------------------------------------------------------------------

  it('fetchNext dispatches SUCCESS and SET_HAS_REACHED_LATEST when no more newer', async () => {
    const { refs, manager } = makeRefs();
    manager.fetchNext.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    await act(async () => {
      await result.current.api.fetchNext();
    });

    const types = result.current.dispatched.map(a => a.type);
    expect(types).toContain('FETCH_NEXT_START');
    expect(types).toContain('FETCH_NEXT_SUCCESS');
    expect(types).toContain('SET_HAS_REACHED_LATEST');
  });

  it('fetchNext omits SET_HAS_REACHED_LATEST when newer messages were returned', async () => {
    const { refs, manager } = makeRefs();
    manager.fetchNext.mockResolvedValueOnce([buildTextMessage({ id: 1 })]);

    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    await act(async () => {
      await result.current.api.fetchNext();
    });

    const hasReachedLatest = result.current.dispatched.find(
      a => a.type === 'SET_HAS_REACHED_LATEST'
    );
    expect(hasReachedLatest).toBeUndefined();
  });

  it('fetchNext dispatches ERROR on SDK failure', async () => {
    const { refs, manager } = makeRefs();
    manager.fetchNext.mockRejectedValueOnce(new Error('fetch next failed'));
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useHarness(baseOptions({ user: user as never, onError }), refs)
    );

    await act(async () => {
      await result.current.api.fetchNext();
    });

    expect(result.current.dispatched.some(a => a.type === 'FETCH_NEXT_ERROR')).toBe(true);
    expect(onError).toHaveBeenCalled();
  });

  it('fetchNext is guarded by isFetchingNextRef', async () => {
    const { refs, manager } = makeRefs();
    refs.isFetchingNextRef.current = true;

    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    await act(async () => {
      await result.current.api.fetchNext();
    });

    expect(manager.fetchNext).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // setAtBottom / clearNewMessageCount / scrollToMessage
  // ---------------------------------------------------------------------------

  it('setAtBottom dispatches SET_AT_BOTTOM', () => {
    const { refs } = makeRefs();
    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    act(() => {
      result.current.api.setAtBottom(true);
    });

    expect(result.current.dispatched).toEqual([{ type: 'SET_AT_BOTTOM', isAtBottom: true }]);
  });

  it('clearNewMessageCount dispatches CLEAR_NEW_MESSAGE_COUNT', () => {
    const { refs } = makeRefs();
    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    act(() => {
      result.current.api.clearNewMessageCount();
    });

    expect(result.current.dispatched).toEqual([{ type: 'CLEAR_NEW_MESSAGE_COUNT' }]);
  });

  it('scrollToMessage dispatches SET_SCROLL_TO_MESSAGE', () => {
    const { refs } = makeRefs();
    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    act(() => {
      result.current.api.scrollToMessage(42);
    });

    expect(result.current.dispatched).toEqual([{ type: 'SET_SCROLL_TO_MESSAGE', messageId: 42 }]);
  });

  // ---------------------------------------------------------------------------
  // markConversationAsReadIfUnread
  // ---------------------------------------------------------------------------

  it('markConversationAsReadIfUnread marks when last msg is from other user and unread', () => {
    const other = buildUser({ uid: 'peer' });
    const lastMsg = Object.assign(buildTextMessage({ id: 9, sender: other as never }), {
      getReadAt: () => 0,
      setReadAt: vi.fn(),
    });
    const state: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [lastMsg as never],
    };
    const { refs, manager } = makeRefs(state);

    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    act(() => {
      result.current.api.markConversationAsReadIfUnread();
    });

    expect(manager.markConversationAsRead).toHaveBeenCalled();
    expect(result.current.dispatched).toContainEqual({ type: 'SET_CONVERSATION_READ' });
    expect(lastMsg.setReadAt).toHaveBeenCalled();
  });

  it('markConversationAsReadIfUnread skips when markedUnreadByUser', () => {
    const other = buildUser({ uid: 'peer' });
    const lastMsg = Object.assign(buildTextMessage({ id: 9, sender: other as never }), {
      getReadAt: () => 0,
      setReadAt: vi.fn(),
    });
    const state: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [lastMsg as never],
      markedUnreadByUser: true,
    };
    const { refs, manager } = makeRefs(state);

    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    act(() => {
      result.current.api.markConversationAsReadIfUnread();
    });

    expect(manager.markConversationAsRead).not.toHaveBeenCalled();
  });

  it('markConversationAsReadIfUnread skips with no messages', () => {
    const { refs, manager } = makeRefs();
    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    act(() => {
      result.current.api.markConversationAsReadIfUnread();
    });

    expect(manager.markConversationAsRead).not.toHaveBeenCalled();
  });

  it('markConversationAsReadIfUnread skips when last message is from the logged-in user', () => {
    const me = buildUser({ uid: 'me' });
    const lastMsg = Object.assign(buildTextMessage({ id: 9, sender: me as never }), {
      getReadAt: () => 0,
      setReadAt: vi.fn(),
    });
    const state: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [lastMsg as never],
    };
    const { refs, manager } = makeRefs(state, { loggedInUser: me as never });

    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    act(() => {
      result.current.api.markConversationAsReadIfUnread();
    });

    expect(manager.markConversationAsRead).not.toHaveBeenCalled();
  });

  it('markConversationAsReadIfUnread skips when last message is already read', () => {
    const other = buildUser({ uid: 'peer' });
    const lastMsg = Object.assign(buildTextMessage({ id: 9, sender: other as never }), {
      getReadAt: () => 9999,
      setReadAt: vi.fn(),
    });
    const state: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [lastMsg as never],
    };
    const { refs, manager } = makeRefs(state);

    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    act(() => {
      result.current.api.markConversationAsReadIfUnread();
    });

    expect(manager.markConversationAsRead).not.toHaveBeenCalled();
  });

  it('markConversationAsReadIfUnread calls onConversationMarkedAsRead with fetched conversation', async () => {
    const other = buildUser({ uid: 'peer' });
    const lastMsg = Object.assign(buildTextMessage({ id: 9, sender: other as never }), {
      getReadAt: () => 0,
      setReadAt: vi.fn(),
    });
    const state: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [lastMsg as never],
    };
    const onConversationMarkedAsRead = vi.fn();
    const { refs, manager } = makeRefs(state, { onConversationMarkedAsRead });
    const conv = { getConversationId: () => 'c1' };
    manager.getConversation.mockResolvedValueOnce(conv);

    const { result } = renderHook(() =>
      useHarness(baseOptions({ user: user as never, onConversationMarkedAsRead }), refs)
    );

    act(() => {
      result.current.api.markConversationAsReadIfUnread();
    });

    await waitFor(() => {
      expect(onConversationMarkedAsRead).toHaveBeenCalledWith(conv);
    });
  });

  it('markConversationAsReadIfUnread is a no-op when manager is null', () => {
    const { refs, manager } = makeRefs();
    refs.managerRef.current = null;

    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    act(() => {
      result.current.api.markConversationAsReadIfUnread();
    });

    expect(manager.markConversationAsRead).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // goToMessage
  // ---------------------------------------------------------------------------

  it('goToMessage dispatches SET_SCROLL_TO_MESSAGE when message already loaded', async () => {
    const loaded = buildTextMessage({ id: 42 });
    const state: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [loaded as never],
    };
    const { refs, manager } = makeRefs(state);

    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    await act(async () => {
      await result.current.api.goToMessage(42);
    });

    expect(manager.fetchAroundMessageId).not.toHaveBeenCalled();
    expect(result.current.dispatched).toEqual([
      { type: 'SET_SCROLL_TO_MESSAGE', messageId: 42, highlight: true },
    ]);
  });

  it('goToMessage re-fetches when message is not loaded', async () => {
    const { refs, manager } = makeRefs();
    manager.fetchAroundMessageId.mockResolvedValueOnce({
      messages: [buildTextMessage({ id: 100 })],
      hasMoreNewer: false,
    });

    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    await act(async () => {
      await result.current.api.goToMessage(100);
    });

    const types = result.current.dispatched.map(a => a.type);
    expect(types).toContain('RESET');
    expect(types).toContain('FETCH_PREVIOUS_START');
    expect(types).toContain('FETCH_AROUND_SUCCESS');
  });

  it('goToMessage dispatches FETCH_PREVIOUS_ERROR on SDK failure', async () => {
    const { refs, manager } = makeRefs();
    manager.fetchAroundMessageId.mockRejectedValueOnce(new Error('nope'));
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useHarness(baseOptions({ user: user as never, onError }), refs)
    );

    await act(async () => {
      await result.current.api.goToMessage(100);
    });

    expect(result.current.dispatched.some(a => a.type === 'FETCH_PREVIOUS_ERROR')).toBe(true);
    expect(onError).toHaveBeenCalled();
  });

  it('goToMessage is a no-op when manager is null and message not loaded', async () => {
    const { refs } = makeRefs();
    refs.managerRef.current = null;

    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    await act(async () => {
      await result.current.api.goToMessage(42);
    });

    expect(result.current.dispatched).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // scrollToBottom
  // ---------------------------------------------------------------------------

  it('scrollToBottom returns "scroll-dom" and marks as read when hasReachedLatest=true', () => {
    const other = buildUser({ uid: 'peer' });
    const lastMsg = Object.assign(buildTextMessage({ id: 1, sender: other as never }), {
      getReadAt: () => 0,
      setReadAt: vi.fn(),
    });
    const state: CometChatMessageListState = {
      ...initialMessageListState,
      hasReachedLatest: true,
      messages: [lastMsg as never],
    };
    const { refs, manager } = makeRefs(state);

    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    let ret = '';
    act(() => {
      ret = result.current.api.scrollToBottom();
    });

    expect(ret).toBe('scroll-dom');
    expect(manager.markConversationAsRead).toHaveBeenCalled();
  });

  it('scrollToBottom returns "refetching" when hasReachedLatest=false and no unread', async () => {
    const state: CometChatMessageListState = {
      ...initialMessageListState,
      hasReachedLatest: false,
      unreadCount: 0,
      lastReadMessageId: null,
    };
    const { refs } = makeRefs(state);

    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    let ret = '';
    act(() => {
      ret = result.current.api.scrollToBottom();
    });

    expect(ret).toBe('refetching');
    // A new manager is instantiated for the re-fetch
    expect(newManagerInstances.length).toBeGreaterThan(0);

    await waitFor(() => {
      const types = result.current.dispatched.map(a => a.type);
      expect(types).toContain('FETCH_PREVIOUS_SUCCESS');
    });
  });

  it('scrollToBottom goes to lastRead when startFromUnreadMessages=true and unread not loaded', async () => {
    const state: CometChatMessageListState = {
      ...initialMessageListState,
      hasReachedLatest: false,
      unreadCount: 3,
      lastReadMessageId: 50,
      messages: [],
    };
    const { refs, manager } = makeRefs(state, { startFromUnreadMessages: true });
    manager.fetchAroundMessageId.mockResolvedValueOnce({
      messages: [buildTextMessage({ id: 50 })],
      hasMoreNewer: true,
    });

    const { result } = renderHook(() =>
      useHarness(baseOptions({ user: user as never, startFromUnreadMessages: true } as never), refs)
    );

    let ret = '';
    act(() => {
      ret = result.current.api.scrollToBottom();
    });

    expect(ret).toBe('refetching');
    expect(manager.markConversationAsRead).toHaveBeenCalled();

    await waitFor(() => {
      const types = result.current.dispatched.map(a => a.type);
      expect(types).toContain('SET_SHOW_UNREAD_BANNER');
    });
  });

  it('scrollToBottom uses the re-fetch branch when startFromUnreadMessages=false even with unread', () => {
    const state: CometChatMessageListState = {
      ...initialMessageListState,
      hasReachedLatest: false,
      unreadCount: 3,
      lastReadMessageId: 50,
      messages: [],
    };
    const { refs } = makeRefs(state, { startFromUnreadMessages: false });

    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    act(() => {
      result.current.api.scrollToBottom();
    });

    // Re-fetch branch creates a new manager
    expect(newManagerInstances.length).toBeGreaterThan(0);
  });

  it('scrollToBottom preserves markedUnreadByUser state across the re-fetch branch', async () => {
    const state: CometChatMessageListState = {
      ...initialMessageListState,
      hasReachedLatest: false,
      unreadCount: 3,
      lastReadMessageId: 50,
      markedUnreadByUser: true,
      messages: [],
    };
    const { refs } = makeRefs(state, { startFromUnreadMessages: true });

    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    act(() => {
      result.current.api.scrollToBottom();
    });

    await waitFor(() => {
      const types = result.current.dispatched.map(a => a.type);
      expect(types).toContain('SET_MARKED_UNREAD_BY_USER');
    });

    // The re-fetch branch should NOT auto-mark-as-read when user manually unreaded
    const markConvReads = newManagerInstances.flatMap(i => {
      const fn = i.markConversationAsRead;
      return typeof fn === 'function' && 'mock' in fn ? fn.mock.calls : [];
    });
    expect(markConvReads).toHaveLength(0);
  });

  it('scrollToBottom re-fetch branch handles fetchPrevious failure via onError', async () => {
    const state: CometChatMessageListState = {
      ...initialMessageListState,
      hasReachedLatest: false,
      unreadCount: 0,
      lastReadMessageId: null,
    };
    const { refs } = makeRefs(state);
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useHarness(baseOptions({ user: user as never, onError }), refs)
    );

    // Reject the new manager's fetchPrevious
    // The mock above always creates a fresh instance; override its fetchPrevious
    // by intercepting the next instance created.
    const origMocked = (await import('../CometChatMessageListManager'))
      .CometChatMessageListManager as unknown as ReturnType<typeof vi.fn>;
    origMocked.mockImplementationOnce(() => {
      const inst = {
        fetchPrevious: vi.fn().mockRejectedValue(new Error('fail')),
        fetchNext: vi.fn().mockResolvedValue([]),
        markConversationAsRead: vi.fn().mockResolvedValue(undefined),
        markAsDelivered: vi.fn().mockResolvedValue(undefined),
        markAsRead: vi.fn().mockResolvedValue(undefined),
        fetchAroundMessageId: vi.fn().mockResolvedValue({ messages: [], hasMoreNewer: false }),
        getConversation: vi.fn().mockResolvedValue({}),
      };
      newManagerInstances.push(inst);
      return inst;
    });

    act(() => {
      result.current.api.scrollToBottom();
    });

    await waitFor(() => {
      expect(result.current.dispatched.some(a => a.type === 'FETCH_PREVIOUS_ERROR')).toBe(true);
    });
    expect(onError).toHaveBeenCalled();
  });

  it('scrollToBottom in group chat also uses the re-fetch branch', () => {
    const state: CometChatMessageListState = {
      ...initialMessageListState,
      hasReachedLatest: false,
    };
    const { refs } = makeRefs(state);

    const { result } = renderHook(() =>
      useHarness(baseOptions({ group: group as never, user: undefined }), refs)
    );

    act(() => {
      result.current.api.scrollToBottom();
    });

    expect(newManagerInstances.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function baseOptions(
  overrides: Partial<Parameters<typeof useMessageListScroll>[0]>
): Parameters<typeof useMessageListScroll>[0] {
  return {
    user: overrides.user,
    group: overrides.group,
    messagesRequestBuilder: undefined,
    parentMessageId: undefined,
    messageTypes: ['text'],
    messageCategories: ['message'],
    onError: overrides.onError,
    onConversationMarkedAsRead: overrides.onConversationMarkedAsRead,
  } as Parameters<typeof useMessageListScroll>[0];
}
