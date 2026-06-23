import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { clone } from '../../utils/CometChatUIKitUtility';
import type { CometChatFetchState } from '../../types';

// ==================== State ====================

export interface CometChatGroupMembersState {
  /** List of fetched group members. */
  members: CometChat.GroupMember[];
  /** Current fetch lifecycle state. */
  fetchState: CometChatFetchState;
  /** Whether more pages are available. */
  hasMore: boolean;
  /** Error message (if fetchState is 'error'). */
  error: string | null;
  /** UIDs of selected members. */
  selectedMemberIds: string[];
  /** Full member objects for selected members (persists across search). */
  selectedMembersMap: Map<string, CometChat.GroupMember>;
  /** Currently active/highlighted member UID. */
  activeMemberId: string | null;
  /** Current search text. */
  searchText: string;
}

// ==================== Actions ====================

export type CometChatGroupMembersAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; members: CometChat.GroupMember[]; hasMore: boolean }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'UPDATE_MEMBER'; member: CometChat.GroupMember }
  | { type: 'ADD_MEMBER'; member: CometChat.GroupMember }
  | { type: 'REMOVE_MEMBER'; uid: string }
  | { type: 'UPDATE_MEMBER_SCOPE'; uid: string; scope: string }
  | { type: 'UPDATE_MEMBER_STATUS'; uid: string; status: string }
  | { type: 'SET_SEARCH_TEXT'; searchText: string }
  | { type: 'SELECT_MEMBER'; member: CometChat.GroupMember }
  | { type: 'DESELECT_MEMBER'; uid: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_ACTIVE_MEMBER'; uid: string | null }
  | { type: 'RESET' };

// ==================== Initial State ====================

export const initialGroupMembersState: CometChatGroupMembersState = {
  members: [],
  fetchState: 'idle',
  hasMore: true,
  error: null,
  selectedMemberIds: [],
  selectedMembersMap: new Map(),
  activeMemberId: null,
  searchText: '',
};

// ==================== Reducer ====================

export function groupMembersReducer(
  state: CometChatGroupMembersState,
  action: CometChatGroupMembersAction
): CometChatGroupMembersState {
  switch (action.type) {
    case 'FETCH_START': {
      return {
        ...state,
        fetchState: state.members.length === 0 ? 'loading' : state.fetchState,
        error: null,
      };
    }

    case 'FETCH_SUCCESS': {
      const merged = [...state.members, ...action.members];
      const fetchState: CometChatFetchState = merged.length === 0 ? 'empty' : 'loaded';
      return {
        ...state,
        members: merged,
        fetchState,
        hasMore: action.hasMore,
      };
    }

    case 'FETCH_ERROR': {
      return {
        ...state,
        fetchState: state.members.length === 0 ? 'error' : state.fetchState,
        error: action.error,
      };
    }

    case 'UPDATE_MEMBER': {
      const uid = action.member.getUid();
      const idx = state.members.findIndex(m => m.getUid() === uid);
      if (idx === -1) return state;

      const updatedMembers = [...state.members];
      updatedMembers[idx] = action.member;
      return {
        ...state,
        members: updatedMembers,
      };
    }

    case 'ADD_MEMBER': {
      // Prevent duplicates
      const existingIdx = state.members.findIndex(m => m.getUid() === action.member.getUid());
      if (existingIdx !== -1) return state;

      return {
        ...state,
        members: [...state.members, action.member],
        fetchState: 'loaded',
      };
    }

    case 'REMOVE_MEMBER': {
      const filtered = state.members.filter(m => m.getUid() !== action.uid);
      if (filtered.length === state.members.length) return state;

      return {
        ...state,
        members: filtered,
        fetchState: filtered.length === 0 ? 'empty' : state.fetchState,
      };
    }

    case 'UPDATE_MEMBER_SCOPE': {
      const idx = state.members.findIndex(m => m.getUid() === action.uid);
      if (idx === -1) return state;

      const updatedMembers = [...state.members];
      const member = updatedMembers[idx];
      if (member) {
        const clonedMember = clone(member);
        clonedMember.setScope(action.scope as unknown as CometChat.GroupMemberScope);
        updatedMembers[idx] = clonedMember;
      }
      return {
        ...state,
        members: updatedMembers,
      };
    }

    case 'UPDATE_MEMBER_STATUS': {
      const idx = state.members.findIndex(m => m.getUid() === action.uid);
      if (idx === -1) return state;

      const updatedMembers = [...state.members];
      const member = updatedMembers[idx];
      if (member) {
        member.setStatus(action.status);
      }
      return {
        ...state,
        members: updatedMembers,
      };
    }

    case 'SET_SEARCH_TEXT': {
      return {
        ...state,
        searchText: action.searchText,
      };
    }

    case 'SELECT_MEMBER': {
      const uid = action.member.getUid();
      if (state.selectedMemberIds.includes(uid)) return state;

      const newMap = new Map(state.selectedMembersMap);
      newMap.set(uid, action.member);
      return {
        ...state,
        selectedMemberIds: [...state.selectedMemberIds, uid],
        selectedMembersMap: newMap,
      };
    }

    case 'DESELECT_MEMBER': {
      if (!state.selectedMemberIds.includes(action.uid)) return state;

      const newMap = new Map(state.selectedMembersMap);
      newMap.delete(action.uid);
      return {
        ...state,
        selectedMemberIds: state.selectedMemberIds.filter(id => id !== action.uid),
        selectedMembersMap: newMap,
      };
    }

    case 'CLEAR_SELECTION': {
      return {
        ...state,
        selectedMemberIds: [],
        selectedMembersMap: new Map(),
      };
    }

    case 'SET_ACTIVE_MEMBER': {
      return {
        ...state,
        activeMemberId: action.uid,
      };
    }

    case 'RESET': {
      // Preserve selection across resets (search, reconnect)
      return {
        ...initialGroupMembersState,
        selectedMemberIds: state.selectedMemberIds,
        selectedMembersMap: state.selectedMembersMap,
        activeMemberId: state.activeMemberId,
        searchText: state.searchText,
      };
    }

    default: {
      return state;
    }
  }
}
