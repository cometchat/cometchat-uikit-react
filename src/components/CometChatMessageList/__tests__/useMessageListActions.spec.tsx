/**
 * Tests for useMessageListActions.
 *
 * We bypass the real SDK by injecting a mock manager into the shared refs
 * object and asserting the dispatch calls + SDK wrapper calls.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
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

  // ---------------------------------------------------------------------------
  // reactToMessage (optimistic)
  // ---------------------------------------------------------------------------

  function messageWithReactions(id: number, reactions: CometChat.ReactionCount[]) {
    return { ...buildTextMessage({ id }), getReactions: () => reactions };
  }

  function reactionDispatches(dispatched: CometChatMessageListAction[]) {
    return dispatched.filter(a => a.type === 'REACTION_UPDATE') as {
      type: 'REACTION_UPDATE';
      messageId: number;
      reactions: CometChat.ReactionCount[];
    }[];
  }

  it('reactToMessage optimistically adds a new reaction, then reconciles with the server', async () => {
    const msg = messageWithReactions(5, []);
    const { refs } = makeRefs({ ...initialMessageListState, messages: [msg] as never });

    const serverReactions = [new CometChat.ReactionCount('👍', 1, true)];
    const addSpy = vi
      .spyOn(CometChat, 'addReaction')
      .mockResolvedValue({ getReactions: () => serverReactions } as never);

    const { result } = renderHook(() =>
      useHarness(
        { onError: undefined, onMessageDeleted: undefined, onConversationUpdated: undefined },
        refs
      )
    );

    await act(async () => {
      await result.current.api.reactToMessage(5, '👍');
    });

    expect(addSpy).toHaveBeenCalledWith(5, '👍');

    const updates = reactionDispatches(result.current.dispatched);
    // Optimistic, then reconcile.
    expect(updates).toHaveLength(2);
    expect(updates[0]?.reactions).toHaveLength(1);
    expect(updates[0]?.reactions[0]?.getReaction()).toBe('👍');
    expect(updates[0]?.reactions[0]?.getCount()).toBe(1);
    expect(updates[0]?.reactions[0]?.getReactedByMe()).toBe(true);
    expect(updates[1]?.reactions).toBe(serverReactions);

    addSpy.mockRestore();
  });

  it('reactToMessage optimistically removes a reaction the user placed', async () => {
    const msg = messageWithReactions(6, [new CometChat.ReactionCount('👍', 1, true)]);
    const { refs } = makeRefs({ ...initialMessageListState, messages: [msg] as never });

    const removeSpy = vi
      .spyOn(CometChat, 'removeReaction')
      .mockResolvedValue({ getReactions: () => [] } as never);

    const { result } = renderHook(() =>
      useHarness(
        { onError: undefined, onMessageDeleted: undefined, onConversationUpdated: undefined },
        refs
      )
    );

    await act(async () => {
      await result.current.api.reactToMessage(6, '👍');
    });

    expect(removeSpy).toHaveBeenCalledWith(6, '👍');

    const updates = reactionDispatches(result.current.dispatched);
    // Optimistic removal drops the sole reaction immediately.
    expect(updates[0]?.reactions).toHaveLength(0);

    removeSpy.mockRestore();
  });

  it('reactToMessage rolls back to the original reactions when the API fails', async () => {
    const original = [new CometChat.ReactionCount('👍', 2, false)];
    const msg = messageWithReactions(7, original);
    const { refs } = makeRefs({ ...initialMessageListState, messages: [msg] as never });
    const onError = vi.fn();

    const addSpy = vi.spyOn(CometChat, 'addReaction').mockRejectedValue(new Error('react failed'));

    const { result } = renderHook(() =>
      useHarness({ onError, onMessageDeleted: undefined, onConversationUpdated: undefined }, refs)
    );

    await act(async () => {
      await result.current.api.reactToMessage(7, '👍');
    });

    const updates = reactionDispatches(result.current.dispatched);
    // Optimistic (count bumped to 3), then rollback.
    expect(updates).toHaveLength(2);
    expect(updates[0]?.reactions[0]?.getCount()).toBe(3);
    expect(updates[1]?.reactions).toBe(original);
    expect(onError).toHaveBeenCalled();

    addSpy.mockRestore();
  });

  it('rollback keeps a reaction that arrived over the socket while the request was in flight', async () => {
    // Someone else already reacted 👍 once.
    const original = [new CometChat.ReactionCount('👍', 1, false)];
    const msg = messageWithReactions(7, original);
    const { refs } = makeRefs({ ...initialMessageListState, messages: [msg] as never });
    const onError = vi.fn();

    const addSpy = vi.spyOn(CometChat, 'addReaction').mockImplementation(() => {
      // Our optimistic update landed (1 -> 2, reactedByMe), and while the
      // request is in flight another member's 👍 arrives over the socket (-> 3).
      refs.stateRef.current = {
        ...refs.stateRef.current,
        messages: [messageWithReactions(7, [new CometChat.ReactionCount('👍', 3, true)])] as never,
      };
      return Promise.reject(new Error('react failed'));
    });

    const { result } = renderHook(() =>
      useHarness({ onError, onMessageDeleted: undefined, onConversationUpdated: undefined }, refs)
    );

    await act(async () => {
      await result.current.api.reactToMessage(7, '👍');
    });

    const updates = reactionDispatches(result.current.dispatched);
    const rolledBack = updates[updates.length - 1]?.reactions ?? [];
    const thumbs = rolledBack.find(r => r.getReaction() === '👍');
    // Our +1 is undone, the other member's reaction survives (1 + 1 = 2).
    expect(thumbs?.getCount()).toBe(2);
    expect(thumbs?.getReactedByMe()).toBe(false);
    expect(onError).toHaveBeenCalled();

    addSpy.mockRestore();
  });

  it('ignores a second toggle for the same message + emoji while one is in flight', async () => {
    const msg = messageWithReactions(7, []);
    const { refs } = makeRefs({ ...initialMessageListState, messages: [msg] as never });

    let settleAdd: ((value: unknown) => void) | undefined;
    const pending = new Promise(resolve => {
      settleAdd = resolve;
    });
    const addSpy = vi.spyOn(CometChat, 'addReaction').mockReturnValue(pending as never);

    const { result } = renderHook(() =>
      useHarness(
        { onError: undefined, onMessageDeleted: undefined, onConversationUpdated: undefined },
        refs
      )
    );

    let first: Promise<void> | undefined;
    act(() => {
      first = result.current.api.reactToMessage(7, '👍');
    });
    // Second click lands before the first request settles — it must be ignored.
    await act(async () => {
      await result.current.api.reactToMessage(7, '👍');
    });
    expect(addSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      settleAdd?.(messageWithReactions(7, [new CometChat.ReactionCount('👍', 1, true)]));
      await first;
    });

    // The pair is toggleable again once the request settles. (State in this
    // harness is static, so this is still an "add" from the hook's point of view.)
    await act(async () => {
      await result.current.api.reactToMessage(7, '👍');
    });
    expect(addSpy).toHaveBeenCalledTimes(2);

    addSpy.mockRestore();
  });

  it('reactToMessage is a no-op when the target message is not in state', async () => {
    const { refs } = makeRefs();
    const addSpy = vi.spyOn(CometChat, 'addReaction');

    const { result } = renderHook(() =>
      useHarness(
        { onError: undefined, onMessageDeleted: undefined, onConversationUpdated: undefined },
        refs
      )
    );

    await act(async () => {
      await result.current.api.reactToMessage(999, '👍');
    });

    expect(addSpy).not.toHaveBeenCalled();
    expect(reactionDispatches(result.current.dispatched)).toHaveLength(0);

    addSpy.mockRestore();
  });
});
