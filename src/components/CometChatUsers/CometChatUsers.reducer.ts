import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatFetchState } from '../../types';

// ==================== State ====================

export interface CometChatUsersState {
  /** List of fetched users. */
  users: CometChat.User[];
  /** Current fetch lifecycle state. */
  fetchState: CometChatFetchState;
  /** Whether more pages are available. */
  hasMore: boolean;
  /** Error message (if fetchState is 'error'). */
  error: string | null;
  /** UIDs of selected users. */
  selectedUserIds: string[];
  /** Full user objects for selected users (persists across search). */
  selectedUsersMap: Map<string, CometChat.User>;
  /** Currently active/highlighted user UID. */
  activeUserId: string | null;
  /** Current search text. */
  searchText: string;
}

// ==================== Actions ====================

export type CometChatUsersAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; users: CometChat.User[]; hasMore: boolean }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'UPDATE_USER'; user: CometChat.User }
  | { type: 'SET_SEARCH_TEXT'; searchText: string }
  | { type: 'SELECT_USER'; user: CometChat.User }
  | { type: 'DESELECT_USER'; userId: string }
  | { type: 'SELECT_RANGE'; users: CometChat.User[] }
  | { type: 'DESELECT_RANGE'; userIds: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_ACTIVE_USER'; userId: string | null }
  | { type: 'RESET' };

// ==================== Initial State ====================

export const initialUsersState: CometChatUsersState = {
  users: [],
  fetchState: 'idle',
  hasMore: true,
  error: null,
  selectedUserIds: [],
  selectedUsersMap: new Map(),
  activeUserId: null,
  searchText: '',
};

// ==================== Reducer ====================

export function usersReducer(
  state: CometChatUsersState,
  action: CometChatUsersAction
): CometChatUsersState {
  switch (action.type) {
    case 'FETCH_START': {
      return {
        ...state,
        fetchState: state.users.length === 0 ? 'loading' : state.fetchState,
        error: null,
      };
    }

    case 'FETCH_SUCCESS': {
      const merged = [...state.users, ...action.users];
      const fetchState: CometChatFetchState = merged.length === 0 ? 'empty' : 'loaded';
      return {
        ...state,
        users: merged,
        fetchState,
        hasMore: action.hasMore,
      };
    }

    case 'FETCH_ERROR': {
      return {
        ...state,
        fetchState: state.users.length === 0 ? 'error' : state.fetchState,
        error: action.error,
      };
    }

    case 'UPDATE_USER': {
      const uid = action.user.getUid();
      const idx = state.users.findIndex(u => u.getUid() === uid);
      if (idx === -1) return state;

      const updatedUsers = [...state.users];
      updatedUsers[idx] = action.user;
      return {
        ...state,
        users: updatedUsers,
      };
    }

    case 'SET_SEARCH_TEXT': {
      return {
        ...state,
        searchText: action.searchText,
      };
    }

    case 'SELECT_USER': {
      const uid = action.user.getUid();
      if (state.selectedUserIds.includes(uid)) return state;

      const newMap = new Map(state.selectedUsersMap);
      newMap.set(uid, action.user);
      return {
        ...state,
        selectedUserIds: [...state.selectedUserIds, uid],
        selectedUsersMap: newMap,
      };
    }

    case 'DESELECT_USER': {
      if (!state.selectedUserIds.includes(action.userId)) return state;

      const newMap = new Map(state.selectedUsersMap);
      newMap.delete(action.userId);
      return {
        ...state,
        selectedUserIds: state.selectedUserIds.filter(id => id !== action.userId),
        selectedUsersMap: newMap,
      };
    }

    case 'SELECT_RANGE': {
      const newIds = action.users
        .map(u => u.getUid())
        .filter(uid => !state.selectedUserIds.includes(uid));

      if (newIds.length === 0) return state;

      const newMap = new Map(state.selectedUsersMap);
      action.users.forEach(u => {
        newMap.set(u.getUid(), u);
      });

      return {
        ...state,
        selectedUserIds: [...state.selectedUserIds, ...newIds],
        selectedUsersMap: newMap,
      };
    }

    case 'DESELECT_RANGE': {
      const idsToRemove = new Set(action.userIds);
      const newMap = new Map(state.selectedUsersMap);
      action.userIds.forEach(id => newMap.delete(id));

      return {
        ...state,
        selectedUserIds: state.selectedUserIds.filter(id => !idsToRemove.has(id)),
        selectedUsersMap: newMap,
      };
    }

    case 'CLEAR_SELECTION': {
      return {
        ...state,
        selectedUserIds: [],
        selectedUsersMap: new Map(),
      };
    }

    case 'SET_ACTIVE_USER': {
      return {
        ...state,
        activeUserId: action.userId,
      };
    }

    case 'RESET': {
      // Preserve selection across resets (search, reconnect)
      return {
        ...initialUsersState,
        selectedUserIds: state.selectedUserIds,
        selectedUsersMap: state.selectedUsersMap,
        activeUserId: state.activeUserId,
        searchText: state.searchText,
      };
    }

    default: {
      return state;
    }
  }
}
