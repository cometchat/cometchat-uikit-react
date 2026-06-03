import { describe, it, expect } from 'vitest';
import {
  usersReducer,
  initialUsersState,
  type CometChatUsersState,
  type CometChatUsersAction,
} from '../CometChatUsers.reducer';

// --- Mock user factory ---
function createMockUser(uid: string, name = 'User', status = 'offline') {
  return {
    getUid: () => uid,
    getName: () => name,
    getStatus: () => status,
    getAvatar: () => `https://example.com/${uid}.png`,
  } as unknown as CometChat.User;
}

describe('usersReducer', () => {
  describe('FETCH_START', () => {
    it('sets fetchState to loading when users array is empty', () => {
      const state = usersReducer(initialUsersState, { type: 'FETCH_START' });
      expect(state.fetchState).toBe('loading');
      expect(state.error).toBeNull();
    });

    it('preserves current fetchState when users already exist', () => {
      const stateWithUsers: CometChatUsersState = {
        ...initialUsersState,
        users: [createMockUser('u1')],
        fetchState: 'loaded',
      };
      const state = usersReducer(stateWithUsers, { type: 'FETCH_START' });
      expect(state.fetchState).toBe('loaded');
      expect(state.error).toBeNull();
    });
  });

  describe('FETCH_SUCCESS', () => {
    it('appends users and sets hasMore', () => {
      const users = [createMockUser('u1'), createMockUser('u2')];
      const state = usersReducer(initialUsersState, {
        type: 'FETCH_SUCCESS',
        users,
        hasMore: true,
      });
      expect(state.users).toHaveLength(2);
      expect(state.hasMore).toBe(true);
      expect(state.fetchState).toBe('loaded');
    });

    it('sets fetchState to empty when no users returned and list is empty', () => {
      const state = usersReducer(initialUsersState, {
        type: 'FETCH_SUCCESS',
        users: [],
        hasMore: false,
      });
      expect(state.fetchState).toBe('empty');
      expect(state.hasMore).toBe(false);
    });

    it('appends to existing users', () => {
      const stateWithUsers: CometChatUsersState = {
        ...initialUsersState,
        users: [createMockUser('u1')],
        fetchState: 'loaded',
      };
      const state = usersReducer(stateWithUsers, {
        type: 'FETCH_SUCCESS',
        users: [createMockUser('u2')],
        hasMore: true,
      });
      expect(state.users).toHaveLength(2);
    });
  });

  describe('FETCH_ERROR', () => {
    it('sets fetchState to error and stores message when list is empty', () => {
      const state = usersReducer(initialUsersState, {
        type: 'FETCH_ERROR',
        error: 'Network error',
      });
      expect(state.fetchState).toBe('error');
      expect(state.error).toBe('Network error');
    });

    it('preserves fetchState when users already exist', () => {
      const stateWithUsers: CometChatUsersState = {
        ...initialUsersState,
        users: [createMockUser('u1')],
        fetchState: 'loaded',
      };
      const state = usersReducer(stateWithUsers, {
        type: 'FETCH_ERROR',
        error: 'Network error',
      });
      expect(state.fetchState).toBe('loaded');
      expect(state.error).toBe('Network error');
    });
  });

  describe('UPDATE_USER', () => {
    it('updates matching user in list by UID', () => {
      const user1 = createMockUser('u1', 'Alice', 'offline');
      const stateWithUsers: CometChatUsersState = {
        ...initialUsersState,
        users: [user1, createMockUser('u2', 'Bob')],
        fetchState: 'loaded',
      };
      const updatedUser = createMockUser('u1', 'Alice', 'online');
      const state = usersReducer(stateWithUsers, {
        type: 'UPDATE_USER',
        user: updatedUser,
      });
      expect(state.users[0]?.getStatus()).toBe('online');
      expect(state.users[1]?.getUid()).toBe('u2');
    });

    it('is no-op for non-matching UID', () => {
      const stateWithUsers: CometChatUsersState = {
        ...initialUsersState,
        users: [createMockUser('u1')],
        fetchState: 'loaded',
      };
      const state = usersReducer(stateWithUsers, {
        type: 'UPDATE_USER',
        user: createMockUser('u99'),
      });
      expect(state).toBe(stateWithUsers);
    });
  });

  describe('SET_SEARCH_TEXT', () => {
    it('updates search text', () => {
      const state = usersReducer(initialUsersState, {
        type: 'SET_SEARCH_TEXT',
        searchText: 'alice',
      });
      expect(state.searchText).toBe('alice');
    });
  });

  describe('SELECT_USER', () => {
    it('adds user to selectedUserIds and selectedUsersMap', () => {
      const user = createMockUser('u1', 'Alice');
      const state = usersReducer(initialUsersState, {
        type: 'SELECT_USER',
        user,
      });
      expect(state.selectedUserIds).toContain('u1');
      expect(state.selectedUsersMap.get('u1')).toBe(user);
    });

    it('is no-op if user already selected', () => {
      const user = createMockUser('u1', 'Alice');
      const stateWithSelection: CometChatUsersState = {
        ...initialUsersState,
        selectedUserIds: ['u1'],
        selectedUsersMap: new Map([['u1', user]]),
      };
      const state = usersReducer(stateWithSelection, {
        type: 'SELECT_USER',
        user,
      });
      expect(state).toBe(stateWithSelection);
    });
  });

  describe('DESELECT_USER', () => {
    it('removes user from selectedUserIds and selectedUsersMap', () => {
      const user = createMockUser('u1', 'Alice');
      const stateWithSelection: CometChatUsersState = {
        ...initialUsersState,
        selectedUserIds: ['u1'],
        selectedUsersMap: new Map([['u1', user]]),
      };
      const state = usersReducer(stateWithSelection, {
        type: 'DESELECT_USER',
        userId: 'u1',
      });
      expect(state.selectedUserIds).not.toContain('u1');
      expect(state.selectedUsersMap.has('u1')).toBe(false);
    });

    it('is no-op if user not selected', () => {
      const state = usersReducer(initialUsersState, {
        type: 'DESELECT_USER',
        userId: 'u99',
      });
      expect(state).toBe(initialUsersState);
    });
  });

  describe('SELECT_RANGE', () => {
    it('adds multiple users to selection', () => {
      const users = [createMockUser('u1'), createMockUser('u2'), createMockUser('u3')];
      const state = usersReducer(initialUsersState, {
        type: 'SELECT_RANGE',
        users,
      });
      expect(state.selectedUserIds).toEqual(['u1', 'u2', 'u3']);
      expect(state.selectedUsersMap.size).toBe(3);
    });

    it('does not duplicate already-selected users', () => {
      const user1 = createMockUser('u1');
      const stateWithSelection: CometChatUsersState = {
        ...initialUsersState,
        selectedUserIds: ['u1'],
        selectedUsersMap: new Map([['u1', user1]]),
      };
      const users = [user1, createMockUser('u2')];
      const state = usersReducer(stateWithSelection, {
        type: 'SELECT_RANGE',
        users,
      });
      expect(state.selectedUserIds).toEqual(['u1', 'u2']);
    });

    it('is no-op when all users already selected', () => {
      const user1 = createMockUser('u1');
      const stateWithSelection: CometChatUsersState = {
        ...initialUsersState,
        selectedUserIds: ['u1'],
        selectedUsersMap: new Map([['u1', user1]]),
      };
      const state = usersReducer(stateWithSelection, {
        type: 'SELECT_RANGE',
        users: [user1],
      });
      expect(state).toBe(stateWithSelection);
    });
  });

  describe('DESELECT_RANGE', () => {
    it('removes multiple users from selection', () => {
      const user1 = createMockUser('u1');
      const user2 = createMockUser('u2');
      const user3 = createMockUser('u3');
      const stateWithSelection: CometChatUsersState = {
        ...initialUsersState,
        selectedUserIds: ['u1', 'u2', 'u3'],
        selectedUsersMap: new Map([
          ['u1', user1],
          ['u2', user2],
          ['u3', user3],
        ]),
      };
      const state = usersReducer(stateWithSelection, {
        type: 'DESELECT_RANGE',
        userIds: ['u1', 'u3'],
      });
      expect(state.selectedUserIds).toEqual(['u2']);
      expect(state.selectedUsersMap.size).toBe(1);
    });
  });

  describe('CLEAR_SELECTION', () => {
    it('empties selectedUserIds and selectedUsersMap', () => {
      const stateWithSelection: CometChatUsersState = {
        ...initialUsersState,
        selectedUserIds: ['u1', 'u2'],
        selectedUsersMap: new Map([
          ['u1', createMockUser('u1')],
          ['u2', createMockUser('u2')],
        ]),
      };
      const state = usersReducer(stateWithSelection, { type: 'CLEAR_SELECTION' });
      expect(state.selectedUserIds).toEqual([]);
      expect(state.selectedUsersMap.size).toBe(0);
    });
  });

  describe('SET_ACTIVE_USER', () => {
    it('updates activeUserId', () => {
      const state = usersReducer(initialUsersState, {
        type: 'SET_ACTIVE_USER',
        userId: 'u1',
      });
      expect(state.activeUserId).toBe('u1');
    });

    it('sets activeUserId to null', () => {
      const stateWithActive: CometChatUsersState = {
        ...initialUsersState,
        activeUserId: 'u1',
      };
      const state = usersReducer(stateWithActive, {
        type: 'SET_ACTIVE_USER',
        userId: null,
      });
      expect(state.activeUserId).toBeNull();
    });
  });

  describe('RESET', () => {
    it('returns initial state but preserves selection and active user', () => {
      const stateWithData: CometChatUsersState = {
        users: [createMockUser('u1'), createMockUser('u2')],
        fetchState: 'loaded',
        hasMore: false,
        error: null,
        selectedUserIds: ['u1'],
        selectedUsersMap: new Map([['u1', createMockUser('u1')]]),
        activeUserId: 'u1',
        searchText: 'alice',
      };
      const state = usersReducer(stateWithData, { type: 'RESET' });
      expect(state.users).toEqual([]);
      expect(state.fetchState).toBe('idle');
      expect(state.hasMore).toBe(true);
      expect(state.error).toBeNull();
      // Preserved:
      expect(state.selectedUserIds).toEqual(['u1']);
      expect(state.selectedUsersMap.size).toBe(1);
      expect(state.activeUserId).toBe('u1');
      expect(state.searchText).toBe('alice');
    });
  });

  describe('unknown action', () => {
    it('returns unchanged state', () => {
      const state = usersReducer(initialUsersState, {
        type: 'UNKNOWN_ACTION',
      } as unknown as CometChatUsersAction);
      expect(state).toBe(initialUsersState);
    });
  });
});
