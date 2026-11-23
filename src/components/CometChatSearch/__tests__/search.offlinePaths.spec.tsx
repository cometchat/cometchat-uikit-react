/**
 * CometChatSearch on the offline (ON) path, the rest of it: a keyword search
 * that answers nothing or fails, "load more" for keyword and filter-only
 * reads, a live message in a listed result, and the managers' filter request.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatSearchConversations } from '../useCometChatSearchConversations';
import { useCometChatSearchMessages } from '../useCometChatSearchMessages';
import { CometChatSearchConversationsManager } from '../CometChatSearchConversationsManager';
import { CometChatSearchMessagesManager } from '../CometChatSearchMessagesManager';
import type { CometChatSearchFilter } from '../CometChatSearch.types';
import { OfflineHub } from '../../../utils/offline/hub';
import {
  installOfflineSdk,
  scriptedRead,
  textMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';

const NOT_CONNECTED = { code: 'FAILED_TO_FETCH' };
const noFilters: CometChatSearchFilter[] = [];
const unread: CometChatSearchFilter[] = ['unread'];

const row = (id: string, unreadCount = 0) => {
  let count = unreadCount;
  let last: CometChat.BaseMessage | undefined;
  return {
    getConversationId: () => id,
    getConversationType: () => 'user',
    getConversationWith: () => ({ getUid: () => id, getName: () => id }),
    setConversationWith: () => undefined,
    setConversationId: () => undefined,
    setConversationType: () => undefined,
    getUnreadMessageCount: () => count,
    setUnreadMessageCount: (n: number) => {
      count = n;
    },
    getLastMessage: () => last,
    setLastMessage: (m: CometChat.BaseMessage) => {
      last = m;
    },
  } as unknown as CometChat.Conversation;
};
const ids = (list: CometChat.Conversation[]) => list.map(c => c.getConversationId());

describe('search hooks, offline ON', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(
      new CometChat.User({ uid: 'me', name: 'me' })
    );
    vi.spyOn(CometChat, 'removeMessageListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'addUserListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'removeUserListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'addGroupListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'removeGroupListener').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
    OfflineHub.resetForTests();
  });

  describe('conversations, keyword', () => {
    it('no match is the empty state (D83 rule 5)', async () => {
      vi.spyOn(CometChatSearchConversationsManager.prototype, 'search').mockResolvedValue({
        results: [],
        hasMore: false,
      });
      const { result } = renderHook(() =>
        useCometChatSearchConversations({ searchKeyword: 'zed', activeFilters: noFilters })
      );
      await waitFor(() => {
        expect(result.current.fetchState).toBe('empty');
      });
    });

    it('load more appends a page; an empty page ends the list', async () => {
      vi.spyOn(CometChatSearchConversationsManager.prototype, 'search').mockResolvedValue({
        results: [row('a')],
        hasMore: true,
      });
      const loadMore = vi
        .spyOn(CometChatSearchConversationsManager.prototype, 'loadMore')
        .mockResolvedValueOnce({ results: [row('b')], hasMore: true })
        .mockResolvedValueOnce({ results: [], hasMore: true });
      const { result } = renderHook(() =>
        useCometChatSearchConversations({ searchKeyword: 'a', activeFilters: noFilters })
      );
      await waitFor(() => {
        expect(ids(result.current.conversations)).toEqual(['a']);
      });
      await act(async () => {
        await result.current.loadMore();
      });
      expect(ids(result.current.conversations)).toEqual(['a', 'b']);
      expect(result.current.hasMore).toBe(true);
      await act(async () => {
        await result.current.loadMore();
      });
      // The server said "more", but an empty page ends it.
      expect(result.current.hasMore).toBe(false);
      expect(loadMore).toHaveBeenCalledTimes(2);
    });

    it('load more offline keeps the results with no error; another failure reaches onError', async () => {
      vi.spyOn(CometChatSearchConversationsManager.prototype, 'search').mockResolvedValue({
        results: [row('a')],
        hasMore: true,
      });
      const failure = { code: 'ERR_SERVER' };
      vi.spyOn(CometChatSearchConversationsManager.prototype, 'loadMore')
        .mockRejectedValueOnce(NOT_CONNECTED)
        .mockRejectedValueOnce(failure);
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useCometChatSearchConversations({ searchKeyword: 'a', activeFilters: noFilters, onError })
      );
      await waitFor(() => {
        expect(ids(result.current.conversations)).toEqual(['a']);
      });
      await act(async () => {
        await result.current.loadMore();
      });
      expect(onError).not.toHaveBeenCalled();
      expect(ids(result.current.conversations)).toEqual(['a']);
      await act(async () => {
        await result.current.loadMore();
      });
      expect(onError).toHaveBeenCalledWith(failure);
      expect(ids(result.current.conversations)).toEqual(['a']);
    });

    it('a new message in a listed result moves it up with one more unread, from the listed peer', async () => {
      vi.spyOn(CometChatSearchConversationsManager.prototype, 'search').mockResolvedValue({
        results: [row('x'), row('peer', 2)],
        hasMore: false,
      });
      const { result } = renderHook(() =>
        useCometChatSearchConversations({ searchKeyword: 'p', activeFilters: noFilters })
      );
      await waitFor(() => {
        expect(ids(result.current.conversations)).toEqual(['x', 'peer']);
      });
      await act(async () => {
        await Promise.resolve();
      });
      // The SDK's rebuild carries the id but no peer (a sweep-delivered copy).
      const rebuilt = row('peer');
      (rebuilt as unknown as { getConversationWith: () => unknown }).getConversationWith = () =>
        undefined;
      vi.spyOn(CometChat.CometChatHelper, 'getConversationFromMessage').mockResolvedValue(rebuilt);
      const incoming = textMessage('hi', 'me', 'user', 'peer');
      vi.spyOn(incoming, 'getConversationId').mockReturnValue('peer');
      act(() => {
        fake.fire('message', 'onTextMessageReceived', incoming);
      });
      await waitFor(() => {
        expect(ids(result.current.conversations)[0]).toBe('peer');
      });
      expect(result.current.conversations[0]?.getUnreadMessageCount()).toBe(3);
    });
  });

  describe('conversations, filters only', () => {
    it('load more reads the next page two-phase; a second tap during a read waits', async () => {
      const read = scriptedRead('Conversations');
      vi.spyOn(CometChatSearchConversationsManager.prototype, 'startFilterRead').mockReturnValue({
        fetchNext: read.fn,
      } as unknown as CometChat.ConversationsRequest);
      const { result } = renderHook(() =>
        useCometChatSearchConversations({ searchKeyword: '', activeFilters: unread })
      );
      await waitFor(() => {
        expect(read.calls).toHaveLength(1);
      });
      const page = Array.from({ length: 30 }, (_, i) => row(`r${String(i)}`));
      act(() => {
        read.last().server(page);
      });
      await waitFor(() => {
        expect(result.current.hasMore).toBe(true);
      });
      await new Promise(resolve => {
        setTimeout(resolve, 0);
      });
      let first: Promise<void> = Promise.resolve();
      act(() => {
        first = result.current.loadMore();
      });
      await waitFor(() => {
        expect(read.calls).toHaveLength(2);
      });
      await act(async () => {
        await result.current.loadMore();
      });
      expect(read.calls).toHaveLength(2);
      await act(async () => {
        read.last().server([row('next')]);
        await first;
      });
      expect(result.current.conversations).toHaveLength(31);
      expect(ids(result.current.conversations).at(-1)).toBe('next');
    });
  });

  describe('messages, keyword', () => {
    it('a failure that is not "not connected" is the error state and reaches onError', async () => {
      const failure = { code: 'ERR_SERVER' };
      vi.spyOn(CometChatSearchMessagesManager.prototype, 'search').mockRejectedValue(failure);
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useCometChatSearchMessages({ searchKeyword: 'x', activeFilters: noFilters, onError })
      );
      await waitFor(() => {
        expect(result.current.fetchState).toBe('error');
      });
      expect(onError).toHaveBeenCalledWith(failure);
    });

    it('load more appends; offline it keeps the results silently; another failure reaches onError', async () => {
      const first = textMessage('one');
      first.setId(1);
      const second = textMessage('two');
      second.setId(2);
      vi.spyOn(CometChatSearchMessagesManager.prototype, 'search').mockResolvedValue({
        results: [first],
        hasMore: true,
      });
      const failure = { code: 'ERR_SERVER' };
      vi.spyOn(CometChatSearchMessagesManager.prototype, 'loadMore')
        .mockResolvedValueOnce({ results: [second], hasMore: true })
        .mockRejectedValueOnce(NOT_CONNECTED)
        .mockRejectedValueOnce(failure);
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useCometChatSearchMessages({ searchKeyword: 'o', activeFilters: noFilters, onError })
      );
      await waitFor(() => {
        expect(result.current.messages).toHaveLength(1);
      });
      await act(async () => {
        await result.current.loadMore();
      });
      expect(result.current.messages.map(m => m.getId())).toEqual([1, 2]);
      await act(async () => {
        await result.current.loadMore();
      });
      expect(onError).not.toHaveBeenCalled();
      await act(async () => {
        await result.current.loadMore();
      });
      expect(onError).toHaveBeenCalledWith(failure);
      expect(result.current.messages.map(m => m.getId())).toEqual([1, 2]);
    });
  });
});

describe('search managers: the filter-only request (offline ON path)', () => {
  it('conversations: the request it returns is the one load more pages with', async () => {
    const manager = new CometChatSearchConversationsManager();
    const request = manager.startFilterRead(['unread']);
    expect(request).toBeInstanceOf(CometChat.ConversationsRequest);
    const fetchNext = vi.spyOn(request, 'fetchNext').mockResolvedValue([]);
    await manager.loadMore();
    expect(fetchNext).toHaveBeenCalledTimes(1);
  });

  it("messages: 30 a page, 3 with 'see more'; the request it returns is the one load more pages with", async () => {
    const manager = new CometChatSearchMessagesManager();
    const full = manager.startFilterRead(['photos'], 'peer');
    expect(full.limit).toBe(30);
    expect(full.request).toBeInstanceOf(CometChat.MessagesRequest);
    const preview = manager.startFilterRead(['files'], undefined, 'g1', true);
    expect(preview.limit).toBe(3);
    const fetchPrevious = vi.spyOn(preview.request, 'fetchPrevious').mockResolvedValue([]);
    await manager.loadMore();
    expect(fetchPrevious).toHaveBeenCalledTimes(1);
  });

  it("messages: the integrator's builder is built, not replaced", () => {
    const manager = new CometChatSearchMessagesManager();
    const builder = new CometChat.MessagesRequestBuilder().setLimit(7);
    const build = vi.spyOn(builder, 'build');
    const { request } = manager.startFilterRead(['links'], undefined, undefined, false, builder);
    expect(build).toHaveBeenCalledTimes(1);
    expect(request).toBe(build.mock.results[0]?.value);
  });
});
