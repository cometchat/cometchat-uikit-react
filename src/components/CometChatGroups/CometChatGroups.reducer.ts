import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatFetchState } from '../../types';

// ==================== State ====================

export interface CometChatGroupsState {
  /** List of fetched groups. */
  groups: CometChat.Group[];
  /** Current fetch lifecycle state. */
  fetchState: CometChatFetchState;
  /** Whether more pages are available. */
  hasMore: boolean;
  /** Error message (if fetchState is 'error'). */
  error: string | null;
  /** GUIDs of selected groups. */
  selectedGroupIds: string[];
  /** Full group objects for selected groups (persists across search). */
  selectedGroupsMap: Map<string, CometChat.Group>;
  /** Currently active/highlighted group GUID. */
  activeGroupId: string | null;
  /** Current search text. */
  searchText: string;
}

// ==================== Actions ====================

export type CometChatGroupsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; groups: CometChat.Group[]; hasMore: boolean }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'UPDATE_GROUP'; group: CometChat.Group }
  | { type: 'ADD_GROUP'; group: CometChat.Group }
  | { type: 'REMOVE_GROUP'; groupId: string }
  | { type: 'SET_SEARCH_TEXT'; searchText: string }
  | { type: 'SELECT_GROUP'; group: CometChat.Group }
  | { type: 'DESELECT_GROUP'; groupId: string }
  | { type: 'SELECT_RANGE'; groups: CometChat.Group[] }
  | { type: 'DESELECT_RANGE'; groupIds: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_ACTIVE_GROUP'; groupId: string | null }
  | { type: 'RESET' };

// ==================== Initial State ====================

export const initialGroupsState: CometChatGroupsState = {
  groups: [],
  fetchState: 'idle',
  hasMore: true,
  error: null,
  selectedGroupIds: [],
  selectedGroupsMap: new Map(),
  activeGroupId: null,
  searchText: '',
};

// ==================== Reducer ====================

export function groupsReducer(
  state: CometChatGroupsState,
  action: CometChatGroupsAction
): CometChatGroupsState {
  switch (action.type) {
    case 'FETCH_START': {
      return {
        ...state,
        fetchState: state.groups.length === 0 ? 'loading' : state.fetchState,
        error: null,
      };
    }

    case 'FETCH_SUCCESS': {
      const merged = [...state.groups, ...action.groups];
      const fetchState: CometChatFetchState = merged.length === 0 ? 'empty' : 'loaded';
      return {
        ...state,
        groups: merged,
        fetchState,
        hasMore: action.hasMore,
      };
    }

    case 'FETCH_ERROR': {
      return {
        ...state,
        fetchState: state.groups.length === 0 ? 'error' : state.fetchState,
        error: action.error,
      };
    }

    case 'UPDATE_GROUP': {
      const guid = action.group.getGuid();
      const idx = state.groups.findIndex(g => g.getGuid() === guid);
      if (idx === -1) return state;

      const updatedGroups = [...state.groups];
      updatedGroups[idx] = action.group;
      return {
        ...state,
        groups: updatedGroups,
      };
    }

    case 'ADD_GROUP': {
      const exists = state.groups.some(g => g.getGuid() === action.group.getGuid());
      if (exists) return state;
      return {
        ...state,
        groups: [action.group, ...state.groups],
        fetchState: 'loaded',
      };
    }

    case 'REMOVE_GROUP': {
      const filtered = state.groups.filter(g => g.getGuid() !== action.groupId);
      if (filtered.length === state.groups.length) return state;

      return {
        ...state,
        groups: filtered,
        fetchState: filtered.length === 0 ? 'empty' : state.fetchState,
      };
    }

    case 'SET_SEARCH_TEXT': {
      return {
        ...state,
        searchText: action.searchText,
      };
    }

    case 'SELECT_GROUP': {
      const guid = action.group.getGuid();
      if (state.selectedGroupIds.includes(guid)) return state;

      const newMap = new Map(state.selectedGroupsMap);
      newMap.set(guid, action.group);
      return {
        ...state,
        selectedGroupIds: [...state.selectedGroupIds, guid],
        selectedGroupsMap: newMap,
      };
    }

    case 'DESELECT_GROUP': {
      if (!state.selectedGroupIds.includes(action.groupId)) return state;

      const newMap = new Map(state.selectedGroupsMap);
      newMap.delete(action.groupId);
      return {
        ...state,
        selectedGroupIds: state.selectedGroupIds.filter(id => id !== action.groupId),
        selectedGroupsMap: newMap,
      };
    }

    case 'SELECT_RANGE': {
      const newIds = action.groups
        .map(g => g.getGuid())
        .filter(guid => !state.selectedGroupIds.includes(guid));

      if (newIds.length === 0) return state;

      const newMap = new Map(state.selectedGroupsMap);
      action.groups.forEach(g => {
        newMap.set(g.getGuid(), g);
      });

      return {
        ...state,
        selectedGroupIds: [...state.selectedGroupIds, ...newIds],
        selectedGroupsMap: newMap,
      };
    }

    case 'DESELECT_RANGE': {
      const idsToRemove = new Set(action.groupIds);
      const newMap = new Map(state.selectedGroupsMap);
      action.groupIds.forEach(id => newMap.delete(id));

      return {
        ...state,
        selectedGroupIds: state.selectedGroupIds.filter(id => !idsToRemove.has(id)),
        selectedGroupsMap: newMap,
      };
    }

    case 'CLEAR_SELECTION': {
      return {
        ...state,
        selectedGroupIds: [],
        selectedGroupsMap: new Map(),
      };
    }

    case 'SET_ACTIVE_GROUP': {
      return {
        ...state,
        activeGroupId: action.groupId,
      };
    }

    case 'RESET': {
      // Preserve selection across resets (search, reconnect)
      return {
        ...initialGroupsState,
        selectedGroupIds: state.selectedGroupIds,
        selectedGroupsMap: state.selectedGroupsMap,
        activeGroupId: state.activeGroupId,
        searchText: state.searchText,
      };
    }

    default: {
      return state;
    }
  }
}
