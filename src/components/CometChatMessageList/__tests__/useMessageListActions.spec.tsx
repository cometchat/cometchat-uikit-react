/**
 * Tests for useMessageListActions.
 *
 * We bypass the real SDK by injecting a mock manager into the shared refs
 * object and asserting the dispatch calls + SDK wrapper calls.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMessageListActions } from '../useMessageListActions';
import type { MessageListRefs } from '../messageListRefs';
import type {
  CometChatMessageListAction,
  CometChatMessageListState,
  CometChatUseMessageListOptions,
} from '../CometChatMessageList.types';
import { initialMessageListState } from '../CometChatMessageList.types';
import { buildTextMessage } from '../../../testing/mock-builders';

function makeRefs(initialState: CometChatMessageListState = initialMessageListState): {
  refs: MessageListRefs;
  manager: Record<string, ReturnType<typeof vi.fn>>;
} {
  const manager = {
    deleteMessage: vi.fn(),
    markMessageAsUnread: vi.fn(),
    markConversationAsRead: vi.fn().mockResolvedValue(undefined),
  };
  const refs: MessageListRefs = {
    generationRef: { current: 0 },
    managerRef: { current: manager as never },
    isFetchingPrevRef: { current: false },
    isFetchingNextRef: { current: false },
    lastUnreadMarkedIdRef: { current: '' },
    groupRef: { current: undefined },
    stateRef: { current: initialState },
    optionsRef: { current: {} as CometChatUseMessageListOptions },
    initializeRef: { current: null },
  };
  return { refs, manager };
}

function useHarness(options: Parameters<typeof useMessageListActions>[0], refs: MessageListRefs) {
  const [dispatched, setDispatched] = React.useState<CometChatMessageListAction[]>([]);
  const dispatch = React.useCallback((action: CometChatMessageListAction) => {
    setDispatched(list => [...list, action]);
  }, []);
  const api = useMessageListActions(options, refs, dispatch);
  return { api, dispatched };
}

describe('useMessageListActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // deleteMessage
  // ---------------------------------------------------------------------------

  it('deleteMessage dispatches MESSAGE_DELETED and invokes onMessageDeleted', async () => {
    const { refs, manager } = makeRefs();
    const deleted = buildTextMessage({ id: 7 });
    manager.deleteMessage.mockResolvedValueOnce(deleted);
    const onMessageDeleted = vi.fn();

    const { result } = renderHook(() =>
      useHarness({ onError: undefined, onMessageDeleted, onConversationUpdated: undefined }, refs)
    );

    await act(async () => {
      await result.current.api.deleteMessage(7);
    });

    expect(manager.deleteMessage).toHaveBeenCalledWith(7);
    expect(result.current.dispatched).toContainEqual({ type: 'MESSAGE_DELETED', message: deleted });
    expect(onMessageDeleted).toHaveBeenCalledWith(deleted);
  });

  it('deleteMessage is a no-op when no manager is attached', async () => {
    const { refs, manager } = makeRefs();
    refs.managerRef.current = null;

    const { result } = renderHook(() =>
      useHarness(
        { onError: undefined, onMessageDeleted: undefined, onConversationUpdated: undefined },
        refs
      )
    );

    await act(async () => {
      await result.current.api.deleteMessage(5);
    });

    expect(manager.deleteMessage).not.toHaveBeenCalled();
  });

  it('deleteMessage forwards error to onError on SDK failure', async () => {
    const { refs, manager } = makeRefs();
    const onError = vi.fn();
    manager.deleteMessage.mockRejectedValueOnce(new Error('delete failed'));

    const { result } = renderHook(() =>
      useHarness({ onError, onMessageDeleted: undefined, onConversationUpdated: undefined }, refs)
    );

    await act(async () => {
      await result.current.api.deleteMessage(1);
    });

    expect(onError).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // markMessageAsUnread
  // ---------------------------------------------------------------------------

  it('markMessageAsUnread dispatches lastReadMessageId + unreadCount + flags', async () => {
    const { refs, manager } = makeRefs();
    const conversation = {
      getLastReadMessageId: () => '42',
      getUnreadMessageCount: () => 3,
    };
    manager.markMessageAsUnread.mockResolvedValueOnce(conversation);
    const onConversationUpdated = vi.fn();

    const { result } = renderHook(() =>
      useHarness({ onError: undefined, onMessageDeleted: undefined, onConversationUpdated }, refs)
    );

    await act(async () => {
      await result.current.api.markMessageAsUnread(buildTextMessage({ id: 10 }) as never);
    });

    const types = result.current.dispatched.map(a => a.type);
    expect(types).toEqual(
      expect.arrayContaining([
        'SET_LAST_READ_MESSAGE_ID',
        'SET_UNREAD_COUNT',
        'SET_MARKED_UNREAD_BY_USER',
        'SET_SHOW_UNREAD_BANNER',
      ])
    );
    expect(onConversationUpdated).toHaveBeenCalledWith(conversation);
  });

  it('markMessageAsUnread handles null lastReadMessageId from conversation', async () => {
    const { refs, manager } = makeRefs();
    manager.markMessageAsUnread.mockResolvedValueOnce({
      getLastReadMessageId: () => null,
      getUnreadMessageCount: () => 0,
    });

    const { result } = renderHook(() =>
      useHarness(
        { onError: undefined, onMessageDeleted: undefined, onConversationUpdated: undefined },
        refs
      )
    );

    await act(async () => {
      await result.current.api.markMessageAsUnread(buildTextMessage({ id: 11 }) as never);
    });

    const lastReadDispatch = result.current.dispatched.find(
      a => a.type === 'SET_LAST_READ_MESSAGE_ID'
    );
    expect(lastReadDispatch).toMatchObject({ messageId: null });
  });

  it('markMessageAsUnread guards duplicate calls for the same message', async () => {
    const { refs, manager } = makeRefs();
    manager.markMessageAsUnread.mockResolvedValue({
      getLastReadMessageId: () => '42',
      getUnreadMessageCount: () => 1,
    });

    const { result } = renderHook(() =>
      useHarness(
        { onError: undefined, onMessageDeleted: undefined, onConversationUpdated: undefined },
        refs
      )
    );

    const msg = buildTextMessage({ id: 10 });
    await act(async () => {
      await result.current.api.markMessageAsUnread(msg as never);
    });
    await act(async () => {
      await result.current.api.markMessageAsUnread(msg as never);
    });

    expect(manager.markMessageAsUnread).toHaveBeenCalledTimes(1);
  });

  it('markMessageAsUnread is a no-op without a manager', async () => {
    const { refs, manager } = makeRefs();
    refs.managerRef.current = null;

    const { result } = renderHook(() =>
      useHarness(
        { onError: undefined, onMessageDeleted: undefined, onConversationUpdated: undefined },
        refs
      )
    );

    await act(async () => {
      await result.current.api.markMessageAsUnread(buildTextMessage({ id: 1 }) as never);
    });

    expect(manager.markMessageAsUnread).not.toHaveBeenCalled();
  });

  it('markMessageAsUnread calls onError when the SDK fails', async () => {
    const { refs, manager } = makeRefs();
    const onError = vi.fn();
    manager.markMessageAsUnread.mockRejectedValueOnce(new Error('mark failed'));

    const { result } = renderHook(() =>
      useHarness({ onError, onMessageDeleted: undefined, onConversationUpdated: undefined }, refs)
    );

    await act(async () => {
      await result.current.api.markMessageAsUnread(buildTextMessage({ id: 22 }) as never);
    });

    expect(onError).toHaveBeenCalled();
  });
});
