/**
 * Offline (ON) path regressions from the Nov 4 review:
 *
 * 1. Start from the first unread (and any jump) with offline on ended at the
 *    newest message: the window around the target arrives page by page
 *    (cached first), the first rows looked like an initial load, so the view
 *    scrolled to the bottom, pinned there and loaded newer pages from it before
 *    the target was ever scrolled to. With offline off one FETCH_AROUND_SUCCESS
 *    carries the rows and the target together.
 * 2. Older messages after reconnect (UIK-READ-03 / UIT-READ-03): offline at the
 *    top of the chat, the read stops with "Connect to load older messages";
 *    online again, tapping it OR scrolling loads older. Scrolling did nothing:
 *    the view disabled loading on scroll while the footer showed, and the top
 *    sentinel, already in view, never fires again.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, renderHook } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { messageListReducer } from '../CometChatMessageList.reducer';
import {
  initialMessageListState,
  type CometChatMessageListAction,
  type CometChatMessageListState,
  type CometChatUseMessageListOptions,
} from '../CometChatMessageList.types';
import { fetchAroundOffline, readPageOffline, type OfflineListContext } from '../messageListOffline';
import type { MessageListRefs } from '../messageListRefs';
import type { CometChatMessageListManager } from '../CometChatMessageListManager';
import {
  canLoadOnScroll,
  RETRY_ON_SCROLL_GAP_MS,
  useMessageListViewScroll,
  type UseMessageListViewScrollOptions,
} from '../useMessageListViewScroll';
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
import { useMessageListEvents } from '../useMessageListEvents';

vi.mock('../CometChatMessageList.sound', () => ({ playIncomingSound: vi.fn() }));

const me = new CometChat.User({ uid: 'me', name: 'me' });
const peer = new CometChat.User({ uid: 'peer', name: 'peer' });

function fromPeer(id: number) {
  return offlineMessage(textMessage(`p${String(id)}`, 'me', 'user', 'peer'), { id, sentAt: id });
}
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => fromPeer(from + i));

/** A reducer-backed harness: dispatch runs the real reducer, stateRef follows it. */
function harness(initial: Partial<CometChatMessageListState> = {}) {
  let state: CometChatMessageListState = { ...initialMessageListState, ...initial };
  const actions: CometChatMessageListAction[] = [];
  const manager = {
    fetchPreviousTwoPhase: vi.fn(),
    fetchNextTwoPhase: vi.fn(),
    resetPreviousRequest: vi.fn(),
    initNextRequest: vi.fn(),
    getMessageDetailsTwoPhase: vi.fn().mockResolvedValue(null),
    getPageLimit: () => 30,
    markAsRead: vi.fn().mockResolvedValue(undefined),
    markAsDelivered: vi.fn().mockResolvedValue(undefined),
    markConversationAsRead: vi.fn().mockResolvedValue(undefined),
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

// --- A controllable IntersectionObserver ---------------------------------

interface Observed {
  callback: IntersectionObserverCallback;
  target: Element;
}
let observed: Observed[] = [];
class FakeIntersectionObserver {
  constructor(private readonly cb: IntersectionObserverCallback) {}
  observe(target: Element): void {
    observed.push({ callback: this.cb, target });
  }
  unobserve(): void {
    /* no-op */
  }
  disconnect(): void {
    /* no-op */
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
function intersect(className: string, isIntersecting: boolean): void {
  for (const o of observed.filter(x => (x.target as HTMLElement).className === className)) {
    act(() => {
      o.callback(
        [{ isIntersecting, target: o.target } as unknown as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });
  }
}

type ViewState = UseMessageListViewScrollOptions['state'];

/** The scroll hook on a container with real-looking metrics. */
function ScrollProbe(props: {
  messages: CometChat.BaseMessage[];
  state: Partial<ViewState>;
  hasMore?: boolean;
  hasMoreNewer?: boolean;
  fetchPrevious: () => Promise<void>;
  fetchNext: () => Promise<void>;
  scrollToMessage?: (id: number) => void;
}) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const { topSentinelRef, bottomSentinelRef } = useMessageListViewScroll({
    scrollContainerRef,
    allMessages: props.messages,
    isFetchingMore: false,
    hasMore: props.hasMore ?? true,
    hasMoreNewer: props.hasMoreNewer ?? false,
    state: {
      isAtBottom: true,
      scrollToMessageId: null,
      newMessageCount: 0,
      markedUnreadByUser: false,
      ...props.state,
    },
    fetchPrevious: props.fetchPrevious,
    fetchNext: props.fetchNext,
    setAtBottom: () => undefined,
    markConversationAsReadIfUnread: () => undefined,
    scrollToMessage: props.scrollToMessage ?? (() => undefined),
  });
  return (
    <div
      ref={el => {
        scrollContainerRef.current = el;
        if (el) {
          Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => 3000 });
          Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => 600 });
        }
      }}
      data-testid="container"
    >
      <div ref={topSentinelRef} className="top" />
      <div className="cometchat-message-list__messages">
        {props.messages.map(m => (
          <div key={m.getId()} data-message-id={m.getId()} />
        ))}
      </div>
      <div ref={bottomSentinelRef} className="bottom" />
    </div>
  );
}

const frames = () => new Promise(resolve => setTimeout(resolve, 120));
const scrollIntoView = vi.fn();

describe('start from unread / jump with offline on (issue 2)', () => {
  let fake: OfflineSdkFake;
  const realIO = globalThis.IntersectionObserver;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    observed = [];
    globalThis.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
    scrollIntoView.mockClear();
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(() => {
    globalThis.IntersectionObserver = realIO;
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('the around-read marks its anchor before any row lands, and positioning clears it', async () => {
    const h = harness({ fetchState: 'loading' });
    let anchorWhenFirstRows: number | null | undefined;
    h.manager.fetchPreviousTwoPhase.mockImplementation(handlers => {
      anchorWhenFirstRows = h.state.offlineScrollAnchor;
      handlers.onCached(range(10, 39));
      handlers.onServer(range(10, 39));
      return Promise.resolve();
    });
    h.manager.fetchNextTwoPhase.mockImplementation(handlers => {
      expect(h.state.offlineScrollAnchor).toBe(40);
      handlers.onCached(range(41, 70));
      handlers.onServer(range(41, 70));
      return Promise.resolve();
    });
    h.manager.getMessageDetailsTwoPhase.mockResolvedValue(fromPeer(40));
    const result = await fetchAroundOffline(h.ctx, h.refs.managerRef.current!, 40, 0, false);
    expect(anchorWhenFirstRows).toBe(40);
    expect(result.rows.map(serverIdOf)).toEqual(range(10, 70).map(serverIdOf));
    // Positioned on the target: the anchor is released, newer pages are left.
    expect(h.state.scrollToMessageId).toBe(40);
    expect(h.state.offlineScrollAnchor).toBeNull();
    expect(h.state.hasReachedLatest).toBe(false);
    expect(h.actions.findIndex(a => a.type === 'OFFLINE_AROUND_START')).toBe(0);
  });

  it('reducer: OFFLINE_AROUND_START sets the anchor; SET_SCROLL_TO_MESSAGE(0) keeps it; RESET drops it', () => {
    let s = messageListReducer(initialMessageListState, {
      type: 'OFFLINE_AROUND_START',
      messageId: 40,
    });
    expect(s.offlineScrollAnchor).toBe(40);
    s = messageListReducer(s, { type: 'SET_SCROLL_TO_MESSAGE', messageId: 0 });
    expect(s.offlineScrollAnchor).toBe(40);
    s = messageListReducer(s, { type: 'RESET' });
    expect(s.offlineScrollAnchor).toBeUndefined();
    // Offline off never sets it, so SET_SCROLL_TO_MESSAGE leaves the state shape as today.
    const off = messageListReducer(initialMessageListState, {
      type: 'SET_SCROLL_TO_MESSAGE',
      messageId: 7,
    });
    expect('offlineScrollAnchor' in off).toBe(false);
  });

  it('rows arriving while the anchor is pending do not scroll the list to the bottom', async () => {
    const props = { fetchPrevious: vi.fn(), fetchNext: vi.fn() };
    const { getByTestId, rerender } = render(
      <ScrollProbe {...props} messages={[]} state={{ offlineScrollAnchor: 40 }} />
    );
    // Cached "before" page, then the target, then the "after" page.
    rerender(<ScrollProbe {...props} messages={range(10, 39)} state={{ offlineScrollAnchor: 40 }} />);
    rerender(<ScrollProbe {...props} messages={range(10, 40)} state={{ offlineScrollAnchor: 40 }} />);
    rerender(
      <ScrollProbe
        {...props}
        hasMoreNewer
        messages={range(10, 70)}
        state={{ offlineScrollAnchor: 40 }}
      />
    );
    await act(frames);
    expect(getByTestId('container').scrollTop).toBe(0);
    // The bottom sentinel crossing while the window fills loads nothing newer.
    intersect('bottom', false);
    intersect('bottom', true);
    expect(props.fetchNext).not.toHaveBeenCalled();
    // Positioned: the target is scrolled into view, nothing scrolled to the bottom.
    rerender(
      <ScrollProbe
        {...props}
        hasMoreNewer
        messages={range(10, 70)}
        state={{ offlineScrollAnchor: null, scrollToMessageId: 40 }}
      />
    );
    await act(frames);
    expect(scrollIntoView).toHaveBeenCalled();
    const target = scrollIntoView.mock.contexts[0] as HTMLElement;
    expect(target.getAttribute('data-message-id')).toBe('40');
    expect(getByTestId('container').scrollTop).toBe(0);
  });

  it('control: with no anchor the first rows are an initial load and scroll to the bottom', async () => {
    const props = { fetchPrevious: vi.fn(), fetchNext: vi.fn() };
    const { getByTestId, rerender } = render(<ScrollProbe {...props} messages={[]} state={{}} />);
    rerender(<ScrollProbe {...props} hasMoreNewer messages={range(1, 30)} state={{}} />);
    await act(frames);
    expect(getByTestId('container').scrollTop).toBe(3000);
    intersect('bottom', false);
    intersect('bottom', true);
    expect(props.fetchNext).toHaveBeenCalled();
  });
});

describe('older messages after reconnect (issue 3, UIK-READ-03)', () => {
  let fake: OfflineSdkFake;
  const realIO = globalThis.IntersectionObserver;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    observed = [];
    globalThis.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.IntersectionObserver = realIO;
    fake.restore();
    OfflineHub.resetForTests();
  });

  const footer = (retryable: boolean): Partial<ViewState> => ({
    offlineFooter: 'connect_to_load_more',
    offlineFooterRetryable: retryable,
  });

  it('reducer: a read that stops offline shows the footer, not yet retryable on scroll', () => {
    const s = messageListReducer(
      { ...initialMessageListState, messages: range(31, 60) },
      { type: 'OFFLINE_PAGE_ERROR', direction: 'previous', notConnected: true, error: 'x' }
    );
    expect(s.offlineFooter).toBe('connect_to_load_more');
    expect(s.offlineFooterRetryable).toBe(false);
    // The connection is back: it loads on scroll too.
    const online = messageListReducer(s, { type: 'OFFLINE_CONNECTED' });
    expect(online.offlineFooterRetryable).toBe(true);
    // A list with no footer is untouched by the reconnect.
    expect(messageListReducer(initialMessageListState, { type: 'OFFLINE_CONNECTED' })).toBe(
      initialMessageListState
    );
    // The page then lands: the footer goes.
    const landed = messageListReducer(online, {
      type: 'OFFLINE_SERVER_PAGE',
      direction: 'previous',
      cachedKeys: [],
      messages: range(1, 30),
    });
    expect(landed.offlineFooter).toBe('none');
  });

  it('a read that gave up after the connection came back is retryable at once', async () => {
    const h = harness({ messages: range(31, 60) });
    fake.connected = true;
    h.manager.fetchPreviousTwoPhase.mockImplementation(handlers => {
      handlers.onCached([]);
      handlers.onError({ code: 'FAILED_TO_FETCH' }, true);
      return Promise.resolve();
    });
    await readPageOffline(h.ctx, h.refs.managerRef.current!, 'previous', 0);
    expect(h.state.offlineFooter).toBe('connect_to_load_more');
    expect(h.state.offlineFooterRetryable).toBe(true);
    fake.connected = false;
    await readPageOffline(h.ctx, h.refs.managerRef.current!, 'previous', 0);
    expect(h.state.offlineFooterRetryable).toBe(false);
  });

  it('offline, scrolling at the top does not read; online again, a scroll up there loads older', () => {
    const props = { fetchPrevious: vi.fn().mockResolvedValue(undefined), fetchNext: vi.fn() };
    const { getByTestId, rerender } = render(
      <ScrollProbe {...props} messages={range(31, 60)} state={footer(false)} />
    );
    intersect('top', true); // the user is at the top (first, initial callback)
    const container = getByTestId('container');
    fireEvent.wheel(container, { deltaY: -120 });
    fireEvent.scroll(container);
    expect(props.fetchPrevious).not.toHaveBeenCalled();

    rerender(<ScrollProbe {...props} messages={range(31, 60)} state={footer(true)} />);
    fireEvent.wheel(container, { deltaY: 120 }); // away from the footer
    expect(props.fetchPrevious).not.toHaveBeenCalled();
    fireEvent.keyDown(container, { key: 'a' }); // not a scroll key
    expect(props.fetchPrevious).not.toHaveBeenCalled();
    fireEvent.wheel(container, { deltaY: -120 });
    expect(props.fetchPrevious).toHaveBeenCalledTimes(1);
    // One read per gesture: the rest of the burst is ignored…
    fireEvent.wheel(container, { deltaY: -120 });
    fireEvent.scroll(container);
    expect(props.fetchPrevious).toHaveBeenCalledTimes(1);
    // …and a later gesture tries again (the read may have failed).
    vi.advanceTimersByTime(RETRY_ON_SCROLL_GAP_MS);
    fireEvent.keyDown(container, { key: 'PageUp' });
    expect(props.fetchPrevious).toHaveBeenCalledTimes(2);
  });

  it('a scroll retry at the footer keeps the reading position when the page lands', () => {
    // The retry a scroll gesture starts at "Connect to load older messages" did
    // not mark the prepend restore (only the top sentinel did), so when the
    // older page landed the view jumped to the top of it instead of keeping the
    // rows the user was reading. Review: Prajwal
    // `useMessageListViewScroll.ts:343` on #2460.
    let height = 3000;
    let top = 0;
    function RestoreProbe(props: { messages: CometChat.BaseMessage[]; fetchPrevious: () => Promise<void> }) {
      const scrollContainerRef = React.useRef<HTMLDivElement>(null);
      const { topSentinelRef } = useMessageListViewScroll({
        scrollContainerRef,
        allMessages: props.messages,
        isFetchingMore: false,
        hasMore: true,
        hasMoreNewer: false,
        state: {
          isAtBottom: false,
          scrollToMessageId: null,
          newMessageCount: 0,
          markedUnreadByUser: false,
          ...footer(true),
        },
        fetchPrevious: props.fetchPrevious,
        fetchNext: () => Promise.resolve(),
        setAtBottom: () => undefined,
        markConversationAsReadIfUnread: () => undefined,
        scrollToMessage: () => undefined,
      });
      return (
        <div
          ref={el => {
            scrollContainerRef.current = el;
            if (el) {
              Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => height });
              Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => 600 });
              Object.defineProperty(el, 'scrollTop', {
                configurable: true,
                get: () => top,
                set: (value: number) => {
                  top = value;
                },
              });
            }
          }}
          data-testid="container"
        >
          <div ref={topSentinelRef} className="top" />
          <div className="cometchat-message-list__messages">
            {props.messages.map(m => (
              <div key={m.getId()} data-message-id={m.getId()} />
            ))}
          </div>
        </div>
      );
    }

    const fetchPrevious = vi.fn().mockResolvedValue(undefined);
    const { getByTestId, rerender } = render(
      <RestoreProbe messages={range(31, 60)} fetchPrevious={fetchPrevious} />
    );
    intersect('top', true); // the user sits at the footer
    fireEvent.wheel(getByTestId('container'), { deltaY: -120 });
    expect(fetchPrevious).toHaveBeenCalledTimes(1);

    // The older page lands and the list grows by 1000px above the reader.
    height = 4000;
    rerender(<RestoreProbe messages={range(1, 60)} fetchPrevious={fetchPrevious} />);
    expect(top).toBe(1000);
  });

  it('the reconnect edge load keeps the reading position when its page lands', () => {
    // The kit reads a blocked older edge by itself when the connection returns (D84
    // rule 9): no sentinel fires and the user makes no gesture, so nothing marked the
    // prepend and the page moved the viewport off the rows the user was reading. The
    // read runs in the data hook, which has no scroll container, so it records the
    // bookkeeping through `markOlderPrependRef` (#2460 QA).
    let height = 3000;
    let top = 0;
    const kitPrepend: React.RefObject<(() => void) | null> = { current: null };
    function EdgeProbe(props: { messages: CometChat.BaseMessage[] }) {
      const scrollContainerRef = React.useRef<HTMLDivElement>(null);
      useMessageListViewScroll({
        scrollContainerRef,
        allMessages: props.messages,
        isFetchingMore: false,
        hasMore: true,
        hasMoreNewer: false,
        state: {
          isAtBottom: false,
          scrollToMessageId: null,
          newMessageCount: 0,
          markedUnreadByUser: false,
          ...footer(true),
        },
        fetchPrevious: () => Promise.resolve(),
        fetchNext: () => Promise.resolve(),
        setAtBottom: () => undefined,
        markConversationAsReadIfUnread: () => undefined,
        scrollToMessage: () => undefined,
        markOlderPrependRef: kitPrepend,
      });
      return (
        <div
          ref={el => {
            scrollContainerRef.current = el;
            if (el) {
              Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => height });
              Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => 600 });
              Object.defineProperty(el, 'scrollTop', {
                configurable: true,
                get: () => top,
                set: (value: number) => {
                  top = value;
                },
              });
            }
          }}
          data-testid="container"
        >
          <div className="cometchat-message-list__messages">
            {props.messages.map(m => (
              <div key={m.getId()} data-message-id={m.getId()} />
            ))}
          </div>
        </div>
      );
    }

    const { rerender } = render(<EdgeProbe messages={range(31, 60)} />);
    // What the data hook's reconnect edge load does before it reads the older page.
    // Unwired (the defect) this is null and nothing is recorded.
    act(() => {
      kitPrepend.current?.();
    });

    // The page lands and the list grows by 1000px above the reader.
    height = 4000;
    rerender(<EdgeProbe messages={range(1, 60)} />);
    expect(top).toBe(1000);
  });

  it('the View lets scrolling load past a footer only once it is retryable', () => {
    expect(canLoadOnScroll(true, 'connect_to_load_more', false)).toBe(false);
    expect(canLoadOnScroll(true, 'connect_to_load_more', undefined)).toBe(false);
    expect(canLoadOnScroll(true, 'connect_to_load_more', true)).toBe(true);
    expect(canLoadOnScroll(true, 'none', undefined)).toBe(true);
    expect(canLoadOnScroll(true, undefined, undefined)).toBe(true);
    expect(canLoadOnScroll(false, 'connect_to_load_more', true)).toBe(false);
  });

  it('online again, scrolling down and back up to the top loads older (the observer is live again)', () => {
    const props = { fetchPrevious: vi.fn().mockResolvedValue(undefined), fetchNext: vi.fn() };
    // The View passes hasMore=true once the footer is retryable.
    render(<ScrollProbe {...props} hasMore messages={range(31, 60)} state={footer(true)} />);
    intersect('top', true);
    intersect('top', false);
    intersect('top', true);
    expect(props.fetchPrevious).toHaveBeenCalledTimes(1);
  });

  it('not at the top: a scroll elsewhere does not read older', () => {
    const props = { fetchPrevious: vi.fn().mockResolvedValue(undefined), fetchNext: vi.fn() };
    const { getByTestId } = render(
      <ScrollProbe {...props} messages={range(31, 60)} state={footer(true)} />
    );
    intersect('top', false);
    fireEvent.wheel(getByTestId('container'), { deltaY: -120 });
    expect(props.fetchPrevious).not.toHaveBeenCalled();
  });

  it('the newer footer of a jumped window loads on a scroll down at the bottom', () => {
    const props = { fetchPrevious: vi.fn(), fetchNext: vi.fn().mockResolvedValue(undefined) };
    const { getByTestId } = render(
      <ScrollProbe
        {...props}
        messages={range(31, 60)}
        state={{ offlineNewerFooter: 'connect_to_load_more', offlineFooterRetryable: true }}
      />
    );
    intersect('bottom', true);
    fireEvent.wheel(getByTestId('container'), { deltaY: -120 });
    expect(props.fetchNext).not.toHaveBeenCalled();
    fireEvent.wheel(getByTestId('container'), { deltaY: 120 });
    expect(props.fetchNext).toHaveBeenCalledTimes(1);
  });

  it('connection/connected with offline on marks the footer retryable and fetches nothing', () => {
    const h = harness({ messages: range(31, 60), offlineFooter: 'connect_to_load_more' });
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
          <CometChatEventsContext.Provider value={bridge}>{children}</CometChatEventsContext.Provider>
        ),
      }
    );
    act(() => {
      handlers.forEach(fn => {
        fn({ type: 'connection/connected' });
      });
    });
    expect(h.state.offlineFooterRetryable).toBe(true);
    expect(h.manager.fetchPreviousTwoPhase).not.toHaveBeenCalled();
    expect(h.manager.fetchNext).not.toHaveBeenCalled();
  });
});
