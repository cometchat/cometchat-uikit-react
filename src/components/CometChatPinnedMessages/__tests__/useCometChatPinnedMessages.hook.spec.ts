// useCometChatPinnedMessages: paging through the manager and keeping the list live from events.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatEvent } from '../../../context/CometChatEvents.types';
import { useCometChatPinnedMessages } from '../useCometChatPinnedMessages';

interface Page {
  messages: CometChat.BaseMessage[];
  hasMore: boolean;
}

const mocks = vi.hoisted(() => ({
  construct: vi.fn<(uid?: string, guid?: string, builder?: unknown) => void>(),
  fetchFirst: vi.fn<() => Promise<Page>>(),
  fetchNext: vi.fn<() => Promise<Page>>(),
  eventHandler: { current: null as ((event: CometChatEvent) => void) | null },
}));

vi.mock('../CometChatPinnedMessagesManager', () => ({
  CometChatPinnedMessagesManager: class {
    constructor(uid?: string, guid?: string, builder?: unknown) {
      mocks.construct(uid, guid, builder);
    }
    fetchFirst() {
      return mocks.fetchFirst();
    }
    fetchNext() {
      return mocks.fetchNext();
    }
  },
}));

vi.mock('../../../hooks/useCometChatEvents', () => ({
  useCometChatEvents: (handler: (event: CometChatEvent) => void) => {
    mocks.eventHandler.current = handler;
  },
}));

const BOB = new CometChat.User('bob');
const CAROL = new CometChat.User('carol');
const GROUP = new CometChat.Group('g1', 'Group One', 'public');
const BUILDER = new CometChat.MessagesRequestBuilder().setLimit(10);

function message(
  id: number,
  opts: {
    receiverType?: 'user' | 'group';
    receiverId?: string;
    senderUid?: string;
    pinnedAt?: number;
    parentId?: number;
    savedAt?: number;
  } = {}
): CometChat.TextMessage {
  const m = new CometChat.TextMessage(
    opts.receiverId ?? 'g1',
    `text ${String(id)}`,
    opts.receiverType ?? 'group'
  );
  m.setId(id);
  m.setSender(new CometChat.User(opts.senderUid ?? 'other'));
  if (opts.pinnedAt !== undefined) {
    m.setPinnedAt(opts.pinnedAt);
    m.setPinnedBy('other');
  }
  if (opts.parentId !== undefined) m.setParentMessageId(opts.parentId);
  if (opts.savedAt !== undefined) m.setSavedAt(opts.savedAt);
  return m;
}

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function emit(event: CometChatEvent) {
  const handler = mocks.eventHandler.current;
  if (!handler) throw new Error('useCometChatEvents handler was never registered');
  act(() => {
    handler(event);
  });
}

function ids(messages: CometChat.BaseMessage[]) {
  return messages.map(m => m.getId());
}

async function renderLoaded(
  messages: CometChat.BaseMessage[],
  hasMore = false,
  scope: { user?: CometChat.User; group?: CometChat.Group } = { group: GROUP }
) {
  mocks.fetchFirst.mockResolvedValueOnce({ messages, hasMore });
  const hook = renderHook(() => useCometChatPinnedMessages(scope.user, scope.group));
  await waitFor(() => {
    expect(hook.result.current.fetchState).toBe(messages.length ? 'loaded' : 'empty');
  });
  return hook;
}

beforeEach(() => {
  mocks.eventHandler.current = null;
  mocks.fetchFirst.mockResolvedValue({ messages: [], hasMore: false });
  mocks.fetchNext.mockResolvedValue({ messages: [], hasMore: false });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('first page', () => {
  it('scopes the manager to the 1-1 and lands the first page', async () => {
    mocks.fetchFirst.mockResolvedValueOnce({
      messages: [message(1, { receiverType: 'user', receiverId: 'bob' }), message(2)],
      hasMore: true,
    });
    const { result } = renderHook(() => useCometChatPinnedMessages(BOB, undefined, BUILDER));

    expect(mocks.construct).toHaveBeenCalledWith('bob', undefined, BUILDER);
    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });
    expect(ids(result.current.messages)).toEqual([1, 2]);
    expect(result.current.count).toBe(2);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('scopes the manager to the group', () => {
    renderHook(() => useCometChatPinnedMessages(undefined, GROUP));
    expect(mocks.construct).toHaveBeenCalledWith(undefined, 'g1', undefined);
  });

  it('reports loading while the first page is in flight', () => {
    mocks.fetchFirst.mockReturnValueOnce(new Promise<Page>(() => undefined));
    const { result } = renderHook(() => useCometChatPinnedMessages(undefined, GROUP));
    expect(result.current.fetchState).toBe('loading');
    expect(result.current.count).toBe(0);
  });

  it('settles to empty when nothing is pinned', async () => {
    const { result } = await renderLoaded([]);
    expect(result.current.hasMore).toBe(false);
  });

  it('surfaces the error message when the first page fails', async () => {
    mocks.fetchFirst.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useCometChatPinnedMessages(undefined, GROUP));
    await waitFor(() => {
      expect(result.current.fetchState).toBe('error');
    });
    expect(result.current.error).toBe('boom');
  });

  it('falls back to a generic message for a non-Error rejection', async () => {
    mocks.fetchFirst.mockRejectedValueOnce({ code: 'ERR_SOMETHING' });
    const { result } = renderHook(() => useCometChatPinnedMessages(undefined, GROUP));
    await waitFor(() => {
      expect(result.current.fetchState).toBe('error');
    });
    expect(result.current.error).toBe('Failed to load pinned messages');
  });

  it('drops a first page that lands after the conversation changed', async () => {
    const stale = deferred<Page>();
    const fresh = deferred<Page>();
    mocks.fetchFirst.mockReturnValueOnce(stale.promise).mockReturnValueOnce(fresh.promise);
    const { result, rerender } = renderHook(
      ({ user }: { user: CometChat.User }) => useCometChatPinnedMessages(user),
      { initialProps: { user: BOB } }
    );

    rerender({ user: CAROL });
    expect(mocks.construct).toHaveBeenLastCalledWith('carol', undefined, undefined);

    await act(async () => {
      stale.resolve({ messages: [message(1)], hasMore: false });
      await stale.promise;
    });
    expect(result.current.messages).toEqual([]);
    expect(result.current.fetchState).toBe('loading');

    await act(async () => {
      fresh.resolve({ messages: [message(2)], hasMore: false });
      await fresh.promise;
    });
    expect(ids(result.current.messages)).toEqual([2]);
  });

  it('drops a failure that lands after the conversation changed', async () => {
    const stale = deferred<Page>();
    mocks.fetchFirst
      .mockReturnValueOnce(stale.promise)
      .mockReturnValueOnce(new Promise<Page>(() => undefined));
    const { result, rerender } = renderHook(
      ({ user }: { user: CometChat.User }) => useCometChatPinnedMessages(user),
      { initialProps: { user: BOB } }
    );

    rerender({ user: CAROL });
    await act(async () => {
      stale.reject(new Error('old conversation failed'));
      await stale.promise.catch(() => undefined);
    });

    expect(result.current.fetchState).toBe('loading');
    expect(result.current.error).toBeNull();
  });
});

describe('loadMore', () => {
  it('appends the next page and records whether more remain', async () => {
    const { result } = await renderLoaded([message(1)], true);
    mocks.fetchNext.mockResolvedValueOnce({
      messages: [message(2)],
      hasMore: false,
    });

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(ids(result.current.messages)).toEqual([1, 2]);
    });
    expect(result.current.hasMore).toBe(false);
    expect(result.current.count).toBe(2);
  });

  it('does not fetch once the list is exhausted', async () => {
    const { result } = await renderLoaded([message(1)], false);
    act(() => {
      result.current.loadMore();
    });
    expect(mocks.fetchNext).not.toHaveBeenCalled();
  });

  it('does not fetch while the first page is still loading', () => {
    mocks.fetchFirst.mockReturnValueOnce(new Promise<Page>(() => undefined));
    const { result } = renderHook(() => useCometChatPinnedMessages(undefined, GROUP));
    act(() => {
      result.current.loadMore();
    });
    expect(mocks.fetchNext).not.toHaveBeenCalled();
  });

  it('keeps the loaded rows and records the error when a later page fails', async () => {
    const { result } = await renderLoaded([message(1)], true);
    mocks.fetchNext.mockRejectedValueOnce(new Error('page 2 failed'));

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('page 2 failed');
    });
    expect(result.current.fetchState).toBe('loaded');
    expect(ids(result.current.messages)).toEqual([1]);
  });

  it('falls back to a generic message for a non-Error page failure', async () => {
    const { result } = await renderLoaded([message(1)], true);
    mocks.fetchNext.mockRejectedValueOnce('nope');

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load pinned messages');
    });
  });

  it('drops a page that lands after a reload', async () => {
    const { result } = await renderLoaded([message(1)], true);
    const stalePage = deferred<Page>();
    mocks.fetchNext.mockReturnValueOnce(stalePage.promise);

    act(() => {
      result.current.loadMore();
    });
    mocks.fetchFirst.mockResolvedValueOnce({
      messages: [message(3)],
      hasMore: true,
    });
    act(() => {
      result.current.reload();
    });
    await waitFor(() => {
      expect(ids(result.current.messages)).toEqual([3]);
    });

    await act(async () => {
      stalePage.resolve({ messages: [message(2)], hasMore: false });
      await stalePage.promise;
    });
    expect(ids(result.current.messages)).toEqual([3]);
    expect(result.current.hasMore).toBe(true);
  });

  it('drops a page failure that lands after a reload', async () => {
    const { result } = await renderLoaded([message(1)], true);
    const stalePage = deferred<Page>();
    mocks.fetchNext.mockReturnValueOnce(stalePage.promise);

    act(() => {
      result.current.loadMore();
    });
    mocks.fetchFirst.mockResolvedValueOnce({
      messages: [message(3)],
      hasMore: true,
    });
    act(() => {
      result.current.reload();
    });
    await waitFor(() => {
      expect(ids(result.current.messages)).toEqual([3]);
    });

    await act(async () => {
      stalePage.reject(new Error('stale'));
      await stalePage.promise.catch(() => undefined);
    });
    expect(result.current.error).toBeNull();
  });
});

describe('reload', () => {
  it('refetches through a fresh manager and replaces the list', async () => {
    const { result } = await renderLoaded([message(1), message(2)]);
    mocks.fetchFirst.mockResolvedValueOnce({
      messages: [message(5)],
      hasMore: false,
    });

    act(() => {
      result.current.reload();
    });

    await waitFor(() => {
      expect(ids(result.current.messages)).toEqual([5]);
    });
    expect(mocks.construct).toHaveBeenCalledTimes(2);
  });
});

describe('pin events', () => {
  it('inserts a pin from this conversation in pinnedAt order', async () => {
    const { result } = await renderLoaded([
      message(1, { pinnedAt: 300 }),
      message(2, { pinnedAt: 100 }),
    ]);

    emit({ type: 'message/pinned', message: message(3, { pinnedAt: 200 }) });

    expect(ids(result.current.messages)).toEqual([1, 3, 2]);
  });

  it('ignores a pin broadcast from another conversation', async () => {
    const { result } = await renderLoaded([message(1, { pinnedAt: 100 })]);

    emit({
      type: 'message/pinned',
      message: message(9, { receiverId: 'g2', pinnedAt: 500 }),
    });

    expect(ids(result.current.messages)).toEqual([1]);
  });

  it('applies this tab’s own pin and unpin flips', async () => {
    const { result } = await renderLoaded([message(1, { pinnedAt: 100 })]);
    const pinned = message(2, { pinnedAt: 200 });

    emit({ type: 'ui:message/pin-changed', message: pinned, pinned: true });
    expect(ids(result.current.messages)).toEqual([2, 1]);

    emit({ type: 'ui:message/pin-changed', message: pinned, pinned: false });
    expect(ids(result.current.messages)).toEqual([1]);
  });

  it('ignores an unpin flip from another conversation', async () => {
    const { result } = await renderLoaded([message(1, { pinnedAt: 100 })]);

    emit({
      type: 'ui:message/pin-changed',
      message: message(1, { receiverId: 'g2' }),
      pinned: false,
    });

    expect(ids(result.current.messages)).toEqual([1]);
  });

  it('removes an unpinned message and empties in place when it was the last', async () => {
    const { result } = await renderLoaded([message(1, { pinnedAt: 100 })]);

    emit({ type: 'message/unpinned', message: message(1) });

    expect(result.current.messages).toEqual([]);
    expect(result.current.fetchState).toBe('empty');
  });

  it('ignores an unpin from another conversation', async () => {
    const { result } = await renderLoaded([message(1, { pinnedAt: 100 })]);

    emit({
      type: 'message/unpinned',
      message: message(1, { receiverId: 'g2' }),
    });

    expect(ids(result.current.messages)).toEqual([1]);
  });

  it('accepts pins from either side of a 1-1', async () => {
    const { result } = await renderLoaded([], false, { user: BOB });

    emit({
      type: 'message/pinned',
      message: message(1, {
        receiverType: 'user',
        receiverId: 'me',
        senderUid: 'bob',
      }),
    });
    emit({
      type: 'message/pinned',
      message: message(2, {
        receiverType: 'user',
        receiverId: 'bob',
        senderUid: 'me',
      }),
    });

    expect(ids(result.current.messages).sort()).toEqual([1, 2]);
  });
});

describe('content updates', () => {
  it.each(['message/edited', 'message/moderated'] as const)(
    '%s replaces the row in place and keeps its pin',
    async type => {
      const { result } = await renderLoaded([
        message(1, { pinnedAt: 300 }),
        message(2, { pinnedAt: 200 }),
      ]);
      const update = message(2);
      update.setEditedAt(999);

      emit({ type, message: update });

      expect(ids(result.current.messages)).toEqual([1, 2]);
      const row = result.current.messages[1];
      expect(row?.getEditedAt()).toBe(999);
      expect(row?.getPinnedAt()).toBe(200);
    }
  );

  it('ignores an edit to a message that is not pinned here', async () => {
    const { result } = await renderLoaded([message(1, { pinnedAt: 100 })]);
    const before = result.current.messages;

    emit({ type: 'message/edited', message: message(7) });

    expect(result.current.messages).toBe(before);
  });

  it.each([
    {
      label: 'message/unsaved',
      event: (m: CometChat.BaseMessage): CometChatEvent => ({
        type: 'message/unsaved',
        message: m,
      }),
    },
    {
      label: 'ui:message/save-changed',
      event: (m: CometChat.BaseMessage): CometChatEvent => ({
        type: 'ui:message/save-changed',
        message: m,
        saved: false,
      }),
    },
  ])('$label clears the saved indicator instead of carrying it forward', async ({ event }) => {
    const { result } = await renderLoaded([message(1, { pinnedAt: 100, savedAt: 50 })]);

    emit(event(message(1, { pinnedAt: 100 })));

    expect(result.current.messages[0]?.isSaved()).toBe(false);
  });

  it('message/saved marks the row saved', async () => {
    const { result } = await renderLoaded([message(1, { pinnedAt: 100 })]);

    emit({
      type: 'message/saved',
      message: message(1, { pinnedAt: 100, savedAt: 60 }),
    });

    expect(result.current.messages[0]?.isSaved()).toBe(true);
  });
});

describe('reactions', () => {
  function reactionEvent(messageId: number) {
    const reaction = new CometChat.Reaction(
      'r1',
      String(messageId),
      '👍',
      'other',
      1,
      new CometChat.User('other')
    );
    return {
      reaction,
      event: new CometChat.ReactionEvent(reaction, 'g1', 'group', 'group_g1'),
    };
  }

  it.each([
    ['reaction/added', 'message_reaction_added'],
    ['reaction/removed', 'message_reaction_removed'],
  ] as const)('%s updates a pinned row through the SDK helper', async (type, action) => {
    const { result } = await renderLoaded([message(1, { pinnedAt: 100 })]);
    const chips = [new CometChat.ReactionCount('👍', 1, false)];
    const helper = vi
      .spyOn(CometChat.CometChatHelper, 'updateMessageWithReactionInfo')
      .mockImplementation(base => {
        base.setReactions(chips);
        return base;
      });
    const { reaction, event } = reactionEvent(1);

    emit({ type, event });

    expect(helper).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), reaction, action);
    expect(result.current.messages[0]?.getReactions()).toEqual(chips);
    expect(result.current.messages[0]?.getPinnedAt()).toBe(100);
  });

  it('ignores a reaction on a message that is not pinned here', async () => {
    const { result } = await renderLoaded([message(1, { pinnedAt: 100 })]);
    const helper = vi.spyOn(CometChat.CometChatHelper, 'updateMessageWithReactionInfo');
    const before = result.current.messages;

    emit({ type: 'reaction/added', event: reactionEvent(42).event });

    expect(helper).not.toHaveBeenCalled();
    expect(result.current.messages).toBe(before);
  });

  it('applies this user’s own reaction change to the row', async () => {
    const { result } = await renderLoaded([message(1, { pinnedAt: 100 })]);
    const chips = [new CometChat.ReactionCount('🎉', 2, true)];

    emit({
      type: 'ui:message/reaction-changed',
      messageId: 1,
      reactions: chips,
    });

    expect(result.current.messages[0]?.getReactions()).toEqual(chips);
    expect(result.current.messages[0]?.getPinnedAt()).toBe(100);
  });

  it('ignores an own reaction change for a message that is not pinned here', async () => {
    const { result } = await renderLoaded([message(1, { pinnedAt: 100 })]);
    const before = result.current.messages;

    emit({
      type: 'ui:message/reaction-changed',
      messageId: 42,
      reactions: [new CometChat.ReactionCount('🎉', 1, true)],
    });

    expect(result.current.messages).toBe(before);
  });
});

describe('deletes', () => {
  it.each(['message/deleted', 'ui:message/deleted'] as const)(
    '%s removes the row and any pinned replies to it',
    async type => {
      const { result } = await renderLoaded([
        message(1, { pinnedAt: 400 }),
        message(2, { pinnedAt: 300, parentId: 1 }),
        message(3, { pinnedAt: 200 }),
        message(4, { pinnedAt: 100, parentId: 3 }),
      ]);

      emit({ type, message: message(1) });

      expect(ids(result.current.messages)).toEqual([3, 4]);
    }
  );

  it('removes pinned replies even when the deleted parent was not pinned', async () => {
    const { result } = await renderLoaded([
      message(2, { pinnedAt: 300, parentId: 1 }),
      message(3, { pinnedAt: 200 }),
    ]);

    emit({ type: 'message/deleted', message: message(1) });

    expect(ids(result.current.messages)).toEqual([3]);
  });
});

it('ignores events it does not handle', async () => {
  const { result } = await renderLoaded([message(1, { pinnedAt: 100 })]);
  const before = result.current;

  emit({ type: 'ui:conversation/read', conversationId: 'group_g1' });

  expect(result.current).toBe(before);
});
