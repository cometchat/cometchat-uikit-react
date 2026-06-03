import { describe, it, expect } from 'vitest';
import {
  conversationsReducer,
  initialConversationsState,
  type CometChatConversationsState,
  type CometChatConversationsAction,
} from '../CometChatConversations.reducer';

// --- Mock conversation factory ---
function createMockConversation(id: string, unreadCount = 0) {
  return {
    getConversationId: () => id,
    getConversationType: () => 'user',
    getConversationWith: () => ({ getUid: () => id, getName: () => `User ${id}` }),
    getLastMessage: () => null,
    getUnreadMessageCount: () => unreadCount,
  } as unknown as CometChat.Conversation;
}

describe('conversationsReducer', () => {
  describe('FETCH_START', () => {
    it('sets fetchState to loading when conversations array is empty', () => {
      const state = conversationsReducer(initialConversationsState, { type: 'FETCH_START' });
      expect(state.fetchState).toBe('loading');
      expect(state.error).toBeNull();
    });

    it('preserves current fetchState when conversations already exist', () => {
      const stateWithConvs: CometChatConversationsState = {
        ...initialConversationsState,
        conversations: [createMockConversation('c1')],
        fetchState: 'loaded',
      };
      const state = conversationsReducer(stateWithConvs, { type: 'FETCH_START' });
      expect(state.fetchState).toBe('loaded');
      expect(state.error).toBeNull();
    });
  });

  describe('FETCH_SUCCESS', () => {
    it('appends conversations and sets hasMore', () => {
      const conversations = [createMockConversation('c1'), createMockConversation('c2')];
      const state = conversationsReducer(initialConversationsState, {
        type: 'FETCH_SUCCESS',
        conversations,
        hasMore: true,
      });
      expect(state.conversations).toHaveLength(2);
      expect(state.hasMore).toBe(true);
      expect(state.fetchState).toBe('loaded');
    });

    it('sets fetchState to empty when no conversations returned and list is empty', () => {
      const state = conversationsReducer(initialConversationsState, {
        type: 'FETCH_SUCCESS',
        conversations: [],
        hasMore: false,
      });
      expect(state.fetchState).toBe('empty');
      expect(state.hasMore).toBe(false);
    });

    it('appends to existing conversations', () => {
      const stateWithConvs: CometChatConversationsState = {
        ...initialConversationsState,
        conversations: [createMockConversation('c1')],
        fetchState: 'loaded',
      };
      const state = conversationsReducer(stateWithConvs, {
        type: 'FETCH_SUCCESS',
        conversations: [createMockConversation('c2')],
        hasMore: true,
      });
      expect(state.conversations).toHaveLength(2);
    });
  });

  describe('FETCH_ERROR', () => {
    it('sets fetchState to error and stores message when list is empty', () => {
      const state = conversationsReducer(initialConversationsState, {
        type: 'FETCH_ERROR',
        error: 'Network error',
      });
      expect(state.fetchState).toBe('error');
      expect(state.error).toBe('Network error');
    });

    it('preserves fetchState when conversations already exist', () => {
      const stateWithConvs: CometChatConversationsState = {
        ...initialConversationsState,
        conversations: [createMockConversation('c1')],
        fetchState: 'loaded',
      };
      const state = conversationsReducer(stateWithConvs, {
        type: 'FETCH_ERROR',
        error: 'Network error',
      });
      expect(state.fetchState).toBe('loaded');
      expect(state.error).toBe('Network error');
    });
  });

  describe('UPDATE_CONVERSATION', () => {
    it('updates matching conversation by ID', () => {
      const conv1 = createMockConversation('c1', 0);
      const stateWithConvs: CometChatConversationsState = {
        ...initialConversationsState,
        conversations: [conv1, createMockConversation('c2')],
        fetchState: 'loaded',
      };
      const updatedConv = createMockConversation('c1', 5);
      const state = conversationsReducer(stateWithConvs, {
        type: 'UPDATE_CONVERSATION',
        conversation: updatedConv,
      });
      expect(state.conversations[0]?.getUnreadMessageCount()).toBe(5);
      expect(state.conversations[1]?.getConversationId()).toBe('c2');
    });

    it('is no-op for non-matching ID', () => {
      const stateWithConvs: CometChatConversationsState = {
        ...initialConversationsState,
        conversations: [createMockConversation('c1')],
        fetchState: 'loaded',
      };
      const state = conversationsReducer(stateWithConvs, {
        type: 'UPDATE_CONVERSATION',
        conversation: createMockConversation('c99'),
      });
      expect(state).toBe(stateWithConvs);
    });
  });

  describe('REMOVE_CONVERSATION', () => {
    it('removes conversation by ID', () => {
      const stateWithConvs: CometChatConversationsState = {
        ...initialConversationsState,
        conversations: [createMockConversation('c1'), createMockConversation('c2')],
        fetchState: 'loaded',
      };
      const state = conversationsReducer(stateWithConvs, {
        type: 'REMOVE_CONVERSATION',
        conversationId: 'c1',
      });
      expect(state.conversations).toHaveLength(1);
      expect(state.conversations[0]?.getConversationId()).toBe('c2');
    });

    it('sets fetchState to empty when last conversation removed', () => {
      const stateWithConvs: CometChatConversationsState = {
        ...initialConversationsState,
        conversations: [createMockConversation('c1')],
        fetchState: 'loaded',
      };
      const state = conversationsReducer(stateWithConvs, {
        type: 'REMOVE_CONVERSATION',
        conversationId: 'c1',
      });
      expect(state.conversations).toHaveLength(0);
      expect(state.fetchState).toBe('empty');
    });

    it('is no-op for non-matching ID', () => {
      const stateWithConvs: CometChatConversationsState = {
        ...initialConversationsState,
        conversations: [createMockConversation('c1')],
        fetchState: 'loaded',
      };
      const state = conversationsReducer(stateWithConvs, {
        type: 'REMOVE_CONVERSATION',
        conversationId: 'c99',
      });
      expect(state).toBe(stateWithConvs);
    });
  });

  describe('MOVE_TO_TOP', () => {
    it('moves existing conversation to top', () => {
      const conv1 = createMockConversation('c1');
      const conv2 = createMockConversation('c2');
      const conv3 = createMockConversation('c3');
      const stateWithConvs: CometChatConversationsState = {
        ...initialConversationsState,
        conversations: [conv1, conv2, conv3],
        fetchState: 'loaded',
      };
      const updatedConv3 = createMockConversation('c3', 1);
      const state = conversationsReducer(stateWithConvs, {
        type: 'MOVE_TO_TOP',
        conversation: updatedConv3,
      });
      expect(state.conversations[0]?.getConversationId()).toBe('c3');
      expect(state.conversations).toHaveLength(3);
    });

    it('adds new conversation to top if not in list', () => {
      const stateWithConvs: CometChatConversationsState = {
        ...initialConversationsState,
        conversations: [createMockConversation('c1')],
        fetchState: 'loaded',
      };
      const newConv = createMockConversation('c_new');
      const state = conversationsReducer(stateWithConvs, {
        type: 'MOVE_TO_TOP',
        conversation: newConv,
      });
      expect(state.conversations[0]?.getConversationId()).toBe('c_new');
      expect(state.conversations).toHaveLength(2);
    });
  });

  describe('SET_SEARCH_TEXT', () => {
    it('updates search text', () => {
      const state = conversationsReducer(initialConversationsState, {
        type: 'SET_SEARCH_TEXT',
        searchText: 'alice',
      });
      expect(state.searchText).toBe('alice');
    });
  });

  describe('SELECT_CONVERSATION', () => {
    it('adds conversation to selection', () => {
      const conv = createMockConversation('c1');
      const state = conversationsReducer(initialConversationsState, {
        type: 'SELECT_CONVERSATION',
        conversation: conv,
      });
      expect(state.selectedConversationIds).toContain('c1');
      expect(state.selectedConversationsMap.get('c1')).toBe(conv);
    });

    it('is no-op if already selected', () => {
      const conv = createMockConversation('c1');
      const stateWithSelection: CometChatConversationsState = {
        ...initialConversationsState,
        selectedConversationIds: ['c1'],
        selectedConversationsMap: new Map([['c1', conv]]),
      };
      const state = conversationsReducer(stateWithSelection, {
        type: 'SELECT_CONVERSATION',
        conversation: conv,
      });
      expect(state).toBe(stateWithSelection);
    });
  });

  describe('DESELECT_CONVERSATION', () => {
    it('removes conversation from selection', () => {
      const conv = createMockConversation('c1');
      const stateWithSelection: CometChatConversationsState = {
        ...initialConversationsState,
        selectedConversationIds: ['c1'],
        selectedConversationsMap: new Map([['c1', conv]]),
      };
      const state = conversationsReducer(stateWithSelection, {
        type: 'DESELECT_CONVERSATION',
        conversationId: 'c1',
      });
      expect(state.selectedConversationIds).not.toContain('c1');
      expect(state.selectedConversationsMap.has('c1')).toBe(false);
    });

    it('is no-op if not selected', () => {
      const state = conversationsReducer(initialConversationsState, {
        type: 'DESELECT_CONVERSATION',
        conversationId: 'c99',
      });
      expect(state).toBe(initialConversationsState);
    });
  });

  describe('SELECT_RANGE', () => {
    it('adds multiple conversations to selection', () => {
      const convs = [createMockConversation('c1'), createMockConversation('c2')];
      const state = conversationsReducer(initialConversationsState, {
        type: 'SELECT_RANGE',
        conversations: convs,
      });
      expect(state.selectedConversationIds).toEqual(['c1', 'c2']);
      expect(state.selectedConversationsMap.size).toBe(2);
    });

    it('is no-op when all already selected', () => {
      const conv = createMockConversation('c1');
      const stateWithSelection: CometChatConversationsState = {
        ...initialConversationsState,
        selectedConversationIds: ['c1'],
        selectedConversationsMap: new Map([['c1', conv]]),
      };
      const state = conversationsReducer(stateWithSelection, {
        type: 'SELECT_RANGE',
        conversations: [conv],
      });
      expect(state).toBe(stateWithSelection);
    });
  });

  describe('DESELECT_RANGE', () => {
    it('removes multiple conversations from selection', () => {
      const conv1 = createMockConversation('c1');
      const conv2 = createMockConversation('c2');
      const stateWithSelection: CometChatConversationsState = {
        ...initialConversationsState,
        selectedConversationIds: ['c1', 'c2', 'c3'],
        selectedConversationsMap: new Map([
          ['c1', conv1],
          ['c2', conv2],
          ['c3', createMockConversation('c3')],
        ]),
      };
      const state = conversationsReducer(stateWithSelection, {
        type: 'DESELECT_RANGE',
        conversationIds: ['c1', 'c2'],
      });
      expect(state.selectedConversationIds).toEqual(['c3']);
      expect(state.selectedConversationsMap.size).toBe(1);
    });
  });

  describe('CLEAR_SELECTION', () => {
    it('empties selection', () => {
      const stateWithSelection: CometChatConversationsState = {
        ...initialConversationsState,
        selectedConversationIds: ['c1', 'c2'],
        selectedConversationsMap: new Map([
          ['c1', createMockConversation('c1')],
          ['c2', createMockConversation('c2')],
        ]),
      };
      const state = conversationsReducer(stateWithSelection, { type: 'CLEAR_SELECTION' });
      expect(state.selectedConversationIds).toEqual([]);
      expect(state.selectedConversationsMap.size).toBe(0);
    });
  });

  describe('SET_ACTIVE_CONVERSATION', () => {
    it('updates activeConversationId', () => {
      const state = conversationsReducer(initialConversationsState, {
        type: 'SET_ACTIVE_CONVERSATION',
        conversationId: 'c1',
      });
      expect(state.activeConversationId).toBe('c1');
    });

    it('sets to null', () => {
      const stateWithActive: CometChatConversationsState = {
        ...initialConversationsState,
        activeConversationId: 'c1',
      };
      const state = conversationsReducer(stateWithActive, {
        type: 'SET_ACTIVE_CONVERSATION',
        conversationId: null,
      });
      expect(state.activeConversationId).toBeNull();
    });
  });

  describe('RESET', () => {
    it('returns initial state but preserves selection and active conversation', () => {
      const stateWithData: CometChatConversationsState = {
        conversations: [createMockConversation('c1'), createMockConversation('c2')],
        fetchState: 'loaded',
        hasMore: false,
        error: null,
        selectedConversationIds: ['c1'],
        selectedConversationsMap: new Map([['c1', createMockConversation('c1')]]),
        activeConversationId: 'c1',
        searchText: 'alice',
      };
      const state = conversationsReducer(stateWithData, { type: 'RESET' });
      expect(state.conversations).toEqual([]);
      expect(state.fetchState).toBe('idle');
      expect(state.hasMore).toBe(true);
      expect(state.error).toBeNull();
      // Preserved:
      expect(state.selectedConversationIds).toEqual(['c1']);
      expect(state.selectedConversationsMap.size).toBe(1);
      expect(state.activeConversationId).toBe('c1');
      expect(state.searchText).toBe('alice');
    });
  });

  describe('unknown action', () => {
    it('returns unchanged state', () => {
      const state = conversationsReducer(initialConversationsState, {
        type: 'UNKNOWN_ACTION',
      } as unknown as CometChatConversationsAction);
      expect(state).toBe(initialConversationsState);
    });
  });
});
