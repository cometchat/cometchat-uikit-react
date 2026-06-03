import { describe, it, expect } from 'vitest';
import {
  groupsReducer,
  initialGroupsState,
  type CometChatGroupsState,
  type CometChatGroupsAction,
} from '../CometChatGroups.reducer';

// --- Mock group factory ---
function createMockGroup(guid: string, name = 'Group', type = 'public', membersCount = 5) {
  return {
    getGuid: () => guid,
    getName: () => name,
    getType: () => type,
    getIcon: () => `https://example.com/${guid}.png`,
    getMembersCount: () => membersCount,
    getScope: () => 'admin',
    getOwner: () => 'owner-1',
    getHasJoined: () => true,
  } as unknown as CometChat.Group;
}

describe('groupsReducer', () => {
  describe('FETCH_START', () => {
    it('sets fetchState to loading when groups array is empty', () => {
      const state = groupsReducer(initialGroupsState, { type: 'FETCH_START' });
      expect(state.fetchState).toBe('loading');
      expect(state.error).toBeNull();
    });

    it('preserves current fetchState when groups already exist', () => {
      const stateWithGroups: CometChatGroupsState = {
        ...initialGroupsState,
        groups: [createMockGroup('g1')],
        fetchState: 'loaded',
      };
      const state = groupsReducer(stateWithGroups, { type: 'FETCH_START' });
      expect(state.fetchState).toBe('loaded');
      expect(state.error).toBeNull();
    });
  });

  describe('FETCH_SUCCESS', () => {
    it('appends groups and sets hasMore', () => {
      const groups = [createMockGroup('g1'), createMockGroup('g2')];
      const state = groupsReducer(initialGroupsState, {
        type: 'FETCH_SUCCESS',
        groups,
        hasMore: true,
      });
      expect(state.groups).toHaveLength(2);
      expect(state.hasMore).toBe(true);
      expect(state.fetchState).toBe('loaded');
    });

    it('sets fetchState to empty when no groups returned and list is empty', () => {
      const state = groupsReducer(initialGroupsState, {
        type: 'FETCH_SUCCESS',
        groups: [],
        hasMore: false,
      });
      expect(state.fetchState).toBe('empty');
      expect(state.hasMore).toBe(false);
    });

    it('appends to existing groups', () => {
      const stateWithGroups: CometChatGroupsState = {
        ...initialGroupsState,
        groups: [createMockGroup('g1')],
        fetchState: 'loaded',
      };
      const state = groupsReducer(stateWithGroups, {
        type: 'FETCH_SUCCESS',
        groups: [createMockGroup('g2')],
        hasMore: true,
      });
      expect(state.groups).toHaveLength(2);
    });
  });

  describe('FETCH_ERROR', () => {
    it('sets fetchState to error and stores message when list is empty', () => {
      const state = groupsReducer(initialGroupsState, {
        type: 'FETCH_ERROR',
        error: 'Network error',
      });
      expect(state.fetchState).toBe('error');
      expect(state.error).toBe('Network error');
    });

    it('preserves fetchState when groups already exist', () => {
      const stateWithGroups: CometChatGroupsState = {
        ...initialGroupsState,
        groups: [createMockGroup('g1')],
        fetchState: 'loaded',
      };
      const state = groupsReducer(stateWithGroups, {
        type: 'FETCH_ERROR',
        error: 'Network error',
      });
      expect(state.fetchState).toBe('loaded');
      expect(state.error).toBe('Network error');
    });
  });

  describe('UPDATE_GROUP', () => {
    it('updates matching group in list by GUID', () => {
      const group1 = createMockGroup('g1', 'Alpha', 'public', 5);
      const stateWithGroups: CometChatGroupsState = {
        ...initialGroupsState,
        groups: [group1, createMockGroup('g2', 'Beta')],
        fetchState: 'loaded',
      };
      const updatedGroup = createMockGroup('g1', 'Alpha', 'public', 10);
      const state = groupsReducer(stateWithGroups, {
        type: 'UPDATE_GROUP',
        group: updatedGroup,
      });
      expect(state.groups[0]?.getMembersCount()).toBe(10);
      expect(state.groups[1]?.getGuid()).toBe('g2');
    });

    it('is no-op for non-matching GUID', () => {
      const stateWithGroups: CometChatGroupsState = {
        ...initialGroupsState,
        groups: [createMockGroup('g1')],
        fetchState: 'loaded',
      };
      const state = groupsReducer(stateWithGroups, {
        type: 'UPDATE_GROUP',
        group: createMockGroup('g99'),
      });
      expect(state).toBe(stateWithGroups);
    });
  });

  describe('ADD_GROUP', () => {
    it('prepends group to list', () => {
      const stateWithGroups: CometChatGroupsState = {
        ...initialGroupsState,
        groups: [createMockGroup('g1')],
        fetchState: 'loaded',
      };
      const newGroup = createMockGroup('g2', 'New Group');
      const state = groupsReducer(stateWithGroups, {
        type: 'ADD_GROUP',
        group: newGroup,
      });
      expect(state.groups).toHaveLength(2);
      expect(state.groups[0]?.getGuid()).toBe('g2');
      expect(state.groups[1]?.getGuid()).toBe('g1');
      expect(state.fetchState).toBe('loaded');
    });

    it('sets fetchState to loaded when adding to empty list', () => {
      const newGroup = createMockGroup('g1', 'New Group');
      const state = groupsReducer(initialGroupsState, {
        type: 'ADD_GROUP',
        group: newGroup,
      });
      expect(state.groups).toHaveLength(1);
      expect(state.fetchState).toBe('loaded');
    });
  });

  describe('REMOVE_GROUP', () => {
    it('removes group by GUID', () => {
      const stateWithGroups: CometChatGroupsState = {
        ...initialGroupsState,
        groups: [createMockGroup('g1'), createMockGroup('g2'), createMockGroup('g3')],
        fetchState: 'loaded',
      };
      const state = groupsReducer(stateWithGroups, {
        type: 'REMOVE_GROUP',
        groupId: 'g2',
      });
      expect(state.groups).toHaveLength(2);
      expect(state.groups.map(g => g.getGuid())).toEqual(['g1', 'g3']);
    });

    it('sets fetchState to empty when last group is removed', () => {
      const stateWithGroups: CometChatGroupsState = {
        ...initialGroupsState,
        groups: [createMockGroup('g1')],
        fetchState: 'loaded',
      };
      const state = groupsReducer(stateWithGroups, {
        type: 'REMOVE_GROUP',
        groupId: 'g1',
      });
      expect(state.groups).toHaveLength(0);
      expect(state.fetchState).toBe('empty');
    });

    it('is no-op for non-matching GUID', () => {
      const stateWithGroups: CometChatGroupsState = {
        ...initialGroupsState,
        groups: [createMockGroup('g1')],
        fetchState: 'loaded',
      };
      const state = groupsReducer(stateWithGroups, {
        type: 'REMOVE_GROUP',
        groupId: 'g99',
      });
      expect(state).toBe(stateWithGroups);
    });
  });

  describe('SET_SEARCH_TEXT', () => {
    it('updates search text', () => {
      const state = groupsReducer(initialGroupsState, {
        type: 'SET_SEARCH_TEXT',
        searchText: 'dev',
      });
      expect(state.searchText).toBe('dev');
    });
  });

  describe('SELECT_GROUP', () => {
    it('adds group to selectedGroupIds and selectedGroupsMap', () => {
      const group = createMockGroup('g1', 'Alpha');
      const state = groupsReducer(initialGroupsState, {
        type: 'SELECT_GROUP',
        group,
      });
      expect(state.selectedGroupIds).toContain('g1');
      expect(state.selectedGroupsMap.get('g1')).toBe(group);
    });

    it('is no-op if group already selected', () => {
      const group = createMockGroup('g1', 'Alpha');
      const stateWithSelection: CometChatGroupsState = {
        ...initialGroupsState,
        selectedGroupIds: ['g1'],
        selectedGroupsMap: new Map([['g1', group]]),
      };
      const state = groupsReducer(stateWithSelection, {
        type: 'SELECT_GROUP',
        group,
      });
      expect(state).toBe(stateWithSelection);
    });
  });

  describe('DESELECT_GROUP', () => {
    it('removes group from selectedGroupIds and selectedGroupsMap', () => {
      const group = createMockGroup('g1', 'Alpha');
      const stateWithSelection: CometChatGroupsState = {
        ...initialGroupsState,
        selectedGroupIds: ['g1'],
        selectedGroupsMap: new Map([['g1', group]]),
      };
      const state = groupsReducer(stateWithSelection, {
        type: 'DESELECT_GROUP',
        groupId: 'g1',
      });
      expect(state.selectedGroupIds).not.toContain('g1');
      expect(state.selectedGroupsMap.has('g1')).toBe(false);
    });

    it('is no-op if group not selected', () => {
      const state = groupsReducer(initialGroupsState, {
        type: 'DESELECT_GROUP',
        groupId: 'g99',
      });
      expect(state).toBe(initialGroupsState);
    });
  });

  describe('SELECT_RANGE', () => {
    it('adds multiple groups to selection', () => {
      const groups = [createMockGroup('g1'), createMockGroup('g2'), createMockGroup('g3')];
      const state = groupsReducer(initialGroupsState, {
        type: 'SELECT_RANGE',
        groups,
      });
      expect(state.selectedGroupIds).toEqual(['g1', 'g2', 'g3']);
      expect(state.selectedGroupsMap.size).toBe(3);
    });

    it('does not duplicate already-selected groups', () => {
      const group1 = createMockGroup('g1');
      const stateWithSelection: CometChatGroupsState = {
        ...initialGroupsState,
        selectedGroupIds: ['g1'],
        selectedGroupsMap: new Map([['g1', group1]]),
      };
      const groups = [group1, createMockGroup('g2')];
      const state = groupsReducer(stateWithSelection, {
        type: 'SELECT_RANGE',
        groups,
      });
      expect(state.selectedGroupIds).toEqual(['g1', 'g2']);
    });

    it('is no-op when all groups already selected', () => {
      const group1 = createMockGroup('g1');
      const stateWithSelection: CometChatGroupsState = {
        ...initialGroupsState,
        selectedGroupIds: ['g1'],
        selectedGroupsMap: new Map([['g1', group1]]),
      };
      const state = groupsReducer(stateWithSelection, {
        type: 'SELECT_RANGE',
        groups: [group1],
      });
      expect(state).toBe(stateWithSelection);
    });
  });

  describe('DESELECT_RANGE', () => {
    it('removes multiple groups from selection', () => {
      const group1 = createMockGroup('g1');
      const group2 = createMockGroup('g2');
      const group3 = createMockGroup('g3');
      const stateWithSelection: CometChatGroupsState = {
        ...initialGroupsState,
        selectedGroupIds: ['g1', 'g2', 'g3'],
        selectedGroupsMap: new Map([
          ['g1', group1],
          ['g2', group2],
          ['g3', group3],
        ]),
      };
      const state = groupsReducer(stateWithSelection, {
        type: 'DESELECT_RANGE',
        groupIds: ['g1', 'g3'],
      });
      expect(state.selectedGroupIds).toEqual(['g2']);
      expect(state.selectedGroupsMap.size).toBe(1);
    });
  });

  describe('CLEAR_SELECTION', () => {
    it('empties selectedGroupIds and selectedGroupsMap', () => {
      const stateWithSelection: CometChatGroupsState = {
        ...initialGroupsState,
        selectedGroupIds: ['g1', 'g2'],
        selectedGroupsMap: new Map([
          ['g1', createMockGroup('g1')],
          ['g2', createMockGroup('g2')],
        ]),
      };
      const state = groupsReducer(stateWithSelection, { type: 'CLEAR_SELECTION' });
      expect(state.selectedGroupIds).toEqual([]);
      expect(state.selectedGroupsMap.size).toBe(0);
    });
  });

  describe('SET_ACTIVE_GROUP', () => {
    it('updates activeGroupId', () => {
      const state = groupsReducer(initialGroupsState, {
        type: 'SET_ACTIVE_GROUP',
        groupId: 'g1',
      });
      expect(state.activeGroupId).toBe('g1');
    });

    it('sets activeGroupId to null', () => {
      const stateWithActive: CometChatGroupsState = {
        ...initialGroupsState,
        activeGroupId: 'g1',
      };
      const state = groupsReducer(stateWithActive, {
        type: 'SET_ACTIVE_GROUP',
        groupId: null,
      });
      expect(state.activeGroupId).toBeNull();
    });
  });

  describe('RESET', () => {
    it('returns initial state but preserves selection and active group', () => {
      const stateWithData: CometChatGroupsState = {
        groups: [createMockGroup('g1'), createMockGroup('g2')],
        fetchState: 'loaded',
        hasMore: false,
        error: null,
        selectedGroupIds: ['g1'],
        selectedGroupsMap: new Map([['g1', createMockGroup('g1')]]),
        activeGroupId: 'g1',
        searchText: 'dev',
      };
      const state = groupsReducer(stateWithData, { type: 'RESET' });
      expect(state.groups).toEqual([]);
      expect(state.fetchState).toBe('idle');
      expect(state.hasMore).toBe(true);
      expect(state.error).toBeNull();
      // Preserved:
      expect(state.selectedGroupIds).toEqual(['g1']);
      expect(state.selectedGroupsMap.size).toBe(1);
      expect(state.activeGroupId).toBe('g1');
      expect(state.searchText).toBe('dev');
    });
  });

  describe('unknown action', () => {
    it('returns unchanged state', () => {
      const state = groupsReducer(initialGroupsState, {
        type: 'UNKNOWN_ACTION',
      } as unknown as CometChatGroupsAction);
      expect(state).toBe(initialGroupsState);
    });
  });
});
