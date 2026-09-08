import { describe, it, expect } from 'vitest';
import { savedMessagesReducer, initialSavedMessagesState } from '../CometChatSavedMessages.reducer';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

/** `sentAt` defaults to the id so ordering is obvious at a glance. */
function msg(id: number, sentAt: number = id): CometChat.BaseMessage {
  return { getId: () => id, getSentAt: () => sentAt } as unknown as CometChat.BaseMessage;
}

describe('savedMessagesReducer', () => {
  it('starts idle and empty', () => {
    expect(initialSavedMessagesState.messages).toEqual([]);
    expect(initialSavedMessagesState.fetchState).toBe('idle');
  });

  it('marks the list empty when the first page returns nothing', () => {
    const next = savedMessagesReducer(initialSavedMessagesState, {
      type: 'FETCH_SUCCESS',
      messages: [],
      hasMore: false,
    });
    expect(next.fetchState).toBe('empty');
  });

  it('orders a page by sentAt, newest first', () => {
    const next = savedMessagesReducer(initialSavedMessagesState, {
      type: 'FETCH_SUCCESS',
      messages: [msg(1, 100), msg(2, 300), msg(3, 200)],
      hasMore: false,
    });
    expect(next.messages.map(m => m.getId())).toEqual([2, 3, 1]);
  });

  it('re-sorts across pages — the API paginates by savedAt, not sentAt', () => {
    // A later page can hold a message newer than anything on the first page.
    const first = savedMessagesReducer(initialSavedMessagesState, {
      type: 'FETCH_SUCCESS',
      messages: [msg(1, 100), msg(2, 200)],
      hasMore: true,
    });
    const second = savedMessagesReducer(first, {
      type: 'FETCH_SUCCESS',
      messages: [msg(3, 999)],
      hasMore: false,
    });
    expect(second.messages.map(m => m.getId())).toEqual([3, 2, 1]);
    expect(second.hasMore).toBe(false);
  });

  it('de-duplicates on merge — a socket insert mid-fetch must not double up', () => {
    const state = savedMessagesReducer(initialSavedMessagesState, {
      type: 'MESSAGE_SAVED',
      message: msg(7, 700),
    });
    const merged = savedMessagesReducer(state, {
      type: 'FETCH_SUCCESS',
      messages: [msg(7, 700), msg(8, 800)],
      hasMore: false,
    });
    expect(merged.messages.map(m => m.getId())).toEqual([8, 7]);
  });

  it('places a newly saved message by sentAt, not at the top', () => {
    // Saving an old message must not make it look like the most recent one.
    const state = savedMessagesReducer(initialSavedMessagesState, {
      type: 'FETCH_SUCCESS',
      messages: [msg(1, 500)],
      hasMore: false,
    });
    const next = savedMessagesReducer(state, { type: 'MESSAGE_SAVED', message: msg(2, 100) });
    expect(next.messages.map(m => m.getId())).toEqual([1, 2]);
  });

  it('puts a newly saved recent message at the top', () => {
    const state = savedMessagesReducer(initialSavedMessagesState, {
      type: 'FETCH_SUCCESS',
      messages: [msg(1, 100)],
      hasMore: false,
    });
    const next = savedMessagesReducer(state, { type: 'MESSAGE_SAVED', message: msg(2, 900) });
    expect(next.messages.map(m => m.getId())).toEqual([2, 1]);
  });

  it('keeps equal timestamps in a stable order', () => {
    const next = savedMessagesReducer(initialSavedMessagesState, {
      type: 'FETCH_SUCCESS',
      messages: [msg(5, 100), msg(9, 100), msg(7, 100)],
      hasMore: false,
    });
    expect(next.messages.map(m => m.getId())).toEqual([9, 7, 5]);
  });

  it('does not mutate the previous state’s array while sorting', () => {
    const first = savedMessagesReducer(initialSavedMessagesState, {
      type: 'FETCH_SUCCESS',
      messages: [msg(1, 100), msg(2, 200)],
      hasMore: true,
    });
    const before = [...first.messages];
    savedMessagesReducer(first, {
      type: 'FETCH_SUCCESS',
      messages: [msg(3, 999)],
      hasMore: false,
    });
    expect(first.messages).toEqual(before);
  });

  it('ignores a duplicate save for a message already listed', () => {
    const state = savedMessagesReducer(initialSavedMessagesState, {
      type: 'FETCH_SUCCESS',
      messages: [msg(1)],
      hasMore: false,
    });
    const next = savedMessagesReducer(state, { type: 'MESSAGE_SAVED', message: msg(1) });
    expect(next).toBe(state);
  });

  it('removes a row', () => {
    const state = savedMessagesReducer(initialSavedMessagesState, {
      type: 'FETCH_SUCCESS',
      messages: [msg(1), msg(2)],
      hasMore: false,
    });
    const next = savedMessagesReducer(state, { type: 'REMOVE_MESSAGE', messageId: '1' });
    expect(next.messages.map(m => m.getId())).toEqual([2]);
  });

  it('falls to the empty state in place when the last row goes', () => {
    // The surface must not close itself — it shows "no saved messages yet".
    const state = savedMessagesReducer(initialSavedMessagesState, {
      type: 'FETCH_SUCCESS',
      messages: [msg(1)],
      hasMore: false,
    });
    const next = savedMessagesReducer(state, { type: 'REMOVE_MESSAGE', messageId: '1' });
    expect(next.messages).toEqual([]);
    expect(next.fetchState).toBe('empty');
  });

  it('ignores removal of a message that is not listed', () => {
    const state = savedMessagesReducer(initialSavedMessagesState, {
      type: 'FETCH_SUCCESS',
      messages: [msg(1)],
      hasMore: false,
    });
    const next = savedMessagesReducer(state, { type: 'REMOVE_MESSAGE', messageId: '99' });
    expect(next).toBe(state);
  });

  it('keeps existing rows visible when a later page errors', () => {
    const state = savedMessagesReducer(initialSavedMessagesState, {
      type: 'FETCH_SUCCESS',
      messages: [msg(1)],
      hasMore: true,
    });
    const next = savedMessagesReducer(state, { type: 'FETCH_ERROR', error: 'boom' });
    expect(next.messages).toHaveLength(1);
    expect(next.fetchState).toBe('loaded');
    expect(next.error).toBe('boom');
  });

  it('surfaces the error state only when nothing has loaded', () => {
    const next = savedMessagesReducer(initialSavedMessagesState, {
      type: 'FETCH_ERROR',
      error: 'boom',
    });
    expect(next.fetchState).toBe('error');
  });
});

describe('savedMessagesReducer — MESSAGE_UPDATED', () => {
  /** A saved row carrying pin/save attributes, like the SDK's. */
  function rich(id: number, init: { text?: string; savedAt?: number; pinnedAt?: number } = {}) {
    const state: { savedAt?: number; pinnedAt?: number } = { savedAt: 10, ...init };
    return {
      getId: () => id,
      getSentAt: () => id,
      getText: () => init.text ?? `msg-${String(id)}`,
      getSavedAt: () => state.savedAt,
      getPinnedAt: () => state.pinnedAt,
      getPinnedBy: () => undefined,
      setSavedAt: (v?: number) => {
        state.savedAt = v;
      },
      setPinnedAt: (v?: number) => {
        state.pinnedAt = v;
      },
      setPinnedBy: () => undefined,
      isSaved: () => state.savedAt !== undefined,
      isPinned: () => state.pinnedAt !== undefined,
    } as unknown as CometChat.BaseMessage;
  }

  function loaded(messages: CometChat.BaseMessage[]) {
    return savedMessagesReducer(initialSavedMessagesState, {
      type: 'FETCH_SUCCESS',
      messages,
      hasMore: false,
    });
  }

  it('replaces a row in place — an edit does not change when it was sent', () => {
    const state = loaded([rich(3), rich(2), rich(1)]);
    const next = savedMessagesReducer(state, {
      type: 'MESSAGE_UPDATED',
      message: rich(2, { text: 'edited' }),
    });
    expect(next.messages.map(m => m.getId())).toEqual([3, 2, 1]);
    expect((next.messages[1] as unknown as { getText: () => string }).getText()).toBe('edited');
  });

  it('ignores an update for a message that is not saved', () => {
    const state = loaded([rich(1)]);
    const next = savedMessagesReducer(state, { type: 'MESSAGE_UPDATED', message: rich(99) });
    expect(next).toBe(state);
  });

  it('keeps the row saved when the edit payload omits savedAt', () => {
    const state = loaded([rich(1)]);
    const bare = rich(1, { text: 'edited', savedAt: undefined });
    const next = savedMessagesReducer(state, { type: 'MESSAGE_UPDATED', message: bare });
    expect(next.messages[0]!.isSaved()).toBe(true);
  });
});

describe('savedMessagesReducer — MESSAGE_SAVED respects the error state', () => {
  it('rejects a realtime save while the list is in the error state', () => {
    const errored = savedMessagesReducer(initialSavedMessagesState, {
      type: 'FETCH_ERROR',
      error: 'offline',
    });
    expect(errored.fetchState).toBe('error');

    const next = savedMessagesReducer(errored, { type: 'MESSAGE_SAVED', message: msg(1) });
    expect(next).toBe(errored); // unchanged — no partial one-item list
    expect(next.messages).toHaveLength(0);
    expect(next.fetchState).toBe('error');
  });

  it('appends a realtime save once the list has loaded', () => {
    const empty = savedMessagesReducer(initialSavedMessagesState, {
      type: 'FETCH_SUCCESS',
      messages: [],
      hasMore: false,
    });
    const next = savedMessagesReducer(empty, { type: 'MESSAGE_SAVED', message: msg(1) });
    expect(next.messages).toHaveLength(1);
    expect(next.fetchState).toBe('loaded');
  });
});
