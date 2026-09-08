import { describe, it, expect, vi } from 'vitest';
import { messageListReducer, initialMessageListState } from '../CometChatMessageList.reducer';
import type { CometChatMessageListState } from '../CometChatMessageList.types';
import { buildTextMessage, buildDeletedMessage } from '../../../testing/mock-builders';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

function msg(id: number, sentAt = Date.now()): CometChat.BaseMessage {
  return buildTextMessage({ id, sentAt }) as unknown as CometChat.BaseMessage;
}

/**
 * A message shaped like the SDK's: data as own fields, accessors reading `this`.
 * That shape matters here — cloneMessage copies own properties, so closure-backed
 * fakes would share state between clone and original and hide mutation bugs.
 */
function pinSaveMsg(
  id: number,
  attrs: { pinnedAt?: number; pinnedBy?: string; savedAt?: number } = {}
): CometChat.BaseMessage {
  return {
    id,
    pinnedAt: attrs.pinnedAt,
    pinnedBy: attrs.pinnedBy,
    savedAt: attrs.savedAt,
    getId(this: Record<string, unknown>) {
      return this.id;
    },
    getPinnedAt(this: Record<string, unknown>) {
      return this.pinnedAt;
    },
    setPinnedAt(this: Record<string, unknown>, v: number | undefined) {
      this.pinnedAt = v;
    },
    getPinnedBy(this: Record<string, unknown>) {
      return this.pinnedBy;
    },
    setPinnedBy(this: Record<string, unknown>, v: string | undefined) {
      this.pinnedBy = v;
    },
    getSavedAt(this: Record<string, unknown>) {
      return this.savedAt;
    },
    setSavedAt(this: Record<string, unknown>, v: number | undefined) {
      this.savedAt = v;
    },
  } as unknown as CometChat.BaseMessage;
}

describe('messageListReducer — MESSAGE_PIN_SAVE_UPDATE', () => {
  it('applies pin attributes from the incoming frame', () => {
    const state = { ...initialMessageListState, messages: [pinSaveMsg(1)] };
    const incoming = pinSaveMsg(1, { pinnedAt: 999, pinnedBy: 'admin' });

    const next = messageListReducer(state, {
      type: 'MESSAGE_PIN_SAVE_UPDATE',
      message: incoming,
      scope: 'pin',
    });

    expect(next.messages[0]?.getPinnedAt()).toBe(999);
    expect(next.messages[0]?.getPinnedBy()).toBe('admin');
  });

  it('a PIN broadcast must not wipe the viewer’s own savedAt', () => {
    // pinnedAt/pinnedBy are global; savedAt is per-viewer. A pin broadcast frame
    // is not expected to carry this user's save state, so a wholesale replace
    // would silently drop their saved indicator.
    const state = { ...initialMessageListState, messages: [pinSaveMsg(1, { savedAt: 555 })] };
    const incoming = pinSaveMsg(1, { pinnedAt: 999, pinnedBy: 'admin' }); // no savedAt

    const next = messageListReducer(state, {
      type: 'MESSAGE_PIN_SAVE_UPDATE',
      message: incoming,
      scope: 'pin',
    });

    expect(next.messages[0]?.getSavedAt()).toBe(555);
    expect(next.messages[0]?.getPinnedAt()).toBe(999);
  });

  it('a SAVE event must not clear an existing pin', () => {
    const state = {
      ...initialMessageListState,
      messages: [pinSaveMsg(1, { pinnedAt: 111, pinnedBy: 'admin' })],
    };
    const incoming = pinSaveMsg(1, { savedAt: 777 });

    const next = messageListReducer(state, {
      type: 'MESSAGE_PIN_SAVE_UPDATE',
      message: incoming,
      scope: 'save',
    });

    expect(next.messages[0]?.getSavedAt()).toBe(777);
    expect(next.messages[0]?.getPinnedAt()).toBe(111);
    expect(next.messages[0]?.getPinnedBy()).toBe('admin');
  });

  it('unpin CLEARS the attributes rather than zeroing them', () => {
    const state = {
      ...initialMessageListState,
      messages: [pinSaveMsg(1, { pinnedAt: 111, pinnedBy: 'admin' })],
    };
    const incoming = pinSaveMsg(1); // cleared frame

    const next = messageListReducer(state, {
      type: 'MESSAGE_PIN_SAVE_UPDATE',
      message: incoming,
      scope: 'pin',
    });

    expect(next.messages[0]?.getPinnedAt()).toBeUndefined();
    expect(next.messages[0]?.getPinnedBy()).toBeUndefined();
  });

  it('produces a new message reference so React re-renders', () => {
    const original = pinSaveMsg(1);
    const state = { ...initialMessageListState, messages: [original] };

    const next = messageListReducer(state, {
      type: 'MESSAGE_PIN_SAVE_UPDATE',
      message: pinSaveMsg(1, { pinnedAt: 1 }),
      scope: 'pin',
    });

    expect(next.messages[0]).not.toBe(original);
    expect(next.messages).not.toBe(state.messages);
  });

  it('does not mutate the message still held in the previous state', () => {
    // The optimistic path mutates the live object; the reducer must not compound
    // that by writing through to the old state during reconciliation.
    const original = pinSaveMsg(1);
    const state = { ...initialMessageListState, messages: [original] };

    messageListReducer(state, {
      type: 'MESSAGE_PIN_SAVE_UPDATE',
      message: pinSaveMsg(1, { pinnedAt: 42, pinnedBy: 'admin' }),
      scope: 'pin',
    });

    expect(original.getPinnedAt()).toBeUndefined();
  });

  it('leaves state untouched when the message is not in the loaded window', () => {
    const state = { ...initialMessageListState, messages: [pinSaveMsg(1)] };

    const next = messageListReducer(state, {
      type: 'MESSAGE_PIN_SAVE_UPDATE',
      message: pinSaveMsg(999, { pinnedAt: 1 }),
      scope: 'pin',
    });

    expect(next).toBe(state);
  });

  it('is idempotent — applying the same frame twice changes nothing further', () => {
    const state = { ...initialMessageListState, messages: [pinSaveMsg(1)] };
    const incoming = pinSaveMsg(1, { pinnedAt: 999, pinnedBy: 'admin' });

    const once = messageListReducer(state, {
      type: 'MESSAGE_PIN_SAVE_UPDATE',
      message: incoming,
      scope: 'pin',
    });
    const twice = messageListReducer(once, {
      type: 'MESSAGE_PIN_SAVE_UPDATE',
      message: incoming,
      scope: 'pin',
    });

    expect(twice.messages[0]?.getPinnedAt()).toBe(999);
    expect(twice.messages[0]?.getPinnedBy()).toBe('admin');
  });
});

describe('messageListReducer — MESSAGE_MODERATED preserves the thread-subscription flag', () => {
  const subMsg = (id: number, threadSubscribed: boolean): CometChat.BaseMessage =>
    buildTextMessage({ id, threadSubscribed }) as unknown as CometChat.BaseMessage;

  it('keeps an optimistic subscription when a moderation frame (no flag) replaces the message', () => {
    const state = { ...initialMessageListState, messages: [subMsg(1, true)] };
    // The moderation payload arrives without threadSubscribed (a socket frame does not carry it).
    const moderated = subMsg(1, false);

    const next = messageListReducer(state, { type: 'MESSAGE_MODERATED', message: moderated });

    expect(next.messages[0]?.isThreadSubscribed()).toBe(true);
  });

  it('does not resurrect a deliberate unsubscribe', () => {
    const state = { ...initialMessageListState, messages: [subMsg(1, false)] };
    const moderated = subMsg(1, false);

    const next = messageListReducer(state, { type: 'MESSAGE_MODERATED', message: moderated });

    expect(next.messages[0]?.isThreadSubscribed()).toBe(false);
  });
});

describe('messageListReducer', () => {
  // --- Initial state ---
  it('has correct initial state', () => {
    expect(initialMessageListState.fetchState).toBe('idle');
    expect(initialMessageListState.messages).toEqual([]);
    expect(initialMessageListState.hasMore).toBe(true);
    expect(initialMessageListState.hasMoreNewer).toBe(false);
    expect(initialMessageListState.isAtBottom).toBe(true);
    expect(initialMessageListState.isConversationRead).toBe(false);
  });

  // --- FETCH_PREVIOUS ---
  it('FETCH_PREVIOUS_START sets loading when no messages', () => {
    const state = messageListReducer(initialMessageListState, { type: 'FETCH_PREVIOUS_START' });
    expect(state.fetchState).toBe('loading');
    expect(state.error).toBeNull();
  });

  it('FETCH_PREVIOUS_START sets isFetchingMore when messages exist', () => {
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [msg(1)],
      fetchState: 'loaded',
    };
    const state = messageListReducer(prev, { type: 'FETCH_PREVIOUS_START' });
    expect(state.isFetchingMore).toBe(true);
    expect(state.fetchState).toBe('loaded'); // doesn't change to loading
  });

  it('FETCH_PREVIOUS_SUCCESS prepends messages', () => {
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [msg(3)],
      fetchState: 'loading',
    };
    const state = messageListReducer(prev, {
      type: 'FETCH_PREVIOUS_SUCCESS',
      messages: [msg(2), msg(1)], // SDK returns reverse chronological
      hasMore: true,
    });
    // Messages should be [1, 2, 3] after reversal and prepend
    expect(state.messages).toHaveLength(3);
    expect(state.fetchState).toBe('loaded');
    expect(state.hasMore).toBe(true);
    expect(state.isFetchingMore).toBe(false);
  });

  it('FETCH_PREVIOUS_SUCCESS sets empty when no messages', () => {
    const state = messageListReducer(initialMessageListState, {
      type: 'FETCH_PREVIOUS_SUCCESS',
      messages: [],
      hasMore: false,
    });
    expect(state.fetchState).toBe('empty');
  });

  it('FETCH_PREVIOUS_ERROR sets error state', () => {
    const state = messageListReducer(initialMessageListState, {
      type: 'FETCH_PREVIOUS_ERROR',
      error: 'Network error',
    });
    expect(state.fetchState).toBe('error');
    expect(state.error).toBe('Network error');
  });

  // --- FETCH_NEXT ---
  it('FETCH_NEXT_SUCCESS appends messages', () => {
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [msg(1)],
      fetchState: 'loaded',
    };
    const state = messageListReducer(prev, {
      type: 'FETCH_NEXT_SUCCESS',
      messages: [msg(2), msg(3)],
      hasMoreNewer: true,
    });
    expect(state.messages).toHaveLength(3);
    expect(state.hasMoreNewer).toBe(true);
  });

  // --- FETCH_AROUND ---
  it('FETCH_AROUND_SUCCESS replaces messages and sets scrollToMessageId', () => {
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [msg(99)],
    };
    const state = messageListReducer(prev, {
      type: 'FETCH_AROUND_SUCCESS',
      messages: [msg(10), msg(11), msg(12)],
      targetMessageId: 11,
      hasMore: true,
      hasMoreNewer: true,
    });
    expect(state.messages).toHaveLength(3);
    expect(state.hasMore).toBe(true);
    expect(state.hasMoreNewer).toBe(true);
    expect(state.scrollToMessageId).toBe(11);
    expect(state.hasReachedLatest).toBe(false);
  });

  it('FETCH_AROUND_SUCCESS sets hasReachedLatest true when no newer messages', () => {
    const state = messageListReducer(initialMessageListState, {
      type: 'FETCH_AROUND_SUCCESS',
      messages: [msg(10), msg(11)],
      targetMessageId: 10,
      hasMore: true,
      hasMoreNewer: false,
    });
    expect(state.hasReachedLatest).toBe(true);
  });

  // --- SEND LIFECYCLE ---
  // state.messages from SEND_START onwards; SEND_SUCCESS/ERROR replace by muid.

  it('MESSAGE_SEND_START appends the pending message', () => {
    const pending = buildTextMessage({
      id: 0,
      muid: 'muid-1',
      text: 'hi',
    }) as unknown as CometChat.BaseMessage;
    const state = messageListReducer(initialMessageListState, {
      type: 'MESSAGE_SEND_START',
      muid: 'muid-1',
      message: pending,
    });
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]?.getMuid()).toBe('muid-1');
  });

  it('MESSAGE_SEND_START dedups by muid when dispatched again with the same muid', () => {
    const first = buildTextMessage({
      id: 0,
      muid: 'muid-1',
      text: 'hi',
    }) as unknown as CometChat.BaseMessage;
    const second = buildTextMessage({
      id: 0,
      muid: 'muid-1',
      text: 'updated',
    }) as unknown as CometChat.BaseMessage;
    let state = messageListReducer(initialMessageListState, {
      type: 'MESSAGE_SEND_START',
      muid: 'muid-1',
      message: first,
    });
    state = messageListReducer(state, {
      type: 'MESSAGE_SEND_START',
      muid: 'muid-1',
      message: second,
    });
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toBe(second);
  });

  it('MESSAGE_SEND_SUCCESS replaces the pending message by muid with the confirmed one', () => {
    const pending = buildTextMessage({
      id: 0,
      muid: 'muid-1',
      text: 'hi',
    }) as unknown as CometChat.BaseMessage;
    const confirmed = buildTextMessage({
      id: 100,
      muid: 'muid-1',
      text: 'hi',
    }) as unknown as CometChat.BaseMessage;
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [pending],
    };
    const state = messageListReducer(prev, {
      type: 'MESSAGE_SEND_SUCCESS',
      muid: 'muid-1',
      confirmedMessage: confirmed,
    });
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]?.getId()).toBe(100);
  });

  it('MESSAGE_SEND_ERROR replaces the pending message by muid with the errored copy', () => {
    const pending = buildTextMessage({
      id: 0,
      muid: 'muid-1',
      text: 'hi',
    }) as unknown as CometChat.BaseMessage;
    // Simulate attachErrorToMessage stamping an error on a fresh snapshot.
    const errored = buildTextMessage({
      id: 0,
      muid: 'muid-1',
      text: 'hi',
    }) as unknown as CometChat.BaseMessage;
    (errored as unknown as { error: unknown }).error = { code: 'ERR_PERMISSION_DENIED' };
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [pending],
    };
    const state = messageListReducer(prev, {
      type: 'MESSAGE_SEND_ERROR',
      muid: 'muid-1',
      message: errored,
      error: 'Send failed',
    });
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toBe(errored);
  });

  it('MESSAGE_SEND_ERROR does not append a duplicate already present by id', () => {
    const existing = buildTextMessage({
      id: 5,
      muid: 'muid-a',
      text: 'hi',
    }) as unknown as CometChat.BaseMessage;
    // Same SDK id, but a muid that matches nothing in state — must not be appended.
    const errored = buildTextMessage({
      id: 5,
      muid: 'muid-b',
      text: 'hi',
    }) as unknown as CometChat.BaseMessage;
    (errored as unknown as { error: unknown }).error = { code: 'ERR_PERMISSION_DENIED' };
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [existing],
    };
    const state = messageListReducer(prev, {
      type: 'MESSAGE_SEND_ERROR',
      muid: 'muid-b',
      message: errored,
      error: 'Send failed',
    });
    expect(state).toBe(prev); // unchanged — the append was skipped
    expect(state.messages).toHaveLength(1);
  });

  it('ADD_STREAMING_BUBBLE skips a message already present in state', () => {
    const bubble = buildTextMessage({ id: 7, muid: 'muid-7' }) as unknown as CometChat.BaseMessage;
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [bubble],
    };
    const state = messageListReducer(prev, { type: 'ADD_STREAMING_BUBBLE', message: bubble });
    expect(state).toBe(prev);
    expect(state.messages).toHaveLength(1);
  });

  it('ADD_STREAMING_BUBBLE appends a genuinely new bubble', () => {
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [msg(1)],
    };
    const state = messageListReducer(prev, { type: 'ADD_STREAMING_BUBBLE', message: msg(2) });
    expect(state.messages).toHaveLength(2);
  });

  // --- REAL-TIME ---
  it('MESSAGE_RECEIVED appends new message', () => {
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [msg(1)],
      fetchState: 'loaded',
    };
    const state = messageListReducer(prev, {
      type: 'MESSAGE_RECEIVED',
      message: msg(2),
    });
    expect(state.messages).toHaveLength(2);
  });

  it('MESSAGE_RECEIVED deduplicates existing message', () => {
    const existing = msg(1);
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [existing],
      fetchState: 'loaded',
    };
    const state = messageListReducer(prev, {
      type: 'MESSAGE_RECEIVED',
      message: existing,
    });
    expect(state.messages).toHaveLength(1);
  });

  it('MESSAGE_RECEIVED increments newMessageCount when not at bottom', () => {
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      isAtBottom: false,
      fetchState: 'loaded',
    };
    const state = messageListReducer(prev, {
      type: 'MESSAGE_RECEIVED',
      message: msg(1),
    });
    expect(state.newMessageCount).toBe(1);
  });

  it('MESSAGE_RECEIVED with hasReachedLatest=false only increments count, does NOT append', () => {
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      hasReachedLatest: false,
      messages: [msg(1)],
      fetchState: 'loaded',
    };
    const state = messageListReducer(prev, {
      type: 'MESSAGE_RECEIVED',
      message: msg(2),
    });
    expect(state.messages).toHaveLength(1); // NOT appended
    expect(state.newMessageCount).toBe(1);
  });

  it('MESSAGE_RECEIVED with hasReachedLatest=true appends message normally', () => {
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      hasReachedLatest: true,
      isAtBottom: true,
      messages: [msg(1)],
      fetchState: 'loaded',
    };
    const state = messageListReducer(prev, {
      type: 'MESSAGE_RECEIVED',
      message: msg(2),
    });
    expect(state.messages).toHaveLength(2);
    expect(state.newMessageCount).toBe(0); // at bottom, so count stays 0
  });

  it('MESSAGE_EDITED replaces message in place', () => {
    const original = msg(1);
    const edited = msg(1);
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [original],
    };
    const state = messageListReducer(prev, {
      type: 'MESSAGE_EDITED',
      message: edited,
    });
    expect(state.messages[0]).toBe(edited);
  });

  it('MESSAGE_EDITED updates quoted message references', () => {
    const setQuotedMessage = vi.fn();
    const original = msg(1);
    const quoting = Object.assign(msg(2), {
      getQuotedMessageId: () => 1,
      setQuotedMessage,
    }) as CometChat.BaseMessage;

    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [original, quoting],
    };

    const edited = msg(1);
    const state = messageListReducer(prev, {
      type: 'MESSAGE_EDITED',
      message: edited,
    });

    expect(state.messages[0]).toBe(edited);
    expect(setQuotedMessage).toHaveBeenCalledWith(edited);
  });

  it('MESSAGE_DELETED replaces message (not removes)', () => {
    const original = msg(1);
    const deleted = buildDeletedMessage({ id: 1 }) as unknown as CometChat.BaseMessage;
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [original],
    };
    const state = messageListReducer(prev, {
      type: 'MESSAGE_DELETED',
      message: deleted,
    });
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toBe(deleted);
  });

  // --- RECEIPT_UPDATE ---
  it('RECEIPT_UPDATE batch updates delivered on outgoing messages ≤ target ID', () => {
    const setDeliveredAt1 = vi.fn();
    const setDeliveredAt2 = vi.fn();
    const setDeliveredAt3 = vi.fn();
    const m1 = {
      getId: () => 1,
      getSender: () => ({ getUid: () => 'me' }),
      getDeliveredAt: () => 0,
      getReadAt: () => 0,
      setDeliveredAt: setDeliveredAt1,
      setReadAt: vi.fn(),
    } as any;
    const m2 = {
      getId: () => 2,
      getSender: () => ({ getUid: () => 'me' }),
      getDeliveredAt: () => 0,
      getReadAt: () => 0,
      setDeliveredAt: setDeliveredAt2,
      setReadAt: vi.fn(),
    } as any;
    const m3 = {
      getId: () => 3,
      getSender: () => ({ getUid: () => 'me' }),
      getDeliveredAt: () => 0,
      getReadAt: () => 0,
      setDeliveredAt: setDeliveredAt3,
      setReadAt: vi.fn(),
    } as any;

    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [m1, m2, m3],
    };

    const state = messageListReducer(prev, {
      type: 'RECEIPT_UPDATE',
      receiptType: 'delivered',
      messageId: 2,
      timestamp: 5000,
      loggedInUserId: 'me',
    });

    expect(setDeliveredAt1).toHaveBeenCalledWith(5000);
    expect(setDeliveredAt2).toHaveBeenCalledWith(5000);
    expect(setDeliveredAt3).not.toHaveBeenCalled();
    expect(state.messages).not.toBe(prev.messages);
  });

  it('RECEIPT_UPDATE batch updates read on outgoing messages ≤ target ID', () => {
    const setReadAt = vi.fn();
    const m1 = {
      getId: () => 1,
      getSender: () => ({ getUid: () => 'me' }),
      getDeliveredAt: () => 100,
      getReadAt: () => 0,
      setDeliveredAt: vi.fn(),
      setReadAt,
    } as any;

    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [m1],
    };

    messageListReducer(prev, {
      type: 'RECEIPT_UPDATE',
      receiptType: 'read',
      messageId: 1,
      timestamp: 6000,
      loggedInUserId: 'me',
    });

    expect(setReadAt).toHaveBeenCalledWith(6000);
  });

  it('RECEIPT_UPDATE skips messages > target ID', () => {
    const setDeliveredAt = vi.fn();
    const m1 = {
      getId: () => 5,
      getSender: () => ({ getUid: () => 'me' }),
      getDeliveredAt: () => 0,
      getReadAt: () => 0,
      setDeliveredAt,
      setReadAt: vi.fn(),
    } as any;

    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [m1],
    };

    messageListReducer(prev, {
      type: 'RECEIPT_UPDATE',
      receiptType: 'delivered',
      messageId: 3,
      timestamp: 5000,
      loggedInUserId: 'me',
    });

    expect(setDeliveredAt).not.toHaveBeenCalled();
  });

  it('RECEIPT_UPDATE skips incoming messages', () => {
    const setDeliveredAt = vi.fn();
    const m1 = {
      getId: () => 1,
      getSender: () => ({ getUid: () => 'other-user' }),
      getDeliveredAt: () => 0,
      getReadAt: () => 0,
      setDeliveredAt,
      setReadAt: vi.fn(),
    } as any;

    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [m1],
    };

    messageListReducer(prev, {
      type: 'RECEIPT_UPDATE',
      receiptType: 'delivered',
      messageId: 5,
      timestamp: 5000,
      loggedInUserId: 'me',
    });

    expect(setDeliveredAt).not.toHaveBeenCalled();
  });

  it('RECEIPT_UPDATE returns same state if nothing changed', () => {
    const m1 = {
      getId: () => 1,
      getSender: () => ({ getUid: () => 'me' }),
      getDeliveredAt: () => 500,
      getReadAt: () => 0, // already delivered
      setDeliveredAt: vi.fn(),
      setReadAt: vi.fn(),
    } as any;

    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [m1],
    };

    const state = messageListReducer(prev, {
      type: 'RECEIPT_UPDATE',
      receiptType: 'delivered',
      messageId: 1,
      timestamp: 5000,
      loggedInUserId: 'me',
    });

    expect(state).toBe(prev);
  });

  // --- REACTION_UPDATE ---
  it('REACTION_UPDATE updates reactions on existing message', () => {
    const original = msg(1);
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [original],
    };

    const mockReactions = [
      { getReaction: () => '👍', getCount: () => 1 },
    ] as unknown as CometChat.ReactionCount[];

    const state = messageListReducer(prev, {
      type: 'REACTION_UPDATE',
      messageId: 1,
      reactions: mockReactions,
    });

    // Should be a new reference (cloned), not the original
    expect(state.messages[0]).not.toBe(original);
    expect(state.messages).toHaveLength(1);
  });

  // --- UPDATE_REPLY_COUNT ---
  it('UPDATE_REPLY_COUNT increments replyCount by 1', () => {
    const setReplyCount = vi.fn();
    const parent = {
      getId: () => 10,
      getSender: () => ({ getUid: () => 'user-1' }),
      getReceiverType: () => 'user',
      getReceiverId: () => 'user-2',
      getParentMessageId: () => 0,
      getReplyCount: () => 3,
      getSentAt: () => 1000,
      getDeliveredAt: () => 0,
      getReadAt: () => 0,
      getDeletedAt: () => 0,
      getEditedAt: () => 0,
      getMuid: () => 'muid-10',
      getType: () => 'text',
      getCategory: () => 'message',
      getReactions: () => [],
      getMetadata: () => ({}),
      getMentionedUsers: () => [],
      setReplyCount,
    } as unknown as CometChat.BaseMessage;

    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [parent],
    };

    const state = messageListReducer(prev, {
      type: 'UPDATE_REPLY_COUNT',
      parentMessageId: 10,
    });

    expect(setReplyCount).toHaveBeenCalledWith(4);
    expect(state.messages).not.toBe(prev.messages);
  });

  it('UPDATE_REPLY_COUNT returns same state if parent not found', () => {
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [msg(1)],
    };

    const state = messageListReducer(prev, {
      type: 'UPDATE_REPLY_COUNT',
      parentMessageId: 999,
    });

    expect(state).toBe(prev);
  });

  // --- MESSAGE_MODERATED ---
  it('MESSAGE_MODERATED replaces message in-place like edit', () => {
    const original = msg(1);
    const moderated = msg(1);
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [original, msg(2)],
    };

    const state = messageListReducer(prev, {
      type: 'MESSAGE_MODERATED',
      message: moderated,
    });

    expect(state.messages).toHaveLength(2);
    expect(state.messages[0]).toBe(moderated);
  });

  // --- SET_HAS_REACHED_LATEST ---
  it('SET_HAS_REACHED_LATEST sets the flag', () => {
    const state = messageListReducer(initialMessageListState, {
      type: 'SET_HAS_REACHED_LATEST',
      hasReachedLatest: false,
    });
    expect(state.hasReachedLatest).toBe(false);

    const state2 = messageListReducer(state, {
      type: 'SET_HAS_REACHED_LATEST',
      hasReachedLatest: true,
    });
    expect(state2.hasReachedLatest).toBe(true);
  });

  // --- UPDATE_GROUP_REFERENCE ---
  it('UPDATE_GROUP_REFERENCE returns same state (no-op)', () => {
    const fakeGroup = { getGuid: () => 'g1' } as any;
    const state = messageListReducer(initialMessageListState, {
      type: 'UPDATE_GROUP_REFERENCE',
      group: fakeGroup,
    });
    expect(state).toBe(initialMessageListState);
  });

  // --- SCROLL STATE ---
  it('SET_AT_BOTTOM clears newMessageCount when at bottom', () => {
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      newMessageCount: 5,
      isAtBottom: false,
    };
    const state = messageListReducer(prev, { type: 'SET_AT_BOTTOM', isAtBottom: true });
    expect(state.isAtBottom).toBe(true);
    expect(state.newMessageCount).toBe(0);
  });

  it('SET_SCROLL_TO_MESSAGE sets messageId', () => {
    const state = messageListReducer(initialMessageListState, {
      type: 'SET_SCROLL_TO_MESSAGE',
      messageId: 42,
    });
    expect(state.scrollToMessageId).toBe(42);
  });

  // --- UNREAD TRACKING ---
  it('SET_CONVERSATION_READ marks as read and clears counts', () => {
    const prev: CometChatMessageListState = {
      ...initialMessageListState,
      unreadCount: 5,
      newMessageCount: 3,
    };
    const state = messageListReducer(prev, { type: 'SET_CONVERSATION_READ' });
    expect(state.isConversationRead).toBe(true);
    expect(state.unreadCount).toBe(0);
    expect(state.newMessageCount).toBe(0);
  });

  it('SET_LAST_READ_MESSAGE_ID sets the ID', () => {
    const state = messageListReducer(initialMessageListState, {
      type: 'SET_LAST_READ_MESSAGE_ID',
      messageId: 99,
    });
    expect(state.lastReadMessageId).toBe(99);
  });

  // --- RESET ---
  it('RESET returns initial state', () => {
    const modified: CometChatMessageListState = {
      ...initialMessageListState,
      messages: [msg(1)],
      fetchState: 'loaded',
      hasMore: false,
      error: 'some error',
    };
    const state = messageListReducer(modified, { type: 'RESET' });
    expect(state).toEqual(initialMessageListState);
  });

  // --- Unknown action ---
  it('returns unchanged state for unknown action', () => {
    const state = messageListReducer(initialMessageListState, { type: 'UNKNOWN' } as never);
    expect(state).toBe(initialMessageListState);
  });
});
