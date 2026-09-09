import { describe, it, expect } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  pinnedMessagesReducer,
  initialPinnedMessagesState,
} from '../CometChatPinnedMessages.reducer';

/** A pinned row whose pin/save attributes behave like the SDK's. */
function msg(
  id: number,
  init: { text?: string; pinnedAt?: number; pinnedBy?: string; savedAt?: number } = {}
): CometChat.BaseMessage {
  const state: { pinnedAt?: number; pinnedBy?: string; savedAt?: number } = {
    pinnedAt: 100,
    pinnedBy: 'admin',
    ...init,
  };
  return {
    getId: () => id,
    getText: () => init.text ?? `msg-${String(id)}`,
    getPinnedAt: () => state.pinnedAt,
    getPinnedBy: () => state.pinnedBy,
    getSavedAt: () => state.savedAt,
    setPinnedAt: (v?: number) => {
      state.pinnedAt = v;
    },
    setPinnedBy: (v?: string) => {
      state.pinnedBy = v;
    },
    setSavedAt: (v?: number) => {
      state.savedAt = v;
    },
    isPinned: () => state.pinnedAt !== undefined,
    isSaved: () => state.savedAt !== undefined,
  } as unknown as CometChat.BaseMessage;
}

function loaded(messages: CometChat.BaseMessage[]) {
  return pinnedMessagesReducer(initialPinnedMessagesState, {
    type: 'FETCH_SUCCESS',
    messages,
    hasMore: false,
  });
}

describe('pinnedMessagesReducer — MESSAGE_UPDATED', () => {
  it('replaces a row in place, keeping its position', () => {
    const state = loaded([msg(1), msg(2), msg(3)]);
    const next = pinnedMessagesReducer(state, {
      type: 'MESSAGE_UPDATED',
      message: msg(2, { text: 'edited' }),
    });
    expect(next.messages.map(m => m.getId())).toEqual([1, 2, 3]);
    expect((next.messages[1] as unknown as { getText: () => string }).getText()).toBe('edited');
  });

  it('ignores an update for a message that is not pinned here', () => {
    // An edit in the conversation at large must not smuggle a row onto the panel.
    const state = loaded([msg(1)]);
    const next = pinnedMessagesReducer(state, { type: 'MESSAGE_UPDATED', message: msg(99) });
    expect(next).toBe(state);
    expect(next.messages).toHaveLength(1);
  });

  it('keeps the row pinned when the edit payload omits pinnedAt', () => {
    // Otherwise an edit would erase the very reason the row is on this panel.
    const state = loaded([msg(1)]);
    const bare = msg(1, { text: 'edited', pinnedAt: undefined, pinnedBy: undefined });
    const next = pinnedMessagesReducer(state, { type: 'MESSAGE_UPDATED', message: bare });
    expect(next.messages[0]!.isPinned()).toBe(true);
    expect(next.messages[0]!.getPinnedBy()).toBe('admin');
  });

  it('keeps the viewer’s save state when the edit payload omits savedAt', () => {
    const state = loaded([msg(1, { savedAt: 555 })]);
    const bare = msg(1, { text: 'edited', savedAt: undefined });
    const next = pinnedMessagesReducer(state, { type: 'MESSAGE_UPDATED', message: bare });
    expect(next.messages[0]!.isSaved()).toBe(true);
  });

  it('does not resurrect pin state the payload deliberately asserts', () => {
    // A payload that carries its own attributes is authoritative.
    const state = loaded([msg(1, { pinnedBy: 'admin' })]);
    const repinned = msg(1, { pinnedAt: 999, pinnedBy: 'moderator-bob' });
    const next = pinnedMessagesReducer(state, { type: 'MESSAGE_UPDATED', message: repinned });
    expect(next.messages[0]!.getPinnedBy()).toBe('moderator-bob');
    expect(next.messages[0]!.getPinnedAt()).toBe(999);
  });

  it('yields a new array so React re-renders', () => {
    const state = loaded([msg(1)]);
    const next = pinnedMessagesReducer(state, {
      type: 'MESSAGE_UPDATED',
      message: msg(1, { text: 'edited' }),
    });
    expect(next.messages).not.toBe(state.messages);
  });
});

describe('pinnedMessagesReducer — realtime refresh paths', () => {
  it('swaps in a new reference on save, so memoized options recompute', () => {
    // The optimistic path mutates the message IN PLACE. Without a fresh object
    // the glyph would update on the next render but the Save/Unsave option —
    // memoized on the message reference — never would.
    const state = loaded([msg(1)]);
    const saved = msg(1, { savedAt: 42 });
    const next = pinnedMessagesReducer(state, { type: 'MESSAGE_UPDATED', message: saved });
    expect(next.messages[0]).not.toBe(state.messages[0]);
    expect(next.messages[0]!.isSaved()).toBe(true);
  });

  it('lets an unsave event actually clear the flag', () => {
    // The carry-forward that protects content updates would otherwise undo this,
    // since it cannot tell "field omitted" from "field cleared" on its own.
    const state = loaded([msg(1, { savedAt: 42 })]);
    const unsaved = msg(1, { savedAt: undefined });
    const next = pinnedMessagesReducer(state, {
      type: 'MESSAGE_UPDATED',
      message: unsaved,
      pinSaveAuthoritative: true,
    });
    expect(next.messages[0]!.isSaved()).toBe(false);
  });

  it('still protects save state on a content update', () => {
    const state = loaded([msg(1, { savedAt: 42 })]);
    const edited = msg(1, { text: 'edited', savedAt: undefined });
    const next = pinnedMessagesReducer(state, { type: 'MESSAGE_UPDATED', message: edited });
    expect(next.messages[0]!.isSaved()).toBe(true);
  });
});

describe('pinnedMessagesReducer — MESSAGE_PINNED respects the error state', () => {
  it('rejects a realtime pin while the list is in the error state', () => {
    const errored = pinnedMessagesReducer(initialPinnedMessagesState, {
      type: 'FETCH_ERROR',
      error: 'offline',
    });
    expect(errored.fetchState).toBe('error');

    const next = pinnedMessagesReducer(errored, { type: 'MESSAGE_PINNED', message: msg(1) });
    expect(next).toBe(errored); // unchanged — no partial one-item list
    expect(next.messages).toHaveLength(0);
    expect(next.fetchState).toBe('error');
  });

  it('appends a realtime pin once the list has loaded', () => {
    const next = pinnedMessagesReducer(loaded([]), { type: 'MESSAGE_PINNED', message: msg(1) });
    expect(next.messages).toHaveLength(1);
    expect(next.fetchState).toBe('loaded');
  });
});
