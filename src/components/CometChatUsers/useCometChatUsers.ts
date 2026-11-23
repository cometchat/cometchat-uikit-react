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
import { isOfflineOn } from '../../utils/offline/gate';
import { useOfflineListLifecycle } from '../../utils/offline/useOfflineListLifecycle';
import { useDeferredLoadMore } from '../../utils/offline/useDeferredLoadMore';
import {
  applyEntityPage,
  errorMessageOf,
  nextOfflineOpId,
  offlineListBuilder,
  reportsReadError,
  carriesKeyword,
  readEntityPage,
} from '../../utils/offline/entityList';

const uidOf = (user: CometChat.User): string => user.getUid();

/** How an offline-path read relates to the rows on screen. */
type OfflineReadMode = 'first' | 'next' | 'refresh';

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

  // --- Offline support (ON path only; inert with offline off) ---
  const usersRef = useRef(state.users);
  usersRef.current = state.users;
  /** The offline read whose server phase is still pending (one at a time per request). */
  const offlineInFlightRef = useRef<string | null>(null);
  /** The offline state on screen: the next reconnect reads the list again (D84). */
  const reloadOnConnectRef = useRef(false);
  /** The search keyword of the request the list last loaded, for that reload. */
  const loadedSearchRef = useRef('');
  const errorViewRef = useRef(false);
  errorViewRef.current =
    (state.fetchState === 'error' || state.connectToSearch === true) && state.users.length === 0;
  const latestFetchNextRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const deferFetchNext = useDeferredLoadMore(
    () => latestFetchNextRef.current(),
    offlineInFlightRef
  );

  // Logout, user switch or cache reset (UIK-LIFE-01/02). The latest closures are
  // read through refs: this is declared before the functions it calls.
  const lifecycleReloadRef = useRef<() => void>(() => undefined);
  const offlineUsedRef = useOfflineListLifecycle({
    onSessionEnd: () => {
      fetchIdRef.current = nextOfflineOpId('session');
      offlineInFlightRef.current = null;
      managerRef.current = null;
      dispatch({ type: 'RESET' });
    },
    onCacheReset: () => {
      lifecycleReloadRef.current();
    },
    // A user switch, or a login after the logout that cleared this list:
    // read it for whoever is signed in now, instead of staying on the blank
    // frame `onSessionEnd` left until this list is remounted (F1).
    onLogin: () => {
      lifecycleReloadRef.current();
    },
  });

  /**
   * Offline path: one two-phase page read. The cached page paints first; the
   * server page replaces the same slice in place. D84: with nothing on screen a
   * failed read is the error view (offline: "Connect to load users") and one `onError`;
   * an offline keyword search is "Connect to search" and no `onError`. Rows on screen
   * stay: offline is silent, a real error reaches `onError` unless the kit started the
   * read itself (`refresh` or `automatic`).
   */
  const readOffline = useCallback(
    (manager: CometChatUsersManager, opId: string, mode: OfflineReadMode, automatic = false) => {
      offlineUsedRef.current = true;
      offlineInFlightRef.current = opId;
      const settle = () => {
        if (offlineInFlightRef.current === opId) offlineInFlightRef.current = null;
      };
      reloadOnConnectRef.current = false;
      return readEntityPage<CometChat.User>(
        {
          request: manager.request(),
          kind: 'users',
          refresh: mode === 'refresh',
          idOf: uidOf,
          isStale: () => fetchIdRef.current !== opId,
          shown: () => usersRef.current,
        },
        {
          onPage: page => {
            if (page.phase === 'server') settle();
            const emptyAfter =
              page.phase === 'server' &&
              applyEntityPage(usersRef.current, page, uidOf).length === 0;
            dispatch({ type: 'OFFLINE_PAGE', page });
            if (emptyAfter) onEmpty?.();
          },
          onError: (error, notConnected, hasMore) => {
            settle();
            // A cached page painted in this same tick may not have reached the ref yet.
            const shown = usersRef.current.length > 0 || (notConnected && hasMore);
            const keyword = carriesKeyword(loadedSearchRef.current, manager.request());
            // A re-read the kit started (reconnect refresh, cache-reset reload) stays quiet
            // over rows on screen: rows stay, no error output, no onError.
            const kitStarted = mode === 'refresh' || automatic;
            const quiet = mode === 'refresh' && !notConnected && shown;
            if (reportsReadError(notConnected, shown, keyword, kitStarted)) {
              onError?.(error as CometChat.CometChatException);
            }
            // "Connect to search" is the empty state, so it reports `onEmpty` like any empty list.
            if (notConnected && keyword && !shown) onEmpty?.();
            // An offline state shown because the device was offline reloads once on reconnect.
            reloadOnConnectRef.current = notConnected && !shown && mode !== 'next';
            dispatch({
              type: 'OFFLINE_PAGE_ERROR',
              quiet,
              notConnected,
              error: errorMessageOf(error),
              hasMore,
              keyword,
            });
          },
        }
      ).finally(settle);
    },
    [onEmpty, onError, offlineUsedRef]
  );

  // --- Fetch next page ---
  const fetchNext = useCallback(async () => {
    if (!managerRef.current || !state.hasMore || state.fetchState === 'loading') return;

    if (isOfflineOn()) {
      // A read whose server phase is pending is still running: never start a
      // second one on the same request (the SDK answers it empty, BEH-SNAP-14).
      if (offlineInFlightRef.current) {
        // Asked again later, once the pending read lands (never dropped).
        deferFetchNext();
        return;
      }
      const opId = nextOfflineOpId('fetch');
      fetchIdRef.current = opId;
      dispatch({ type: 'FETCH_START' });
      await readOffline(managerRef.current, opId, 'next');
      return;
    }

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
  }, [
    state.hasMore,
    state.fetchState,
    state.users.length,
    handleError,
    onEmpty,
    readOffline,
    deferFetchNext,
  ]);
  latestFetchNextRef.current = fetchNext;

  // --- Initialize Manager + first fetch ---
  const initializeAndFetch = useCallback(
    (search: string, offline?: { on: boolean; refresh: boolean; automatic?: boolean }) => {
      if (offline?.on ?? isOfflineOn()) {
        // Offline path: the integrator's builder is copied, never changed. A
        // refresh (reconnect) re-reads page one over the rows on screen.
        const manager = new CometChatUsersManager(
          offlineListBuilder(search, searchRequestBuilder, usersRequestBuilder, () =>
            new CometChat.UsersRequestBuilder().setLimit(30)
          )
        );
        managerRef.current = manager;
        loadedSearchRef.current = search;
        const opId = nextOfflineOpId('fetch');
        fetchIdRef.current = opId;
        if (!offline?.refresh) dispatch({ type: 'RESET' });
        dispatch({ type: 'FETCH_START' });
        void readOffline(
          manager,
          opId,
          offline?.refresh ? 'refresh' : 'first',
          offline?.automatic === true
        );
        return;
      }

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
    [
      buildRequestBuilder,
      handleError,
      onEmpty,
      readOffline,
      searchRequestBuilder,
      usersRequestBuilder,
    ]
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

  /*
   * The live search text, for the connection listener below.
   *
   * That listener is attached once and deliberately not re-attached when the search text changes,
   * so reading `state.searchText` directly inside it captures whatever the value was at attach
   * time — almost always the empty string. A reconnect mid-search then re-fetched unfiltered and
   * silently replaced the filtered list with the full one.
   */
  const searchTextRef = useRef(state.searchText);
  searchTextRef.current = state.searchText;
  lifecycleReloadRef.current = () => {
    // The kit's own reload after a cache reset: quiet if it fails over rows on screen.
    initializeAndFetch(searchTextRef.current, {
      on: isOfflineOn(),
      refresh: false,
      automatic: true,
    });
  };

  // --- Connection recovery ---
  useEffect(() => {
    const listenerId = `CometChatUsers_conn_${instanceId}`;
    const cleanup = CometChatUsersManager.attachConnectionListener(listenerId, {
      onConnected: () => {
        CometChatLogger.info('CometChatUsers', 'Connection recovered, re-fetching users');
        if (isOfflineOn()) {
          if (errorViewRef.current) {
            // D84: an offline state reads again once; any other error view stays until the
            // app or the user reloads.
            if (reloadOnConnectRef.current) {
              reloadOnConnectRef.current = false;
              initializeAndFetch(loadedSearchRef.current, { on: true, refresh: false });
            }
            return;
          }
          // Offline path: re-read two-phase into the rows on screen, no blank.
          initializeAndFetch(searchTextRef.current, { on: true, refresh: true });
          return;
        }
        initializeAndFetch(searchTextRef.current, { on: false, refresh: false });
      },
    });

    return cleanup;
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

  // Deselect every currently selected user (fires onSelect(false) for each so
  // consumers tracking selection via the callback stay in sync).
  const deselectAll = useCallback(() => {
    if (state.selectedUserIds.length > 0) {
      deselectRange(state.selectedUserIds);
    }
  }, [state.selectedUserIds, deselectRange]);

  // Ctrl/Cmd+A behaviour: select all loaded users, or deselect all when they
  // are already selected (toggle). Only meaningful in multiple-selection mode.
  const toggleSelectAll = useCallback(() => {
    if (selectionMode !== 'multiple' || state.users.length === 0) return;
    const allSelected = state.users.every(u => state.selectedUserIds.includes(u.getUid()));
    if (allSelected) {
      deselectAll();
    } else {
      selectRange(state.users);
    }
  }, [selectionMode, state.users, state.selectedUserIds, selectRange, deselectAll]);

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
    ...(state.connectToSearch !== undefined && { connectToSearch: state.connectToSearch }),
    ...(state.connectToLoad !== undefined && { connectToLoad: state.connectToLoad }),
    // Actions
    fetchNext,
    setSearchText,
    selectUser,
    deselectUser,
    selectRange,
    deselectRange,
    clearSelection,
    deselectAll,
    toggleSelectAll,
    setActiveUser,
    handleItemClick,
  };
}
