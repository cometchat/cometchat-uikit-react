import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  conversationsReducer,
  initialConversationsState,
  type CometChatConversationsAction,
} from '../CometChatConversations.reducer';

function createMockConversation(id: string) {
  return {
    getConversationId: () => id,
    getConversationType: () => 'user',
    getConversationWith: () => ({ getUid: () => id, getName: () => `User ${id}` }),
    getLastMessage: () => null,
    getUnreadMessageCount: () => 0,
  } as unknown as CometChat.Conversation;
}

// Arbitrary for generating valid actions
const conversationIdArb = fc.string({ minLength: 1, maxLength: 10 });

const validActionArb: fc.Arbitrary<CometChatConversationsAction> = fc.oneof(
  fc.constant({ type: 'FETCH_START' } as CometChatConversationsAction),
  fc.array(conversationIdArb, { minLength: 0, maxLength: 5 }).map(ids => ({
    type: 'FETCH_SUCCESS',
    conversations: ids.map(id => createMockConversation(id)),
    hasMore: ids.length > 0,
  })),
  fc.string().map(error => ({ type: 'FETCH_ERROR', error })),
  conversationIdArb.map(id => ({
    type: 'SELECT_CONVERSATION',
    conversation: createMockConversation(id),
  })),
  conversationIdArb.map(id => ({ type: 'DESELECT_CONVERSATION', conversationId: id })),
  fc.constant({ type: 'CLEAR_SELECTION' } as CometChatConversationsAction),
  fc.constant({ type: 'RESET' } as CometChatConversationsAction)
);

describe('CometChatConversations property-based tests', () => {
  it('reducer never throws on valid action sequences', () => {
    fc.assert(
      fc.property(fc.array(validActionArb, { minLength: 1, maxLength: 20 }), actions => {
        let state = initialConversationsState;
        for (const action of actions) {
          state = conversationsReducer(state, action);
        }
        // Should always produce a valid state
        expect(state).toBeDefined();
        expect(state.conversations).toBeInstanceOf(Array);
        expect(state.selectedConversationIds).toBeInstanceOf(Array);
      })
    );
  });

  it('selection state is always consistent (selectedConversationIds matches selectedConversationsMap keys)', () => {
    fc.assert(
      fc.property(fc.array(validActionArb, { minLength: 1, maxLength: 20 }), actions => {
        let state = initialConversationsState;
        for (const action of actions) {
          state = conversationsReducer(state, action);
        }
        // selectedConversationIds and selectedConversationsMap keys must match
        const idsFromArray = new Set(state.selectedConversationIds);
        const idsFromMap = new Set(state.selectedConversationsMap.keys());
        expect(idsFromArray).toEqual(idsFromMap);
      })
    );
  });

  it('RESET always preserves selection', () => {
    fc.assert(
      fc.property(fc.array(conversationIdArb, { minLength: 1, maxLength: 5 }), selectedIds => {
        const selectedMap = new Map(selectedIds.map(id => [id, createMockConversation(id)]));
        const stateWithSelection = {
          ...initialConversationsState,
          conversations: selectedIds.map(id => createMockConversation(id)),
          fetchState: 'loaded' as const,
          selectedConversationIds: selectedIds,
          selectedConversationsMap: selectedMap,
          activeConversationId: selectedIds[0] ?? null,
          searchText: 'test',
        };

        const state = conversationsReducer(stateWithSelection, { type: 'RESET' });
        expect(state.selectedConversationIds).toEqual(selectedIds);
        expect(state.selectedConversationsMap.size).toBe(selectedMap.size);
        expect(state.activeConversationId).toBe(selectedIds[0] ?? null);
      })
    );
  });

  it('FETCH_SUCCESS never produces impossible states', () => {
    fc.assert(
      fc.property(
        fc.array(conversationIdArb, { minLength: 0, maxLength: 10 }),
        fc.boolean(),
        (ids, hasMore) => {
          const conversations = ids.map(id => createMockConversation(id));
          const state = conversationsReducer(initialConversationsState, {
            type: 'FETCH_SUCCESS',
            conversations,
            hasMore,
          });

          // fetchState should be 'loaded' or 'empty', never 'loading' or 'error'
          expect(['loaded', 'empty']).toContain(state.fetchState);

          // If conversations exist, fetchState must be 'loaded'
          if (state.conversations.length > 0) {
            expect(state.fetchState).toBe('loaded');
          }
        }
      )
    );
  });
});
