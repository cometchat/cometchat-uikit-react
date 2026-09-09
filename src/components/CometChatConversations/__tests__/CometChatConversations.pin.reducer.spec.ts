import { describe, it, expect } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { conversationsReducer, initialConversationsState } from '../CometChatConversations.reducer';

type Pin = 'global' | 'user' | 'none';

/** A conversation carrying mutable pin attributes, like the SDK's. */
function conv(id: string, pin: Pin = 'none', sentAt = 0, unread = 0): CometChat.Conversation {
  const state: { pinnedAt?: number; pinnedBy?: string } = {
    pinnedAt: pin === 'none' ? undefined : 100,
    pinnedBy: pin === 'global' ? 'app_system' : pin === 'user' ? 'me' : undefined,
  };
  const self = {
    getConversationId: () => id,
    getConversationType: () => 'user',
    getConversationWith: () => ({ getUid: () => id }),
    getLastMessage: () => ({ getSentAt: () => sentAt }),
    getUnreadMessageCount: () => unread,
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
    isSystemPinned: () => state.pinnedBy === 'app_system',
  };
  return self as unknown as CometChat.Conversation;
}

const ids = (list: CometChat.Conversation[]) => list.map(c => c.getConversationId());

function loaded(conversations: CometChat.Conversation[]) {
  return conversationsReducer(initialConversationsState, {
    type: 'FETCH_SUCCESS',
    conversations,
    hasMore: false,
  });
}

describe('conversationsReducer — pin tiers on realtime paths', () => {
  it('MOVE_TO_TOP keeps an unpinned chat below the pinned block', () => {
    const state = loaded([conv('g1', 'global'), conv('u1', 'user'), conv('n1'), conv('n2')]);
    const next = conversationsReducer(state, { type: 'MOVE_TO_TOP', conversation: conv('n2') });
    expect(ids(next.conversations)).toEqual(['g1', 'u1', 'n2', 'n1']);
  });

  it('ADD_CONVERSATION lands a first-ever message below every pin', () => {
    const state = loaded([conv('g1', 'global'), conv('u1', 'user'), conv('n1')]);
    const next = conversationsReducer(state, {
      type: 'ADD_CONVERSATION',
      conversation: conv('new'),
    });
    expect(ids(next.conversations)).toEqual(['g1', 'u1', 'new', 'n1']);
  });

  it('still prepends when nothing is pinned', () => {
    const state = loaded([conv('a'), conv('b')]);
    const next = conversationsReducer(state, { type: 'MOVE_TO_TOP', conversation: conv('b') });
    expect(ids(next.conversations)).toEqual(['b', 'a']);
  });

  it('FETCH_SUCCESS re-asserts bands across a merge', () => {
    const first = loaded([conv('n1'), conv('n2')]);
    const second = conversationsReducer(first, {
      type: 'FETCH_SUCCESS',
      conversations: [conv('g1', 'global'), conv('n3')],
      hasMore: false,
    });
    expect(ids(second.conversations)).toEqual(['g1', 'n1', 'n2', 'n3']);
  });
});

describe('conversationsReducer — CONVERSATION_PIN_CHANGED', () => {
  it('moves a newly pinned conversation into the pinned band', () => {
    const state = loaded([conv('u1', 'user'), conv('n1', 'none', 500), conv('n2', 'none', 400)]);
    const next = conversationsReducer(state, {
      type: 'CONVERSATION_PIN_CHANGED',
      conversation: conv('n2', 'user'),
    });
    expect(ids(next.conversations)).toEqual(['n2', 'u1', 'n1']);
  });

  it('drops an unpinned conversation back in by last activity, not to the top', () => {
    const state = loaded([
      conv('u1', 'user', 300),
      conv('n1', 'none', 900),
      conv('n2', 'none', 100),
    ]);
    const next = conversationsReducer(state, {
      type: 'CONVERSATION_PIN_CHANGED',
      conversation: conv('u1', 'none', 300),
    });
    expect(ids(next.conversations)).toEqual(['n1', 'u1', 'n2']);
  });

  it('ignores a conversation that is not on this page', () => {
    // Inserting would surface a chat the user has not scrolled to.
    const state = loaded([conv('a'), conv('b')]);
    const next = conversationsReducer(state, {
      type: 'CONVERSATION_PIN_CHANGED',
      conversation: conv('elsewhere', 'user'),
    });
    expect(next).toBe(state);
  });

  it('keeps the listed row’s unread count rather than taking the payload’s', () => {
    // The event payload is server-built and may not carry what this row shows.
    const state = loaded([conv('a', 'none', 0, 7), conv('b')]);
    const next = conversationsReducer(state, {
      type: 'CONVERSATION_PIN_CHANGED',
      conversation: conv('a', 'user', 0, 0),
    });
    const moved = next.conversations.find(c => c.getConversationId() === 'a');
    expect(moved?.getUnreadMessageCount()).toBe(7);
    expect(moved?.isPinned()).toBe(true);
  });

  it('is idempotent — the same event twice does not duplicate the row', () => {
    const state = loaded([conv('a'), conv('b')]);
    const once = conversationsReducer(state, {
      type: 'CONVERSATION_PIN_CHANGED',
      conversation: conv('a', 'user'),
    });
    const twice = conversationsReducer(once, {
      type: 'CONVERSATION_PIN_CHANGED',
      conversation: conv('a', 'user'),
    });
    expect(ids(twice.conversations)).toEqual(['a', 'b']);
  });
});

describe('conversationsReducer — a realtime message must not unpin', () => {
  /** What `getConversationFromMessage` yields: no conversation-level pin state. */
  function fromMessage(id: string): CometChat.Conversation {
    return {
      getConversationId: () => id,
      getConversationType: () => 'user',
      getConversationWith: () => ({ getUid: () => id }),
      getLastMessage: () => ({ getSentAt: () => 999 }),
      getUnreadMessageCount: () => 0,
      setUnreadMessageCount: () => undefined,
      getPinnedAt: () => undefined,
      getPinnedBy: () => undefined,
      setPinnedAt: () => undefined,
      setPinnedBy: () => undefined,
      isPinned: () => false,
      isSystemPinned: () => false,
    } as unknown as CometChat.Conversation;
  }

  /** As above, but with working setters so the carry-forward can land. */
  function fromMessageMutable(id: string): CometChat.Conversation {
    const state: { pinnedAt?: number; pinnedBy?: string } = {};
    return {
      getConversationId: () => id,
      getConversationType: () => 'user',
      getConversationWith: () => ({ getUid: () => id }),
      getLastMessage: () => ({ getSentAt: () => 999 }),
      getUnreadMessageCount: () => 0,
      setUnreadMessageCount: () => undefined,
      getPinnedAt: () => state.pinnedAt,
      getPinnedBy: () => state.pinnedBy,
      setPinnedAt: (v?: number) => {
        state.pinnedAt = v;
      },
      setPinnedBy: (v?: string) => {
        state.pinnedBy = v;
      },
      isPinned: () => state.pinnedAt !== undefined,
      isSystemPinned: () => state.pinnedBy === 'app_system',
    } as unknown as CometChat.Conversation;
  }

  it('keeps a user-pinned conversation in its tier when a message arrives', () => {
    // The incoming conversation is rebuilt from the message and knows nothing
    // about pinning; the listed row is the authority.
    const state = loaded([conv('u1', 'user'), conv('n1', 'none', 500)]);
    const next = conversationsReducer(state, {
      type: 'MOVE_TO_TOP',
      conversation: fromMessageMutable('u1'),
    });
    expect(ids(next.conversations)).toEqual(['u1', 'n1']);
    expect(next.conversations[0]!.isPinned()).toBe(true);
  });

  it('keeps an admin-global pin in the top tier when a message arrives', () => {
    const state = loaded([conv('g1', 'global'), conv('u1', 'user'), conv('n1')]);
    const next = conversationsReducer(state, {
      type: 'MOVE_TO_TOP',
      conversation: fromMessageMutable('g1'),
    });
    expect(ids(next.conversations)).toEqual(['g1', 'u1', 'n1']);
  });

  it('still moves an unpinned conversation to the top of the normal tier', () => {
    const state = loaded([conv('u1', 'user'), conv('n1'), conv('n2')]);
    const next = conversationsReducer(state, {
      type: 'MOVE_TO_TOP',
      conversation: fromMessageMutable('n2'),
    });
    expect(ids(next.conversations)).toEqual(['u1', 'n2', 'n1']);
  });

  it('degrades safely when the payload has no pin setters', () => {
    // Nothing to carry onto — the row must not vanish or throw.
    const state = loaded([conv('u1', 'user'), conv('n1')]);
    const next = conversationsReducer(state, {
      type: 'MOVE_TO_TOP',
      conversation: fromMessage('u1'),
    });
    expect(ids(next.conversations)).toHaveLength(2);
  });
});

describe('conversationsReducer — pinned rows hold their position', () => {
  it('does not promote the 2nd pinned conversation when a message arrives', () => {
    const state = loaded([conv('u1', 'user'), conv('u2', 'user'), conv('n1')]);
    const next = conversationsReducer(state, {
      type: 'MOVE_TO_TOP',
      conversation: conv('u2', 'user'),
    });
    expect(ids(next.conversations)).toEqual(['u1', 'u2', 'n1']);
  });

  it('does not promote a pinned conversation on a last-message update', () => {
    const state = loaded([conv('u1', 'user'), conv('u2', 'user', 100), conv('n1')]);
    const next = conversationsReducer(state, {
      type: 'UPDATE_LAST_MESSAGE_AND_PLACE_AT_TOP',
      message: {
        getConversationId: () => 'u2',
        getSentAt: () => 999,
        getCategory: () => 'message',
        getType: () => 'text',
      } as unknown as CometChat.BaseMessage,
      group: {} as unknown as CometChat.Group,
    });
    // Either the guard rejected the message or it was applied in place — never a
    // reorder of the pinned block.
    expect(ids(next.conversations)).toEqual(['u1', 'u2', 'n1']);
  });

  it('still promotes an unpinned conversation to the top of its band', () => {
    const state = loaded([conv('u1', 'user'), conv('n1'), conv('n2')]);
    const next = conversationsReducer(state, { type: 'MOVE_TO_TOP', conversation: conv('n2') });
    expect(ids(next.conversations)).toEqual(['u1', 'n2', 'n1']);
  });
});
