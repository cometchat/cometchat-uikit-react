/**
 * The message list's offline (ON) path: reducer actions, two-phase reads,
 * send-state drawing, the sweep, receipts, kill switch, and the reconnect rule
 * (no kit fetch with offline on; today's fetch with it off).
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { messageListReducer } from '../CometChatMessageList.reducer';
import {
  initialMessageListState,
  type CometChatMessageListAction,
  type CometChatMessageListState,
  type CometChatUseMessageListOptions,
} from '../CometChatMessageList.types';
import {
  applyMessageSync,
  applyMessagesUpdated,
  applySendState,
  failStrandedSends,
  holdReceiptIfUnshown,
  readPageOffline,
  type OfflineListContext,
} from '../messageListOffline';
import type { MessageListRefs } from '../messageListRefs';
import type { CometChatMessageListManager } from '../CometChatMessageListManager';
import { OfflineHub } from '../../../utils/offline/hub';
import { serverIdOf } from '../../../utils/offline/identity';
import {
  installOfflineSdk,
  offlineMessage,
  textMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import type { CometChatSDKEvent } from '../../../context/CometChatEvents.types';

vi.mock('../CometChatMessageList.sound', () => ({ playIncomingSound: vi.fn() }));
import { playIncomingSound } from '../CometChatMessageList.sound';
import { useMessageListEvents } from '../useMessageListEvents';

const me = new CometChat.User({ uid: 'me', name: 'me' });
const peer = new CometChat.User({ uid: 'peer', name: 'peer' });

function fromPeer(id: number, sentAt: number, extra: Parameters<typeof offlineMessage>[1] = {}) {
  const m = offlineMessage(textMessage(`p${String(id)}`, 'me', 'user', 'peer'), {
    id,
    sentAt,
    ...extra,
  });
  return m;
}

function own(text: string, extra: Parameters<typeof offlineMessage>[1] = {}) {
  return offlineMessage(textMessage(text, 'peer', 'user', 'me'), extra);
}

/** A reducer-backed harness: dispatch runs the real reducer, stateRef follows it. */
function harness(initial: Partial<CometChatMessageListState> = {}) {
  let state: CometChatMessageListState = { ...initialMessageListState, ...initial };
  const actions: CometChatMessageListAction[] = [];
  const manager = {
    fetchPreviousTwoPhase: vi.fn(),
    fetchNextTwoPhase: vi.fn(),
    markAsRead: vi.fn().mockResolvedValue(undefined),
    markAsDelivered: vi.fn().mockResolvedValue(undefined),
    markConversationAsRead: vi.fn().mockResolvedValue(undefined),
    initNextRequest: vi.fn(),
    fetchNext: vi.fn().mockResolvedValue([]),
  };
  const refs: MessageListRefs = {
    generationRef: { current: 0 },
    managerRef: { current: manager as unknown as CometChatMessageListManager },
    isFetchingPrevRef: { current: false },
    isFetchingNextRef: { current: false },
    lastUnreadMarkedIdRef: { current: '' },
    groupRef: { current: undefined },
    stateRef: { current: state },
    optionsRef: { current: { loggedInUser: me } as CometChatUseMessageListOptions },
    initializeRef: { current: null },
    pendingMessagesMap: {},
  };
  const dispatch = (action: CometChatMessageListAction) => {
    actions.push(action);
    state = messageListReducer(state, action);
    refs.stateRef.current = state;
  };
  const ctx: OfflineListContext = {
    refs,
    dispatch,
    publish: vi.fn(),
    user: peer,
    group: undefined,
    parentMessageId: undefined,
    loggedInUser: me,
    isAgentChat: false,
    makeManager: () => manager as unknown as CometChatMessageListManager,
  };
  return {
    ctx,
    refs,
    manager,
    actions,
    get state() {
      return state;
    },
  };
}

describe('message list reducer, ON path', () => {
  it('OFFLINE_UPSERT inserts in sorted place and replaces by identity', () => {
    let s = messageListReducer(initialMessageListState, {
      type: 'OFFLINE_UPSERT',
      messages: [fromPeer(3, 30), fromPeer(1, 10)],
    });
    const pending = own('x', { localMessageId: 'L1', muid: 'M1', status: 'PENDING', sentAt: 5 });
    s = messageListReducer(s, { type: 'OFFLINE_UPSERT', messages: [pending] });
    s = messageListReducer(s, { type: 'OFFLINE_UPSERT', messages: [fromPeer(2, 20)] });
    expect(s.messages.map(m => serverIdOf(m))).toEqual([1, 2, 3, 0]);
    expect(s.fetchState).toBe('loaded');
    const acked = own('x', { localMessageId: 'L1', muid: 'M1', status: 'SENT', id: 4, sentAt: 40 });
    s = messageListReducer(s, { type: 'OFFLINE_UPSERT', messages: [acked] });
    expect(s.messages.map(m => serverIdOf(m))).toEqual([1, 2, 3, 4]);
  });

  it('OFFLINE_UPSERT updateOnly never inserts (onMessagesSynced, BEH-INV-11)', () => {
    const s = messageListReducer(
      { ...initialMessageListState, messages: [fromPeer(1, 1)] },
      { type: 'OFFLINE_UPSERT', messages: [fromPeer(2, 2)], updateOnly: true }
    );
    expect(s.messages).toHaveLength(1);
  });

  it('OFFLINE_SERVER_PAGE: only an empty server page ends the direction (BEH-READ-09b)', () => {
    const cached = [fromPeer(1, 1), fromPeer(2, 2), fromPeer(3, 3)];
    let s = messageListReducer(initialMessageListState, {
      type: 'OFFLINE_UPSERT',
      messages: cached,
    });
    s = messageListReducer(s, {
      type: 'OFFLINE_SERVER_PAGE',
      direction: 'previous',
      cachedKeys: ['s:1', 's:2', 's:3'],
      messages: [fromPeer(1, 1), fromPeer(3, 3)],
    });
    expect(s.hasMore).toBe(true);
    // 2 was in the cached page and inside the server page's range: a proven omission.
    expect(s.messages.map(m => serverIdOf(m))).toEqual([1, 3]);
    s = messageListReducer(s, {
      type: 'OFFLINE_SERVER_PAGE',
      direction: 'previous',
      cachedKeys: [],
      messages: [],
    });
    expect(s.hasMore).toBe(false);
  });

  it('OFFLINE_SERVER_PAGE: a painted cached page that does not join the server page is dropped (D13-R2)', () => {
    const unsent = own('mine', { localMessageId: 'L' });
    const cached = [fromPeer(100, 100), fromPeer(101, 101)];
    let s = messageListReducer(initialMessageListState, {
      type: 'OFFLINE_UPSERT',
      messages: [...cached, unsent],
    });
    const server = [fromPeer(350, 350), fromPeer(351, 351)];
    const page = { type: 'OFFLINE_SERVER_PAGE', direction: 'previous', messages: server } as const;
    const keys = ['s:100', 's:101'];
    // Without the painted keys (no cached paint in this read) the rows are left as today.
    expect(
      messageListReducer(s, { ...page, cachedKeys: keys }).messages.map(m => serverIdOf(m))
    ).toEqual([100, 101, 350, 351, 0]);
    s = messageListReducer(s, { ...page, cachedKeys: keys, paintedKeys: keys, rawCachedKeys: keys });
    expect(s.messages.map(m => serverIdOf(m))).toEqual([350, 351, 0]);
    expect(s.hasMore).toBe(true);
  });

  it('OFFLINE_PAGE_ERROR not connected: keeps rows and shows the footer; with no rows, the error view (P6, D83)', () => {
    const s = messageListReducer(
      { ...initialMessageListState, messages: [fromPeer(1, 1)], fetchState: 'loaded' },
      { type: 'OFFLINE_PAGE_ERROR', direction: 'previous', notConnected: true, error: 'x' }
    );
    expect(s.fetchState).toBe('loaded');
    expect(s.offlineFooter).toBe('connect_to_load_more');
    expect(s.hasMore).toBe(true);
    const empty = messageListReducer(initialMessageListState, {
      type: 'OFFLINE_PAGE_ERROR',
      direction: 'previous',
      notConnected: true,
      error: 'x',
    });
    expect(empty.fetchState).toBe('error');
    expect(empty.error).toBe('x');
    // The footer marks the offline error: the reconnect read keys off it.
    expect(empty.offlineFooter).toBe('connect_to_load_more');
  });

  it('RECEIPT_UPDATE offline never marks a row without a server id (BEH-SEND-32)', () => {
    const acked = own('a', { id: 5, sentAt: 1 });
    const pending = own('b', { localMessageId: 'L', status: 'PENDING', sentAt: 2 });
    const s = messageListReducer(
      { ...initialMessageListState, messages: [acked, pending] },
      {
        type: 'RECEIPT_UPDATE',
        receiptType: 'read',
        messageId: 99,
        timestamp: 123,
        loggedInUserId: 'me',
        offline: true,
      }
    );
    expect(s.messages[0]?.getReadAt()).toBe(123);
    expect(s.messages[1]?.getReadAt()).toBeFalsy();
  });

  it('MESSAGE_RECEIVED offline: sorted insert; a swept message adds no unread/new count', () => {
    const base = {
      ...initialMessageListState,
      messages: [fromPeer(5, 50)],
      isAtBottom: false,
      fetchState: 'loaded' as const,
    };
    const swept = messageListReducer(base, {
      type: 'MESSAGE_RECEIVED',
      message: fromPeer(3, 30, { source: 'SYNC' }),
      offline: { swept: true },
    });
    expect(swept.messages.map(m => serverIdOf(m))).toEqual([3, 5]);
    expect(swept.newMessageCount).toBe(0);
    const live = messageListReducer(base, {
      type: 'MESSAGE_RECEIVED',
      message: fromPeer(6, 60),
      offline: { swept: false },
    });
    expect(live.newMessageCount).toBe(1);
  });
});

describe('message list offline operations', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('two-phase read: cached paints first, server replaces the slice; stale gen is dropped', async () => {
    const h = harness({ fetchState: 'loading' });
    h.manager.fetchPreviousTwoPhase.mockImplementation(handlers => {
      handlers.onCached([fromPeer(1, 1), fromPeer(2, 2), fromPeer(3, 3)]);
      expect(h.state.messages).toHaveLength(3);
      expect(h.state.fetchState).toBe('loaded');
      handlers.onServer([fromPeer(1, 1), fromPeer(3, 3), fromPeer(4, 4)]);
      return Promise.resolve();
    });
    const result = await readPageOffline(h.ctx, h.refs.managerRef.current!, 'previous', 0);
    expect(result.serverPage).toHaveLength(3);
    expect(h.state.messages.map(m => serverIdOf(m))).toEqual([1, 3, 4]);

    const stale = harness();
    stale.manager.fetchPreviousTwoPhase.mockImplementation(handlers => {
      stale.refs.generationRef.current = 5;
      handlers.onCached([fromPeer(9, 9)]);
      return Promise.resolve();
    });
    const r2 = await readPageOffline(stale.ctx, stale.refs.managerRef.current!, 'previous', 0);
    expect(r2.stale).toBe(true);
    expect(stale.state.messages).toHaveLength(0);
  });

  it('D13-R2: a stale cached newest page that does not join the server page is dropped, not stitched over a gap', async () => {
    const h = harness({ fetchState: 'loading', messages: [own('mine', { localMessageId: 'L' })] });
    let painted: (number | string)[] = [];
    h.manager.fetchPreviousTwoPhase.mockImplementation(handlers => {
      handlers.onCached([fromPeer(1, 1), fromPeer(2, 2), fromPeer(3, 3)]);
      painted = h.state.messages.map(m => serverIdOf(m));
      handlers.onServer([fromPeer(71, 71), fromPeer(72, 72), fromPeer(73, 73)]);
      return Promise.resolve();
    });
    await readPageOffline(h.ctx, h.refs.managerRef.current!, 'previous', 0);
    expect(painted).toEqual([1, 2, 3, 0]);
    expect(h.state.messages.map(m => serverIdOf(m))).toEqual([71, 72, 73, 0]);
  });

  it('D13-R2: a joining cached page, and cached rows already listed, are kept', async () => {
    const joined = harness();
    joined.manager.fetchPreviousTwoPhase.mockImplementation(handlers => {
      handlers.onCached([fromPeer(1, 1), fromPeer(2, 2), fromPeer(3, 3)]);
      handlers.onServer([fromPeer(3, 3), fromPeer(4, 4), fromPeer(5, 5)]);
      return Promise.resolve();
    });
    await readPageOffline(joined.ctx, joined.refs.managerRef.current!, 'previous', 0);
    expect(joined.state.messages.map(m => serverIdOf(m))).toEqual([1, 2, 3, 4, 5]);

    // The cache read lags the server cursor: it returns rows already shown.
    const lagging = harness({ messages: [fromPeer(4, 4), fromPeer(5, 5)] });
    lagging.manager.fetchPreviousTwoPhase.mockImplementation(handlers => {
      handlers.onCached([fromPeer(4, 4), fromPeer(5, 5)]);
      handlers.onServer([fromPeer(1, 1), fromPeer(2, 2)]);
      return Promise.resolve();
    });
    await readPageOffline(lagging.ctx, lagging.refs.managerRef.current!, 'previous', 0);
    expect(lagging.state.messages.map(m => serverIdOf(m))).toEqual([1, 2, 4, 5]);
  });

  it('draws own sends from the hub: pending row, ack in place, discard removes it', () => {
    const h = harness({ hasReachedLatest: true });
    const m = own('hi', { localMessageId: 'L1', muid: 'M1', status: 'PENDING', sentAt: 9 });
    applySendState(h.ctx, { gen: 0, localMessageId: 'L1', message: m, state: 'sending' });
    expect(h.state.messages).toHaveLength(1);
    const first = h.state.messages[0];
    m.setId(11);
    applySendState(h.ctx, { gen: 0, localMessageId: 'L1', message: m, state: 'sent' });
    expect(h.state.messages).toHaveLength(1);
    expect(h.state.messages[0]).not.toBe(first);
    expect(serverIdOf(h.state.messages[0])).toBe(11);

    const n = own('bye', { localMessageId: 'L2', muid: 'M2', status: 'FAILED', sentAt: 10 });
    applySendState(h.ctx, { gen: 0, localMessageId: 'L2', message: n, state: 'failed' });
    applySendState(h.ctx, { gen: 0, localMessageId: 'L2', message: n, state: 'discarded' });
    expect(h.state.messages.map(x => serverIdOf(x))).toEqual([11]);
  });

  it('ignores send states from an old session gen and other chats', () => {
    const h = harness();
    const m = own('hi', { localMessageId: 'L1', muid: 'M1' });
    OfflineHub.getInstance().endSession();
    applySendState(h.ctx, { gen: 0, localMessageId: 'L1', message: m, state: 'sending' });
    const elsewhere = offlineMessage(textMessage('x', 'someone-else', 'user', 'me'), {
      localMessageId: 'L3',
    });
    applySendState(h.ctx, {
      gen: OfflineHub.getInstance().gen,
      localMessageId: 'L3',
      message: elsewhere,
      state: 'sending',
    });
    expect(h.state.messages).toHaveLength(0);
  });

  it('held receipts land when the row acquires its server id (BEH-SEND-32)', () => {
    const h = harness();
    holdReceiptIfUnshown(h.ctx, 21, 'read', 777);
    const m = own('a', { localMessageId: 'LA', muid: 'MA', sentAt: 3 });
    m.setId(21);
    applySendState(h.ctx, { gen: 0, localMessageId: 'LA', message: m, state: 'sent' });
    expect(h.state.messages[0]?.getReadAt()).toBe(777);
  });

  it('the sweep upserts action/call rows for this chat, one cumulative read, PARTIAL refreshes', async () => {
    const h = harness({ isAtBottom: true, hasReachedLatest: true });
    const swept = [fromPeer(4, 4, { source: 'SYNC' }), fromPeer(6, 6, { source: 'SYNC' })];
    const elsewhere = offlineMessage(textMessage('z', 'me', 'user', 'stranger'), {
      id: 5,
      sentAt: 5,
    });
    h.manager.fetchPreviousTwoPhase.mockImplementation(handlers => {
      handlers.onServer([fromPeer(6, 6)]);
      return Promise.resolve();
    });
    applyMessageSync(h.ctx, { gen: 0, messages: [...swept, elsewhere], outcome: 'PARTIAL' }, false);
    expect(h.state.messages.map(m => serverIdOf(m))).toEqual([4, 6]);
    expect(h.manager.markAsRead).toHaveBeenCalledTimes(1);
    expect(serverIdOf(h.manager.markAsRead.mock.calls[0]?.[0])).toBe(6);
    await waitFor(() => {
      expect(h.manager.fetchPreviousTwoPhase).toHaveBeenCalledTimes(1);
    });
  });

  it('onMessagesSynced updates rows shown and never inserts', () => {
    const h = harness();
    h.ctx.dispatch({ type: 'OFFLINE_UPSERT', messages: [fromPeer(1, 1, { updatedAt: 1 })] });
    const edited = fromPeer(1, 1, { updatedAt: 2 });
    applyMessagesUpdated(h.ctx, { gen: 0, messages: [edited, fromPeer(2, 2)] });
    expect(h.state.messages).toHaveLength(1);
    expect(h.state.messages[0]).toBe(edited);
  });

  it('kill switch: stranded un-acked rows turn failed (direct) with one notice (UIK-LIFE-03)', () => {
    const h = harness({ hasReachedLatest: true });
    const notices: string[] = [];
    OfflineHub.getInstance().notice.subscribe(n => notices.push(n.kind));
    const a = own('a', { localMessageId: 'LA', muid: 'MA', status: 'PENDING', sentAt: 1 });
    applySendState(h.ctx, { gen: 0, localMessageId: 'LA', message: a, state: 'sending' });
    fake.setEnabled(false);
    failStrandedSends(h.ctx);
    expect(OfflineHub.getInstance().directFailureOf(a)).toBe('');
    expect(notices).toEqual(['messages_not_sent']);
  });
});

describe('the sweep applies the list type/category acceptance', () => {
  const group = new CometChat.Group('g1', 'g1', 'public');
  const types = ['text', 'groupMember'];
  const categories = ['message', 'action'];

  beforeEach(() => {
    OfflineHub.resetForTests();
  });

  const groupCtx = (h: ReturnType<typeof harness>, extra: Partial<OfflineListContext> = {}) => ({
    ...h.ctx,
    user: undefined,
    group,
    messageTypes: types,
    messageCategories: categories,
    ...extra,
  });

  function inGroup(id: number, sentAt: number, text = `t${String(id)}`) {
    const m = new CometChat.TextMessage('g1', text, 'group');
    m.setSender(new CometChat.User({ uid: 'peer', name: 'peer' }));
    return offlineMessage(m, { id, sentAt });
  }

  function action(id: number, sentAt: number, type: string, what: string) {
    const a = new CometChat.Action(
      'g1',
      type,
      'group',
      'action' as CometChat.MessageCategory
    );
    a.setAction(what);
    a.setSender(new CometChat.User({ uid: 'peer', name: 'peer' }));
    return offlineMessage(a, { id, sentAt });
  }

  function sweepRows() {
    const edited = inGroup(1, 1, 'edited body');
    edited.setEditedAt(50);
    const deleted = inGroup(2, 2);
    deleted.setDeletedAt(60);
    return [
      edited,
      action(11, 51, 'message', 'edited'),
      deleted,
      action(12, 61, 'message', 'deleted'),
      action(13, 62, 'groupMember', 'joined'),
      inGroup(14, 63, 'brand new'),
    ];
  }

  it('keeps the edited and deleted originals, group actions and new text; drops edit/delete action rows', () => {
    const h = harness({ hasReachedLatest: true });
    h.ctx.dispatch({ type: 'OFFLINE_UPSERT', messages: [inGroup(1, 1), inGroup(2, 2)] });
    applyMessageSync(groupCtx(h), { gen: 0, messages: sweepRows(), outcome: 'COMPLETE' }, false);
    expect(h.state.messages.map(m => serverIdOf(m))).toEqual([1, 2, 13, 14]);
    expect(h.state.messages[0]?.getEditedAt()).toBe(50);
    expect(h.state.messages[1]?.getDeletedAt()).toBe(60);
    expect(h.state.messages.some(m => m.getType() === 'message')).toBe(false);
  });

  it('hideGroupActionMessages drops the group member row too', () => {
    const h = harness({ hasReachedLatest: true });
    applyMessageSync(groupCtx(h), { gen: 0, messages: sweepRows(), outcome: 'COMPLETE' }, true);
    expect(h.state.messages.map(m => serverIdOf(m))).toEqual([1, 2, 14]);
  });

  it("a consumer builder's types are respected over the list props", () => {
    const h = harness({ hasReachedLatest: true });
    const builder = new CometChat.MessagesRequestBuilder().setTypes(['groupMember']);
    applyMessageSync(
      groupCtx(h, { builder }),
      { gen: 0, messages: sweepRows(), outcome: 'COMPLETE' },
      false
    );
    expect(h.state.messages.map(m => serverIdOf(m))).toEqual([13]);
  });

  it('a list with no configured types or categories accepts every row', () => {
    const h = harness({ hasReachedLatest: true });
    applyMessageSync(
      groupCtx(h, { messageTypes: [], messageCategories: [] }),
      { gen: 0, messages: sweepRows(), outcome: 'COMPLETE' },
      false
    );
    expect(h.state.messages).toHaveLength(6);
  });
});

describe('useMessageListEvents with offline ON', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    vi.clearAllMocks();
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  function mount(state: Partial<CometChatMessageListState>) {
    const h = harness(state);
    const handlers = new Set<(e: CometChatSDKEvent) => void>();
    const bridge = {
      subscribe: (fn: (e: CometChatSDKEvent) => void) => {
        handlers.add(fn);
        return () => handlers.delete(fn);
      },
      publish: vi.fn(),
    };
    renderHook(
      () => {
        useMessageListEvents(
          {
            user: peer,
            group: undefined,
            loggedInUser: me,
            messagesRequestBuilder: undefined,
            parentMessage: undefined,
            parentMessageId: undefined,
            messageTypes: ['text'],
            messageCategories: ['message'],
            disableSoundForMessages: false,
            customSoundForMessages: undefined,
            scrollToBottomOnNewMessages: false,
            hideReceipts: false,
          },
          h.refs,
          h.ctx.dispatch
        );
      },
      {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <CometChatEventsContext.Provider value={bridge}>
            {children}
          </CometChatEventsContext.Provider>
        ),
      }
    );
    const emit = (e: CometChatSDKEvent) => {
      act(() => {
        handlers.forEach(fn => {
          fn(e);
        });
      });
    };
    // Keep the harness's live `state` getter (a spread would freeze it).
    return Object.assign(h, { emit }) as typeof h & { emit: typeof emit };
  }

  it('kill switch at the next operation: a send with offline off fails the stranded rows (no reconnect needed)', () => {
    const h = mount({ hasReachedLatest: true });
    const notices: string[] = [];
    OfflineHub.getInstance().notice.subscribe(n => notices.push(n.kind));
    const stranded = own('left behind', {
      localMessageId: 'LK',
      muid: 'MK',
      status: 'PENDING',
      sentAt: 1,
    });
    act(() => {
      OfflineHub.getInstance().reportSendState(stranded, 'sending', { announced: true });
    });
    fake.setEnabled(false);
    // The socket never dropped: the next send is the next operation.
    const next = own('typed after the switch', { muid: 'MN', sentAt: 2 });
    h.emit({ type: 'ui:message/sent', message: next, status: 'inprogress' } as never);
    expect(OfflineHub.getInstance().directFailureOf(stranded)).toBe('');
    expect(notices).toEqual(['messages_not_sent']);
  });

  it('reconnect makes no message-list fetch with offline on (UIK-SYNC-01)', () => {
    const h = mount({ messages: [fromPeer(5, 5)] });
    h.emit({ type: 'connection/connected' });
    expect(h.manager.initNextRequest).not.toHaveBeenCalled();
    expect(h.manager.fetchNext).not.toHaveBeenCalled();
  });

  it('reconnect with offline off runs today’s catch-up fetch', async () => {
    fake.setEnabled(false);
    const h = mount({ messages: [fromPeer(5, 5)] });
    h.emit({ type: 'connection/connected' });
    await waitFor(() => {
      expect(h.manager.initNextRequest).toHaveBeenCalledWith(5);
    });
  });

  it('a swept message: no sound, no per-message receipt, sorted insert (UIK-SYNC-02)', () => {
    const h = mount({ messages: [fromPeer(5, 50)], isAtBottom: true, hasReachedLatest: true });
    const swept = fromPeer(3, 30, { source: 'SYNC' });
    h.emit({ type: 'message/text-received', message: swept as CometChat.TextMessage });
    expect(playIncomingSound).not.toHaveBeenCalled();
    expect(h.manager.markAsRead).not.toHaveBeenCalled();
    expect(h.state.messages.map(m => serverIdOf(m))).toEqual([3, 5]);
  });

  it('a live message still plays sound and is receipted', () => {
    const h = mount({ messages: [], isAtBottom: true, hasReachedLatest: true });
    h.emit({ type: 'message/text-received', message: fromPeer(7, 70) as CometChat.TextMessage });
    expect(playIncomingSound).toHaveBeenCalledTimes(1);
    expect(h.manager.markAsRead).toHaveBeenCalledTimes(1);
  });

  it('the hub’s outbox events reach the list through its private channel', () => {
    const h = mount({ hasReachedLatest: true });
    OfflineHub.getInstance().start();
    const m = own('q', { localMessageId: 'LQ', muid: 'MQ', status: 'PENDING', sentAt: 1 });
    act(() => {
      OfflineHub.getInstance().reportSendState(m, 'sending', { announced: true });
    });
    expect(h.state.messages).toHaveLength(1);
    m.setId(8);
    act(() => {
      fake.fire('offline', 'onOutboxMessageSent', m);
    });
    expect(serverIdOf(h.state.messages[0])).toBe(8);
  });

  it('a user switch loads this chat for the new user, instead of leaving it blank', () => {
    // `session` cleared the rows but nothing started a read for the new user:
    // the list stayed blank until it was remounted. Review: Prajwal
    // `useMessageListEvents.ts:958` on #2460.
    const h = mount({ hasReachedLatest: true });
    const m = own('q', { localMessageId: 'LS', muid: 'MS', status: 'PENDING', sentAt: 1 });
    act(() => {
      OfflineHub.getInstance().reportSendState(m, 'sending', { announced: true });
    });
    const initialize = vi.fn();
    h.refs.initializeRef.current = initialize;
    const hub = OfflineHub.getInstance();
    act(() => {
      hub.onLogin({ getUid: () => 'me' } as unknown as CometChat.User);
    });
    expect(initialize).not.toHaveBeenCalled();
    act(() => {
      hub.onLogin({ getUid: () => 'someone-else' } as unknown as CometChat.User);
    });
    expect(h.state.messages).toHaveLength(0);
    expect(initialize).toHaveBeenCalledTimes(1);
    expect(h.refs.managerRef.current).not.toBeNull();
  });

  it('logout clears a list that used the offline path; one that did not is untouched', () => {
    const used = mount({ hasReachedLatest: true });
    const m = own('q', { localMessageId: 'LU', muid: 'MU', status: 'PENDING', sentAt: 1 });
    act(() => {
      OfflineHub.getInstance().reportSendState(m, 'sending', { announced: true });
    });
    const unused = mount({ messages: [fromPeer(1, 1)] });
    act(() => {
      OfflineHub.getInstance().endSession();
    });
    expect(used.state.messages).toHaveLength(0);
    expect(unused.state.messages).toHaveLength(1);
  });
});
