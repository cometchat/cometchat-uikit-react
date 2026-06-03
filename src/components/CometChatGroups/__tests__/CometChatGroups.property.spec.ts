import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  groupsReducer,
  initialGroupsState,
  type CometChatGroupsAction,
} from '../CometChatGroups.reducer';

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

describe('CometChatGroups property-based tests', () => {
  it('FETCH_SUCCESS with any array of groups never throws', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 0, maxLength: 200 }),
        guids => {
          const groups = guids.map(guid => createMockGroup(guid));
          const state = groupsReducer(initialGroupsState, {
            type: 'FETCH_SUCCESS',
            groups,
            hasMore: groups.length > 0,
          });
          expect(state.groups.length).toBe(groups.length);
          expect(state.fetchState).toBe(groups.length === 0 ? 'empty' : 'loaded');
        }
      )
    );
  });

  it('state transitions are valid — no impossible states', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant({ type: 'FETCH_START' } as CometChatGroupsAction),
          fc.constant({
            type: 'FETCH_SUCCESS',
            groups: [createMockGroup('g1')],
            hasMore: true,
          } as CometChatGroupsAction),
          fc.constant({ type: 'FETCH_ERROR', error: 'fail' } as CometChatGroupsAction),
          fc.constant({ type: 'RESET' } as CometChatGroupsAction)
        ),
        action => {
          const state = groupsReducer(initialGroupsState, action);
          // fetchState must be one of the valid values
          expect(['idle', 'loading', 'loaded', 'error', 'empty']).toContain(state.fetchState);
          // hasMore must be boolean
          expect(typeof state.hasMore).toBe('boolean');
          // groups must be an array
          expect(Array.isArray(state.groups)).toBe(true);
        }
      )
    );
  });

  it('SELECT_GROUP followed by DESELECT_GROUP returns to original selection', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 10 }), guid => {
        const group = createMockGroup(guid);
        let state = groupsReducer(initialGroupsState, { type: 'SELECT_GROUP', group });
        expect(state.selectedGroupIds).toContain(guid);

        state = groupsReducer(state, { type: 'DESELECT_GROUP', groupId: guid });
        expect(state.selectedGroupIds).not.toContain(guid);
        expect(state.selectedGroupsMap.has(guid)).toBe(false);
      })
    );
  });

  it('SELECT_RANGE is idempotent — selecting same groups twice does not duplicate', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 8 }), { minLength: 1, maxLength: 20 }),
        guids => {
          const uniqueGuids = [...new Set(guids)];
          const groups = uniqueGuids.map(guid => createMockGroup(guid));

          let state = groupsReducer(initialGroupsState, { type: 'SELECT_RANGE', groups });
          state = groupsReducer(state, { type: 'SELECT_RANGE', groups });

          expect(state.selectedGroupIds.length).toBe(uniqueGuids.length);
        }
      )
    );
  });

  it('RESET preserves selection regardless of state', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 8 }), { minLength: 0, maxLength: 10 }),
        guids => {
          const uniqueGuids = [...new Set(guids)];
          const groups = uniqueGuids.map(guid => createMockGroup(guid));

          let state = groupsReducer(initialGroupsState, { type: 'SELECT_RANGE', groups });
          const selectedBefore = [...state.selectedGroupIds];

          state = groupsReducer(state, { type: 'RESET' });

          expect(state.selectedGroupIds).toEqual(selectedBefore);
          expect(state.groups).toEqual([]);
          expect(state.fetchState).toBe('idle');
        }
      )
    );
  });

  it('ADD_GROUP/REMOVE_GROUP consistency — add then remove returns to original length', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 10 }), guid => {
        const group = createMockGroup(guid);

        let state = groupsReducer(initialGroupsState, { type: 'ADD_GROUP', group });
        expect(state.groups.length).toBe(1);
        expect(state.groups[0]?.getGuid()).toBe(guid);

        state = groupsReducer(state, { type: 'REMOVE_GROUP', groupId: guid });
        expect(state.groups.length).toBe(0);
      })
    );
  });

  it('SET_SEARCH_TEXT with any string does not corrupt state', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 100 }), text => {
        const state = groupsReducer(initialGroupsState, {
          type: 'SET_SEARCH_TEXT',
          searchText: text,
        });
        expect(state.searchText).toBe(text);
        // Other state fields unchanged
        expect(state.groups).toEqual([]);
        expect(state.fetchState).toBe('idle');
      })
    );
  });
});
