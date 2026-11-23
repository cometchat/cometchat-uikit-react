/**
 * Offline ON, opening a chat: the open's own read holds the "fetching older"
 * flag until its server phase settles, as Android's open does. Scrolling up
 * during the server phase must not start a second read on the same request
 * (the SDK refuses it and onError would fire).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';

const managers: Record<string, ReturnType<typeof vi.fn>>[] = [];
let makeManager: () => Record<string, ReturnType<typeof vi.fn>>;

vi.mock('../CometChatMessageListManager', () => ({
  CometChatMessageListManager: vi.fn().mockImplementation(() => {
    const m = makeManager();
    managers.push(m);
    return m;
  }),
}));
vi.mock('../CometChatMessageList.sound', () => ({ playIncomingSound: vi.fn() }));

import { useMessageListInit } from '../useMessageListInit';
import { messageListReducer } from '../CometChatMessageList.reducer';
import {
  initialMessageListState,
  type CometChatMessageListAction,
  type CometChatMessageListState,
  type CometChatUseMessageListOptions,
} from '../CometChatMessageList.types';
import type { MessageListRefs } from '../messageListRefs';
import { OfflineHub } from '../../../utils/offline/hub';
import {
  installOfflineSdk,
  offlineMessage,
  textMessage,
  type OfflineSdkFake,
} from '../../../testing/offline-sdk-fake';

const me = new CometChat.User({ uid: 'me', name: 'me' });
const peer = new CometChat.User({ uid: 'peer', name: 'peer' });

function fromPeer(id: number) {
  return offlineMessage(textMessage(`p${String(id)}`, 'me', 'user', 'peer'), { id, sentAt: id });
}
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => fromPeer(from + i));

interface Handlers {
  onCached: (p: unknown[]) => void;
  onServer: (p: unknown[]) => void;
  onError: (e: unknown, notConnected: boolean) => void;
}

function run(opts: { goToMessageId?: number } = {}) {
  const refs: MessageListRefs = {
    generationRef: { current: 0 },
    managerRef: { current: null },
    isFetchingPrevRef: { current: false },
    isFetchingNextRef: { current: false },
    lastUnreadMarkedIdRef: { current: '' },
    groupRef: { current: undefined },
    stateRef: { current: initialMessageListState },
    optionsRef: { current: { loggedInUser: me } as CometChatUseMessageListOptions },
    initializeRef: { current: null },
    pendingMessagesMap: {},
  };
  const actions: CometChatMessageListAction[] = [];
  let state: CometChatMessageListState = initialMessageListState;
  const dispatch = (action: CometChatMessageListAction) => {
    actions.push(action);
    state = messageListReducer(state, action);
    refs.stateRef.current = state;
  };
  renderHook(() =>
    useMessageListInit(
      {
        user: peer,
        group: undefined,
        loggedInUser: me,
        messagesRequestBuilder: undefined,
        parentMessageId: undefined,
        startFromUnreadMessages: false,
        goToMessageId: opts.goToMessageId,
        messageTypes: ['text'],
        messageCategories: ['message'],
        onError: undefined,
        onActiveChatChanged: undefined,
      } as Parameters<typeof useMessageListInit>[0],
      refs,
      dispatch
    )
  );
  return { refs, actions };
}

describe('offline ON: the open holds the fetching flags while its read is in flight', () => {
  let fake: OfflineSdkFake;
  let previous: ReturnType<typeof vi.fn>;
  let next: ReturnType<typeof vi.fn>;
  let serverPhase: { resolve: () => void };

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    managers.length = 0;
    // The cached page paints, then the server phase waits until the test says.
    previous = vi.fn().mockImplementation((h: Handlers) => {
      h.onCached(range(61, 90));
      return new Promise<void>(resolve => {
        serverPhase = {
          resolve: () => {
            h.onServer(range(61, 90));
            resolve();
          },
        };
      });
    });
    next = vi.fn().mockImplementation((h: Handlers) => {
      h.onCached(range(91, 95));
      h.onServer(range(91, 95));
      return Promise.resolve();
    });
    makeManager = () =>
      ({
        getConversationTwoPhase: vi.fn().mockResolvedValue({
          getLastReadMessageId: () => null,
          getUnreadMessageCount: () => 0,
        }),
        getMessageDetailsTwoPhase: vi.fn().mockResolvedValue(fromPeer(80)),
        fetchPreviousTwoPhase: previous,
        fetchNextTwoPhase: next,
        resetPreviousRequest: vi.fn(),
        initNextRequest: vi.fn(),
        getPageLimit: () => 30,
        markAsDelivered: vi.fn().mockResolvedValue(undefined),
        markConversationAsRead: vi.fn().mockResolvedValue(undefined),
      }) as never;
  });

  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('a plain open keeps the older-read flag set through the server phase, then clears it', async () => {
    const r = run();
    await waitFor(() => {
      expect(previous).toHaveBeenCalledTimes(1);
    });
    // A scroll-up now would see the flag and refuse to start a second read.
    expect(r.refs.isFetchingPrevRef.current).toBe(true);
    serverPhase.resolve();
    await waitFor(() => {
      expect(r.actions.some(a => a.type === 'SET_HAS_REACHED_LATEST')).toBe(true);
    });
    expect(r.refs.isFetchingPrevRef.current).toBe(false);
  });

  it('a failed open read clears the flag too', async () => {
    previous.mockImplementation((h: Handlers) => {
      h.onError(new Error('boom'), false);
      return Promise.resolve();
    });
    const r = run();
    await waitFor(() => {
      expect(r.actions.some(a => a.type === 'OFFLINE_PAGE_ERROR')).toBe(true);
    });
    await waitFor(() => {
      expect(r.refs.isFetchingPrevRef.current).toBe(false);
    });
  });

  it('an open at a message holds both flags while the window around it loads', async () => {
    const r = run({ goToMessageId: 80 });
    await waitFor(() => {
      expect(previous).toHaveBeenCalledTimes(1);
    });
    expect(r.refs.isFetchingPrevRef.current).toBe(true);
    expect(r.refs.isFetchingNextRef.current).toBe(true);
    serverPhase.resolve();
    await waitFor(() => {
      expect(r.actions.some(a => a.type === 'SET_SCROLL_TO_MESSAGE')).toBe(true);
    });
    await waitFor(() => {
      expect(r.refs.isFetchingPrevRef.current).toBe(false);
    });
    expect(r.refs.isFetchingNextRef.current).toBe(false);
  });
});
