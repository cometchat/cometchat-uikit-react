/**
 * Issue A: with offline on, the default top-level list sends only `hideReplies`
 * so the SDK writes its pages to the cache, and applies the removed filters on
 * the client. Paging and delete-by-omission go by the raw page.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageListManager } from '../CometChatMessageListManager';
import { messageListReducer } from '../CometChatMessageList.reducer';
import {
  initialMessageListState,
  type CometChatMessageListAction,
  type CometChatMessageListState,
  type CometChatUseMessageListOptions,
} from '../CometChatMessageList.types';
import { readPageOffline, rowsOf, type OfflineListContext } from '../messageListOffline';
import type { MessageListRefs } from '../messageListRefs';
import { OfflineHub } from '../../../utils/offline/hub';
import { serverIdOf } from '../../../utils/offline/identity';
import {
  installOfflineSdk,
  offlineMessage,
  scriptedRead,
  textMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';

const me = new CometChat.User({ uid: 'me', name: 'me' });
const peer = new CometChat.User({ uid: 'peer', name: 'peer' });
const TYPES = ['text', 'image'];
const CATEGORIES = ['message', 'custom'];

function row(id: number, extra: { type?: string; category?: string; deleted?: boolean } = {}) {
  const message = offlineMessage(textMessage(`m${String(id)}`, 'me', 'user', 'peer'), {
    id,
    sentAt: id,
  });
  if (extra.type) message.setType(extra.type);
  if (extra.category) message.setCategory(extra.category as CometChat.MessageCategory);
  if (extra.deleted) message.setDeletedAt(id);
  return message;
}

function pageOf(from: number, to: number, extra: Parameters<typeof row>[1] = {}) {
  const page: CometChat.BaseMessage[] = [];
  for (let id = from; id <= to; id++) page.push(row(id, extra));
  return page;
}

function managerOptions() {
  return { user: peer, messageTypes: TYPES, messageCategories: CATEGORIES };
}

interface Internals {
  previousRequest: { fetchPrevious: unknown };
}

function managerWithRead(options = managerOptions()) {
  const manager = new CometChatMessageListManager(options);
  const read = scriptedRead('Messages');
  (manager as unknown as Internals).previousRequest.fetchPrevious = read.fn;
  return { manager, read };
}

function harness(manager: CometChatMessageListManager) {
  let state: CometChatMessageListState = { ...initialMessageListState, fetchState: 'loading' };
  const refs = {
    generationRef: { current: 0 },
    managerRef: { current: manager },
    stateRef: { current: state },
    optionsRef: { current: { loggedInUser: me } as CometChatUseMessageListOptions },
  } as unknown as MessageListRefs;
  const states: CometChatMessageListState[] = [];
  const dispatch = (action: CometChatMessageListAction) => {
    state = messageListReducer(state, action);
    refs.stateRef.current = state;
    states.push(state);
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
    makeManager: () => manager,
  };
  return {
    ctx,
    states,
    get state() {
      return state;
    },
  };
}

/** Let the read's continuation (a macrotask after each terminal) start its next page. */
const nextRead = () =>
  new Promise(resolve => {
    setTimeout(resolve, 5);
  });

describe('the request the default list sends', () => {
  let fake: OfflineSdkFake;
  const proto = CometChat.MessagesRequestBuilder.prototype;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    vi.restoreAllMocks();
  });

  function spies() {
    return {
      hideDeleted: vi.spyOn(proto, 'hideDeletedMessages'),
      hideReplies: vi.spyOn(proto, 'hideReplies'),
      setTypes: vi.spyOn(proto, 'setTypes'),
      setCategories: vi.spyOn(proto, 'setCategories'),
      setParent: vi.spyOn(proto, 'setParentMessageId'),
    };
  }

  it('offline on: only hideReplies, so the SDK caches the page', () => {
    const s = spies();
    new CometChatMessageListManager(managerOptions());
    expect(s.hideReplies).toHaveBeenCalledWith(true);
    expect(s.hideDeleted).not.toHaveBeenCalled();
    expect(s.setTypes).not.toHaveBeenCalled();
    expect(s.setCategories).not.toHaveBeenCalled();
  });

  it('offline off: exactly today’s request', () => {
    fake.setEnabled(false);
    const s = spies();
    new CometChatMessageListManager(managerOptions());
    expect(s.hideDeleted).toHaveBeenCalledWith(true);
    expect(s.hideReplies).toHaveBeenCalledWith(true);
    expect(s.setTypes).toHaveBeenCalledWith(TYPES);
    expect(s.setCategories).toHaveBeenCalledWith(CATEGORIES);
  });

  it('offline on, a thread list: today’s request (the SDK caches no thread page)', () => {
    const s = spies();
    new CometChatMessageListManager({ ...managerOptions(), parentMessageId: 9 });
    expect(s.setParent).toHaveBeenCalledWith(9);
    expect(s.hideDeleted).toHaveBeenCalledWith(true);
    expect(s.setTypes).toHaveBeenCalledWith(TYPES);
  });

  it('offline on, a consumer builder: left exactly as given, and its pages are not filtered', async () => {
    const builder = new CometChat.MessagesRequestBuilder().setUID('peer').setLimit(10);
    const s = spies();
    const { manager, read } = managerWithRead({ ...managerOptions(), builder } as never);
    expect(s.hideDeleted).not.toHaveBeenCalled();
    expect(s.hideReplies).not.toHaveBeenCalled();
    const seen: number[][] = [];
    const reading = manager.fetchPreviousTwoPhase({
      onCached: () => undefined,
      onServer: page => seen.push(page.map(serverIdOf)),
      onError: () => undefined,
    });
    read.last().server([row(1, { deleted: true }), row(2, { type: 'other' })]);
    await reading;
    expect(seen).toEqual([[1, 2]]);
  });

  it('applies types, categories and hide-deleted to both phases, keeping the raw page', async () => {
    const { manager, read } = managerWithRead();
    const cached: number[][] = [];
    const server: number[][] = [];
    const raw: number[][] = [];
    const reading = manager.fetchPreviousTwoPhase({
      onCached: page => cached.push(page.map(serverIdOf)),
      onServer: (page, rawPage) => {
        server.push(page.map(serverIdOf));
        raw.push((rawPage ?? []).map(serverIdOf));
      },
      onError: () => undefined,
    });
    const mixed = [
      row(1),
      row(2, { deleted: true }),
      row(3, { type: 'other' }),
      row(4, { category: 'action' }),
    ];
    read.last().cached(mixed);
    read.last().server(mixed);
    await reading;
    expect(cached).toEqual([[1]]);
    expect(server).toEqual([[1]]);
    expect(raw).toEqual([[1, 2, 3, 4]]);
  });
});

describe('paging by the raw page', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('a page with every row filtered out keeps paging: no empty state, no dead end', async () => {
    const { manager, read } = managerWithRead();
    const h = harness(manager);
    const reading = readPageOffline(h.ctx, manager, 'previous', 0);
    read.last().server(pageOf(40, 69, { type: 'hidden' }));
    await nextRead();
    expect(h.state.fetchState).toBe('loading');
    expect(read.calls).toHaveLength(2);
    read.last().server([...pageOf(8, 9), ...pageOf(10, 39, { type: 'hidden' })]);
    await nextRead();
    expect(read.calls).toHaveLength(3);
    expect(h.states.some(s => s.fetchState === 'empty')).toBe(false);
    read.last().server([]);
    const result = await reading;
    expect(h.state.messages.map(serverIdOf)).toEqual([8, 9]);
    expect(h.state.fetchState).toBe('loaded');
    expect(h.state.hasMore).toBe(false);
    expect(rowsOf(result).map(serverIdOf)).toEqual([8, 9]);
    expect(result.moreOnServer).toBe(false);
  });

  it('history with nothing to show ends in the empty state only at the empty raw page', async () => {
    const { manager, read } = managerWithRead();
    const h = harness(manager);
    const reading = readPageOffline(h.ctx, manager, 'previous', 0);
    read.last().server(pageOf(1, 3, { deleted: true }));
    await nextRead();
    expect(h.state.fetchState).toBe('loading');
    read.last().server([]);
    await reading;
    expect(h.state.fetchState).toBe('empty');
  });

  it('a page that filtered nothing is one read, with more to page', async () => {
    const { manager, read } = managerWithRead();
    const h = harness(manager);
    const reading = readPageOffline(h.ctx, manager, 'previous', 0);
    read.last().server(pageOf(1, 4));
    const result = await reading;
    expect(read.calls).toHaveLength(1);
    expect(h.state.hasMore).toBe(true);
    expect(result.moreOnServer).toBe(true);
  });

  it('a short filtered page reads on until it has a full page, then stops', async () => {
    const { manager, read } = managerWithRead();
    const h = harness(manager);
    const reading = readPageOffline(h.ctx, manager, 'previous', 0);
    read.last().server([row(70, { deleted: true }), ...pageOf(71, 99)]);
    await nextRead();
    read.last().server(pageOf(40, 69));
    await reading;
    expect(read.calls).toHaveLength(2);
    expect(h.state.messages).toHaveLength(59);
    expect(h.state.hasMore).toBe(true);
  });

  it('offline: a cached page with every row filtered out reads the next cached page', async () => {
    const { manager, read } = managerWithRead();
    const h = harness(manager);
    const reading = readPageOffline(h.ctx, manager, 'previous', 0);
    read.last().cached(pageOf(40, 69, { type: 'hidden' }));
    read.last().fail();
    await nextRead();
    expect(read.calls).toHaveLength(2);
    expect(h.state.fetchState).toBe('loading');
    read.last().cached(pageOf(8, 9));
    read.last().fail();
    const result = await reading;
    expect(h.state.messages.map(serverIdOf)).toEqual([8, 9]);
    expect(h.state.fetchState).toBe('loaded');
    expect(h.state.offlineFooter).toBe('connect_to_load_more');
    expect(result.notConnected).toBe(true);
  });

  it('offline: the same cached page twice ends the read instead of looping on it', async () => {
    // Reading on past a page the client filter emptied assumes the SDK's cached
    // cursor moves. If it ever stood still, the same page was read for ever and
    // the list sat on its loader until the chat was left: the read now ends with
    // what it has, exactly as an exhausted cache does. The old code loops here
    // and the test times out. Review: Prajwal `messageListOffline.ts:236`.
    const { manager, read } = managerWithRead();
    const h = harness(manager);
    const reading = readPageOffline(h.ctx, manager, 'previous', 0);
    const samePage = () => pageOf(40, 69, { type: 'hidden' });
    read.last().cached(samePage());
    read.last().fail();
    await nextRead();
    expect(read.calls).toHaveLength(2);
    // The SDK answers with the very same rows again.
    read.last().cached(samePage());
    read.last().fail();
    const result = await reading;
    expect(read.calls).toHaveLength(2);
    expect(result.notConnected).toBe(true);
    expect(h.state.fetchState).not.toBe('loading');
    expect(h.state.offlineFooter).toBe('connect_to_load_more');
  });

  it('a filtered page that keeps moving still stops at the read cap', async () => {
    const { manager, read } = managerWithRead();
    const h = harness(manager);
    const reading = readPageOffline(h.ctx, manager, 'previous', 0);
    // Every read answers a new, fully filtered page: without a cap this never ends.
    for (let page = 0; page < 12; page += 1) {
      const from = 1000 - page * 30;
      read.last().cached(pageOf(from, from + 29, { type: 'hidden' }));
      read.last().fail();
      await nextRead();
      if (read.calls.length < page + 2) break;
    }
    const result = await reading;
    expect(read.calls).toHaveLength(10);
    expect(result.notConnected).toBe(true);
    expect(h.state.fetchState).not.toBe('loading');
  });

  it('a new generation stops the read', async () => {
    const { manager, read } = managerWithRead();
    const h = harness(manager);
    const reading = readPageOffline(h.ctx, manager, 'previous', 0);
    read.last().server(pageOf(40, 69, { type: 'hidden' }));
    h.ctx.refs.generationRef.current = 1;
    const result = await reading;
    expect(read.calls).toHaveLength(1);
    expect(result.stale).toBe(true);
  });
});

describe('delete-by-omission against the raw page', () => {
  function apply(
    shown: CometChat.BaseMessage[],
    cachedKeys: string[],
    messages: CometChat.BaseMessage[],
    rawMessages: CometChat.BaseMessage[]
  ) {
    return messageListReducer(
      { ...initialMessageListState, messages: shown, fetchState: 'loaded' },
      { type: 'OFFLINE_SERVER_PAGE', direction: 'previous', cachedKeys, messages, rawMessages }
    );
  }

  it('a cached row the server now reports deleted goes', () => {
    const next = apply(
      [row(1), row(2), row(3)],
      ['s:1', 's:2', 's:3'],
      [row(1), row(3)],
      [row(1), row(2, { deleted: true }), row(3)]
    );
    expect(next.messages.map(serverIdOf)).toEqual([1, 3]);
  });

  it('a cached row missing from the raw page, inside its range, goes', () => {
    const next = apply(
      [row(1), row(2), row(3)],
      ['s:1', 's:2', 's:3'],
      [row(1), row(3)],
      [row(1), row(3)]
    );
    expect(next.messages.map(serverIdOf)).toEqual([1, 3]);
  });

  it('the range is the raw page’s, not the filtered page’s', () => {
    // The filter kept only row 3, but the server answered for 1..5.
    const next = apply(
      [row(2), row(3), row(9)],
      ['s:2', 's:3', 's:9'],
      [row(3)],
      [row(1, { deleted: true }), row(3), row(5, { type: 'hidden' })]
    );
    expect(next.messages.map(serverIdOf)).toEqual([3, 9]);
  });

  it('an all-filtered raw page still removes the cached rows it covers, and says there is more', () => {
    const next = apply([row(2), row(9)], ['s:2', 's:9'], [], [row(1, { deleted: true }), row(3)]);
    expect(next.messages.map(serverIdOf)).toEqual([9]);
    expect(next.hasMore).toBe(true);
  });

  it('a row without a server id is never removed', () => {
    const unsent = offlineMessage(textMessage('mine', 'peer', 'user', 'me'), {
      localMessageId: 'L1',
      status: 'PENDING',
    });
    const next = apply([row(2), unsent], ['s:2'], [], [row(1, { deleted: true }), row(3)]);
    expect(next.messages).toEqual([unsent]);
  });
});
