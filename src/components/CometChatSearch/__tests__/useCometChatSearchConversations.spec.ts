/**
 * Unit tests for useCometChatSearchConversations: the criteria gate, fetch
 * states, load-more de-duplication, and the realtime listeners (move to top
 * with unread counts, edits/deletes, presence, typing).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

type Handlers = Record<string, (arg: unknown) => void>;

const mocks = vi.hoisted(() => ({
  search: vi.fn(),
  loadMore: vi.fn(),
  reset: vi.fn(),
  listeners: {} as Record<'message' | 'user' | 'typing', Handlers>,
  cleanups: { message: vi.fn(), user: vi.fn(), typing: vi.fn() },
  getConversationFromMessage: vi.fn(),
  getLoggedinUser: vi.fn(),
}));

vi.mock('../CometChatSearchConversationsManager', () => ({
  CometChatSearchConversationsManager: class {
    search = mocks.search;
    loadMore = mocks.loadMore;
    reset = mocks.reset;
    static attachMessageListener(_id: string, h: Handlers) {
      mocks.listeners.message = h;
      return mocks.cleanups.message;
    }
    static attachUserListener(_id: string, h: Handlers) {
      mocks.listeners.user = h;
      return mocks.cleanups.user;
    }
    static attachTypingListener(_id: string, h: Handlers) {
      mocks.listeners.typing = h;
      return mocks.cleanups.typing;
    }
  },
}));

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    getLoggedinUser: mocks.getLoggedinUser,
    CometChatHelper: { getConversationFromMessage: mocks.getConversationFromMessage },
  },
}));

import { useCometChatSearchConversations } from '../useCometChatSearchConversations';

interface FakeConv {
  id: string;
  unread: number;
  type: 'user' | 'group';
  withUid?: string;
  getConversationId: () => string;
  getUnreadMessageCount: () => number;
  setUnreadMessageCount: (n: number) => void;
  getConversationType: () => string;
  getConversationWith: () => { getUid: () => string | undefined };
}

function conv(id: string, { unread = 0, type = 'user', withUid }: Partial<FakeConv> = {}): FakeConv {
  const c: FakeConv = {
    id,
    unread,
    type,
    withUid,
    getConversationId: () => c.id,
    getUnreadMessageCount: () => c.unread,
    setUnreadMessageCount: (n: number) => {
      c.unread = n;
    },
    getConversationType: () => c.type,
    getConversationWith: () => ({ getUid: () => c.withUid }),
  };
  return c;
}

function message(conversationId: string, senderUid: string) {
  return { getConversationId: () => conversationId, getSender: () => ({ getUid: () => senderUid }) };
}

// Stable across renders: the hook refetches when the filters array changes identity.
const NO_FILTERS: never[] = [];

const ids = (list: unknown[]) => (list as FakeConv[]).map(c => c.getConversationId());

describe('useCometChatSearchConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLoggedinUser.mockResolvedValue({ getUid: () => 'me' });
  });

  async function loaded(results: FakeConv[], hasMore = false, extra: Record<string, unknown> = {}) {
    mocks.search.mockResolvedValue({ results, hasMore });
    const hook = renderHook(() =>
      useCometChatSearchConversations({ searchKeyword: 'team', activeFilters: NO_FILTERS, ...extra })
    );
    await waitFor(() => expect(hook.result.current.fetchState).toBe('loaded'));
    return hook;
  }

  it('without a keyword or conversation filter, shows the empty state and never searches', async () => {
    const onStateChange = vi.fn();
    const { result } = renderHook(() =>
      useCometChatSearchConversations({ searchKeyword: '  ', activeFilters: NO_FILTERS, onStateChange })
    );
    await waitFor(() => expect(result.current.fetchState).toBe('empty'));
    expect(mocks.search).not.toHaveBeenCalled();
    expect(onStateChange).toHaveBeenLastCalledWith('empty');
  });

  it('searches and loads results', async () => {
    const { result } = await loaded([conv('a'), conv('b')], true);
    expect(ids(result.current.conversations)).toEqual(['a', 'b']);
    expect(result.current.hasMore).toBe(true);
    expect(mocks.reset).toHaveBeenCalled();
    expect(mocks.search).toHaveBeenCalledWith('team', [], undefined);
  });

  it('shows the empty state when the search finds nothing', async () => {
    mocks.search.mockResolvedValue({ results: [], hasMore: false });
    const { result } = renderHook(() => useCometChatSearchConversations({ searchKeyword: 'zzz', activeFilters: NO_FILTERS }));
    await waitFor(() => expect(result.current.fetchState).toBe('empty'));
  });

  it('shows the error state and reports the error when the search fails', async () => {
    const error = { code: 'ERR' };
    mocks.search.mockRejectedValue(error);
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useCometChatSearchConversations({ searchKeyword: 'x', activeFilters: NO_FILTERS, onError })
    );
    await waitFor(() => expect(result.current.fetchState).toBe('error'));
    expect(onError).toHaveBeenCalledWith(error);
  });

  describe('loadMore', () => {
    it('appends new conversations and skips ones already shown', async () => {
      const { result } = await loaded([conv('a'), conv('b')], true);
      mocks.loadMore.mockResolvedValue({ results: [conv('b'), conv('c')], hasMore: false });
      await act(() => result.current.loadMore());
      expect(ids(result.current.conversations)).toEqual(['a', 'b', 'c']);
      expect(result.current.hasMore).toBe(false);
    });

    it('stops paging when a page comes back empty', async () => {
      const { result } = await loaded([conv('a')], true);
      mocks.loadMore.mockResolvedValue({ results: [], hasMore: true });
      await act(() => result.current.loadMore());
      expect(result.current.hasMore).toBe(false);
    });

    it('does nothing when there is no next page', async () => {
      const { result } = await loaded([conv('a')], false);
      await act(() => result.current.loadMore());
      expect(mocks.loadMore).not.toHaveBeenCalled();
    });

    it('reports a failed page', async () => {
      const onError = vi.fn();
      const { result } = await loaded([conv('a')], true, { onError });
      mocks.loadMore.mockRejectedValue({ code: 'PAGE' });
      await act(() => result.current.loadMore());
      expect(onError).toHaveBeenCalledWith({ code: 'PAGE' });
    });
  });

  describe('realtime messages', () => {
    it("someone else's message moves the conversation to the top and adds to its unread count", async () => {
      const { result } = await loaded([conv('a'), conv('b', { unread: 2 })]);
      await waitFor(() => expect(mocks.getLoggedinUser).toHaveBeenCalled());
      const fresh = conv('b');
      mocks.getConversationFromMessage.mockResolvedValue(fresh);

      act(() => mocks.listeners.message.onMessageReceived!(message('b', 'bob')));
      await waitFor(() => expect(ids(result.current.conversations)).toEqual(['b', 'a']));
      expect(fresh.unread).toBe(3);
    });

    it('my own message moves the conversation up without adding to the unread count', async () => {
      const { result } = await loaded([conv('a'), conv('b', { unread: 2 })]);
      await waitFor(() => expect(mocks.getLoggedinUser).toHaveBeenCalled());
      const fresh = conv('b');
      mocks.getConversationFromMessage.mockResolvedValue(fresh);

      act(() => mocks.listeners.message.onMessageReceived!(message('b', 'me')));
      await waitFor(() => expect(ids(result.current.conversations)).toEqual(['b', 'a']));
      expect(fresh.unread).toBe(2);
    });

    it('still moves the conversation up when the fresh copy cannot be fetched', async () => {
      const { result } = await loaded([conv('a'), conv('b')]);
      mocks.getConversationFromMessage.mockRejectedValue(new Error('offline'));
      act(() => mocks.listeners.message.onMessageReceived!(message('b', 'bob')));
      await waitFor(() => expect(ids(result.current.conversations)).toEqual(['b', 'a']));
    });

    it('ignores messages for conversations that are not in the results', async () => {
      const { result } = await loaded([conv('a')]);
      act(() => mocks.listeners.message.onMessageReceived!(message('zzz', 'bob')));
      expect(mocks.getConversationFromMessage).not.toHaveBeenCalled();
      expect(ids(result.current.conversations)).toEqual(['a']);
    });

    it('edits and deletes refresh the conversation in place', async () => {
      const { result } = await loaded([conv('a'), conv('b')]);
      const before = result.current.conversations;
      act(() => mocks.listeners.message.onMessageEdited!(message('b', 'bob')));
      expect(result.current.conversations).not.toBe(before);
      expect(ids(result.current.conversations)).toEqual(['a', 'b']);

      const afterEdit = result.current.conversations;
      act(() => mocks.listeners.message.onMessageDeleted!(message('a', 'bob')));
      expect(result.current.conversations).not.toBe(afterEdit);
      expect(ids(result.current.conversations)).toEqual(['a', 'b']);
    });
  });

  it('a 1:1 contact going online or offline refreshes that conversation only', async () => {
    const { result } = await loaded([conv('u1', { withUid: 'alice' }), conv('g1', { type: 'group' })]);
    const before = result.current.conversations;
    act(() => mocks.listeners.user.onUserOnline!({ getUid: () => 'stranger' }));
    expect(result.current.conversations).toBe(before);

    act(() => mocks.listeners.user.onUserOnline!({ getUid: () => 'alice' }));
    expect(result.current.conversations).not.toBe(before);
    const afterOnline = result.current.conversations;
    act(() => mocks.listeners.user.onUserOffline!({ getUid: () => 'alice' }));
    expect(result.current.conversations).not.toBe(afterOnline);
  });

  it('tracks typing by group id for groups and by sender for 1:1 chats', async () => {
    const { result } = await loaded([conv('a')]);
    const groupTyping = { getReceiverType: () => 'group', getReceiverId: () => 'g1', getSender: () => ({ getUid: () => 'x' }) };
    const userTyping = { getReceiverType: () => 'user', getReceiverId: () => 'me', getSender: () => ({ getUid: () => 'bob' }) };

    act(() => mocks.listeners.typing.onTypingStarted!(groupTyping));
    act(() => mocks.listeners.typing.onTypingStarted!(userTyping));
    expect([...result.current.typingIndicators.keys()].sort()).toEqual(['bob', 'g1']);

    act(() => mocks.listeners.typing.onTypingEnded!(groupTyping));
    expect([...result.current.typingIndicators.keys()]).toEqual(['bob']);

    const before = result.current.typingIndicators;
    act(() => mocks.listeners.typing.onTypingEnded!(groupTyping));
    expect(result.current.typingIndicators).toBe(before);
  });

  it('detaches every listener on unmount', async () => {
    const { unmount } = await loaded([conv('a')]);
    unmount();
    expect(mocks.cleanups.message).toHaveBeenCalled();
    expect(mocks.cleanups.user).toHaveBeenCalled();
    expect(mocks.cleanups.typing).toHaveBeenCalled();
  });
});
