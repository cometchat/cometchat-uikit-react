/**
 * Offline list rule 9 (message list and threads): an edge that stopped at "Connect to load more"
 * loads its page once, by itself, when the connection returns. It waits for the reads in flight,
 * loads only while the window is unchanged and the edge is still blocked, older first and newer
 * after it settles. Over rows a real error from that kit-started read stays silent.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { messageListReducer } from '../CometChatMessageList.reducer';
import {
  initialMessageListState,
  type CometChatMessageListAction,
  type CometChatMessageListState,
  type CometChatUseMessageListOptions,
} from '../CometChatMessageList.types';
import type { MessageListRefs } from '../messageListRefs';
import type { CometChatMessageListManager } from '../CometChatMessageListManager';
import { useMessageListEvents } from '../useMessageListEvents';
import { useMessageListScroll } from '../useMessageListScroll';
import { OfflineHub } from '../../../utils/offline/hub';
import {
  installOfflineSdk,
  offlineMessage,
  textMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import type { CometChatSDKEvent } from '../../../context/CometChatEvents.types';

vi.mock('../CometChatMessageList.sound', () => ({ playIncomingSound: vi.fn() }));

const me = new CometChat.User({ uid: 'me', name: 'me' });
const peer = new CometChat.User({ uid: 'peer', name: 'peer' });

function fromPeer(id: number) {
  return offlineMessage(textMessage(`p${String(id)}`, 'me', 'user', 'peer'), { id, sentAt: id });
}
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => fromPeer(from + i));

function harness(initial: Partial<CometChatMessageListState>) {
  let state: CometChatMessageListState = { ...initialMessageListState, ...initial };
  const manager = {
    fetchPreviousTwoPhase: vi.fn(),
    fetchNextTwoPhase: vi.fn(),
    resetPreviousRequest: vi.fn(),
    initNextRequest: vi.fn(),
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
    reconnectEdgesRef: { current: null },
    markOlderPrependRef: { current: null },
    pendingMessagesMap: {},
  };
  const dispatch = (action: CometChatMessageListAction) => {
    state = messageListReducer(state, action);
    refs.stateRef.current = state;
  };
  return {
    refs,
    manager,
    dispatch,
    get state() {
      return state;
    },
  };
}

describe('message list: a blocked edge loads by itself on reconnect (D84 rule 9)', () => {
  let fake: OfflineSdkFake;
  const handlers = new Set<(e: CometChatSDKEvent) => void>();
  const onError = vi.fn();

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    handlers.clear();
    onError.mockClear();
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  function mount(h: ReturnType<typeof harness>) {
    const bridge = {
      subscribe: (fn: (e: CometChatSDKEvent) => void) => {
        handlers.add(fn);
        return () => handlers.delete(fn);
      },
      publish: vi.fn(),
    };
    return renderHook(
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
          h.dispatch
        );
        return useMessageListScroll(
          {
            user: peer,
            group: undefined,
            messagesRequestBuilder: undefined,
            parentMessageId: undefined,
            messageTypes: ['text'],
            messageCategories: ['message'],
            onError,
            onConversationMarkedAsRead: undefined,
            isAgentChat: false,
          },
          h.refs,
          h.dispatch
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
  }
  const reconnect = async () => {
    await act(async () => {
      handlers.forEach(fn => {
        fn({ type: 'connection/connected' });
      });
      await Promise.resolve();
    });
  };

  it('the older edge loads its page once, with no tap', async () => {
    const h = harness({ messages: range(31, 60), offlineFooter: 'connect_to_load_more' });
    h.manager.fetchPreviousTwoPhase.mockImplementation(page => {
      page.onCached(range(1, 30));
      page.onServer(range(1, 30));
      return Promise.resolve();
    });
    mount(h);
    await reconnect();
    await vi.waitFor(() => {
      expect(h.manager.fetchPreviousTwoPhase).toHaveBeenCalledTimes(1);
    });
    expect(h.manager.fetchNextTwoPhase).not.toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(h.state.offlineFooter).toBe('none');
    });
    // Loaded: a second reconnect finds nothing blocked and reads nothing more.
    await reconnect();
    expect(h.manager.fetchPreviousTwoPhase).toHaveBeenCalledTimes(1);
  });

  it('both edges load, older first and the newer one after it settles', async () => {
    const h = harness({
      messages: range(31, 60),
      offlineFooter: 'connect_to_load_more',
      offlineNewerFooter: 'connect_to_load_more',
    });
    const order: string[] = [];
    h.manager.fetchPreviousTwoPhase.mockImplementation(page => {
      order.push('older');
      page.onServer(range(1, 30));
      return Promise.resolve();
    });
    h.manager.fetchNextTwoPhase.mockImplementation(page => {
      order.push('newer');
      page.onServer(range(61, 90));
      return Promise.resolve();
    });
    mount(h);
    await reconnect();
    await vi.waitFor(() => {
      expect(order).toEqual(['older', 'newer']);
    });
  });

  it('waits for a read in flight to settle before it loads the edge', async () => {
    const h = harness({ messages: range(31, 60), offlineFooter: 'connect_to_load_more' });
    h.refs.isFetchingPrevRef.current = true;
    h.manager.fetchPreviousTwoPhase.mockImplementation(page => {
      page.onServer(range(1, 30));
      return Promise.resolve();
    });
    mount(h);
    await reconnect();
    await new Promise(resolve => setTimeout(resolve, 120));
    expect(h.manager.fetchPreviousTwoPhase).not.toHaveBeenCalled();
    h.refs.isFetchingPrevRef.current = false;
    await vi.waitFor(() => {
      expect(h.manager.fetchPreviousTwoPhase).toHaveBeenCalledTimes(1);
    });
  });

  it('loads nothing once the window changed (a jump) while it waited', async () => {
    const h = harness({ messages: range(31, 60), offlineFooter: 'connect_to_load_more' });
    h.refs.isFetchingPrevRef.current = true;
    mount(h);
    await reconnect();
    // A jump replaces the window: new generation, footers cleared.
    h.refs.generationRef.current += 1;
    h.dispatch({ type: 'RESET' });
    h.refs.isFetchingPrevRef.current = false;
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(h.manager.fetchPreviousTwoPhase).not.toHaveBeenCalled();
    expect(h.manager.fetchNextTwoPhase).not.toHaveBeenCalled();
  });

  it('loads nothing while a jump is still filling its window', async () => {
    const h = harness({
      messages: range(31, 60),
      offlineFooter: 'connect_to_load_more',
      offlineScrollAnchor: 40,
    });
    mount(h);
    await reconnect();
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(h.manager.fetchPreviousTwoPhase).not.toHaveBeenCalled();
  });

  it('an edge that is not blocked loads nothing', async () => {
    const h = harness({ messages: range(31, 60) });
    mount(h);
    await reconnect();
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(h.manager.fetchPreviousTwoPhase).not.toHaveBeenCalled();
    expect(h.manager.fetchNextTwoPhase).not.toHaveBeenCalled();
  });

  it('the older edge records the prepend bookkeeping before its page lands', async () => {
    // Without it the view never restored the scroll position for this read (only the
    // top sentinel and the scroll retry marked it), so the page the kit read by itself
    // moved the viewport instead of holding the rows the user was reading.
    const h = harness({ messages: range(31, 60), offlineFooter: 'connect_to_load_more' });
    const order: string[] = [];
    h.refs.markOlderPrependRef = {
      current: () => {
        order.push('mark');
      },
    };
    h.manager.fetchPreviousTwoPhase.mockImplementation(page => {
      order.push('read');
      page.onCached(range(1, 30));
      page.onServer(range(1, 30));
      return Promise.resolve();
    });
    mount(h);
    await reconnect();
    await vi.waitFor(() => {
      expect(h.manager.fetchPreviousTwoPhase).toHaveBeenCalledTimes(1);
    });
    expect(order).toEqual(['mark', 'read']);
  });

  it('records nothing when no older edge is blocked: a newer page is appended, not prepended', async () => {
    const h = harness({
      messages: range(31, 60),
      offlineNewerFooter: 'connect_to_load_more',
    });
    const mark = vi.fn();
    h.refs.markOlderPrependRef = { current: mark };
    h.manager.fetchNextTwoPhase.mockImplementation(page => {
      page.onServer(range(61, 90));
      return Promise.resolve();
    });
    mount(h);
    await reconnect();
    await vi.waitFor(() => {
      expect(h.manager.fetchNextTwoPhase).toHaveBeenCalledTimes(1);
    });
    expect(mark).not.toHaveBeenCalled();
  });

  it('a real error from that kit-started read over rows stays silent; a tap on the footer still reports it', async () => {
    const h = harness({ messages: range(31, 60), offlineFooter: 'connect_to_load_more' });
    h.manager.fetchPreviousTwoPhase.mockImplementation(page => {
      page.onError(new Error('boom'), false);
      return Promise.resolve();
    });
    const { result } = mount(h);
    await reconnect();
    await vi.waitFor(() => {
      expect(h.manager.fetchPreviousTwoPhase).toHaveBeenCalledTimes(1);
    });
    expect(onError).not.toHaveBeenCalled();
    // The same read started by the user (a tap on the footer) reports the real error once.
    await act(async () => {
      await result.current.fetchPrevious();
    });
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
