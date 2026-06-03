import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  usersReducer,
  initialUsersState,
  type CometChatUsersAction,
} from '../CometChatUsers.reducer';

function createMockUser(uid: string, name = 'User', status = 'offline') {
  return {
    getUid: () => uid,
    getName: () => name,
    getStatus: () => status,
    getAvatar: () => `https://example.com/${uid}.png`,
  } as unknown as CometChat.User;
}

describe('CometChatUsers property-based tests', () => {
  it('FETCH_SUCCESS with any array of users never throws', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 0, maxLength: 200 }),
        uids => {
          const users = uids.map(uid => createMockUser(uid));
          const state = usersReducer(initialUsersState, {
            type: 'FETCH_SUCCESS',
            users,
            hasMore: users.length > 0,
          });
          expect(state.users.length).toBe(users.length);
          expect(state.fetchState).toBe(users.length === 0 ? 'empty' : 'loaded');
        }
      )
    );
  });

  it('state transitions are valid — no impossible states', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant({ type: 'FETCH_START' } as CometChatUsersAction),
          fc.constant({
            type: 'FETCH_SUCCESS',
            users: [createMockUser('u1')],
            hasMore: true,
          } as CometChatUsersAction),
          fc.constant({ type: 'FETCH_ERROR', error: 'fail' } as CometChatUsersAction),
          fc.constant({ type: 'RESET' } as CometChatUsersAction)
        ),
        action => {
          const state = usersReducer(initialUsersState, action);
          // fetchState must be one of the valid values
          expect(['idle', 'loading', 'loaded', 'error', 'empty']).toContain(state.fetchState);
          // hasMore must be boolean
          expect(typeof state.hasMore).toBe('boolean');
          // users must be an array
          expect(Array.isArray(state.users)).toBe(true);
        }
      )
    );
  });

  it('SELECT_USER followed by DESELECT_USER returns to original selection', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 10 }), uid => {
        const user = createMockUser(uid);
        let state = usersReducer(initialUsersState, { type: 'SELECT_USER', user });
        expect(state.selectedUserIds).toContain(uid);

        state = usersReducer(state, { type: 'DESELECT_USER', userId: uid });
        expect(state.selectedUserIds).not.toContain(uid);
        expect(state.selectedUsersMap.has(uid)).toBe(false);
      })
    );
  });

  it('SELECT_RANGE is idempotent — selecting same users twice does not duplicate', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 8 }), { minLength: 1, maxLength: 20 }),
        uids => {
          const uniqueUids = [...new Set(uids)];
          const users = uniqueUids.map(uid => createMockUser(uid));

          let state = usersReducer(initialUsersState, { type: 'SELECT_RANGE', users });
          state = usersReducer(state, { type: 'SELECT_RANGE', users });

          expect(state.selectedUserIds.length).toBe(uniqueUids.length);
        }
      )
    );
  });

  it('RESET preserves selection regardless of state', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 8 }), { minLength: 0, maxLength: 10 }),
        uids => {
          const uniqueUids = [...new Set(uids)];
          const users = uniqueUids.map(uid => createMockUser(uid));

          let state = usersReducer(initialUsersState, { type: 'SELECT_RANGE', users });
          const selectedBefore = [...state.selectedUserIds];

          state = usersReducer(state, { type: 'RESET' });

          expect(state.selectedUserIds).toEqual(selectedBefore);
          expect(state.users).toEqual([]);
          expect(state.fetchState).toBe('idle');
        }
      )
    );
  });

  it('SET_SEARCH_TEXT with any string does not corrupt state', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 100 }), text => {
        const state = usersReducer(initialUsersState, {
          type: 'SET_SEARCH_TEXT',
          searchText: text,
        });
        expect(state.searchText).toBe(text);
        // Other state fields unchanged
        expect(state.users).toEqual([]);
        expect(state.fetchState).toBe('idle');
      })
    );
  });
});
