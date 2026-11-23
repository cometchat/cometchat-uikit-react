/**
 * useCometChatConversations on the offline (ON) path, end to end through the
 * hook: later pages, read errors, live message events, the unfiltered sync
 * reconcile, logout and cache reset, and pin events from elsewhere.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatConversations } from '../useCometChatConversations';
import { OfflineHub } from '../../../utils/offline/hub';
import { CometChatLogger } from '../../../utils/CometChatLogger';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import {
  CometChatMessageStatus,
  type CometChatEvent,
  type CometChatEventsContextValue,
} from '../../../context/CometChatEvents.types';
import {
  installOfflineSdk,
  offlineMessage,
  textMessage,
  scriptedRead,
  type OfflineSdkFake,
  type ScriptedRead,
} from '../../../testing/offline-sdk-fake';

interface ConvOptions {
  last?: CometChat.BaseMessage;
  pinnedAt?: number;
  updatedAt?: number;
}

/** A conversation as the SDK hands it, with mutable pin and preview state. */
function conv(id: string, options: ConvOptions = {}): CometChat.Conversation {
  const state = {
    last: options.last,
    pinnedAt: options.pinnedAt,
    pinnedBy: options.pinnedAt ? 'me' : undefined,
    unread: 0,
    with: { getUid: () => id, getName: () => id } as unknown,
    id,
    type: 'user',
  };
  return {
    getConversationId: () => state.id,
    setConversationId: (v: string) => {
      state.id = v;
    },
    getConversationType: () => state.type,
    setConversationType: (v: string) => {
      state.type = v;
    },
    getConversationWith: () => state.with,
    setConversationWith: (v: unknown) => {
      state.with = v;
    },
    getLastMessage: () => state.last,
    setLastMessage: (m: CometChat.BaseMessage) => {
      state.last = m;
    },
    getUnreadMessageCount: () => state.unread,
    setUnreadMessageCount: (n: number) => {
      state.unread = n;
    },
    getUpdatedAt: () => options.updatedAt ?? 1,
    getPinnedAt: () => state.pinnedAt,
    setPinnedAt: (v?: number) => {
      state.pinnedAt = v;
    },
    getPinnedBy: () => state.pinnedBy,
    setPinnedBy: (v?: string) => {
      state.pinnedBy = v;
    },
    isPinned: () => state.pinnedAt !== undefined,
    isSystemPinned: () => false,
    getTags: () => [],
  } as unknown as CometChat.Conversation;
}

const ids = (list: readonly CometChat.Conversation[]) => list.map(c => c.getConversationId());

function eventBus() {
  const handlers = new Set<(event: CometChatEvent) => void>();
  const value: CometChatEventsContextValue = {
    subscribe: handler => {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    publish: () => undefined,
  };
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CometChatEventsContext.Provider value={value}>{children}</CometChatEventsContext.Provider>
  );
  return {
    wrapper,
    emit(event: CometChatEvent) {
      for (const handler of handlers) handler(event);
    },
  };
}

describe('useCometChatConversations, offline ON', () => {
  let fake: OfflineSdkFake;
  let read: ScriptedRead;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    OfflineHub.getInstance().start();
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(
      new CometChat.User({ uid: 'me', name: 'me' })
    );
    vi.spyOn(CometChat, 'addConnectionListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'removeConnectionListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'removeMessageListener').mockImplementation(() => undefined);
    read = scriptedRead('Conversations');
    // The default (unfiltered) request: no builder, no search.
    vi.spyOn(CometChat.ConversationsRequestBuilder.prototype, 'build').mockReturnValue({
      fetchNext: read.fn,
    } as unknown as CometChat.ConversationsRequest);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
    OfflineHub.resetForTests();
  });

  async function mountWithFirstPage(
    rows: CometChat.Conversation[],
    props: Parameters<typeof useCometChatConversations>[0] = {},
    wrapper?: React.FC<{ children: React.ReactNode }>
  ) {
    const hook = renderHook(() => useCometChatConversations(props), { wrapper });
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server(rows);
    });
    await waitFor(() => {
      expect(ids(hook.result.current.conversations)).toEqual(ids(rows));
    });
    return hook;
  }

  it('a later page reads two-phase too: its server page replaces only its own cached rows', async () => {
    const { result } = await mountWithFirstPage([conv('a'), conv('b')]);
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.fetchNext();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    act(() => {
      read.last().cached([conv('x'), conv('y')]);
    });
    expect(ids(result.current.conversations)).toEqual(['a', 'b', 'x', 'y']);
    await act(async () => {
      read.last().server([conv('y'), conv('z')]);
      await pending;
    });
    expect(ids(result.current.conversations)).toEqual(['a', 'b', 'y', 'z']);
    expect(result.current.hasMore).toBe(true);
  });

  it("a load-more asked for while page one's server read is pending runs once it lands", async () => {
    const { result } = renderHook(() => useCometChatConversations({}));
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([conv('a'), conv('b')]);
    });
    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });
    // The cached page is on screen and the user scrolls to the end: no second
    // read on the same request, and the ask is kept.
    act(() => {
      void result.current.fetchNext();
    });
    expect(read.calls).toHaveLength(1);
    act(() => {
      read.last().server([conv('a'), conv('b')]);
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    act(() => {
      read.last().server([conv('c')]);
    });
    await waitFor(() => {
      expect(ids(result.current.conversations)).toEqual(['a', 'b', 'c']);
    });
  });

  it('a read error that is not "not connected" reaches onError and the error state', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useCometChatConversations({ onError }));
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    const failure = Object.assign(new Error('server said no'), { code: 'ERR_SERVER' });
    await act(async () => {
      read.last().fail(failure);
      await Promise.resolve();
    });
    expect(onError).toHaveBeenCalledWith(failure);
    expect(result.current.fetchState).toBe('error');
    expect(result.current.error).toBe('server said no');
  });

  it('D84 rule 2: offline past the cache with chats on screen keeps them, no error view, no onError', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useCometChatConversations({ onError }));
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().cached([conv('a')]);
      read.last().fail({ code: 'FAILED_TO_FETCH' });
      await Promise.resolve();
    });
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.fetchState).toBe('loaded');
    expect(result.current.connectToLoad).not.toBe(true);
    expect(result.current.hasMore).toBe(true);
    expect(ids(result.current.conversations)).toEqual(['a']);
  });

  it('D83 rule 2: a load-more page offline stays silent (its footer is unchanged)', async () => {
    const onError = vi.fn();
    const { result } = await mountWithFirstPage([conv('a')], { onError });
    await act(async () => {
      void result.current.fetchNext();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    await act(async () => {
      read.last().fail({ code: 'ERROR_INTERNET_UNAVAILABLE' });
      await Promise.resolve();
    });
    expect(ids(result.current.conversations)).toEqual(['a']);
    expect(result.current.fetchState).toBe('loaded');
    expect(onError).not.toHaveBeenCalled();
  });

  it('a non-Error failure is reported as "Unknown error"', async () => {
    const { result } = renderHook(() => useCometChatConversations({}));
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().fail({ code: 'ERR_PLAIN_OBJECT' });
      await Promise.resolve();
    });
    expect(result.current.error).toBe('Unknown error');
  });

  it('a page answered after a newer read started is ignored', async () => {
    const { result } = renderHook(() => useCometChatConversations({}));
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    const stale = read.last();
    act(() => {
      result.current.setSearchText('fresh');
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    act(() => {
      stale.cached([conv('stale-cached')]);
      stale.server([conv('stale-server')]);
    });
    act(() => {
      read.last().server([conv('fresh')]);
    });
    await waitFor(() => {
      expect(ids(result.current.conversations)).toEqual(['fresh']);
    });
  });

  it('an unfiltered list reconciles the sync page in place, without a re-read', async () => {
    const { result } = await mountWithFirstPage([
      conv('a', { updatedAt: 5 }),
      conv('b', { updatedAt: 4 }),
    ]);
    act(() => {
      fake.fire('sync', 'onConversationSyncCompleted', [
        conv('b', { updatedAt: 9 }),
        conv('a', { updatedAt: 5 }),
      ]);
    });
    await waitFor(() => {
      expect(ids(result.current.conversations)).toEqual(['b', 'a']);
    });
    expect(read.calls).toHaveLength(1);
  });

  describe('a sync page never cuts the list back to page one', () => {
    /** The request the builder builds: the scripted read plus what it asks the server for. */
    function builds(asks: Record<string, unknown> = {}) {
      vi.spyOn(CometChat.ConversationsRequestBuilder.prototype, 'build').mockReturnValue({
        fetchNext: read.fn,
        getConversationType: () => undefined,
        getTags: () => [],
        getUserTags: () => [],
        getGroupTags: () => [],
        getSearchKeyword: () => '',
        getUnread: () => false,
        getPinnedBy: () => [],
        getHideAgentic: () => false,
        getOnlyAgentic: () => false,
        ...asks,
      } as unknown as CometChat.ConversationsRequest);
    }

    /** Page one and page two loaded: a, b, then c, d. */
    async function withPageTwo(props: Parameters<typeof useCometChatConversations>[0]) {
      const hook = await mountWithFirstPage(
        [conv('a', { updatedAt: 90 }), conv('b', { updatedAt: 80 })],
        props
      );
      act(() => {
        void hook.result.current.fetchNext();
      });
      await waitFor(() => {
        expect(read.calls).toHaveLength(2);
      });
      act(() => {
        read.last().server([conv('c', { updatedAt: 70 }), conv('d', { updatedAt: 60 })]);
      });
      await waitFor(() => {
        expect(ids(hook.result.current.conversations)).toEqual(['a', 'b', 'c', 'd']);
      });
      return hook;
    }

    it('a builder that only sets a limit is a plain list: the sync page is a slice, the rows below stay, nothing is re-read', async () => {
      builds();
      const { result } = await withPageTwo({
        conversationsRequestBuilder: new CometChat.ConversationsRequestBuilder().setLimit(2),
      });
      act(() => {
        fake.fire('sync', 'onConversationSyncCompleted', [
          conv('b', { updatedAt: 100 }),
          conv('a', { updatedAt: 90 }),
        ]);
      });
      await waitFor(() => {
        expect(ids(result.current.conversations)).toEqual(['b', 'a', 'c', 'd']);
      });
      expect(read.calls).toHaveLength(2);
    });

    it('a narrowed list re-reads its own request once and merges: the rows paged in stay, the stale cached row goes', async () => {
      builds({ getTags: () => ['vip'] });
      const { result } = await withPageTwo({
        conversationsRequestBuilder: new CometChat.ConversationsRequestBuilder().setTags(['vip']),
      });
      act(() => {
        fake.fire('sync', 'onConversationSyncCompleted', [conv('a', { updatedAt: 90 })]);
      });
      await waitFor(() => {
        expect(read.calls).toHaveLength(3);
      });
      // A second sync while the re-read is in flight starts nothing.
      act(() => {
        fake.fire('sync', 'onConversationSyncCompleted', [conv('a', { updatedAt: 90 })]);
      });
      expect(read.calls).toHaveLength(3);
      // The cached phase brings back a row the server no longer has.
      act(() => {
        read
          .last()
          .cached([conv('a', { updatedAt: 90 }), conv('gone', { updatedAt: 95 }), conv('b', { updatedAt: 80 })]);
      });
      expect(ids(result.current.conversations)).toContain('gone');
      act(() => {
        read.last().server([conv('b', { updatedAt: 100 }), conv('a', { updatedAt: 90 })]);
      });
      await waitFor(() => {
        expect(ids(result.current.conversations)).toEqual(['b', 'a', 'c', 'd']);
      });
      // Paging goes on from the re-read request.
      expect(result.current.hasMore).toBe(true);
    });

    it('an empty server answer to a narrowed list’s re-read never clears the rows shown', async () => {
      builds({ getConversationType: () => 'user' });
      const onEmpty = vi.fn();
      const { result } = await withPageTwo({
        conversationsRequestBuilder: new CometChat.ConversationsRequestBuilder(),
        onEmpty,
      });
      act(() => {
        fake.fire('sync', 'onConversationSyncCompleted', [conv('a', { updatedAt: 90 })]);
      });
      await waitFor(() => {
        expect(read.calls).toHaveLength(3);
      });
      act(() => {
        read.last().cached([conv('a', { updatedAt: 90 })]);
        read.last().server([]);
      });
      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });
      expect(ids(result.current.conversations)).toEqual(['a', 'b', 'c', 'd']);
      expect(onEmpty).not.toHaveBeenCalled();
    });
  });

  it('a user switch loads the new user’s chats, instead of leaving the list blank', async () => {
    // `session` (logout or user switch) clears the rows so no frame of the old
    // user's chats is shown, but nothing started a read for the new one: the
    // initial-fetch effect only re-runs for a new builder or keyword, so the
    // list stayed blank until it was remounted. Review: Prajwal
    // `useCometChatConversations.ts:849` on #2460.
    const { result } = await mountWithFirstPage([conv('a')]);
    const hub = OfflineHub.getInstance();
    act(() => {
      hub.onLogin({ getUid: () => 'me' } as unknown as CometChat.User);
    });
    act(() => {
      // The kit signs the next user in: the hub ends the old session and says so.
      hub.onLogin({ getUid: () => 'someone-else' } as unknown as CometChat.User);
    });
    expect(result.current.conversations).toEqual([]);
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    act(() => {
      read.last().server([conv('their-chat')]);
    });
    await waitFor(() => {
      expect(ids(result.current.conversations)).toEqual(['their-chat']);
    });
  });

  it('signing the same user in again does not reload the list', async () => {
    const { result } = await mountWithFirstPage([conv('a')]);
    const hub = OfflineHub.getInstance();
    const same = { getUid: () => 'me' } as unknown as CometChat.User;
    act(() => {
      hub.onLogin(same);
    });
    act(() => {
      hub.onLogin(same);
    });
    expect(read.calls).toHaveLength(1);
    expect(ids(result.current.conversations)).toEqual(['a']);
  });

  it('logout clears the old user’s chats; a cache reset reloads two-phase', async () => {
    const { result } = await mountWithFirstPage([conv('a')]);
    act(() => {
      OfflineHub.getInstance().endSession();
    });
    expect(result.current.conversations).toEqual([]);
    expect(read.calls).toHaveLength(1);

    act(() => {
      fake.fire('cacheReset', 'onOfflineCacheReset', 'SCHEMA_CHANGED', 0);
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    act(() => {
      read.last().server([conv('reloaded')]);
    });
    await waitFor(() => {
      expect(ids(result.current.conversations)).toEqual(['reloaded']);
    });
  });

  describe('live message events rebuild the row from the listed one', () => {
    function rebuiltWithoutPeer(id: string) {
      // The SDK's rebuild of a sweep-delivered or composed message: id, no peer.
      const rebuilt = conv(id);
      rebuilt.setConversationWith(undefined as unknown as CometChat.User);
      return rebuilt;
    }

    it('received, edited and deleted messages update the listed row offline', async () => {
      const helper = vi.spyOn(CometChat.CometChatHelper, 'getConversationFromMessage');
      const { result } = await mountWithFirstPage([conv('a'), conv('peer')]);

      const incoming = textMessage('hello', 'me', 'user', 'peer');
      incoming.setSentAt(10);
      helper.mockResolvedValue(rebuiltWithoutPeer('peer'));
      act(() => {
        fake.fire('message', 'onTextMessageReceived', incoming);
      });
      await waitFor(() => {
        expect(ids(result.current.conversations)[0]).toBe('peer');
      });
      const row = result.current.conversations[0]!;
      expect(row.getLastMessage()).toBe(incoming);
      expect((row.getConversationWith() as CometChat.User).getUid()).toBe('peer');

      const edited = textMessage('hello (edited)', 'me', 'user', 'peer');
      helper.mockResolvedValue(rebuiltWithoutPeer('peer'));
      act(() => {
        fake.fire('message', 'onMessageEdited', edited);
      });
      await waitFor(() => {
        expect(result.current.conversations[0]?.getLastMessage()).toBe(edited);
      });

      const deleted = textMessage('gone', 'me', 'user', 'peer');
      helper.mockResolvedValue(rebuiltWithoutPeer('peer'));
      act(() => {
        fake.fire('message', 'onMessageDeleted', deleted);
      });
      await waitFor(() => {
        expect(result.current.conversations[0]?.getLastMessage()).toBe(deleted);
      });
    });

    it('an edit or delete in a chat that is not listed changes nothing; a failed rebuild is skipped', async () => {
      const helper = vi.spyOn(CometChat.CometChatHelper, 'getConversationFromMessage');
      const { result } = await mountWithFirstPage([conv('a')]);
      const before = result.current.conversations;
      helper.mockResolvedValue(rebuiltWithoutPeer('stranger'));
      act(() => {
        fake.fire('message', 'onMessageEdited', textMessage('x', 'me', 'user', 'stranger'));
      });
      helper.mockRejectedValue(new Error('no conversation'));
      act(() => {
        fake.fire('message', 'onMessageDeleted', textMessage('y', 'me', 'user', 'stranger'));
        fake.fire('message', 'onMessageEdited', textMessage('z', 'me', 'user', 'stranger'));
      });
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      expect(result.current.conversations).toBe(before);
    });
  });

  it("this tab's own edit and delete update the listed row offline; an unlisted chat is left alone", async () => {
    const helper = vi.spyOn(CometChat.CometChatHelper, 'getConversationFromMessage');
    const bus = eventBus();
    const { result } = await mountWithFirstPage([conv('a'), conv('peer')], {}, bus.wrapper);
    const rebuilt = () => {
      const row = conv('peer');
      row.setConversationWith(undefined as unknown as CometChat.User);
      return row;
    };

    const edited = textMessage('fixed typo', 'peer');
    helper.mockResolvedValue(rebuilt());
    act(() => {
      bus.emit({
        type: 'ui:compose/edit',
        message: edited,
        status: CometChatMessageStatus.success,
      } as CometChatEvent);
    });
    await waitFor(() => {
      expect(result.current.conversations[1]?.getLastMessage()).toBe(edited);
    });

    const deleted = textMessage('deleted', 'peer');
    helper.mockResolvedValue(rebuilt());
    act(() => {
      bus.emit({ type: 'ui:message/deleted', message: deleted } as CometChatEvent);
    });
    await waitFor(() => {
      expect(result.current.conversations[1]?.getLastMessage()).toBe(deleted);
    });
    expect(
      (result.current.conversations[1]?.getConversationWith() as CometChat.User).getUid()
    ).toBe('peer');

    const before = result.current.conversations;
    const stranger = conv('stranger');
    stranger.setConversationWith(undefined as unknown as CometChat.User);
    helper.mockResolvedValue(stranger);
    act(() => {
      bus.emit({
        type: 'ui:message/deleted',
        message: textMessage('z', 'stranger'),
      } as CometChatEvent);
    });
    helper.mockRejectedValue(new Error('no conversation'));
    act(() => {
      bus.emit({
        type: 'ui:compose/edit',
        message: textMessage('w', 'stranger'),
        status: CometChatMessageStatus.success,
      } as CometChatEvent);
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    expect(result.current.conversations).toBe(before);
  });

  it('a sync page from an older session is ignored', async () => {
    const { result } = await mountWithFirstPage([conv('a')]);
    const hub = OfflineHub.getInstance();
    act(() => {
      hub.conversationSync.emit({ gen: hub.gen - 1, conversations: [conv('old-user-chat')] });
    });
    expect(ids(result.current.conversations)).toEqual(['a']);
  });

  describe('a chat read offline keeps its badge clear after the reconnect (D3)', () => {
    /** A listed chat with `count` unread, as a sync page carries it. */
    const unread = (id: string, count: number) => {
      const row = conv(id);
      row.setUnreadMessageCount(count);
      return row;
    };

    it("the sync page's old count does not put the badge back, and the flush clears it", async () => {
      const { result } = await mountWithFirstPage([conv('peer')]);
      const hub = OfflineHub.getInstance();
      // The user read the chat while offline: the receipt could not be sent.
      hub.rememberReadWhileOffline('peer', 'user');

      // Reconnect: the conversation phase runs before the read is flushed, so
      // the server's copy still carries the count the user already cleared.
      act(() => {
        hub.conversationSync.emit({ gen: hub.gen, conversations: [unread('peer', 3)] });
      });
      expect(result.current.conversations[0]?.getUnreadMessageCount()).toBe(0);

      // The read reaches the server: the chat is read there too.
      act(() => {
        hub.conversationRead.emit({ gen: hub.gen, id: 'peer', type: 'user' });
      });
      expect(result.current.conversations[0]?.getUnreadMessageCount()).toBe(0);
    });

    it('a count the server reports for a chat that was not read offline is shown', async () => {
      const { result } = await mountWithFirstPage([conv('peer'), conv('other')]);
      const hub = OfflineHub.getInstance();
      hub.rememberReadWhileOffline('peer', 'user');
      act(() => {
        hub.conversationSync.emit({
          gen: hub.gen,
          conversations: [unread('peer', 3), unread('other', 4)],
        });
      });
      const counts = result.current.conversations.map(c => c.getUnreadMessageCount());
      expect(counts).toEqual([0, 4]);
    });

    it('a flushed read of a chat that is not listed changes nothing', async () => {
      const { result } = await mountWithFirstPage([conv('peer')]);
      const hub = OfflineHub.getInstance();
      const before = result.current.conversations;
      act(() => {
        hub.conversationRead.emit({ gen: hub.gen, id: 'stranger', type: 'user' });
      });
      expect(result.current.conversations).toBe(before);
    });

    it('messages that arrived during the outage keep their count when the read lands (N1)', async () => {
      // Read offline up to message 100; three more arrived before the reconnect.
      const mark = textMessage('read this far', 'peer', 'user', 'peer');
      mark.setId(100);
      const newer = textMessage('arrived during the outage', 'peer', 'user', 'peer');
      newer.setId(103);
      const { result } = await mountWithFirstPage([conv('peer')]);
      const hub = OfflineHub.getInstance();
      hub.rememberReadWhileOffline('peer', 'user', mark);

      // The sync page's count stands: its newest message is past the mark.
      const row = unread('peer', 3);
      row.setLastMessage(newer);
      act(() => {
        hub.conversationSync.emit({ gen: hub.gen, conversations: [row] });
      });
      expect(result.current.conversations[0]?.getUnreadMessageCount()).toBe(3);

      // The read reaches the server, up to 100 only: the three newer messages
      // are unread there too, so the badge must not go to zero here.
      act(() => {
        hub.conversationRead.emit({ gen: hub.gen, id: 'peer', type: 'user', upToId: 100 });
      });
      expect(result.current.conversations[0]?.getUnreadMessageCount()).toBe(3);
    });

    it('a flushed read whose mark is the newest message leaves the badge clear', async () => {
      const mark = textMessage('newest', 'peer', 'user', 'peer');
      mark.setId(100);
      const { result } = await mountWithFirstPage([conv('peer')]);
      const hub = OfflineHub.getInstance();
      hub.rememberReadWhileOffline('peer', 'user', mark);
      const row = unread('peer', 2);
      row.setLastMessage(mark);
      act(() => {
        hub.conversationSync.emit({ gen: hub.gen, conversations: [row] });
      });
      act(() => {
        hub.conversationRead.emit({ gen: hub.gen, id: 'peer', type: 'user', upToId: 100 });
      });
      expect(result.current.conversations[0]?.getUnreadMessageCount()).toBe(0);
    });
  });

  it('a rebuilt row whose peer cannot name itself takes the listed peer', async () => {
    const helper = vi.spyOn(CometChat.CometChatHelper, 'getConversationFromMessage');
    const { result } = await mountWithFirstPage([conv('peer')]);
    const broken = conv('peer');
    broken.setConversationWith({
      getUid: () => 'peer',
      getName: () => {
        throw new Error('half-built user');
      },
    } as unknown as CometChat.User);
    helper.mockResolvedValue(broken);
    const incoming = textMessage('hi', 'me', 'user', 'peer');
    act(() => {
      fake.fire('message', 'onTextMessageReceived', incoming);
    });
    await waitFor(() => {
      expect(result.current.conversations[0]?.getLastMessage()).toBe(incoming);
    });
    expect(
      (result.current.conversations[0]?.getConversationWith() as CometChat.User).getName()
    ).toBe('peer');
  });

  describe('pin events from another device (UIK-CONV-01)', () => {
    it('a pin of a listed chat updates its row; a pin of an unlisted chat fetches and inserts it', async () => {
      const bus = eventBus();
      const { result } = await mountWithFirstPage([conv('a'), conv('b')], {}, bus.wrapper);
      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        bus.emit({ type: 'conversation/pinned', conversation: conv('b', { pinnedAt: 50 }) });
      });
      await waitFor(() => {
        expect(ids(result.current.conversations)).toEqual(['b', 'a']);
      });
      expect(result.current.conversations[0]?.getPinnedAt()).toBe(50);

      const fetched = conv('c', { pinnedAt: 60 });
      const getConversation = vi.spyOn(CometChat, 'getConversation').mockResolvedValue(fetched);
      act(() => {
        bus.emit({ type: 'conversation/pinned', conversation: conv('c', { pinnedAt: 60 }) });
      });
      await waitFor(() => {
        expect(ids(result.current.conversations)).toContain('c');
      });
      expect(getConversation).toHaveBeenCalledWith('c', 'user');
    });

    describe('with a builder, as Android decides by what the request narrows', () => {
      const asks = (extra: Record<string, unknown> = {}) =>
        vi.spyOn(CometChat.ConversationsRequestBuilder.prototype, 'build').mockReturnValue({
          fetchNext: read.fn,
          getConversationType: () => undefined,
          getTags: () => [],
          getUserTags: () => [],
          getGroupTags: () => [],
          getSearchKeyword: () => '',
          getUnread: () => false,
          getPinnedBy: () => [],
          getHideAgentic: () => false,
          getOnlyAgentic: () => false,
          ...extra,
        } as unknown as CometChat.ConversationsRequest);

      it('a builder that only sets a limit is the plain list: a pin of a chat not on screen is fetched and inserted', async () => {
        asks();
        const bus = eventBus();
        const { result } = await mountWithFirstPage(
          [conv('a'), conv('b')],
          { conversationsRequestBuilder: new CometChat.ConversationsRequestBuilder().setLimit(2) },
          bus.wrapper
        );
        await act(async () => {
          await Promise.resolve();
        });
        vi.spyOn(CometChat, 'getConversation').mockResolvedValue(conv('c', { pinnedAt: 60 }));
        act(() => {
          bus.emit({ type: 'conversation/pinned', conversation: conv('c', { pinnedAt: 60 }) });
        });
        await waitFor(() => {
          expect(ids(result.current.conversations)).toEqual(['c', 'a', 'b']);
        });
      });

      it('a builder that narrows the list (tags) only updates rows it shows: nothing is fetched', async () => {
        asks({ getTags: () => ['vip'] });
        const bus = eventBus();
        const { result } = await mountWithFirstPage(
          [conv('a'), conv('b')],
          {
            conversationsRequestBuilder: new CometChat.ConversationsRequestBuilder().setTags([
              'vip',
            ]),
          },
          bus.wrapper
        );
        await act(async () => {
          await Promise.resolve();
        });
        const getConversation = vi
          .spyOn(CometChat, 'getConversation')
          .mockResolvedValue(conv('c', { pinnedAt: 60 }));
        act(() => {
          bus.emit({ type: 'conversation/pinned', conversation: conv('c', { pinnedAt: 60 }) });
        });
        await act(async () => {
          await Promise.resolve();
        });
        expect(getConversation).not.toHaveBeenCalled();
        expect(ids(result.current.conversations)).toEqual(['a', 'b']);
      });
    });

    it('a chat that cannot be fetched is logged and ignored', async () => {
      const warn = vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => undefined);
      const bus = eventBus();
      const { result } = await mountWithFirstPage([conv('a')], {}, bus.wrapper);
      const failure = new Error('offline');
      vi.spyOn(CometChat, 'getConversation').mockRejectedValue(failure);
      act(() => {
        bus.emit({ type: 'conversation/pinned', conversation: conv('nope', { pinnedAt: 1 }) });
      });
      await waitFor(() => {
        expect(warn).toHaveBeenCalledWith(
          'CometChatConversations',
          'Pinned chat could not be fetched; event ignored:',
          failure
        );
      });
      expect(ids(result.current.conversations)).toEqual(['a']);
    });
  });

  describe('the listed unread count and newest preview are kept (R4, R7)', () => {
    function peerRow(unread: number, last: CometChat.BaseMessage) {
      const row = conv('peer', { last });
      row.setUnreadMessageCount(unread);
      return row;
    }
    function rebuilt() {
      // The SDK's rebuild from a message: unread 0, no peer.
      const row = conv('peer');
      row.setConversationWith(undefined as unknown as CometChat.User);
      return row;
    }
    function msg(text: string, id: number, sender: string, source = '') {
      return offlineMessage(textMessage(text, sender === 'me' ? 'peer' : 'me', 'user', sender), {
        id,
        sentAt: id,
        source,
      });
    }
    async function settle() {
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
    }

    it('R4: messages swept on reconnect keep the unread count and never bring back an older preview', async () => {
      const helper = vi.spyOn(CometChat.CometChatHelper, 'getConversationFromMessage');
      const newest = msg('newest', 30, 'peer');
      const { result } = await mountWithFirstPage([conv('a'), peerRow(3, newest)]);
      const peer = () => result.current.conversations.find(c => c.getConversationId() === 'peer')!;

      helper.mockResolvedValue(rebuilt());
      act(() => {
        fake.fire('message', 'onTextMessageReceived', msg('older swept', 10, 'peer', 'SYNC'));
      });
      await settle();
      expect(peer().getLastMessage()).toBe(newest);
      expect(peer().getUnreadMessageCount()).toBe(3);

      const sweptNewest = msg('swept newest', 40, 'peer', 'SYNC');
      helper.mockResolvedValue(rebuilt());
      act(() => {
        fake.fire('message', 'onTextMessageReceived', sweptNewest);
      });
      await waitFor(() => {
        expect(peer().getLastMessage()).toBe(sweptNewest);
      });
      expect(peer().getUnreadMessageCount()).toBe(3);

      // A live (not swept) message still counts +1, as with offline off.
      const live = msg('live', 50, 'peer');
      helper.mockResolvedValue(rebuilt());
      act(() => {
        fake.fire('message', 'onTextMessageReceived', live);
      });
      await waitFor(() => {
        expect(peer().getLastMessage()).toBe(live);
      });
      expect(peer().getUnreadMessageCount()).toBe(4);
    });

    it('R7: a late ack of an own message keeps the unread count and a newer preview', async () => {
      const helper = vi.spyOn(CometChat.CometChatHelper, 'getConversationFromMessage');
      const bus = eventBus();
      const fromPeer = msg('peer newer', 50, 'peer');
      const { result } = await mountWithFirstPage(
        [conv('a'), peerRow(2, fromPeer)],
        {},
        bus.wrapper
      );
      const peer = () => result.current.conversations.find(c => c.getConversationId() === 'peer')!;

      helper.mockResolvedValue(rebuilt());
      act(() => {
        bus.emit({
          type: 'ui:message/sent',
          message: msg('held mine', 40, 'me'),
          status: CometChatMessageStatus.success,
        } as CometChatEvent);
      });
      await settle();
      expect(peer().getLastMessage()).toBe(fromPeer);
      expect(peer().getUnreadMessageCount()).toBe(2);

      const mineNewer = msg('mine newer', 60, 'me');
      helper.mockResolvedValue(rebuilt());
      act(() => {
        bus.emit({
          type: 'ui:message/sent',
          message: mineNewer,
          status: CometChatMessageStatus.success,
        } as CometChatEvent);
      });
      await waitFor(() => {
        expect(peer().getLastMessage()).toBe(mineNewer);
      });
      expect(peer().getUnreadMessageCount()).toBe(2);
    });

    it('R7: a send-state event keeps the unread count and never replaces a newer preview', async () => {
      const helper = vi.spyOn(CometChat.CometChatHelper, 'getConversationFromMessage');
      const fromPeer = msg('peer newer', 50, 'peer');
      const { result } = await mountWithFirstPage([conv('a'), peerRow(2, fromPeer)]);
      const peer = () => result.current.conversations.find(c => c.getConversationId() === 'peer')!;
      const hub = OfflineHub.getInstance();

      helper.mockResolvedValue(rebuilt());
      act(() => {
        hub.sendState.emit({
          gen: hub.gen,
          localMessageId: '',
          message: msg('old failed', 40, 'me'),
          state: 'failed',
        });
      });
      await settle();
      expect(peer().getLastMessage()).toBe(fromPeer);
      expect(peer().getUnreadMessageCount()).toBe(2);

      const pending = offlineMessage(textMessage('pending', 'peer'), {
        localMessageId: 'L9',
        status: 'PENDING',
        sentAt: 70,
      });
      helper.mockResolvedValue(rebuilt());
      act(() => {
        hub.sendState.emit({
          gen: hub.gen,
          localMessageId: 'L9',
          message: pending,
          state: 'sending',
        });
      });
      await waitFor(() => {
        expect((peer().getLastMessage() as CometChat.TextMessage).getText()).toBe('pending');
      });
      expect(peer().getUnreadMessageCount()).toBe(2);
    });

    it('a failed send marks its chat where it stands and never moves it to the top', async () => {
      const helper = vi.spyOn(CometChat.CometChatHelper, 'getConversationFromMessage');
      const statusOfPreview = (row: CometChat.Conversation) =>
        (row.getLastMessage() as unknown as { getStatus(): string }).getStatus();
      // `peer` holds the user's queued message; chat `a` has had a message since,
      // so it sits above `peer`.
      const queued = offlineMessage(textMessage('mine', 'peer', 'user', 'me'), {
        localMessageId: 'LF1',
        status: 'PENDING',
        sentAt: 40,
      });
      const { result } = await mountWithFirstPage([conv('a'), peerRow(2, queued)]);
      const peer = () => result.current.conversations.find(c => c.getConversationId() === 'peer')!;
      const hub = OfflineHub.getInstance();

      // On reconnect the outbox fails it, reporting the SDK's copy of the row.
      const failed = offlineMessage(textMessage('mine', 'peer', 'user', 'me'), {
        localMessageId: 'LF1',
        status: 'FAILED',
        failureReason: 'PERMANENT',
        sentAt: 40,
      });
      helper.mockResolvedValue(rebuilt());
      act(() => {
        hub.sendState.emit({
          gen: hub.gen,
          localMessageId: 'LF1',
          message: failed,
          state: 'failed',
          reason: 'PERMANENT',
        });
      });

      // The preview carries the failed mark …
      await waitFor(() => {
        expect(statusOfPreview(peer())).toBe('FAILED');
      });
      // … and this is the regression: the row used to jump above `a`, where
      // something actually happened while the message sat unsent.
      expect(ids(result.current.conversations)).toEqual(['a', 'peer']);
      expect(peer().getUnreadMessageCount()).toBe(2);
    });
  });

  it('R5: paging closed by an offline read past the cache opens again on reconnect', async () => {
    let connection: { onConnected?: () => void } | undefined;
    vi.spyOn(CometChat, 'addConnectionListener').mockImplementation((_id, listener) => {
      connection = listener as unknown as { onConnected?: () => void };
    });
    const { result } = await mountWithFirstPage([conv('a')]);
    await act(async () => {
      void result.current.fetchNext();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    await act(async () => {
      read.last().fail({ code: 'FAILED_TO_FETCH' });
      await Promise.resolve();
    });
    expect(result.current.hasMore).toBe(false);
    act(() => {
      connection?.onConnected?.();
    });
    expect(result.current.hasMore).toBe(true);
    // The load the user already asked for runs again now: its scroll trigger is spent.
    await waitFor(() => {
      expect(read.calls).toHaveLength(3);
    });
    act(() => {
      read.last().server([conv('b')]);
    });
    await waitFor(() => {
      expect(ids(result.current.conversations)).toEqual(['a', 'b']);
    });
  });

  it('D83 rule 1: nothing cached and not connected is the error view and one onError', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useCometChatConversations({ onError }));
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      // An empty cached page is nothing on screen, not rows shown.
      read.last().cached([]);
      read.last().fail({ code: 'ERROR_INTERNET_UNAVAILABLE' });
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('error');
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('D83 rule 4: an error view from being offline reloads once on reconnect; a failing reload is the error view and onError again', async () => {
    let connection: { onConnected?: () => void } | undefined;
    vi.spyOn(CometChat, 'addConnectionListener').mockImplementation((_id, listener) => {
      connection = listener as unknown as { onConnected?: () => void };
    });
    const onError = vi.fn();
    const { result } = renderHook(() => useCometChatConversations({ onError }));
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().cached([]);
      read.last().fail({ code: 'ERROR_INTERNET_UNAVAILABLE' });
      await Promise.resolve();
    });
    act(() => {
      connection?.onConnected?.();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    await act(async () => {
      read.last().fail({ code: 'ERROR_INTERNET_UNAVAILABLE' });
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('error');
    expect(onError).toHaveBeenCalledTimes(2);
    // Still an offline error view: the next reconnect reloads, and this time it loads.
    act(() => {
      connection?.onConnected?.();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(3);
    });
    act(() => {
      read.last().server([conv('a')]);
    });
    await waitFor(() => {
      expect(ids(result.current.conversations)).toEqual(['a']);
    });
    expect(result.current.fetchState).toBe('loaded');
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it('D84 rule 7: an offline keyword search with nothing saved is "Connect to search" (no onError) and reloads that keyword on reconnect', async () => {
    let connection: { onConnected?: () => void } | undefined;
    vi.spyOn(CometChat, 'addConnectionListener').mockImplementation((_id, listener) => {
      connection = listener as unknown as { onConnected?: () => void };
    });
    const onError = vi.fn();
    const onEmpty = vi.fn();
    const builder = new CometChat.ConversationsRequestBuilder();
    const { result } = renderHook(() =>
      useCometChatConversations({
        searchKeyword: 'jo',
        searchRequestBuilder: builder,
        onError,
        onEmpty,
      })
    );
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().fail({ code: 'ERROR_INTERNET_UNAVAILABLE' });
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('empty');
    expect(result.current.connectToSearch).toBe(true);
    expect(result.current.connectToLoad).toBe(false);
    expect(onError).not.toHaveBeenCalled();
    expect(onEmpty).toHaveBeenCalledTimes(1);
    act(() => {
      connection?.onConnected?.();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    act(() => {
      read.last().server([conv('joe')]);
    });
    await waitFor(() => {
      expect(ids(result.current.conversations)).toEqual(['joe']);
    });
    expect(result.current.connectToSearch).toBe(false);
  });

  it('D84 addition B: an offline list with no keyword is "Connect to load", never "Connect to search"', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useCometChatConversations({ onError }));
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().fail({ code: 'ERROR_INTERNET_UNAVAILABLE' });
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('error');
    expect(result.current.connectToLoad).toBe(true);
    expect(result.current.connectToSearch).toBe(false);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('D84 rule 5: a real error over chats the user started (open) keeps them and reports onError once', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useCometChatConversations({ onError }));
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().cached([conv('a')]);
    });
    await act(async () => {
      read.last().fail(Object.assign(new Error('boom'), { code: 'ERR_SERVER' }));
      await Promise.resolve();
    });
    expect(ids(result.current.conversations)).toEqual(['a']);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('D83 rule 4: a server error view is not reloaded on reconnect', async () => {
    let connection: { onConnected?: () => void } | undefined;
    vi.spyOn(CometChat, 'addConnectionListener').mockImplementation((_id, listener) => {
      connection = listener as unknown as { onConnected?: () => void };
    });
    const { result } = renderHook(() => useCometChatConversations({}));
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    await act(async () => {
      read.last().fail(Object.assign(new Error('boom'), { code: 'ERR_SERVER' }));
      await Promise.resolve();
    });
    expect(result.current.fetchState).toBe('error');
    act(() => {
      connection?.onConnected?.();
    });
    expect(read.calls).toHaveLength(1);
    expect(result.current.fetchState).toBe('error');
  });

  it('D83 rule 5: an empty server page is the empty view, not an error', async () => {
    const onError = vi.fn();
    const onEmpty = vi.fn();
    const { result } = renderHook(() => useCometChatConversations({ onError, onEmpty }));
    await waitFor(() => {
      expect(read.calls).toHaveLength(1);
    });
    act(() => {
      read.last().server([]);
    });
    await waitFor(() => {
      expect(result.current.fetchState).toBe('empty');
    });
    expect(onEmpty).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('a reconnect paging reopen that fails with chats shown stays quiet: no onError, no error, chats kept', async () => {
    let connection: { onConnected?: () => void } | undefined;
    vi.spyOn(CometChat, 'addConnectionListener').mockImplementation((_id, listener) => {
      connection = listener as unknown as { onConnected?: () => void };
    });
    const onError = vi.fn();
    const { result } = await mountWithFirstPage([conv('a')], { onError });
    await act(async () => {
      void result.current.fetchNext();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    await act(async () => {
      read.last().fail({ code: 'FAILED_TO_FETCH' });
      await Promise.resolve();
    });
    act(() => {
      connection?.onConnected?.();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(3);
    });
    await act(async () => {
      read.last().fail(Object.assign(new Error('server said no'), { code: 'ERR_SERVER' }));
      await Promise.resolve();
    });
    expect(ids(result.current.conversations)).toEqual(['a']);
    expect(result.current.fetchState).toBe('loaded');
    expect(result.current.error).toBeNull();
    expect(onError).not.toHaveBeenCalled();
  });

  it('a filtered list whose sync re-read fails with chats shown stays quiet', async () => {
    const builder = new CometChat.ConversationsRequestBuilder().setTags(['vip']);
    vi.spyOn(CometChat.ConversationsRequestBuilder.prototype, 'build').mockReturnValue({
      fetchNext: read.fn,
      getTags: () => ['vip'],
    } as unknown as CometChat.ConversationsRequest);
    const onError = vi.fn();
    const { result } = await mountWithFirstPage([conv('a'), conv('b')], {
      conversationsRequestBuilder: builder,
      onError,
    });
    act(() => {
      fake.fire('sync', 'onConversationSyncCompleted', [conv('a')]);
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    await act(async () => {
      read.last().fail(Object.assign(new Error('server said no'), { code: 'ERR_SERVER' }));
      await Promise.resolve();
    });
    expect(ids(result.current.conversations)).toEqual(['a', 'b']);
    expect(result.current.fetchState).toBe('loaded');
    expect(result.current.error).toBeNull();
    expect(onError).not.toHaveBeenCalled();
  });

  it('R5: a reconnect with paging never closed offline makes no read', async () => {
    let connection: { onConnected?: () => void } | undefined;
    vi.spyOn(CometChat, 'addConnectionListener').mockImplementation((_id, listener) => {
      connection = listener as unknown as { onConnected?: () => void };
    });
    await mountWithFirstPage([conv('a')]);
    act(() => {
      connection?.onConnected?.();
    });
    await Promise.resolve();
    expect(read.calls).toHaveLength(1);
  });

  it('R5: a page of rows the reconnect sync already listed reads on until the list grows', async () => {
    const { result } = await mountWithFirstPage([conv('a'), conv('b'), conv('c'), conv('d')]);
    act(() => {
      void result.current.fetchNext();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    act(() => {
      read.last().server([conv('b'), conv('c')]);
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(3);
    });
    act(() => {
      read.last().server([conv('d')]);
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(4);
    });
    act(() => {
      read.last().server([conv('e'), conv('f')]);
    });
    await waitFor(() => {
      expect(ids(result.current.conversations)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    });
    await Promise.resolve();
    // The list grew: the read stops there.
    expect(read.calls).toHaveLength(4);
    expect(result.current.hasMore).toBe(true);
  });

  it('R5: an empty server page ends the read-on', async () => {
    const { result } = await mountWithFirstPage([conv('a'), conv('b')]);
    act(() => {
      void result.current.fetchNext();
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(2);
    });
    act(() => {
      read.last().server([conv('a')]);
    });
    await waitFor(() => {
      expect(read.calls).toHaveLength(3);
    });
    act(() => {
      read.last().server([]);
    });
    await waitFor(() => {
      expect(result.current.hasMore).toBe(false);
    });
    expect(read.calls).toHaveLength(3);
  });
});

describe('useCometChatConversations, offline OFF: edits and deletes rebuild from the message', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: false });
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null);
    vi.spyOn(CometChat, 'addConnectionListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'removeConnectionListener').mockImplementation(() => undefined);
    vi.spyOn(CometChat, 'removeMessageListener').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
    OfflineHub.resetForTests();
  });

  it("the SDK's rebuilt conversation replaces the row as it is", async () => {
    const fetchNext = vi.fn(() => Promise.resolve([conv('peer')]));
    const builder = {
      build: () => ({ fetchNext }),
    } as unknown as CometChat.ConversationsRequestBuilder;
    const { result } = renderHook(() =>
      useCometChatConversations({ conversationsRequestBuilder: builder })
    );
    await waitFor(() => {
      expect(ids(result.current.conversations)).toEqual(['peer']);
    });
    const helper = vi.spyOn(CometChat.CometChatHelper, 'getConversationFromMessage');
    const edited = conv('peer');
    helper.mockResolvedValueOnce(edited);
    act(() => {
      fake.fire('message', 'onMessageEdited', textMessage('e', 'me', 'user', 'peer'));
    });
    await waitFor(() => {
      expect(result.current.conversations[0]).toBe(edited);
    });
    const deleted = conv('peer');
    helper.mockResolvedValueOnce(deleted);
    act(() => {
      fake.fire('message', 'onMessageDeleted', textMessage('d', 'me', 'user', 'peer'));
    });
    await waitFor(() => {
      expect(result.current.conversations[0]).toBe(deleted);
    });
    expect(fetchNext.mock.calls[0]).toHaveLength(0);
  });
});
