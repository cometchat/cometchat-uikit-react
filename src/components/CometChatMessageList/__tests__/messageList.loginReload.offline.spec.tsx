/**
 * The message list's reload on login (offline ON): it loads the chat it shows
 * for whoever is signed in now, except when that chat is the user who just
 * signed in — a switch from A to B must not load B's chat with themselves
 * (Aanshi Q2 on #2460).
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import type { CometChatEvent } from '../../../context/CometChatEvents.types';
import { useMessageListEvents } from '../useMessageListEvents';
import { offlineStateOf } from '../messageListOffline';
import type { MessageListRefs } from '../messageListRefs';
import {
  initialMessageListState,
  type CometChatMessageListAction,
  type CometChatUseMessageListOptions,
} from '../CometChatMessageList.types';
import { OfflineHub } from '../../../utils/offline/hub';
import { installOfflineSdk, type OfflineSdkFake } from '../../../testing/offline-sdk-fake';

vi.mock('../CometChatMessageList.sound', () => ({ playIncomingSound: vi.fn() }));

const me = new CometChat.User({ uid: 'me', name: 'me' });
const peerB = new CometChat.User({ uid: 'b', name: 'B' });

function makeRefs(): MessageListRefs {
  return {
    generationRef: { current: 0 },
    managerRef: { current: null },
    isFetchingPrevRef: { current: false },
    isFetchingNextRef: { current: false },
    lastUnreadMarkedIdRef: { current: '' },
    groupRef: { current: undefined },
    stateRef: { current: initialMessageListState },
    optionsRef: {
      current: { loggedInUser: me, user: peerB } as CometChatUseMessageListOptions,
    },
    initializeRef: { current: vi.fn() },
    pendingMessagesMap: {},
  };
}

function mount(refs: MessageListRefs) {
  const dispatched: CometChatMessageListAction[] = [];
  const bridge = {
    subscribe: () => () => undefined,
    publish: vi.fn(),
  };
  renderHook(
    () => {
      useMessageListEvents(
        {
          user: peerB,
          group: undefined,
          loggedInUser: me,
          messagesRequestBuilder: undefined,
          parentMessage: undefined,
        } as unknown as Parameters<typeof useMessageListEvents>[0],
        refs,
        a => dispatched.push(a)
      );
    },
    {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <CometChatEventsContext.Provider value={bridge as never}>
          {children}
        </CometChatEventsContext.Provider>
      ),
    }
  );
  // This list took the offline path, which is what cleared it on session end.
  offlineStateOf(refs).used = true;
  return { dispatched };
}

describe('message list reload on login (offline ON)', () => {
  let fake: OfflineSdkFake | null = null;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
  });

  afterEach(() => {
    fake?.restore();
    fake = null;
    OfflineHub.resetForTests();
    vi.restoreAllMocks();
  });

  it('stays cleared when the chat it shows is the user who just signed in', async () => {
    const refs = makeRefs();
    const { dispatched } = mount(refs);
    const hub = OfflineHub.getInstance();
    // A was signed in; now B is, and the list is still pointed at B.
    hub.onLogin(new CometChat.User({ uid: 'a', name: 'A' }));
    act(() => {
      hub.onLogin(peerB);
    });
    await waitFor(() => {
      expect(hub.signedInUid).toBe('b');
    });
    // One RESET only: the one `session` dispatched when A's session ended. The
    // login did not add a second one, and nothing was re-fetched.
    expect(dispatched.filter(a => a.type === 'RESET')).toHaveLength(1);
    expect(refs.initializeRef.current).not.toHaveBeenCalled();
  });

  it('loads the chat for another user who signs in', async () => {
    const refs = makeRefs();
    const { dispatched } = mount(refs);
    const hub = OfflineHub.getInstance();
    hub.onLogin(new CometChat.User({ uid: 'a', name: 'A' }));
    act(() => {
      hub.onLogin(new CometChat.User({ uid: 'c', name: 'C' }));
    });
    await waitFor(() => {
      expect(refs.initializeRef.current).toHaveBeenCalled();
    });
    // The session end cleared it, and the login reload cleared it again before
    // loading C's copy of the chat.
    expect(dispatched.filter(a => a.type === 'RESET')).toHaveLength(2);
  });
});
