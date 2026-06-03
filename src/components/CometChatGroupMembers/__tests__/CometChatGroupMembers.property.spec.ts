import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  groupMembersReducer,
  initialGroupMembersState,
  type CometChatGroupMembersAction,
} from '../CometChatGroupMembers.reducer';

// --- Mock member factory for property tests ---
function createMockMember(uid: string, scope = 'participant') {
  return {
    getUid: () => uid,
    getName: () => `User ${uid}`,
    getAvatar: () => '',
    getScope: () => scope,
    getStatus: () => 'online',
    setScope: () => undefined,
    setStatus: () => undefined,
  } as unknown as CometChat.GroupMember;
}

// --- Arbitrary generators ---
const memberArb = fc.string({ minLength: 1, maxLength: 10 }).map(uid => createMockMember(uid));

const validActionArb: fc.Arbitrary<CometChatGroupMembersAction> = fc.oneof(
  fc.constant({ type: 'FETCH_START' } as CometChatGroupMembersAction),
  fc.array(memberArb, { minLength: 0, maxLength: 5 }).chain(members =>
    fc.constant({
      type: 'FETCH_SUCCESS',
      members,
      hasMore: members.length > 0,
    } as CometChatGroupMembersAction)
  ),
  fc.string().map(error => ({ type: 'FETCH_ERROR', error }) as CometChatGroupMembersAction),
  memberArb.map(member => ({ type: 'ADD_MEMBER', member }) as CometChatGroupMembersAction),
  fc
    .string({ minLength: 1 })
    .map(uid => ({ type: 'REMOVE_MEMBER', uid }) as CometChatGroupMembersAction),
  memberArb.map(member => ({ type: 'SELECT_MEMBER', member }) as CometChatGroupMembersAction),
  fc
    .string({ minLength: 1 })
    .map(uid => ({ type: 'DESELECT_MEMBER', uid }) as CometChatGroupMembersAction),
  fc.constant({ type: 'CLEAR_SELECTION' } as CometChatGroupMembersAction),
  fc.constant({ type: 'RESET' } as CometChatGroupMembersAction)
);

describe('CometChatGroupMembers — Property-Based Tests', () => {
  it('fetchNext always returns array (reducer never sets members to non-array)', () => {
    fc.assert(
      fc.property(fc.array(validActionArb, { minLength: 1, maxLength: 20 }), actions => {
        let state = initialGroupMembersState;
        for (const action of actions) {
          state = groupMembersReducer(state, action);
        }
        expect(Array.isArray(state.members)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('state transitions are valid: fetchState is always a valid value', () => {
    const validStates = new Set(['idle', 'loading', 'loaded', 'error', 'empty']);

    fc.assert(
      fc.property(fc.array(validActionArb, { minLength: 1, maxLength: 20 }), actions => {
        let state = initialGroupMembersState;
        for (const action of actions) {
          state = groupMembersReducer(state, action);
          expect(validStates.has(state.fetchState)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('selection state is always consistent (selectedMemberIds matches selectedMembersMap keys)', () => {
    fc.assert(
      fc.property(fc.array(validActionArb, { minLength: 1, maxLength: 20 }), actions => {
        let state = initialGroupMembersState;
        for (const action of actions) {
          state = groupMembersReducer(state, action);
        }
        const mapKeys = [...state.selectedMembersMap.keys()].sort();
        const ids = [...state.selectedMemberIds].sort();
        expect(ids).toEqual(mapKeys);
      }),
      { numRuns: 100 }
    );
  });

  it('RESET always preserves selection', () => {
    fc.assert(
      fc.property(fc.array(memberArb, { minLength: 1, maxLength: 5 }), members => {
        // Build up some selection state
        let state = initialGroupMembersState;
        for (const member of members) {
          state = groupMembersReducer(state, { type: 'SELECT_MEMBER', member });
        }
        const selectionBefore = [...state.selectedMemberIds];

        // Reset
        state = groupMembersReducer(state, { type: 'RESET' });

        // Selection should be preserved
        expect(state.selectedMemberIds).toEqual(selectionBefore);
        expect(state.members).toEqual([]);
        expect(state.fetchState).toBe('idle');
      }),
      { numRuns: 50 }
    );
  });

  it('member list never contains duplicates (by UID) after ADD_MEMBER', () => {
    fc.assert(
      fc.property(fc.array(memberArb, { minLength: 1, maxLength: 10 }), members => {
        let state = initialGroupMembersState;
        // Add all members (some may have duplicate UIDs)
        for (const member of members) {
          state = groupMembersReducer(state, { type: 'ADD_MEMBER', member });
        }
        const uids = state.members.map(m => m.getUid());
        const uniqueUids = new Set(uids);
        expect(uids.length).toBe(uniqueUids.size);
      }),
      { numRuns: 100 }
    );
  });
});
