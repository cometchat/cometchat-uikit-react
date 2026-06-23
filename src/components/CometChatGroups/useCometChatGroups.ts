import { useCallback, useEffect, useId, useReducer, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupsManager } from './CometChatGroupsManager';
import { groupsReducer, initialGroupsState } from './CometChatGroups.reducer';
import type {
  CometChatUseCometChatGroupsOptions,
  CometChatUseCometChatGroupsReturn,
} from './CometChatGroups.types';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { useCometChatGroupsEvents } from './useCometChatGroupsEvents';
import { usePublishEvent } from '../../hooks/usePublishEvent';

/**
 * useCometChatGroups — orchestration hook for the groups list data layer.
 *
 * Creates the Manager, attaches SDK listeners, dispatches reducer actions,
 * and exposes a clean API to the Provider.
 */
export function useCometChatGroups(
  options: CometChatUseCometChatGroupsOptions = {}
): CometChatUseCometChatGroupsReturn {
  const {
    groupsRequestBuilder,
    searchRequestBuilder,
    searchKeyword = '',
    selectionMode = 'none',
    activeGroup,
    onError,
    onEmpty,
    onSelect,
    onItemClick,
  } = options;

  const [state, dispatch] = useReducer(groupsReducer, initialGroupsState);
  const managerRef = useRef<CometChatGroupsManager | null>(null);
  const fetchIdRef = useRef<string>('');
  const instanceId = useId();
  const anchorIndexRef = useRef<number | null>(null);
  const anchorGuidRef = useRef<string | null>(null);
  const groupsRef = useRef<CometChat.Group[]>([]);
  const publish = usePublishEvent();

  groupsRef.current = state.groups;

  // --- Error handler ---
  const handleError = useCallback(
    (error: unknown) => {
      if (onError) onError(error as CometChat.CometChatException);
      const message = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'FETCH_ERROR', error: message });
    },
    [onError]
  );

  // --- Build request builder with search ---
  const buildRequestBuilder = useCallback(
    (search: string): CometChat.GroupsRequestBuilder => {
      let builder: CometChat.GroupsRequestBuilder;

      if (search && searchRequestBuilder) {
        builder = searchRequestBuilder;
        builder.setSearchKeyword(search);
      } else if (search && groupsRequestBuilder) {
        builder = groupsRequestBuilder;
        builder.setSearchKeyword(search);
      } else if (groupsRequestBuilder) {
        builder = groupsRequestBuilder;
        if (!search) builder.setSearchKeyword('');
      } else {
        builder = new CometChat.GroupsRequestBuilder().setLimit(30);
        if (search) builder.setSearchKeyword(search);
      }

      return builder;
    },
    [groupsRequestBuilder, searchRequestBuilder]
  );

  // --- Fetch next page ---
  const fetchNext = useCallback(async () => {
    if (!managerRef.current || !state.hasMore || state.fetchState === 'loading') return;

    const currentFetchId = `fetch_${String(Date.now())}`;
    fetchIdRef.current = currentFetchId;
    dispatch({ type: 'FETCH_START' });

    try {
      const groups = await managerRef.current.fetchNext();
      // Guard against stale fetches
      if (fetchIdRef.current !== currentFetchId) return;

      const hasMore = groups.length > 0;
      dispatch({ type: 'FETCH_SUCCESS', groups, hasMore });

      // Emit onEmpty if first fetch returned no results
      if (!hasMore && state.groups.length === 0) {
        onEmpty?.();
      }
    } catch (error: unknown) {
      if (fetchIdRef.current !== currentFetchId) return;
      handleError(error);
    }
  }, [state.hasMore, state.fetchState, state.groups.length, handleError, onEmpty]);

  // --- Initialize Manager + first fetch ---
  const initializeAndFetch = useCallback(
    (search: string) => {
      const builder = buildRequestBuilder(search);
      managerRef.current = new CometChatGroupsManager(builder);
      dispatch({ type: 'RESET' });
      // Trigger fetch after reset
      const currentFetchId = `fetch_${String(Date.now())}`;
      fetchIdRef.current = currentFetchId;
      dispatch({ type: 'FETCH_START' });

      managerRef.current
        .fetchNext()
        .then(groups => {
          if (fetchIdRef.current !== currentFetchId) return;
          const hasMore = groups.length > 0;
          dispatch({ type: 'FETCH_SUCCESS', groups, hasMore });
          if (!hasMore) onEmpty?.();
        })
        .catch((error: unknown) => {
          if (fetchIdRef.current !== currentFetchId) return;
          handleError(error);
        });
    },
    [buildRequestBuilder, handleError, onEmpty]
  );

  // --- Initial fetch on mount and when builders change ---
  useEffect(() => {
    initializeAndFetch(searchKeyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupsRequestBuilder, searchRequestBuilder, searchKeyword]);

  // --- Set search text (triggers re-fetch) ---
  const setSearchText = useCallback(
    (text: string) => {
      dispatch({ type: 'SET_SEARCH_TEXT', searchText: text });
      initializeAndFetch(text);
    },
    [initializeAndFetch]
  );

  // --- Group listener ---
  useEffect(() => {
    const listenerId = `CometChatGroups_group_${instanceId}`;

    let loggedInUid: string | null = null;

    // Resolve the logged-in user UID asynchronously and cache it
    void CometChat.getLoggedinUser().then(user => {
      if (user) {
        loggedInUid = user.getUid();
      }
    });

    const getLoggedInUserUid = (): string | null => loggedInUid;

    const cleanup = CometChatGroupsManager.attachGroupListener(listenerId, {
      onGroupMemberJoined: (_message, _joinedUser, joinedGroup) => {
        // SDK may provide incorrect membersCount — increment from local state
        const guid = joinedGroup.getGuid();
        const existing = groupsRef.current.find(g => g.getGuid() === guid);
        if (existing) {
          joinedGroup.setMembersCount(existing.getMembersCount() + 1);
        }
        dispatch({ type: 'UPDATE_GROUP', group: joinedGroup });
      },
      onGroupMemberLeft: (_message, leavingUser, group) => {
        const loggedInUid = getLoggedInUserUid();
        if (loggedInUid && leavingUser.getUid() === loggedInUid) {
          dispatch({ type: 'REMOVE_GROUP', groupId: group.getGuid() });
        } else {
          const guid = group.getGuid();
          const existing = groupsRef.current.find(g => g.getGuid() === guid);
          if (existing) {
            group.setMembersCount(Math.max(0, existing.getMembersCount() - 1));
          }
          dispatch({ type: 'UPDATE_GROUP', group });
        }
      },
      onGroupMemberBanned: (_message, bannedUser, _bannedBy, bannedFrom) => {
        const loggedInUid = getLoggedInUserUid();
        if (loggedInUid && bannedUser.getUid() === loggedInUid) {
          dispatch({ type: 'REMOVE_GROUP', groupId: bannedFrom.getGuid() });
        } else {
          const guid = bannedFrom.getGuid();
          const existing = groupsRef.current.find(g => g.getGuid() === guid);
          if (existing) {
            bannedFrom.setMembersCount(Math.max(0, existing.getMembersCount() - 1));
          }
          dispatch({ type: 'UPDATE_GROUP', group: bannedFrom });
        }
      },
      onGroupMemberKicked: (_message, kickedUser, _kickedBy, kickedFrom) => {
        const loggedInUid = getLoggedInUserUid();
        if (loggedInUid && kickedUser.getUid() === loggedInUid) {
          dispatch({ type: 'REMOVE_GROUP', groupId: kickedFrom.getGuid() });
        } else {
          const guid = kickedFrom.getGuid();
          const existing = groupsRef.current.find(g => g.getGuid() === guid);
          if (existing) {
            kickedFrom.setMembersCount(Math.max(0, existing.getMembersCount() - 1));
          }
          dispatch({ type: 'UPDATE_GROUP', group: kickedFrom });
        }
      },
      onGroupMemberScopeChanged: (_message, _changedUser, _newScope, _oldScope, changedGroup) => {
        const guid = changedGroup.getGuid();
        const existing = groupsRef.current.find(g => g.getGuid() === guid);
        if (existing) {
          changedGroup.setMembersCount(existing.getMembersCount());
        }
        dispatch({ type: 'UPDATE_GROUP', group: changedGroup });
      },
    });

    return cleanup;
  }, [instanceId]);

  // --- Connection recovery ---
  useEffect(() => {
    const listenerId = `CometChatGroups_conn_${instanceId}`;
    const cleanup = CometChatGroupsManager.attachConnectionListener(listenerId, {
      onConnected: () => {
        CometChatLogger.info('CometChatGroups', 'Connection recovered, re-fetching groups');
        initializeAndFetch(state.searchText);
      },
    });

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId, initializeAndFetch]);

  // --- Active group sync ---
  useEffect(() => {
    const guid = activeGroup?.getGuid() ?? null;
    dispatch({ type: 'SET_ACTIVE_GROUP', groupId: guid });
  }, [activeGroup]);

  // --- UI Events subscription (cross-component communication) ---
  useCometChatGroupsEvents({ dispatch });

  // --- Selection actions ---
  const selectGroup = useCallback(
    (group: CometChat.Group) => {
      dispatch({ type: 'SELECT_GROUP', group });
      onSelect?.(group, true);
    },
    [onSelect]
  );

  const deselectGroup = useCallback(
    (groupId: string) => {
      const group = state.selectedGroupsMap.get(groupId);
      dispatch({ type: 'DESELECT_GROUP', groupId });
      if (group) onSelect?.(group, false);
    },
    [onSelect, state.selectedGroupsMap]
  );

  const selectRange = useCallback(
    (groups: CometChat.Group[]) => {
      dispatch({ type: 'SELECT_RANGE', groups });
      groups.forEach(g => {
        if (!state.selectedGroupIds.includes(g.getGuid())) {
          onSelect?.(g, true);
        }
      });
    },
    [onSelect, state.selectedGroupIds]
  );

  const deselectRange = useCallback(
    (groupIds: string[]) => {
      groupIds.forEach(guid => {
        const group = state.selectedGroupsMap.get(guid);
        if (group) onSelect?.(group, false);
      });
      dispatch({ type: 'DESELECT_RANGE', groupIds });
    },
    [onSelect, state.selectedGroupsMap]
  );

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const setActiveGroup = useCallback((groupId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_GROUP', groupId });
  }, []);

  // --- Handle item click with selection logic ---
  const handleItemClick = useCallback(
    (group: CometChat.Group, event?: { shiftKey?: boolean }) => {
      const guid = group.getGuid();
      const clickedIndex = state.groups.findIndex(g => g.getGuid() === guid);
      const isShiftClick = event?.shiftKey === true;

      if (selectionMode === 'multiple') {
        if (isShiftClick && anchorIndexRef.current !== null) {
          // Shift-click range selection
          const anchorIndex = anchorIndexRef.current;
          const startIndex = Math.min(anchorIndex, clickedIndex);
          const endIndex = Math.max(anchorIndex, clickedIndex);
          const groupsInRange = state.groups.slice(startIndex, endIndex + 1);
          selectRange(groupsInRange);
        } else {
          // Regular click: toggle individual, set as anchor
          anchorIndexRef.current = clickedIndex;
          anchorGuidRef.current = guid;

          if (state.selectedGroupIds.includes(guid)) {
            deselectGroup(guid);
          } else {
            selectGroup(group);
          }
        }
      } else if (selectionMode === 'single') {
        // Single selection: clear previous, select new
        if (!state.selectedGroupIds.includes(guid)) {
          dispatch({ type: 'CLEAR_SELECTION' });
          selectGroup(group);
        }
      }

      onItemClick?.(group);
    },
    [
      state.groups,
      state.selectedGroupIds,
      selectionMode,
      selectGroup,
      deselectGroup,
      selectRange,
      onItemClick,
    ]
  );

  // --- Group mutation actions ---
  const createGroup = useCallback(
    async (group: CometChat.Group): Promise<CometChat.Group> => {
      const created = await CometChatGroupsManager.createGroup(group);
      dispatch({ type: 'ADD_GROUP', group: created });
      publish({ type: 'ui:group/created', group: created });
      return created;
    },
    [publish]
  );

  const joinGroup = useCallback(
    async (guid: string, groupType: string, password?: string): Promise<CometChat.Group> => {
      const joined = await CometChatGroupsManager.joinGroup(guid, groupType, password);
      dispatch({ type: 'UPDATE_GROUP', group: joined });
      CometChat.getLoggedinUser()
        .then(user => {
          if (user) {
            publish({ type: 'ui:group/member-joined', joinedUser: user, joinedGroup: joined });
          }
        })
        .catch(() => {
          /* skip */
        });
      return joined;
    },
    [publish]
  );

  const leaveGroup = useCallback(async (guid: string): Promise<boolean> => {
    const result = await CometChatGroupsManager.leaveGroup(guid);
    dispatch({ type: 'REMOVE_GROUP', groupId: guid });
    return result;
  }, []);

  const deleteGroup = useCallback(async (guid: string): Promise<boolean> => {
    const result = await CometChatGroupsManager.deleteGroup(guid);
    dispatch({ type: 'REMOVE_GROUP', groupId: guid });
    return result;
  }, []);

  return {
    // State
    groups: state.groups,
    fetchState: state.fetchState,
    hasMore: state.hasMore,
    error: state.error,
    selectedGroupIds: state.selectedGroupIds,
    selectedGroupsMap: state.selectedGroupsMap,
    activeGroupId: state.activeGroupId,
    searchText: state.searchText,
    // Actions
    fetchNext,
    setSearchText,
    selectGroup,
    deselectGroup,
    selectRange,
    deselectRange,
    clearSelection,
    setActiveGroup,
    handleItemClick,
    createGroup,
    joinGroup,
    leaveGroup,
    deleteGroup,
  };
}
