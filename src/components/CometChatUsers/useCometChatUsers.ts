import { useCallback, useEffect, useId, useReducer, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUsersManager } from './CometChatUsersManager';
import { usersReducer, initialUsersState } from './CometChatUsers.reducer';
import type {
  CometChatUseCometChatUsersOptions,
  CometChatUseCometChatUsersReturn,
} from './CometChatUsers.types';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { useCometChatUsersEvents } from './useCometChatUsersEvents';

/**
 * useCometChatUsers — orchestration hook for the users list data layer.
 *
 * Creates the Manager, attaches SDK listeners, dispatches reducer actions,
 * and exposes a clean API to the Provider.
 */
export function useCometChatUsers(
  options: CometChatUseCometChatUsersOptions = {}
): CometChatUseCometChatUsersReturn {
  const {
    usersRequestBuilder,
    searchRequestBuilder,
    searchKeyword = '',
    hideUserStatus = false,
    selectionMode = 'none',
    activeUser,
    onError,
    onEmpty,
    onSelect,
    onItemClick,
  } = options;

  const [state, dispatch] = useReducer(usersReducer, initialUsersState);
  const managerRef = useRef<CometChatUsersManager | null>(null);
  const fetchIdRef = useRef<string>('');
  const instanceId = useId();
  const anchorIndexRef = useRef<number | null>(null);
  const anchorUidRef = useRef<string | null>(null);

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
    (search: string): CometChat.UsersRequestBuilder => {
      let builder: CometChat.UsersRequestBuilder;

      if (search && searchRequestBuilder) {
        builder = searchRequestBuilder;
        builder.setSearchKeyword(search);
      } else if (search && usersRequestBuilder) {
        builder = usersRequestBuilder;
        builder.setSearchKeyword(search);
      } else if (usersRequestBuilder) {
        builder = usersRequestBuilder;
        if (!search) builder.setSearchKeyword('');
      } else {
        builder = new CometChat.UsersRequestBuilder().setLimit(30);
        if (search) builder.setSearchKeyword(search);
      }

      return builder;
    },
    [usersRequestBuilder, searchRequestBuilder]
  );

  // --- Fetch next page ---
  const fetchNext = useCallback(async () => {
    if (!managerRef.current || !state.hasMore || state.fetchState === 'loading') return;

    const currentFetchId = `fetch_${String(Date.now())}`;
    fetchIdRef.current = currentFetchId;
    dispatch({ type: 'FETCH_START' });

    try {
      const users = await managerRef.current.fetchNext();
      // Guard against stale fetches
      if (fetchIdRef.current !== currentFetchId) return;

      const hasMore = users.length > 0;
      dispatch({ type: 'FETCH_SUCCESS', users, hasMore });

      // Emit onEmpty if first fetch returned no results
      if (!hasMore && state.users.length === 0) {
        onEmpty?.();
      }
    } catch (error: unknown) {
      if (fetchIdRef.current !== currentFetchId) return;
      handleError(error);
    }
  }, [state.hasMore, state.fetchState, state.users.length, handleError, onEmpty]);

  // --- Initialize Manager + first fetch ---
  const initializeAndFetch = useCallback(
    (search: string) => {
      const builder = buildRequestBuilder(search);
      managerRef.current = new CometChatUsersManager(builder);
      dispatch({ type: 'RESET' });
      // Trigger fetch after reset
      const currentFetchId = `fetch_${String(Date.now())}`;
      fetchIdRef.current = currentFetchId;
      dispatch({ type: 'FETCH_START' });

      managerRef.current
        .fetchNext()
        .then(users => {
          if (fetchIdRef.current !== currentFetchId) return;
          const hasMore = users.length > 0;
          dispatch({ type: 'FETCH_SUCCESS', users, hasMore });
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
  }, [usersRequestBuilder, searchRequestBuilder, searchKeyword]);

  // --- Set search text (triggers re-fetch) ---
  const setSearchText = useCallback(
    (text: string) => {
      dispatch({ type: 'SET_SEARCH_TEXT', searchText: text });
      initializeAndFetch(text);
    },
    [initializeAndFetch]
  );

  // --- User status listener ---
  useEffect(() => {
    if (hideUserStatus) return;

    const listenerId = `CometChatUsers_status_${instanceId}`;
    const cleanup = CometChatUsersManager.attachUserStatusListener(listenerId, {
      onUserOnline: user => {
        dispatch({ type: 'UPDATE_USER', user });
      },
      onUserOffline: user => {
        dispatch({ type: 'UPDATE_USER', user });
      },
    });

    return cleanup;
  }, [instanceId, hideUserStatus]);

  // --- Connection recovery ---
  useEffect(() => {
    const listenerId = `CometChatUsers_conn_${instanceId}`;
    const cleanup = CometChatUsersManager.attachConnectionListener(listenerId, {
      onConnected: () => {
        CometChatLogger.info('CometChatUsers', 'Connection recovered, re-fetching users');
        initializeAndFetch(state.searchText);
      },
    });

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId, initializeAndFetch]);

  // --- Active user sync ---
  useEffect(() => {
    const uid = activeUser?.getUid() ?? null;
    dispatch({ type: 'SET_ACTIVE_USER', userId: uid });
  }, [activeUser]);

  // --- UI Events subscription (cross-component communication) ---
  useCometChatUsersEvents({ dispatch });

  // --- Selection actions ---
  const selectUser = useCallback(
    (user: CometChat.User) => {
      dispatch({ type: 'SELECT_USER', user });
      onSelect?.(user, true);
    },
    [onSelect]
  );

  const deselectUser = useCallback(
    (userId: string) => {
      const user = state.selectedUsersMap.get(userId);
      dispatch({ type: 'DESELECT_USER', userId });
      if (user) onSelect?.(user, false);
    },
    [onSelect, state.selectedUsersMap]
  );

  const selectRange = useCallback(
    (users: CometChat.User[]) => {
      dispatch({ type: 'SELECT_RANGE', users });
      users.forEach(u => {
        if (!state.selectedUserIds.includes(u.getUid())) {
          onSelect?.(u, true);
        }
      });
    },
    [onSelect, state.selectedUserIds]
  );

  const deselectRange = useCallback(
    (userIds: string[]) => {
      userIds.forEach(uid => {
        const user = state.selectedUsersMap.get(uid);
        if (user) onSelect?.(user, false);
      });
      dispatch({ type: 'DESELECT_RANGE', userIds });
    },
    [onSelect, state.selectedUsersMap]
  );

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const setActiveUser = useCallback((userId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_USER', userId });
  }, []);

  // --- Handle item click with selection logic ---
  const handleItemClick = useCallback(
    (user: CometChat.User, event?: { shiftKey?: boolean }) => {
      const uid = user.getUid();
      const clickedIndex = state.users.findIndex(u => u.getUid() === uid);
      const isShiftClick = event?.shiftKey === true;

      if (selectionMode === 'multiple') {
        if (isShiftClick && anchorIndexRef.current !== null) {
          // Shift-click range selection
          const anchorIndex = anchorIndexRef.current;
          const startIndex = Math.min(anchorIndex, clickedIndex);
          const endIndex = Math.max(anchorIndex, clickedIndex);
          const usersInRange = state.users.slice(startIndex, endIndex + 1);
          selectRange(usersInRange);
        } else {
          // Regular click: toggle individual, set as anchor
          anchorIndexRef.current = clickedIndex;
          anchorUidRef.current = uid;

          if (state.selectedUserIds.includes(uid)) {
            deselectUser(uid);
          } else {
            selectUser(user);
          }
        }
      } else if (selectionMode === 'single') {
        // Single selection: clear previous, select new
        if (!state.selectedUserIds.includes(uid)) {
          dispatch({ type: 'CLEAR_SELECTION' });
          selectUser(user);
        }
      }

      onItemClick?.(user);
    },
    [
      state.users,
      state.selectedUserIds,
      selectionMode,
      selectUser,
      deselectUser,
      selectRange,
      onItemClick,
    ]
  );

  return {
    // State
    users: state.users,
    fetchState: state.fetchState,
    hasMore: state.hasMore,
    error: state.error,
    selectedUserIds: state.selectedUserIds,
    selectedUsersMap: state.selectedUsersMap,
    activeUserId: state.activeUserId,
    searchText: state.searchText,
    // Actions
    fetchNext,
    setSearchText,
    selectUser,
    deselectUser,
    selectRange,
    deselectRange,
    clearSelection,
    setActiveUser,
    handleItemClick,
  };
}
