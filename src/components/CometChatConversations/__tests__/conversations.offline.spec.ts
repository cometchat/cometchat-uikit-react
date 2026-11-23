/**
 * The conversation list's offline (ON) path: the two-phase first page, the
 * sync-page reconcile instead of a reconnect refetch, and the OFF path kept.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  applyFirstServerPage,
  applyNextServerPage,
  hasUnsentPreview,
  mergeFirstServerPage,
  keepReadsMadeOffline,
  reconcileSyncPage,
  requestNarrows,
  strandedPreviewRows,
} from '../conversationsOffline';
import { conversationsReducer, initialConversationsState } from '../CometChatConversations.reducer';
import { useCometChatConversations } from '../useCometChatConversations';
import { OfflineHub } from '../../../utils/offline/hub';
import {
  installOfflineSdk,
  offlineMessage,
  textMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';

function conv(
  id: string,
  updatedAt: number,
  last?: CometChat.BaseMessage,
  /** Pinned chats come first from the server, ordered by this, not by recency. */
  pinnedAt = 0
) {
  return {
    getConversationId: () => id,
    getConversationType: () => 'user',
    getConversationWith: () => ({ getUid: () => id }),
    getLastMessage: () => last,
    getUnreadMessageCount: () => 0,
    getUpdatedAt: () => updatedAt,
    getPinnedAt: () => pinnedAt,
    getPinnedBy: () => (pinnedAt > 0 ? 'me' : ''),
    isPinned: () => pinnedAt > 0,
  } as unknown as CometChat.Conversation;
}

const ids = (list: CometChat.Conversation[]) => list.map(c => c.getConversationId());

describe('conversation reconcile (UIK-SYNC-04, BEH-CONV-06)', () => {
  const unsentLast = offlineMessage(textMessage('u'), { localMessageId: 'L', status: 'PENDING' });

  it('the first server page replaces the cached one but keeps an own unsent preview', () => {
    const current = [conv('a', 5), conv('b', 4, unsentLast), conv('c', 3)];
    expect(hasUnsentPreview(current[1]!)).toBe(true);
    expect(ids(applyFirstServerPage(current, [conv('a', 6), conv('d', 2)]))).toEqual([
      'b',
      'a',
      'd',
    ]);
  });

  it('a later server page replaces only its own cached rows', () => {
    const current = [conv('a', 9), conv('x', 3), conv('y', 2)];
    const next = applyNextServerPage(current, new Set(['x', 'y']), [conv('y', 2), conv('z', 1)]);
    expect(ids(next)).toEqual(['a', 'y', 'z']);
  });

  it('a request narrows only if it asks for a type, tags, search, unread, pinnedBy or agentic', () => {
    const request = (asks: Record<string, unknown> = {}) =>
      ({
        getConversationType: () => '',
        getTags: () => [],
        getUserTags: () => [],
        getGroupTags: () => [],
        getSearchKeyword: () => '',
        getUnread: () => false,
        getPinnedBy: () => [],
        getHideAgentic: () => false,
        getOnlyAgentic: () => false,
        ...asks,
      }) as unknown as CometChat.ConversationsRequest;
    // A builder that only sets a limit, or a request this SDK build has no getters for.
    expect(requestNarrows(request())).toBe(false);
    expect(requestNarrows(request({ getConversationType: () => 'both' }))).toBe(false);
    expect(requestNarrows({} as CometChat.ConversationsRequest)).toBe(false);
    expect(requestNarrows(undefined)).toBe(false);
    for (const asks of [
      { getConversationType: () => 'user' },
      { getTags: () => ['vip'] },
      { getUserTags: () => ['u'] },
      { getGroupTags: () => ['g'] },
      { getSearchKeyword: () => 'ann' },
      { getUnread: () => true },
      { getPinnedBy: () => ['me'] },
      { getHideAgentic: () => true },
      { getOnlyAgentic: () => true },
    ]) {
      expect(requestNarrows(request(asks))).toBe(true);
    }
  });

  describe('a narrowed list’s re-read merges page one into the rows shown', () => {
    const unsentLast = offlineMessage(textMessage('u'), { localMessageId: 'L', status: 'PENDING' });

    it('upserts the page, keeps the rows paged in below, and puts the page in recency order', () => {
      const current = [conv('a', 90), conv('b', 80), conv('c', 70), conv('d', 60)];
      const next = mergeFirstServerPage(current, new Set(['a', 'b']), [conv('b', 100), conv('a', 90)]);
      expect(ids(next)).toEqual(['b', 'a', 'c', 'd']);
    });

    it('drops only a row this read’s cached phase delivered, inside the page’s range, that the page lacks', () => {
      const current = [conv('in', 95), conv('a', 90), conv('top', 120), conv('cachedBelow', 50), conv('b', 100)];
      const cached = new Set(['in', 'a', 'b', 'cachedBelow']);
      // `in` is inside [90, 100]; `cachedBelow` is outside it; `top` was never cached.
      const next = mergeFirstServerPage(current, cached, [conv('b', 100), conv('a', 90)]);
      expect(ids(next)).toEqual(['top', 'b', 'a', 'cachedBelow']);
    });

    it('never drops an own unsent preview, and keeps a newer unsent copy over the page’s', () => {
      const unsent = conv('u', 95, unsentLast);
      const next = mergeFirstServerPage([unsent, conv('a', 90)], new Set(['u', 'a']), [
        conv('b', 100),
        conv('a', 90),
      ]);
      expect(ids(next)).toEqual(['b', 'u', 'a']);
      const newer = mergeFirstServerPage([unsent], new Set(['u']), [conv('u', 50)]);
      expect(newer[0]).toBe(unsent);
    });

    it('an empty server page changes nothing (D17)', () => {
      const current = [conv('a', 90), conv('b', 80)];
      expect(mergeFirstServerPage(current, new Set(['a', 'b']), [])).toBe(current);
    });

    it('reducer: the merge flag merges; without it the first server page still replaces', () => {
      const shown = {
        ...initialConversationsState,
        conversations: [conv('a', 90), conv('b', 80), conv('c', 70)],
        fetchState: 'loaded' as const,
      };
      const action = {
        type: 'OFFLINE_PAGE' as const,
        phase: 'server' as const,
        first: true,
        conversations: [conv('a', 90), conv('b', 80)],
        cachedIds: ['a', 'b'],
      };
      expect(ids(conversationsReducer(shown, { ...action, merge: true }).conversations)).toEqual([
        'a',
        'b',
        'c',
      ]);
      expect(ids(conversationsReducer(shown, action).conversations)).toEqual(['a', 'b']);
    });
  });

  it('a sync page reconciles its slice; rows below the page are kept; nothing moves backwards', () => {
    const current = [conv('a', 10), conv('b', 9), conv('gone', 8), conv('old', 1)];
    const page = [conv('b', 12), conv('a', 10), conv('new', 7)];
    expect(ids(reconcileSyncPage(current, page))).toEqual(['b', 'a', 'new', 'old']);
  });

  it('a synced row with no last message, on an SDK with no getUpdatedAt (4.3), drops no row below the page', () => {
    const bare = (id: string, sentAt?: number) =>
      ({
        getConversationId: () => id,
        getConversationType: () => 'user',
        getConversationWith: () => ({ getUid: () => id }),
        getLastMessage: () =>
          sentAt === undefined ? undefined : offlineMessage(textMessage(id), { sentAt }),
        getUnreadMessageCount: () => 0,
      }) as unknown as CometChat.Conversation;
    const current = [bare('a', 50), bare('b', 40), bare('c', 30), bare('d', 20)];
    // Only an empty chat in the page: its range is unknown, nothing is dropped.
    expect(ids(reconcileSyncPage(current, [bare('empty')]))).toEqual(['a', 'b', 'c', 'd', 'empty']);
    // An empty chat beside stamped ones: the stamped ones bound the range.
    expect(ids(reconcileSyncPage(current, [bare('a', 60), bare('empty')]))).toEqual([
      'a',
      'b',
      'c',
      'd',
      'empty',
    ]);
    expect(ids(reconcileSyncPage(current, [bare('b', 60), bare('empty'), bare('c', 35)]))).toEqual(
      ['b', 'c', 'd', 'empty']
    );
  });

  it('a pinned chat in the sync page does not drag its range back over the pages below', () => {
    // The server puts pins first, by `pinnedAt`: this one has been quiet for
    // ages. The user has paged down to `d`, goes offline and reconnects.
    const pinned = conv('p', 5, undefined, 999);
    const current = [pinned, conv('a', 90), conv('b', 80), conv('c', 70), conv('d', 60)];
    // The sync page is the pin plus the newest chats only.
    const page = [pinned, conv('a', 95), conv('b', 80)];
    // The regression: `p`'s stamp made the range reach back to 5, so `c` and `d`
    // — newer than it, and past the request's cursor — were dropped for good.
    expect(ids(reconcileSyncPage(current, page))).toEqual(['a', 'b', 'c', 'd', 'p']);
  });

  it('a pinned row the sync page lacks is kept: only pin events unpin it', () => {
    // Inside the page's range by recency, so the old rule dropped it.
    const pinned = conv('p', 50, undefined, 999);
    const current = [pinned, conv('a', 90)];
    expect(ids(reconcileSyncPage(current, [conv('a', 95), conv('b', 40)]))).toEqual([
      'a',
      'p',
      'b',
    ]);
  });

  it('an unpinned row inside the page range is still dropped', () => {
    const current = [conv('a', 90), conv('gone', 80), conv('below', 10)];
    expect(ids(reconcileSyncPage(current, [conv('a', 95), conv('c', 70)]))).toEqual([
      'a',
      'c',
      'below',
    ]);
  });

  it('an own unsent preview newer than the sync copy wins', () => {
    const mine = conv('a', 20, unsentLast);
    expect(reconcileSyncPage([mine], [conv('a', 15)])[0]).toBe(mine);
  });

  it('reducer: a cached page never ends the list; the server page does when empty', () => {
    let s = conversationsReducer(initialConversationsState, {
      type: 'OFFLINE_PAGE',
      phase: 'cached',
      first: true,
      conversations: [],
    });
    expect(s.hasMore).toBe(true);
    s = conversationsReducer(s, {
      type: 'OFFLINE_PAGE',
      phase: 'server',
      first: true,
      conversations: [],
    });
    expect(s.hasMore).toBe(false);
    expect(s.fetchState).toBe('empty');
  });

  it('reducer: offline past the cache keeps the saved chats, no error screen', () => {
    const s = conversationsReducer(
      { ...initialConversationsState, conversations: [conv('a', 1)], fetchState: 'loaded' },
      { type: 'OFFLINE_PAGE_ERROR', notConnected: true, error: 'x', hasMore: false }
    );
    expect(s.fetchState).toBe('loaded');
    expect(s.error).toBeNull();
  });
});

describe('useCometChatConversations with offline ON', () => {
  let fake: OfflineSdkFake;
  let onConnected: (() => void) | undefined;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null);
    vi.spyOn(CometChat, 'addConnectionListener').mockImplementation(((
      _id: string,
      l: { onConnected?: () => void }
    ) => {
      onConnected = l.onConnected;
    }) as never);
    vi.spyOn(CometChat, 'removeConnectionListener').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fake.restore();
    OfflineHub.resetForTests();
  });

  /** A builder whose request scripts the two-phase read. */
  function scriptedBuilder() {
    const fetchNext = vi.fn((listener?: Record<string, (p: unknown) => void>) => {
      listener?.onCachedConversations?.([conv('cached', 1)]);
      listener?.onServerConversations?.([conv('server', 2)]);
      return Promise.resolve([]);
    });
    const builder = {
      build: () => ({ fetchNext, getTags: () => ['vip'] }),
    } as unknown as CometChat.ConversationsRequestBuilder;
    return { builder, fetchNext };
  }

  it('reads two-phase, makes no reconnect refetch, and a filtered list re-reads once on sync', async () => {
    const { builder, fetchNext } = scriptedBuilder();
    const { result } = renderHook(() =>
      useCometChatConversations({ conversationsRequestBuilder: builder })
    );
    await waitFor(() => {
      expect(ids(result.current.conversations)).toEqual(['server']);
    });
    expect(fetchNext.mock.calls[0]?.[0]).toBeDefined();
    const before = fetchNext.mock.calls.length;
    act(() => {
      onConnected?.();
    });
    expect(fetchNext.mock.calls.length).toBe(before);
    OfflineHub.getInstance().start();
    act(() => {
      fake.fire('sync', 'onConversationSyncCompleted', [conv('synced', 3)]);
    });
    await waitFor(() => {
      expect(fetchNext.mock.calls.length).toBe(before + 1);
    });
  });

  it('no second page read starts while the first waits for its server phase (the ask runs after it); a filtered re-read never blanks', async () => {
    let answerServer: (() => void) | undefined;
    const fetchNext = vi.fn((listener?: Record<string, (p: unknown) => void>) => {
      listener?.onCachedConversations?.([conv('cached', 1)]);
      return new Promise<unknown[]>(resolve => {
        answerServer = () => {
          listener?.onServerConversations?.([conv('cached', 1), conv('server', 2)]);
          resolve([]);
        };
      });
    });
    const builder = {
      build: () => ({ fetchNext, getTags: () => ['vip'] }),
    } as unknown as CometChat.ConversationsRequestBuilder;
    const { result } = renderHook(() =>
      useCometChatConversations({ conversationsRequestBuilder: builder })
    );
    await waitFor(() => {
      expect(ids(result.current.conversations)).toEqual(['cached']);
    });
    await act(async () => {
      await result.current.fetchNext();
    });
    expect(fetchNext).toHaveBeenCalledTimes(1);
    await act(async () => {
      answerServer?.();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(ids(result.current.conversations).sort()).toEqual(['cached', 'server']);
    });
    // The load-more asked for meanwhile was kept, and runs now.
    await waitFor(() => {
      expect(fetchNext).toHaveBeenCalledTimes(2);
    });
    // A sync on a filtered list re-reads in place: rows stay on screen meanwhile.
    OfflineHub.getInstance().start();
    act(() => {
      fake.fire('sync', 'onConversationSyncCompleted', [conv('synced', 3)]);
    });
    expect(result.current.conversations.length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(fetchNext).toHaveBeenCalledTimes(3);
    });
    expect(result.current.conversations.length).toBeGreaterThan(0);
  });

  it("an own pending send keeps the listed chat's peer; an unlisted chat is not added without one", async () => {
    // A composed message carries only a receiver ID, so the SDK rebuilds a
    // conversation from it with no `conversationWith` (a row without one
    // crashes CometChatConversationsItem).
    // Modelled here the way the SDK answered for a pending send in the browser
    // (offline E2E, UIT-SEND-01): right conversation ID, `conversationWith` unset.
    vi.spyOn(CometChat.CometChatHelper, 'getConversationFromMessage').mockImplementation(
      (message: CometChat.TextMessage | CometChat.MediaMessage | CometChat.CustomMessage) =>
        Promise.resolve(
          new CometChat.Conversation(
            `me_user_${message.getReceiverId()}`,
            'user',
            message,
            undefined as unknown as CometChat.User,
            0,
            [],
            0,
            undefined,
            undefined
          )
        )
    );
    const pending = offlineMessage(textMessage('pending', 'peer'), {
      localMessageId: 'local-1',
      muid: '_m1',
    });
    const listedId = 'me_user_peer';

    const fetchNext = vi.fn((listener?: Record<string, (p: unknown) => void>) => {
      listener?.onServerConversations?.([conv('other', 2), conv(listedId, 1)]);
      return Promise.resolve([]);
    });
    const builder = {
      build: () => ({ fetchNext }),
    } as unknown as CometChat.ConversationsRequestBuilder;
    const { result } = renderHook(() =>
      useCometChatConversations({ conversationsRequestBuilder: builder })
    );
    await waitFor(() => {
      expect(ids(result.current.conversations)).toEqual(['other', listedId]);
    });

    const hub = OfflineHub.getInstance();
    act(() => {
      hub.reportSendState(pending, 'sending', { announced: true });
    });
    await waitFor(() => {
      expect(ids(result.current.conversations)).toEqual([listedId, 'other']);
    });
    const moved = result.current.conversations[0];
    expect((moved?.getConversationWith() as CometChat.User | undefined)?.getUid()).toBe(listedId);
    expect(moved?.getLastMessage()?.getMuid()).toBe('_m1');

    // A chat that is not listed yet: no row without a peer (it appears on the ack).
    const unlisted = offlineMessage(textMessage('to someone new', 'stranger'), {
      localMessageId: 'local-2',
      muid: '_m2',
    });
    act(() => {
      hub.reportSendState(unlisted, 'sending', { announced: true });
    });
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(ids(result.current.conversations)).toEqual([listedId, 'other']);
  });

  it('kill switch at the next read: an unsent own preview turns failed once offline is off', async () => {
    const pending = offlineMessage(textMessage('left behind', 'peer'), {
      localMessageId: 'LP',
      muid: 'MP',
      status: 'PENDING',
    });
    const fetchNext = vi.fn((listener?: Record<string, (p: unknown) => void>) => {
      if (listener) {
        listener.onServerConversations?.([conv('stranded', 2, pending), conv('fine', 1)]);
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });
    const builder = {
      build: () => ({ fetchNext }),
    } as unknown as CometChat.ConversationsRequestBuilder;
    const { result } = renderHook(() =>
      useCometChatConversations({ conversationsRequestBuilder: builder })
    );
    await waitFor(() => {
      expect(ids(result.current.conversations)).toEqual(['stranded', 'fine']);
    });
    const before = result.current.conversations[0];
    expect(OfflineHub.getInstance().directFailureOf(pending)).toBeUndefined();
    fake.setEnabled(false);
    await act(async () => {
      await result.current.fetchNext();
    });
    expect(OfflineHub.getInstance().directFailureOf(pending)).toBe('');
    // A fresh row reference, so the preview re-renders its failed mark.
    expect(result.current.conversations.find(c => c.getConversationId() === 'stranded')).not.toBe(
      before
    );
  });

  it('strandedPreviewRows: only unsent own previews not already failed', () => {
    const unsent = offlineMessage(textMessage('u', 'peer'), { localMessageId: 'LU', muid: 'MU' });
    const done = offlineMessage(textMessage('d', 'peer'), { id: 9, muid: 'MD' });
    const marked = offlineMessage(textMessage('m', 'peer'), { localMessageId: 'LM', muid: 'MM' });
    OfflineHub.getInstance().markDirectFailed(marked, '');
    const rows = strandedPreviewRows([
      conv('a', 1, unsent),
      conv('b', 1, done),
      conv('c', 1, marked),
      conv('d', 1),
    ]);
    expect(ids(rows)).toEqual(['a']);
  });

  it('with offline off a reconnect still refetches, Promise form', async () => {
    fake.setEnabled(false);
    const fetchNext = vi.fn(() => Promise.resolve([conv('a', 1)]));
    const builder = {
      build: () => ({ fetchNext }),
    } as unknown as CometChat.ConversationsRequestBuilder;
    renderHook(() => useCometChatConversations({ conversationsRequestBuilder: builder }));
    await waitFor(() => {
      expect(fetchNext).toHaveBeenCalledTimes(1);
    });
    expect(fetchNext.mock.calls[0]).toHaveLength(0);
    act(() => {
      onConnected?.();
    });
    await waitFor(() => {
      expect(fetchNext).toHaveBeenCalledTimes(2);
    });
  });
});

describe('a chat read offline, in the sync page that follows the reconnect', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    fake = installOfflineSdk();
    OfflineHub.resetForTests();
  });

  afterEach(() => {
    fake.restore();
    vi.restoreAllMocks();
  });

  /** A sync-page row for `id`, unread `count`, whose newest message is `lastId`. */
  function unreadRow(id: string, count: number, lastId: number) {
    let unread = count;
    return {
      getConversationId: () => id,
      getConversationType: () => 'user',
      getConversationWith: () => ({ getUid: () => id }),
      getLastMessage: () => offlineMessage(textMessage('m'), { id: lastId, sentAt: lastId }),
      getUnreadMessageCount: () => unread,
      setUnreadMessageCount: (value: number) => {
        unread = value;
      },
      getUpdatedAt: () => lastId,
      getPinnedAt: () => 0,
      getPinnedBy: () => '',
      isPinned: () => false,
    } as unknown as CometChat.Conversation;
  }

  it('keeps the count when messages arrived after the point the user read', () => {
    // Read at message 10 offline; the peer sent 3 more during the outage. The
    // row used to be zeroed and the flush cleared the whole chat on the server,
    // so those 3 were never shown anywhere (Aanshi N1 on #2460).
    const hub = OfflineHub.getInstance();
    hub.start();
    hub.rememberReadWhileOffline(
      'peer',
      'user',
      offlineMessage(textMessage('read-to'), { id: 10, sentAt: 10 }) as unknown as CometChat.BaseMessage
    );
    const [row] = keepReadsMadeOffline([unreadRow('peer', 3, 13)]);
    expect(row?.getUnreadMessageCount()).toBe(3);
  });

  it('zeroes the count when nothing arrived after that point', () => {
    const hub = OfflineHub.getInstance();
    hub.start();
    hub.rememberReadWhileOffline(
      'peer',
      'user',
      offlineMessage(textMessage('read-to'), { id: 10, sentAt: 10 }) as unknown as CometChat.BaseMessage
    );
    const [row] = keepReadsMadeOffline([unreadRow('peer', 2, 10)]);
    expect(row?.getUnreadMessageCount()).toBe(0);
  });

  it('leaves a chat this device did not read offline alone', () => {
    OfflineHub.getInstance().start();
    const [row] = keepReadsMadeOffline([unreadRow('other', 4, 20)]);
    expect(row?.getUnreadMessageCount()).toBe(4);
  });
});
