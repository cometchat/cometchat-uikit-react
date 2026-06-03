/**
 * Tests for useMessageListInit.
 *
 * Mocks the Manager constructor so `new CometChatMessageListManager(...)` returns
 * a stub with controllable async methods. Asserts the dispatches produced by
 * the initialization sequence across the major branches:
 *   - normal latest fetch (no target)
 *   - startFromUnread when there's a lastReadId + unread
 *   - explicit goToMessageId
 *   - no conversation available (getConversation rejects)
 *   - fetch failure path
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const createdManagers: Record<string, ReturnType<typeof vi.fn>>[] = [];
let currentManagerFactory: (() => Record<string, ReturnType<typeof vi.fn>>) | null = null;

vi.mock('../CometChatMessageListManager', () => {
  return {
    CometChatMessageListManager: vi.fn().mockImplementation(() => {
      const inst = currentManagerFactory
        ? currentManagerFactory()
        : {
            fetchPrevious: vi.fn().mockResolvedValue([]),
            fetchAroundMessageId: vi.fn().mockResolvedValue({ messages: [], hasMoreNewer: false }),
            markAsDelivered: vi.fn().mockResolvedValue(undefined),
            markConversationAsRead: vi.fn().mockResolvedValue(undefined),
            getConversation: vi.fn().mockResolvedValue({
              getLastReadMessageId: () => null,
              getUnreadMessageCount: () => 0,
            }),
          };
      createdManagers.push(inst);
      return inst;
    }),
  };
});

import { useMessageListInit } from '../useMessageListInit';
import type { MessageListRefs } from '../messageListRefs';
import type {
  CometChatMessageListAction,
  CometChatUseMessageListOptions,
} from '../CometChatMessageList.types';
import { initialMessageListState } from '../CometChatMessageList.types';
import { buildUser, buildGroup, buildTextMessage } from '../../../testing/mock-builders';

function makeRefs(options: Partial<CometChatUseMessageListOptions> = {}) {
  const loggedInUser = options.loggedInUser ?? (buildUser({ uid: 'me' }) as never);
  const refs: MessageListRefs = {
    generationRef: { current: 0 },
    managerRef: { current: null },
    isFetchingPrevRef: { current: false },
    isFetchingNextRef: { current: false },
    lastUnreadMarkedIdRef: { current: '' },
    groupRef: { current: undefined },
    stateRef: { current: initialMessageListState },
    optionsRef: {
      current: {
        loggedInUser,
        ...options,
      } as CometChatUseMessageListOptions,
    },
    initializeRef: { current: null },
  };
  return refs;
}

function useHarness(options: Parameters<typeof useMessageListInit>[0], refs: MessageListRefs) {
  const [dispatched, setDispatched] = React.useState<CometChatMessageListAction[]>([]);
  const dispatch = React.useCallback((action: CometChatMessageListAction) => {
    setDispatched(list => [...list, action]);
  }, []);
  useMessageListInit(options, refs, dispatch);
  return { dispatched };
}

describe('useMessageListInit', () => {
  const loggedInUser = buildUser({ uid: 'me' });
  const user = buildUser({ uid: 'peer' });
  const group = buildGroup({ guid: 'room' });

  beforeEach(() => {
    vi.clearAllMocks();
    createdManagers.length = 0;
    currentManagerFactory = null;
  });

  function baseOptions(
    overrides: Partial<Parameters<typeof useMessageListInit>[0]>
  ): Parameters<typeof useMessageListInit>[0] {
    return {
      user: undefined,
      group: undefined,
      loggedInUser: loggedInUser as never,
      messagesRequestBuilder: undefined,
      parentMessageId: undefined,
      startFromUnreadMessages: false,
      goToMessageId: undefined,
      messageTypes: ['text'],
      messageCategories: ['message'],
      onError: undefined,
      onActiveChatChanged: undefined,
      ...overrides,
    } as Parameters<typeof useMessageListInit>[0];
  }

  it('is a no-op when neither user nor group is provided', async () => {
    const refs = makeRefs();
    const { result } = renderHook(() => useHarness(baseOptions({}), refs));

    await new Promise(r => setTimeout(r, 5));

    expect(createdManagers).toHaveLength(0);
    expect(result.current.dispatched).toHaveLength(0);
  });

  it('runs the normal latest-fetch init when user is provided and no target', async () => {
    const peer = buildUser({ uid: 'peer' });
    const msgs = [
      Object.assign(buildTextMessage({ id: 10, sender: peer as never }), {
        setReadAt: vi.fn(),
        setDeliveredAt: vi.fn(),
      }),
    ];
    const fetchPrevious = vi.fn().mockResolvedValue(msgs);
    const getConversation = vi.fn().mockResolvedValue({
      getLastReadMessageId: () => null,
      getUnreadMessageCount: () => 0,
    });
    currentManagerFactory = () => ({
      fetchPrevious,
      fetchAroundMessageId: vi.fn().mockResolvedValue({ messages: [], hasMoreNewer: false }),
      markAsDelivered: vi.fn().mockResolvedValue(undefined),
      markConversationAsRead: vi.fn().mockResolvedValue(undefined),
      getConversation,
    });

    const refs = makeRefs();
    const onActiveChatChanged = vi.fn();
    const { result } = renderHook(() =>
      useHarness(baseOptions({ user: user as never, onActiveChatChanged }), refs)
    );

    await waitFor(() => {
      const types = result.current.dispatched.map(a => a.type);
      expect(types).toContain('FETCH_PREVIOUS_SUCCESS');
      expect(types).toContain('SET_HAS_REACHED_LATEST');
    });

    expect(createdManagers).toHaveLength(1);
    expect(createdManagers[0]?.fetchPrevious).toHaveBeenCalled();

    await waitFor(() => {
      expect(onActiveChatChanged).toHaveBeenCalled();
    });
  });

  it('fetches around lastReadId when startFromUnreadMessages is true and there are unread', async () => {
    const peer = buildUser({ uid: 'peer' });
    const msgs = [
      Object.assign(buildTextMessage({ id: 40, sender: peer as never }), {
        setReadAt: vi.fn(),
        setDeliveredAt: vi.fn(),
      }),
      Object.assign(buildTextMessage({ id: 50, sender: peer as never }), {
        setReadAt: vi.fn(),
        setDeliveredAt: vi.fn(),
      }),
      Object.assign(buildTextMessage({ id: 60, sender: peer as never }), {
        setReadAt: vi.fn(),
        setDeliveredAt: vi.fn(),
      }),
    ];
    currentManagerFactory = () => ({
      fetchPrevious: vi.fn().mockResolvedValue([]),
      fetchAroundMessageId: vi.fn().mockResolvedValue({
        messages: msgs,
        hasMoreNewer: true,
      }),
      markAsDelivered: vi.fn().mockResolvedValue(undefined),
      markConversationAsRead: vi.fn().mockResolvedValue(undefined),
      getConversation: vi.fn().mockResolvedValue({
        getLastReadMessageId: () => '50',
        getUnreadMessageCount: () => 3,
      }),
    });

    const refs = makeRefs();
    const { result } = renderHook(() =>
      useHarness(baseOptions({ user: user as never, startFromUnreadMessages: true }), refs)
    );

    await waitFor(() => {
      const types = result.current.dispatched.map(a => a.type);
      expect(types).toContain('FETCH_AROUND_SUCCESS');
      expect(types).toContain('SET_LAST_READ_MESSAGE_ID');
      // Target equals lastReadId, so banner should be shown
      expect(types).toContain('SET_SHOW_UNREAD_BANNER');
    });
  });

  it('fetches around goToMessageId when explicitly provided', async () => {
    const peer = buildUser({ uid: 'peer' });
    const msgs = [
      Object.assign(buildTextMessage({ id: 77, sender: peer as never }), {
        setReadAt: vi.fn(),
        setDeliveredAt: vi.fn(),
      }),
    ];
    currentManagerFactory = () => ({
      fetchPrevious: vi.fn().mockResolvedValue([]),
      fetchAroundMessageId: vi.fn().mockResolvedValue({
        messages: msgs,
        hasMoreNewer: false,
      }),
      markAsDelivered: vi.fn().mockResolvedValue(undefined),
      markConversationAsRead: vi.fn().mockResolvedValue(undefined),
      getConversation: vi.fn().mockResolvedValue({
        getLastReadMessageId: () => null,
        getUnreadMessageCount: () => 0,
      }),
    });

    const refs = makeRefs();
    const { result } = renderHook(() =>
      useHarness(baseOptions({ user: user as never, goToMessageId: 77 }), refs)
    );

    await waitFor(() => {
      const around = result.current.dispatched.find(a => a.type === 'FETCH_AROUND_SUCCESS');
      expect(around).toMatchObject({ targetMessageId: 77, highlight: true });
    });
  });

  it('proceeds with init when conversation fetch rejects (non-fatal)', async () => {
    currentManagerFactory = () => ({
      fetchPrevious: vi.fn().mockResolvedValue([]),
      fetchAroundMessageId: vi.fn(),
      markAsDelivered: vi.fn().mockResolvedValue(undefined),
      markConversationAsRead: vi.fn().mockResolvedValue(undefined),
      getConversation: vi.fn().mockRejectedValue(new Error('no convo yet')),
    });

    const refs = makeRefs();
    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    await waitFor(() => {
      const types = result.current.dispatched.map(a => a.type);
      expect(types).toContain('FETCH_PREVIOUS_SUCCESS');
    });
  });

  it('dispatches FETCH_PREVIOUS_ERROR when fetchPrevious fails during init', async () => {
    currentManagerFactory = () => ({
      fetchPrevious: vi.fn().mockRejectedValue(new Error('nope')),
      fetchAroundMessageId: vi.fn(),
      markAsDelivered: vi.fn().mockResolvedValue(undefined),
      markConversationAsRead: vi.fn().mockResolvedValue(undefined),
      getConversation: vi.fn().mockResolvedValue({
        getLastReadMessageId: () => null,
        getUnreadMessageCount: () => 0,
      }),
    });

    const refs = makeRefs();
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useHarness(baseOptions({ user: user as never, onError }), refs)
    );

    await waitFor(() => {
      // Init dispatches FETCH_PREVIOUS_ERROR when fetchPrevious rejects
      expect(result.current.dispatched.some(a => a.type === 'FETCH_PREVIOUS_ERROR')).toBe(true);
      const errorAction = result.current.dispatched.find(a => a.type === 'FETCH_PREVIOUS_ERROR');
      expect((errorAction as { error: string }).error).toBe('nope');
    });
  });

  it('exposes the initialize callback on refs.initializeRef', async () => {
    const refs = makeRefs();

    renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    await waitFor(() => {
      expect(refs.initializeRef.current).toBeTypeOf('function');
    });
  });

  it('runs init for a group conversation', async () => {
    const refs = makeRefs();
    const { result } = renderHook(() => useHarness(baseOptions({ group: group as never }), refs));

    await waitFor(() => {
      expect(result.current.dispatched.some(a => a.type === 'FETCH_PREVIOUS_SUCCESS')).toBe(true);
    });

    expect(createdManagers).toHaveLength(1);
  });

  it('marks last incoming message as delivered on init', async () => {
    const other = buildUser({ uid: 'peer' });
    const lastMsg = Object.assign(buildTextMessage({ id: 50, sender: other as never }), {
      setReadAt: vi.fn(),
      setDeliveredAt: vi.fn(),
    });
    const markAsDelivered = vi.fn().mockResolvedValue(undefined);
    currentManagerFactory = () => ({
      fetchPrevious: vi.fn().mockResolvedValue([lastMsg]),
      fetchAroundMessageId: vi.fn(),
      markAsDelivered,
      markConversationAsRead: vi.fn().mockResolvedValue(undefined),
      getConversation: vi.fn().mockResolvedValue({
        getLastReadMessageId: () => null,
        getUnreadMessageCount: () => 0,
      }),
    });

    const refs = makeRefs();
    renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    await waitFor(() => {
      expect(markAsDelivered).toHaveBeenCalledWith(lastMsg);
    });
  });

  it('skips markAsDelivered when the last message is from the logged-in user', async () => {
    const lastMsg = Object.assign(buildTextMessage({ id: 50, sender: loggedInUser as never }), {
      setReadAt: vi.fn(),
      setDeliveredAt: vi.fn(),
    });
    const markAsDelivered = vi.fn().mockResolvedValue(undefined);
    currentManagerFactory = () => ({
      fetchPrevious: vi.fn().mockResolvedValue([lastMsg]),
      fetchAroundMessageId: vi.fn(),
      markAsDelivered,
      markConversationAsRead: vi.fn().mockResolvedValue(undefined),
      getConversation: vi.fn().mockResolvedValue({
        getLastReadMessageId: () => null,
        getUnreadMessageCount: () => 0,
      }),
    });

    const refs = makeRefs();
    const { result } = renderHook(() => useHarness(baseOptions({ user: user as never }), refs));

    await waitFor(() => {
      expect(result.current.dispatched.some(a => a.type === 'FETCH_PREVIOUS_SUCCESS')).toBe(true);
    });

    // Wait for any async path that would call markAsDelivered
    await new Promise(r => setTimeout(r, 20));

    expect(markAsDelivered).not.toHaveBeenCalled();
  });
});
