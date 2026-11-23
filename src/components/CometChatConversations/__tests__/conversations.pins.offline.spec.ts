/**
 * Pin events on the offline (ON) path (UIK-CONV-01, UIT-CONV-05): matched by
 * (type, with) case-insensitive, a 1:1 event whose peer is the user ignored, a
 * chat not on screen fetched and inserted (ignored when the fetch fails),
 * filtered lists only update rows they show, an unpin of a chat not shown
 * changes nothing. With offline off the events hook keeps today's
 * CONVERSATION_PIN_CHANGED.
 */
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import type { CometChatEvent } from '../../../context/CometChatEvents.types';
import { useCometChatConversationsEvents } from '../useCometChatConversationsEvents';
import { conversationsReducer, initialConversationsState } from '../CometChatConversations.reducer';
import {
  applyRemotePinEvent,
  pinKeyOf,
  samePinKey,
  type RemotePinEventDeps,
} from '../conversationsOffline';
import { installOfflineSdk, type OfflineSdkFake } from '../../../testing/offline-sdk-fake';

type Pin = 'user' | 'none';

/** A conversation with mutable pin attributes, like the SDK's. */
function conv(
  id: string,
  options: { type?: 'user' | 'group'; with?: string; pin?: Pin; sentAt?: number } = {}
): CometChat.Conversation {
  const type = options.type ?? 'user';
  const peer = options.with ?? id;
  const state: { pinnedAt?: number; pinnedBy?: string } = {
    pinnedAt: options.pin === 'user' ? 100 : undefined,
    pinnedBy: options.pin === 'user' ? 'other-device' : undefined,
  };
  return {
    getConversationId: () => id,
    getConversationType: () => type,
    getConversationWith: () =>
      type === 'group' ? { getGuid: () => peer } : { getUid: () => peer },
    getLastMessage: () => ({ getSentAt: () => options.sentAt ?? 0 }),
    getUnreadMessageCount: () => 0,
    setUnreadMessageCount: () => undefined,
    setConversationWith: () => undefined,
    setLastMessage: () => undefined,
    getPinnedAt: () => state.pinnedAt,
    getPinnedBy: () => state.pinnedBy,
    setPinnedAt: (v?: number) => {
      state.pinnedAt = v;
    },
    setPinnedBy: (v?: string) => {
      state.pinnedBy = v;
    },
    isPinned: () => state.pinnedAt !== undefined,
    isSystemPinned: () => false,
  } as unknown as CometChat.Conversation;
}

const ids = (list: readonly CometChat.Conversation[]) => list.map(c => c.getConversationId());

function harness(rows: CometChat.Conversation[], overrides: Partial<RemotePinEventDeps> = {}) {
  let list = rows;
  let gen = 1;
  const deps: RemotePinEventDeps = {
    list: () => list,
    loggedInUid: 'Me',
    filtered: false,
    updateRow: vi.fn(),
    insertRow: vi.fn(),
    fetch: vi.fn(),
    gen: () => gen,
    onFetchError: vi.fn(),
    ...overrides,
  };
  return {
    deps,
    setList: (next: CometChat.Conversation[]) => {
      list = next;
    },
    bumpGen: () => {
      gen += 1;
    },
  };
}

describe('pin key', () => {
  it('is (type, with) lower-cased; user uid or group guid', () => {
    expect(pinKeyOf(conv('a', { with: 'Sam' }))).toEqual({ type: 'user', with: 'sam' });
    expect(pinKeyOf(conv('g', { type: 'group', with: 'Team-1' }))).toEqual({
      type: 'group',
      with: 'team-1',
    });
    expect(samePinKey(pinKeyOf(conv('x', { with: 'SAM' })), pinKeyOf(conv('y', { with: 'sam' })))).toBe(
      true
    );
    expect(
      samePinKey(
        pinKeyOf(conv('x', { with: 'sam' })),
        pinKeyOf(conv('y', { type: 'group', with: 'sam' }))
      )
    ).toBe(false);
  });
});

describe('applyRemotePinEvent (UIK-CONV-01)', () => {
  it('matches the listed row by (type, with), case-insensitive, whatever its conversation id', async () => {
    const listed = conv('alex_user_sam', { with: 'sam' });
    const { deps } = harness([conv('other'), listed]);
    // The event's copy names the chat with different casing and another id form.
    const event = conv('ALEX_USER_SAM', { with: 'SAM', pin: 'user' });
    await applyRemotePinEvent(event, true, deps);
    expect(deps.updateRow).toHaveBeenCalledWith('alex_user_sam', event);
    expect(deps.fetch).not.toHaveBeenCalled();
  });

  it('ignores a 1:1 event whose peer is the logged-in user', async () => {
    const { deps } = harness([conv('me', { with: 'me' })]);
    await applyRemotePinEvent(conv('x', { with: 'ME', pin: 'user' }), true, deps);
    expect(deps.updateRow).not.toHaveBeenCalled();
    expect(deps.fetch).not.toHaveBeenCalled();
    expect(deps.insertRow).not.toHaveBeenCalled();
  });

  it('a group whose guid equals the user uid is not the own-peer case', async () => {
    const group = conv('group_me', { type: 'group', with: 'me' });
    const { deps } = harness([group]);
    await applyRemotePinEvent(conv('e', { type: 'group', with: 'me', pin: 'user' }), true, deps);
    expect(deps.updateRow).toHaveBeenCalledWith('group_me', expect.anything());
  });

  it('a pin of a chat not on screen fetches it and inserts it', async () => {
    const fetched = conv('alex_user_bea', { with: 'bea', pin: 'user' });
    const { deps } = harness([conv('other')], { fetch: vi.fn().mockResolvedValue(fetched) });
    await applyRemotePinEvent(conv('evt', { with: 'Bea', pin: 'user' }), true, deps);
    expect(deps.fetch).toHaveBeenCalledWith('bea', 'user');
    expect(deps.insertRow).toHaveBeenCalledWith(fetched);
  });

  it('a failed fetch is ignored (nothing inserted, never throws)', async () => {
    const { deps } = harness([conv('other')], {
      fetch: vi.fn().mockRejectedValue({ code: 'ERR_NOT_CONNECTED' }),
    });
    await expect(
      applyRemotePinEvent(conv('evt', { with: 'bea', pin: 'user' }), true, deps)
    ).resolves.toBeUndefined();
    expect(deps.insertRow).not.toHaveBeenCalled();
    expect(deps.onFetchError).toHaveBeenCalled();
  });

  it('a fetch that outlives its session is dropped', async () => {
    let resolveFetch: (c: CometChat.Conversation) => void = () => undefined;
    const h = harness([conv('other')], {
      fetch: vi.fn(
        () =>
          new Promise<CometChat.Conversation>(resolve => {
            resolveFetch = resolve;
          })
      ),
    });
    const done = applyRemotePinEvent(conv('evt', { with: 'bea', pin: 'user' }), true, h.deps);
    h.bumpGen();
    resolveFetch(conv('alex_user_bea', { with: 'bea', pin: 'user' }));
    await done;
    expect(h.deps.insertRow).not.toHaveBeenCalled();
  });

  it('a chat that appeared while fetching is updated, not inserted twice', async () => {
    let resolveFetch: (c: CometChat.Conversation) => void = () => undefined;
    const h = harness([conv('other')], {
      fetch: vi.fn(
        () =>
          new Promise<CometChat.Conversation>(resolve => {
            resolveFetch = resolve;
          })
      ),
    });
    const done = applyRemotePinEvent(conv('evt', { with: 'bea', pin: 'user' }), true, h.deps);
    h.setList([conv('alex_user_bea', { with: 'bea' }), conv('other')]);
    const fetched = conv('alex_user_bea', { with: 'bea', pin: 'user' });
    resolveFetch(fetched);
    await done;
    expect(h.deps.insertRow).not.toHaveBeenCalled();
    expect(h.deps.updateRow).toHaveBeenCalledWith('alex_user_bea', fetched);
  });

  it('a filtered list only updates rows it shows', async () => {
    const shown = conv('alex_user_sam', { with: 'sam' });
    const { deps } = harness([shown], { filtered: true });
    await applyRemotePinEvent(conv('e1', { with: 'sam', pin: 'user' }), true, deps);
    expect(deps.updateRow).toHaveBeenCalledTimes(1);
    await applyRemotePinEvent(conv('e2', { with: 'bea', pin: 'user' }), true, deps);
    expect(deps.fetch).not.toHaveBeenCalled();
    expect(deps.insertRow).not.toHaveBeenCalled();
  });

  it('an unpin of a chat not shown changes nothing', async () => {
    const { deps } = harness([conv('other')]);
    await applyRemotePinEvent(conv('e', { with: 'bea' }), false, deps);
    expect(deps.fetch).not.toHaveBeenCalled();
    expect(deps.insertRow).not.toHaveBeenCalled();
    expect(deps.updateRow).not.toHaveBeenCalled();
  });
});

describe('reducer: OFFLINE_PIN_EVENT / OFFLINE_PIN_INSERT', () => {
  function loaded(conversations: CometChat.Conversation[]) {
    return conversationsReducer(initialConversationsState, {
      type: 'FETCH_SUCCESS',
      conversations,
      hasMore: false,
    });
  }

  it('moves the pin attributes onto the row matched by id and floats it into the pinned band', () => {
    const state = loaded([conv('a', { sentAt: 3 }), conv('b', { sentAt: 2 }), conv('c', { sentAt: 1 })]);
    const next = conversationsReducer(state, {
      type: 'OFFLINE_PIN_EVENT',
      targetId: 'c',
      conversation: conv('C-EVENT', { with: 'c', pin: 'user' }),
    });
    expect(ids(next.conversations)).toEqual(['c', 'a', 'b']);
    expect(next.conversations[0]?.getPinnedAt()).toBe(100);
  });

  it('a target no longer listed changes nothing', () => {
    const state = loaded([conv('a')]);
    const next = conversationsReducer(state, {
      type: 'OFFLINE_PIN_EVENT',
      targetId: 'gone',
      conversation: conv('gone', { pin: 'user' }),
    });
    expect(next).toBe(state);
  });

  it('inserts a fetched pinned chat at the top of the pinned band, once', () => {
    const state = loaded([conv('a', { sentAt: 2 }), conv('b', { sentAt: 1 })]);
    const fetched = conv('new', { pin: 'user', sentAt: 0 });
    const next = conversationsReducer(state, { type: 'OFFLINE_PIN_INSERT', conversation: fetched });
    expect(ids(next.conversations)).toEqual(['new', 'a', 'b']);
    const again = conversationsReducer(next, { type: 'OFFLINE_PIN_INSERT', conversation: fetched });
    expect(again).toBe(next);
  });
});

describe('events hook: the gate decides the path, per event', () => {
  let fake: OfflineSdkFake | null = null;

  afterEach(() => {
    fake?.restore();
    fake = null;
    Reflect.deleteProperty(CometChat, 'isOfflineEnabled');
  });

  function mount() {
    const handlers: ((event: CometChatEvent) => void)[] = [];
    const value = {
      subscribe: (handler: (event: CometChatEvent) => void) => {
        handlers.push(handler);
        return () => undefined;
      },
      publish: () => undefined,
    };
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(CometChatEventsContext.Provider, { value }, children);
    const dispatch = vi.fn();
    const onRemotePinEvent = vi.fn();
    renderHook(
      () =>
        useCometChatConversationsEvents({
          dispatch,
          conversationsRef: { current: [] },
          loggedInUserId: 'me',
          onRemotePinEvent,
        }),
      { wrapper }
    );
    const emit = (event: CometChatEvent) => {
      for (const h of handlers) h(event);
    };
    return { dispatch, onRemotePinEvent, emit };
  }

  it('offline off: a remote pin keeps today\'s CONVERSATION_PIN_CHANGED', () => {
    const { dispatch, onRemotePinEvent, emit } = mount();
    const c = conv('a', { pin: 'user' });
    emit({ type: 'conversation/pinned', conversation: c });
    expect(dispatch).toHaveBeenCalledWith({ type: 'CONVERSATION_PIN_CHANGED', conversation: c });
    expect(onRemotePinEvent).not.toHaveBeenCalled();
  });

  it('offline on: remote pin and unpin go to the (type, with) handler; own pins stay on onSuccess', () => {
    // Through the fake, which also carries the kit's SDK floor probe: a bare
    // `isOfflineEnabled` leaves the test failing on an SDK below 4.3.1.
    fake = installOfflineSdk();
    const { dispatch, onRemotePinEvent, emit } = mount();
    const c = conv('a', { pin: 'user' });
    emit({ type: 'conversation/pinned', conversation: c });
    emit({ type: 'conversation/unpinned', conversation: c });
    expect(onRemotePinEvent.mock.calls).toEqual([
      [c, true],
      [c, false],
    ]);
    expect(dispatch).not.toHaveBeenCalled();
    // The own action's success event is applied as today.
    emit({ type: 'ui:conversation/pin-changed', conversation: c, pinned: true });
    expect(dispatch).toHaveBeenCalledWith({ type: 'CONVERSATION_PIN_CHANGED', conversation: c });
  });
});
