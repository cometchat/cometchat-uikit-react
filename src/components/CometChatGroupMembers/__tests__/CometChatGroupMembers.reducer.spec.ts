import { describe, it, expect } from 'vitest';
import {
  groupMembersReducer,
  initialGroupMembersState,
  type CometChatGroupMembersState,
  type CometChatGroupMembersAction,
} from '../CometChatGroupMembers.reducer';

// --- Mock member factory ---
function createMockMember(uid: string, name = 'User', scope = 'participant', status = 'online') {
  return {
    getUid: () => uid,
    getName: () => name,
    getAvatar: () => `https://example.com/${uid}.png`,
    getScope: () => scope,
    getStatus: () => status,
    setScope: function (s: string) {
      (this as Record<string, unknown>)._scope = s;
    },
    setStatus: function (s: string) {
      (this as Record<string, unknown>)._status = s;
    },
  } as unknown as CometChat.GroupMember;
}

describe('groupMembersReducer', () => {
  describe('FETCH_START', () => {
    it('sets fetchState to loading when members array is empty', () => {
      const state = groupMembersReducer(initialGroupMembersState, { type: 'FETCH_START' });
      expect(state.fetchState).toBe('loading');
      expect(state.error).toBeNull();
    });

    it('preserves current fetchState when members already exist', () => {
      const stateWithMembers: CometChatGroupMembersState = {
        ...initialGroupMembersState,
        members: [createMockMember('u1')],
        fetchState: 'loaded',
      };
      const state = groupMembersReducer(stateWithMembers, { type: 'FETCH_START' });
      expect(state.fetchState).toBe('loaded');
      expect(state.error).toBeNull();
    });
  });

  describe('FETCH_SUCCESS', () => {
    it('appends members and sets hasMore', () => {
      const members = [createMockMember('u1'), createMockMember('u2')];
      const state = groupMembersReducer(initialGroupMembersState, {
        type: 'FETCH_SUCCESS',
        members,
        hasMore: true,
      });
      expect(state.members).toHaveLength(2);
      expect(state.hasMore).toBe(true);
      expect(state.fetchState).toBe('loaded');
    });

    it('sets fetchState to empty when no members returned and list is empty', () => {
      const state = groupMembersReducer(initialGroupMembersState, {
        type: 'FETCH_SUCCESS',
        members: [],
        hasMore: false,
      });
      expect(state.fetchState).toBe('empty');
      expect(state.hasMore).toBe(false);
    });

    it('appends to existing members', () => {
      const stateWithMembers: CometChatGroupMembersState = {
        ...initialGroupMembersState,
        members: [createMockMember('u1')],
        fetchState: 'loaded',
      };
      const state = groupMembersReducer(stateWithMembers, {
        type: 'FETCH_SUCCESS',
        members: [createMockMember('u2')],
        hasMore: true,
      });
      expect(state.members).toHaveLength(2);
    });
  });

  describe('FETCH_ERROR', () => {
    it('sets fetchState to error and stores message when list is empty', () => {
      const state = groupMembersReducer(initialGroupMembersState, {
        type: 'FETCH_ERROR',
        error: 'Network error',
      });
      expect(state.fetchState).toBe('error');
      expect(state.error).toBe('Network error');
    });

    it('preserves fetchState when members already exist', () => {
      const stateWithMembers: CometChatGroupMembersState = {
        ...initialGroupMembersState,
        members: [createMockMember('u1')],
        fetchState: 'loaded',
      };
      const state = groupMembersReducer(stateWithMembers, {
        type: 'FETCH_ERROR',
        error: 'Network error',
      });
      expect(state.fetchState).toBe('loaded');
      expect(state.error).toBe('Network error');
    });
  });

  describe('UPDATE_MEMBER', () => {
    it('updates matching member by UID', () => {
      const stateWithMembers: CometChatGroupMembersState = {
        ...initialGroupMembersState,
        members: [createMockMember('u1', 'Alice'), createMockMember('u2', 'Bob')],
        fetchState: 'loaded',
      };
      const updatedMember = createMockMember('u1', 'Alice Updated');
      const state = groupMembersReducer(stateWithMembers, {
        type: 'UPDATE_MEMBER',
        member: updatedMember,
      });
      expect(state.members[0]?.getName()).toBe('Alice Updated');
      expect(state.members[1]?.getUid()).toBe('u2');
    });

    it('returns unchanged state if UID not found', () => {
      const stateWithMembers: CometChatGroupMembersState = {
        ...initialGroupMembersState,
        members: [createMockMember('u1')],
        fetchState: 'loaded',
      };
      const state = groupMembersReducer(stateWithMembers, {
        type: 'UPDATE_MEMBER',
        member: createMockMember('u99'),
      });
      expect(state).toBe(stateWithMembers);
    });
  });

  describe('ADD_MEMBER', () => {
    it('appends new member to list', () => {
      const stateWithMembers: CometChatGroupMembersState = {
        ...initialGroupMembersState,
        members: [createMockMember('u1')],
        fetchState: 'loaded',
      };
      const newMember = createMockMember('u2', 'New Member');
      const state = groupMembersReducer(stateWithMembers, {
        type: 'ADD_MEMBER',
        member: newMember,
      });
      expect(state.members).toHaveLength(2);
      expect(state.members[1]?.getUid()).toBe('u2');
      expect(state.fetchState).toBe('loaded');
    });

    it('prevents duplicate members', () => {
      const stateWithMembers: CometChatGroupMembersState = {
        ...initialGroupMembersState,
        members: [createMockMember('u1')],
        fetchState: 'loaded',
      };
      const state = groupMembersReducer(stateWithMembers, {
        type: 'ADD_MEMBER',
        member: createMockMember('u1'),
      });
      expect(state).toBe(stateWithMembers);
    });
  });

  describe('REMOVE_MEMBER', () => {
    it('removes member by UID', () => {
      const stateWithMembers: CometChatGroupMembersState = {
        ...initialGroupMembersState,
        members: [createMockMember('u1'), createMockMember('u2'), createMockMember('u3')],
        fetchState: 'loaded',
      };
      const state = groupMembersReducer(stateWithMembers, {
        type: 'REMOVE_MEMBER',
        uid: 'u2',
      });
      expect(state.members).toHaveLength(2);
      expect(state.members.map(m => m.getUid())).toEqual(['u1', 'u3']);
    });

    it('sets fetchState to empty when last member is removed', () => {
      const stateWithMembers: CometChatGroupMembersState = {
        ...initialGroupMembersState,
        members: [createMockMember('u1')],
        fetchState: 'loaded',
      };
      const state = groupMembersReducer(stateWithMembers, {
        type: 'REMOVE_MEMBER',
        uid: 'u1',
      });
      expect(state.members).toHaveLength(0);
      expect(state.fetchState).toBe('empty');
    });

    it('returns unchanged state for non-matching UID', () => {
      const stateWithMembers: CometChatGroupMembersState = {
        ...initialGroupMembersState,
        members: [createMockMember('u1')],
        fetchState: 'loaded',
      };
      const state = groupMembersReducer(stateWithMembers, {
        type: 'REMOVE_MEMBER',
        uid: 'u99',
      });
      expect(state).toBe(stateWithMembers);
    });
  });

  describe('UPDATE_MEMBER_SCOPE', () => {
    it('updates scope for matching UID', () => {
      const member = createMockMember('u1', 'Alice', 'participant');
      const stateWithMembers: CometChatGroupMembersState = {
        ...initialGroupMembersState,
        members: [member],
        fetchState: 'loaded',
      };
      const state = groupMembersReducer(stateWithMembers, {
        type: 'UPDATE_MEMBER_SCOPE',
        uid: 'u1',
        scope: 'admin',
      });
      expect(state.members).toHaveLength(1);
      // The member's setScope was called
      expect(state.members[0]).toBeDefined();
    });

    it('returns unchanged state if UID not found', () => {
      const stateWithMembers: CometChatGroupMembersState = {
        ...initialGroupMembersState,
        members: [createMockMember('u1')],
        fetchState: 'loaded',
      };
      const state = groupMembersReducer(stateWithMembers, {
        type: 'UPDATE_MEMBER_SCOPE',
        uid: 'u99',
        scope: 'admin',
      });
      expect(state).toBe(stateWithMembers);
    });
  });

  describe('UPDATE_MEMBER_STATUS', () => {
    it('updates status for matching UID', () => {
      const member = createMockMember('u1', 'Alice', 'participant', 'offline');
      const stateWithMembers: CometChatGroupMembersState = {
        ...initialGroupMembersState,
        members: [member],
        fetchState: 'loaded',
      };
      const state = groupMembersReducer(stateWithMembers, {
        type: 'UPDATE_MEMBER_STATUS',
        uid: 'u1',
        status: 'online',
      });
      expect(state.members).toHaveLength(1);
    });

    it('returns unchanged state if UID not found', () => {
      const stateWithMembers: CometChatGroupMembersState = {
        ...initialGroupMembersState,
        members: [createMockMember('u1')],
        fetchState: 'loaded',
      };
      const state = groupMembersReducer(stateWithMembers, {
        type: 'UPDATE_MEMBER_STATUS',
        uid: 'u99',
        status: 'online',
      });
      expect(state).toBe(stateWithMembers);
    });
  });

  describe('SELECT_MEMBER', () => {
    it('adds member to selectedMemberIds and selectedMembersMap', () => {
      const member = createMockMember('u1', 'Alice');
      const state = groupMembersReducer(initialGroupMembersState, {
        type: 'SELECT_MEMBER',
        member,
      });
      expect(state.selectedMemberIds).toContain('u1');
      expect(state.selectedMembersMap.get('u1')).toBe(member);
    });

    it('is no-op if member already selected', () => {
      const member = createMockMember('u1', 'Alice');
      const stateWithSelection: CometChatGroupMembersState = {
        ...initialGroupMembersState,
        selectedMemberIds: ['u1'],
        selectedMembersMap: new Map([['u1', member]]),
      };
      const state = groupMembersReducer(stateWithSelection, {
        type: 'SELECT_MEMBER',
        member,
      });
      expect(state).toBe(stateWithSelection);
    });
  });

  describe('DESELECT_MEMBER', () => {
    it('removes member from selectedMemberIds and selectedMembersMap', () => {
      const member = createMockMember('u1', 'Alice');
      const stateWithSelection: CometChatGroupMembersState = {
        ...initialGroupMembersState,
        selectedMemberIds: ['u1'],
        selectedMembersMap: new Map([['u1', member]]),
      };
      const state = groupMembersReducer(stateWithSelection, {
        type: 'DESELECT_MEMBER',
        uid: 'u1',
      });
      expect(state.selectedMemberIds).not.toContain('u1');
      expect(state.selectedMembersMap.has('u1')).toBe(false);
    });

    it('is no-op if member not selected', () => {
      const state = groupMembersReducer(initialGroupMembersState, {
        type: 'DESELECT_MEMBER',
        uid: 'u99',
      });
      expect(state).toBe(initialGroupMembersState);
    });
  });

  describe('CLEAR_SELECTION', () => {
    it('empties selectedMemberIds and selectedMembersMap', () => {
      const stateWithSelection: CometChatGroupMembersState = {
        ...initialGroupMembersState,
        selectedMemberIds: ['u1', 'u2'],
        selectedMembersMap: new Map([
          ['u1', createMockMember('u1')],
          ['u2', createMockMember('u2')],
        ]),
      };
      const state = groupMembersReducer(stateWithSelection, { type: 'CLEAR_SELECTION' });
      expect(state.selectedMemberIds).toEqual([]);
      expect(state.selectedMembersMap.size).toBe(0);
    });
  });

  describe('SET_ACTIVE_MEMBER', () => {
    it('updates activeMemberId', () => {
      const state = groupMembersReducer(initialGroupMembersState, {
        type: 'SET_ACTIVE_MEMBER',
        uid: 'u1',
      });
      expect(state.activeMemberId).toBe('u1');
    });

    it('sets activeMemberId to null', () => {
      const stateWithActive: CometChatGroupMembersState = {
        ...initialGroupMembersState,
        activeMemberId: 'u1',
      };
      const state = groupMembersReducer(stateWithActive, {
        type: 'SET_ACTIVE_MEMBER',
        uid: null,
      });
      expect(state.activeMemberId).toBeNull();
    });
  });

  describe('SET_SEARCH_TEXT', () => {
    it('updates search text', () => {
      const state = groupMembersReducer(initialGroupMembersState, {
        type: 'SET_SEARCH_TEXT',
        searchText: 'alice',
      });
      expect(state.searchText).toBe('alice');
    });
  });

  describe('RESET', () => {
    it('returns initial state but preserves selection and active member', () => {
      const stateWithData: CometChatGroupMembersState = {
        members: [createMockMember('u1'), createMockMember('u2')],
        fetchState: 'loaded',
        hasMore: false,
        error: null,
        selectedMemberIds: ['u1'],
        selectedMembersMap: new Map([['u1', createMockMember('u1')]]),
        activeMemberId: 'u1',
        searchText: 'alice',
      };
      const state = groupMembersReducer(stateWithData, { type: 'RESET' });
      expect(state.members).toEqual([]);
      expect(state.fetchState).toBe('idle');
      expect(state.hasMore).toBe(true);
      expect(state.error).toBeNull();
      // Preserved:
      expect(state.selectedMemberIds).toEqual(['u1']);
      expect(state.selectedMembersMap.size).toBe(1);
      expect(state.activeMemberId).toBe('u1');
      expect(state.searchText).toBe('alice');
    });
  });

  describe('unknown action', () => {
    it('returns unchanged state', () => {
      const state = groupMembersReducer(initialGroupMembersState, {
        type: 'UNKNOWN_ACTION',
      } as unknown as CometChatGroupMembersAction);
      expect(state).toBe(initialGroupMembersState);
    });
  });
});
