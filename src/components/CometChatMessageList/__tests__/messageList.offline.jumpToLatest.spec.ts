/**
 * "Jump to latest" shows the newest window a sweep read — and keeps the
 * messages that arrived while the user stayed on the older page.
 *
 * The window is a snapshot taken when the sweep answered. The list goes on
 * taking live messages behind it, because it has reached the latest, so
 * installing the snapshot alone dropped every peer message and every acked own
 * send from in between until the chat was reopened. Tapping also hands the list
 * a new manager, so an older-page read still running on the old one has to be
 * dropped, or it prepends its page above the new window across a hidden gap.
 *
 * Review: Aanshi D2 on #2460.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { initialMessageListState, messageListReducer } from '../CometChatMessageList.reducer';
import type {
  CometChatMessageListAction,
  CometChatMessageListState,
  CometChatUseMessageListOptions,
} from '../CometChatMessageList.types';
import {
  jumpToLatest,
  readPageOffline,
  refreshNewestWindow,
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

const me = new CometChat.User({ uid: 'me', name: 'me' });
const peer = new CometChat.User({ uid: 'peer', name: 'peer' });

const fromPeer = (id: number, sentAt = id) =>
  offlineMessage(textMessage(`p${String(id)}`, 'me', 'user', 'peer'), { id, sentAt });

const fromMe = (id: number, sentAt = id) =>
  offlineMessage(textMessage(`m${String(id)}`, 'peer', 'user', 'me'), { id, sentAt });

interface PageHandlers {
  onCached: (page: CometChat.BaseMessage[], raw?: CometChat.BaseMessage[]) => void;
  onServer: (page: CometChat.BaseMessage[], raw?: CometChat.BaseMessage[]) => void;
  onError: (error: unknown, notConnected: boolean) => void;
}

function mockManager() {
  return {
    fetchPreviousTwoPhase: vi.fn<(handlers: PageHandlers) => Promise<void>>(),
    fetchNextTwoPhase: vi.fn<(handlers: PageHandlers) => Promise<void>>(),
    markAsRead: vi.fn().mockResolvedValue(undefined),
    markAsDelivered: vi.fn().mockResolvedValue(undefined),
    markConversationAsRead: vi.fn().mockResolvedValue(undefined),
    initNextRequest: vi.fn(),
    resetPreviousRequest: vi.fn(),
    getPageLimit: () => 30,
  };
}
type MockManager = ReturnType<typeof mockManager>;

/** A reducer-backed harness whose `makeManager` hands out a fresh manager each time. */
function harness(initial: Partial<CometChatMessageListState> = {}) {
  let state: CometChatMessageListState = { ...initialMessageListState, ...initial };
  const open = mockManager();
  const made: MockManager[] = [];
  const refs: MessageListRefs = {
    generationRef: { current: 0 },
    managerRef: { current: open as unknown as CometChatMessageListManager },
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
    makeManager: () => {
      const next = mockManager();
      made.push(next);
      return next as unknown as CometChatMessageListManager;
    },
  };
  return {
    ctx,
    refs,
    dispatch,
    open,
    made,
    get state() {
      return state;
    },
  };
}

const idsOf = (rows: CometChat.BaseMessage[]) => rows.map(serverIdOf);

/** The sweep's refresh reads this window; it does not overlap what is shown. */
function windowIs(h: ReturnType<typeof harness>, page: CometChat.BaseMessage[]) {
  const answer = (handlers: PageHandlers) => {
    handlers.onServer(page);
    return Promise.resolve();
  };
  h.ctx.makeManager = () => {
    const next = mockManager();
    next.fetchPreviousTwoPhase.mockImplementation(answer);
    h.made.push(next);
    return next as unknown as CometChatMessageListManager;
  };
}

/** A message the list takes while the user stays on the older page. */
function arrivesLive(h: ReturnType<typeof harness>, message: CometChat.BaseMessage) {
  h.dispatch({
    type: 'MESSAGE_RECEIVED',
    message,
    offline: { swept: false },
    fromLoggedInUser: message.getSender().getUid() === 'me',
  });
}

describe('"Jump to latest" keeps what arrived while it waited', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  /** Reading older messages, the latest reached: the state the offer is made in. */
  const readingOlder = () =>
    harness({
      hasReachedLatest: true,
      isAtBottom: false,
      messages: [fromPeer(10)],
      fetchState: 'loaded',
    });

  it('a peer message and an acked own send from in between are both shown', async () => {
    const h = readingOlder();
    windowIs(h, [fromPeer(50), fromPeer(51)]);
    await refreshNewestWindow(h.ctx);
    expect(h.state.offlineJumpToLatest).toBe(true);

    arrivesLive(h, fromPeer(60));
    arrivesLive(h, fromMe(61));
    jumpToLatest(h.ctx);

    expect(idsOf(h.state.messages)).toEqual([50, 51, 60, 61]);
    expect(h.state.offlineJumpToLatest).toBe(false);
    expect(h.state.hasReachedLatest).toBe(true);
  });

  it('a send still queued is kept, and rows older than the window are not', async () => {
    const queued = offlineMessage(textMessage('mine', 'peer', 'user', 'me'), {
      localMessageId: 'L1',
      status: 'PENDING',
      sentAt: 70,
    });
    const h = readingOlder();
    h.dispatch({ type: 'OFFLINE_UPSERT', messages: [fromPeer(11), queued] });
    windowIs(h, [fromPeer(50)]);
    await refreshNewestWindow(h.ctx);
    jumpToLatest(h.ctx);

    expect(idsOf(h.state.messages)).toEqual([50, 0]);
  });

  it('an older-page read left running on the replaced manager is dropped', async () => {
    const h = readingOlder();
    let answerOlder = (): void => undefined;
    h.open.fetchPreviousTwoPhase.mockImplementation(
      handlers =>
        new Promise<void>(resolve => {
          answerOlder = () => {
            handlers.onServer([fromPeer(8), fromPeer(9)]);
            resolve();
          };
        })
    );
    const older = readPageOffline(
      h.ctx,
      h.refs.managerRef.current as unknown as CometChatMessageListManager,
      'previous',
      h.refs.generationRef.current
    );

    windowIs(h, [fromPeer(50)]);
    await refreshNewestWindow(h.ctx);
    jumpToLatest(h.ctx);
    expect(h.refs.generationRef.current).toBe(1);
    expect(h.refs.managerRef.current).not.toBe(h.open);

    // The read on the old manager answers now, from the old window.
    answerOlder();
    const page = await older;

    expect(page.stale).toBe(true);
    expect(idsOf(h.state.messages)).toEqual([50]);
  });
});
