/**
 * Review fixes on the message list's offline path: the newest-window refresh
 * never inserts a page before it is known to fit, "Jump to latest" when the
 * user reads older messages, the newer-direction footer, held receipts below
 * a newer row, the alias map, and two-phase unread info at init.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  applySendState,
  holdReceiptIfUnshown,
  jumpToLatest,
  recoverEmptyChat,
  refreshNewestWindow,
  type OfflineListContext,
} from '../messageListOffline';
import { findRowIndex } from '../../../utils/offline/reconcile';
import { clearAliases } from '../../../utils/offline/identity';
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

describe('newest-window refresh after a PARTIAL sweep (UIT-SYNC-04)', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  function serverAnswers(h: ReturnType<typeof harness>, page: CometChat.BaseMessage[]) {
    h.manager.fetchPreviousTwoPhase.mockImplementation(
      (handlers: { onServer: (p: CometChat.BaseMessage[]) => void }) => {
        handlers.onServer(page);
        return Promise.resolve();
      }
    );
  }

  it('an overlapping page is upserted in place', async () => {
    const h = harness({ hasReachedLatest: true, isAtBottom: true, messages: [fromPeer(5, 5)] });
    serverAnswers(h, [fromPeer(5, 5), fromPeer(6, 6)]);
    await refreshNewestWindow(h.ctx);
    expect(h.state.messages.map(serverIdOf)).toEqual([5, 6]);
    expect(h.state.offlineJumpToLatest).toBeFalsy();
  });

  it('at the bottom, a page that does not overlap resets to the newest window, keeping unsent rows', async () => {
    const unsent = own('mine', { localMessageId: 'L1', status: 'PENDING', sentAt: 9 });
    const h = harness({
      hasReachedLatest: true,
      isAtBottom: true,
      messages: [fromPeer(1, 1), unsent],
    });
    serverAnswers(h, [fromPeer(50, 50), fromPeer(51, 51)]);
    await refreshNewestWindow(h.ctx);
    expect(h.state.messages.map(serverIdOf)).toEqual([50, 51, 0]);
  });

  it('reading older messages: nothing moves; "Jump to latest" shows and, tapped, resets', async () => {
    const h = harness({ hasReachedLatest: true, isAtBottom: false, messages: [fromPeer(1, 1)] });
    serverAnswers(h, [fromPeer(50, 50)]);
    await refreshNewestWindow(h.ctx);
    expect(h.state.messages.map(serverIdOf)).toEqual([1]);
    expect(h.state.offlineJumpToLatest).toBe(true);
    jumpToLatest(h.ctx);
    expect(h.state.messages.map(serverIdOf)).toEqual([50]);
    expect(h.state.offlineJumpToLatest).toBe(false);
    expect(h.state.hasReachedLatest).toBe(true);
  });

  it('a jumped window (not the newest messages) is left alone: nothing is read or inserted', async () => {
    const h = harness({ hasReachedLatest: false, messages: [fromPeer(1, 1)] });
    await refreshNewestWindow(h.ctx);
    expect(h.manager.fetchPreviousTwoPhase).not.toHaveBeenCalled();
    expect(h.state.messages.map(serverIdOf)).toEqual([1]);
  });

  it('a stale refresh (chat switched meanwhile) changes nothing', async () => {
    const h = harness({ hasReachedLatest: true, isAtBottom: true, messages: [fromPeer(1, 1)] });
    h.manager.fetchPreviousTwoPhase.mockImplementation(
      (handlers: { onServer: (p: CometChat.BaseMessage[]) => void }) => {
        h.refs.generationRef.current++;
        handlers.onServer([fromPeer(50, 50)]);
        return Promise.resolve();
      }
    );
    await refreshNewestWindow(h.ctx);
    expect(h.state.messages.map(serverIdOf)).toEqual([1]);
  });
});

describe('reducer: the newer direction offline (jumped window)', () => {
  it('not connected while reading newer stops newer paging with its own footer; a server page clears it', () => {
    let state: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [fromPeer(1, 1)],
      hasMoreNewer: true,
    };
    state = messageListReducer(state, {
      type: 'OFFLINE_PAGE_ERROR',
      direction: 'next',
      notConnected: true,
      error: 'offline',
    });
    expect(state.offlineNewerFooter).toBe('connect_to_load_more');
    expect(state.offlineFooter).toBeUndefined();
    state = messageListReducer(state, {
      type: 'OFFLINE_SERVER_PAGE',
      direction: 'next',
      cachedKeys: [],
      messages: [fromPeer(2, 2)],
    });
    expect(state.offlineNewerFooter).toBe('none');
  });
});

describe('held receipts and the alias map (BEH-SEND-32, README §3.2)', () => {
  beforeEach(() => {
    OfflineHub.resetForTests();
    clearAliases();
  });

  it('holds a receipt for an id below a newer row while an own message is unsent', () => {
    const unsent = own('late ack', { localMessageId: 'LA', status: 'PENDING', sentAt: 3 });
    const h = harness({ messages: [fromPeer(10, 10), unsent] });
    holdReceiptIfUnshown(h.ctx, 8, 'read', 99);
    // The ack lands below the peer's newer message and picks the receipt up.
    applySendState(h.ctx, {
      gen: 0,
      localMessageId: 'LA',
      message: own('late ack', { localMessageId: 'LA', id: 8, sentAt: 3, muid: '' }),
      state: 'sent',
    });
    const acked = h.state.messages.find(m => serverIdOf(m) === 8);
    expect(acked?.getReadAt()).toBe(99);
  });

  it('does not hold an old id when nothing is waiting for an ack', () => {
    const h = harness({ messages: [fromPeer(10, 10)] });
    holdReceiptIfUnshown(h.ctx, 8, 'read', 99);
    applySendState(h.ctx, {
      gen: 0,
      localMessageId: '',
      message: own('x', { id: 8, sentAt: 8 }),
      state: 'sent',
    });
    expect(h.state.messages.find(m => serverIdOf(m) === 8)?.getReadAt()).toBeFalsy();
  });

  it('a late copy without its local handle still lands on the acked row (alias map)', () => {
    const hub = OfflineHub.getInstance();
    const acked = own('aliased', { localMessageId: 'LZ', id: 40, sentAt: 4 });
    hub.reportSendState(acked, 'sent');
    const rows = [own('aliased', { localMessageId: 'LZ', sentAt: 4 })];
    // A server-parsed copy: server id, no local handle at all.
    const serverCopy = own('aliased', { id: 40, sentAt: 4 });
    expect(findRowIndex(rows, serverCopy)).toBe(0);
  });
});

describe('an empty chat after the connection returns (UIK-READ-04, P6)', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  function emptyAfterOfflineRead() {
    const h = harness({ fetchState: 'loading' });
    h.ctx.dispatch({
      type: 'OFFLINE_PAGE_ERROR',
      direction: 'previous',
      notConnected: true,
      error: 'x',
    });
    h.refs.initializeRef.current = vi.fn();
    return h;
  }

  it('D83 rule 4: a chat whose open failed offline reads again, once, on the current generation', () => {
    const h = emptyAfterOfflineRead();
    expect(h.state.fetchState).toBe('error');
    recoverEmptyChat(h.ctx);
    expect(h.refs.initializeRef.current).toHaveBeenCalledTimes(1);
    expect(h.refs.generationRef.current).toBe(1);
    // The re-read has started: a second signal (the sweep) does not start another.
    h.ctx.dispatch({ type: 'FETCH_PREVIOUS_START' });
    recoverEmptyChat(h.ctx);
    expect(h.refs.initializeRef.current).toHaveBeenCalledTimes(1);
  });

  it('D83 rule 4: a re-read that is still offline ends in the error view again: no spinner forever', () => {
    const h = emptyAfterOfflineRead();
    recoverEmptyChat(h.ctx);
    h.ctx.dispatch({ type: 'FETCH_PREVIOUS_START' });
    expect(h.state.fetchState).toBe('loading');
    h.ctx.dispatch({
      type: 'OFFLINE_PAGE_ERROR',
      direction: 'previous',
      notConnected: true,
      error: 'x',
    });
    expect(h.state.fetchState).toBe('error');
  });

  it('an error view from any other error is not read again on reconnect', () => {
    const h = harness({ fetchState: 'loading' });
    h.ctx.dispatch({
      type: 'OFFLINE_PAGE_ERROR',
      direction: 'previous',
      notConnected: false,
      error: 'boom',
    });
    h.refs.initializeRef.current = vi.fn();
    expect(h.state.fetchState).toBe('error');
    recoverEmptyChat(h.ctx);
    expect(h.refs.initializeRef.current).not.toHaveBeenCalled();
  });

  it('a chat the server said is empty makes no request', () => {
    const h = harness({ fetchState: 'loading' });
    h.ctx.dispatch({
      type: 'OFFLINE_SERVER_PAGE',
      direction: 'previous',
      cachedKeys: [],
      messages: [],
    });
    h.refs.initializeRef.current = vi.fn();
    expect(h.state.fetchState).toBe('empty');
    recoverEmptyChat(h.ctx);
    expect(h.refs.initializeRef.current).not.toHaveBeenCalled();
  });

  it('a chat with rows makes no request (the sweep carries what changed)', () => {
    const h = harness({
      fetchState: 'loaded',
      messages: [fromPeer(5, 5)],
      offlineFooter: 'connect_to_load_more',
    });
    h.refs.initializeRef.current = vi.fn();
    recoverEmptyChat(h.ctx);
    expect(h.refs.initializeRef.current).not.toHaveBeenCalled();
  });

  it('the sweep finishing is a second chance when it brought nothing for this chat', () => {
    const h = emptyAfterOfflineRead();
    applyMessageSync(
      h.ctx,
      { gen: OfflineHub.getInstance().gen, messages: [], outcome: 'OK' },
      false
    );
    expect(h.refs.initializeRef.current).toHaveBeenCalledTimes(1);
  });
});
