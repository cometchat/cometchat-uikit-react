import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { clone } from '../../utils/CometChatUIKitUtility';
import type { CometChatFetchState } from '../../types';
import {
  reduceEntityPage,
  reduceEntityPageError,
  offlineListStates,
  type EntityPagePayload,
} from '../../utils/offline/entityList';

const memberUidOf = (member: CometChat.GroupMember): string => member.getUid();

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
  /** Offline: a keyword search could not reach the server; nothing saved (offline on only). */
  connectToSearch?: boolean;
  /** Offline: nothing saved and not connected (never set offline off). */
  connectToLoad?: boolean;
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
  /** Offline path: one phase of a two-phase page read. */
  | { type: 'OFFLINE_PAGE'; page: EntityPagePayload<CometChat.GroupMember> }
  /** Offline path: a two-phase read ended without a server page. */
  | {
      type: 'OFFLINE_PAGE_ERROR';
      quiet?: boolean;
      notConnected: boolean;
      error: string;
      hasMore: boolean;
      /** The read carried a search keyword (absent: no). */
      keyword?: boolean;
    }
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

    case 'OFFLINE_PAGE': {
      const next = reduceEntityPage(
        { rows: state.members, fetchState: state.fetchState, hasMore: state.hasMore },
        action.page,
        memberUidOf
      );
      return {
        ...state,
        members: next.rows,
        fetchState: next.fetchState,
        hasMore: next.hasMore,
        ...(action.page.phase === 'server' && {
          error: null,
          connectToSearch: false,
          connectToLoad: false,
        }),
      };
    }

    case 'OFFLINE_PAGE_ERROR': {
      const next = reduceEntityPageError(
        { rows: state.members, fetchState: state.fetchState, hasMore: state.hasMore },
        action.notConnected,
        action.hasMore,
        action.quiet === true,
        action.keyword === true
      );
      const offline = offlineListStates(
        action.notConnected,
        action.keyword === true,
        next.rows.length
      );
      return {
        ...state,
        fetchState: next.fetchState,
        hasMore: next.hasMore,
        // Rows on screen keep the error out of sight; "Connect to search" is not an error.
        error:
          action.quiet ||
          (action.notConnected && (next.rows.length > 0 || offline.connectToSearch))
            ? state.error
            : action.error,
        ...(!action.quiet && offline),
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
