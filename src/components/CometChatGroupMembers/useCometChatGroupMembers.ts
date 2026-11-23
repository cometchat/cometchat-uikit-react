import { useCallback, useEffect, useId, useReducer, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupMembersManager } from './CometChatGroupMembersManager';
import { groupMembersReducer, initialGroupMembersState } from './CometChatGroupMembers.reducer';
import type {
  CometChatUseCometChatGroupMembersOptions,
  CometChatUseCometChatGroupMembersReturn,
} from './CometChatGroupMembers.types';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { useCometChatGroupMembersEvents } from './useCometChatGroupMembersEvents';
import { usePublishEvent } from '../../hooks/usePublishEvent';
import { useCometChatEvents } from '../../hooks/useCometChatEvents';
import { clone, createActionMessage } from '../../utils/CometChatUIKitUtility';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';
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

const memberUidOf = (member: CometChat.GroupMember): string => member.getUid();

/** How an offline-path read relates to the rows on screen. */
type OfflineReadMode = 'first' | 'next' | 'refresh';

/**
 * useCometChatGroupMembers — orchestration hook for the group members list data layer.
 *
 * Creates the Manager, attaches SDK listeners, dispatches reducer actions,
 * and exposes a clean API to the Provider.
 */
export function useCometChatGroupMembers(
  options: CometChatUseCometChatGroupMembersOptions
): CometChatUseCometChatGroupMembersReturn {
  const {
    group,
    groupMemberRequestBuilder,
    searchRequestBuilder,
    searchKeyword = '',
    hideUserStatus = false,
    selectionMode = 'none',
    onError,
    onEmpty,
    onSelect,
    onItemClick,
  } = options;

  const [state, dispatch] = useReducer(groupMembersReducer, initialGroupMembersState);
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
  const [loggedInUserScope, setLoggedInUserScope] = useState<string | null>(null);
  /**
   * Mirror of `loggedInUser` for the group listener.
   *
   * The listener registers once per group and must not re-register when the
   * user resolves — tearing down and re-attaching it would drop events
   */
  const loggedInUserRef = useRef<CometChat.User | null>(null);
  const [memberToChangeScope, setMemberToChangeScope] = useState<CometChat.GroupMember | null>(
    null
  );
  const managerRef = useRef<CometChatGroupMembersManager | null>(null);
  const fetchIdRef = useRef<string>('');
  const instanceId = useId();

  const guid = group.getGuid();
  const publish = usePublishEvent();

  // Track member count in a ref so successive kicks/bans always use the latest value,
  // even if the parent hasn't re-rendered with an updated group prop.
  const memberCountRef = useRef<number>(group.getMembersCount());

  // Sync ref whenever the group prop changes (parent re-renders with fresh group)
  useEffect(() => {
    memberCountRef.current = group.getMembersCount();
  }, [group]);

  // --- Get logged-in user on mount ---
  useEffect(() => {
    Promise.resolve()
      .then(() => CometChat.getLoggedinUser())
      .then(user => {
        if (user) {
          setLoggedInUser(user);
          // Determine logged-in user's scope in this group
          const ownerUid = group.getOwner();
          if (ownerUid === user.getUid()) {
            setLoggedInUserScope('owner');
          } else {
            // Scope will be determined from the member list once fetched
            setLoggedInUserScope(null);
          }
        }
      })
      .catch(() => {
        // Silently handle - user not logged in or SDK not initialized
      });
  }, [group]);

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
    (search: string): CometChat.GroupMembersRequestBuilder => {
      let builder: CometChat.GroupMembersRequestBuilder;

      if (search && searchRequestBuilder) {
        builder = searchRequestBuilder;
        builder.setSearchKeyword(search);
      } else if (search && groupMemberRequestBuilder) {
        builder = groupMemberRequestBuilder;
        builder.setSearchKeyword(search);
      } else if (groupMemberRequestBuilder) {
        builder = groupMemberRequestBuilder;
        if (!search) builder.setSearchKeyword('');
      } else {
        builder = new CometChat.GroupMembersRequestBuilder(guid).setLimit(30);
        if (search) builder.setSearchKeyword(search);
      }

      return builder;
    },
    [guid, groupMemberRequestBuilder, searchRequestBuilder]
  );

  // --- Offline support (ON path only; inert with offline off) ---
  const membersRef = useRef(state.members);
  membersRef.current = state.members;
  const loggedInUserForOfflineRef = useRef(loggedInUser);
  loggedInUserForOfflineRef.current = loggedInUser;
  /** The offline read whose server phase is still pending (one at a time per request). */
  const offlineInFlightRef = useRef<string | null>(null);
  /** The offline state on screen: the next reconnect reads the list again (D84). */
  const reloadOnConnectRef = useRef(false);
  /** The search keyword of the request the list last loaded, for that reload. */
  const loadedSearchRef = useRef('');
  const errorViewRef = useRef(false);
  errorViewRef.current =
    (state.fetchState === 'error' || state.connectToSearch === true) && state.members.length === 0;
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
   * failed read is the error view (offline: "Connect to load ...") and one `onError`;
   * an offline keyword search is "Connect to search" and no `onError`. Rows on screen
   * stay: offline is silent, a real error reaches `onError` unless the kit started the
   * read itself (`refresh` or `automatic`).
   */
  const readOffline = useCallback(
    (
      manager: CometChatGroupMembersManager,
      opId: string,
      mode: OfflineReadMode,
      automatic = false
    ) => {
      offlineUsedRef.current = true;
      offlineInFlightRef.current = opId;
      const settle = () => {
        if (offlineInFlightRef.current === opId) offlineInFlightRef.current = null;
      };
      reloadOnConnectRef.current = false;
      return readEntityPage<CometChat.GroupMember>(
        {
          request: manager.request(),
          kind: 'groupMembers',
          refresh: mode === 'refresh',
          idOf: memberUidOf,
          isStale: () => fetchIdRef.current !== opId,
          shown: () => membersRef.current,
        },
        {
          onPage: page => {
            if (page.phase === 'server') settle();
            const emptyAfter =
              page.phase === 'server' &&
              applyEntityPage(membersRef.current, page, memberUidOf).length === 0;
            dispatch({ type: 'OFFLINE_PAGE', page });
            // The logged-in user's scope, from whichever page lists them.
            const me = loggedInUserForOfflineRef.current;
            const mine = me ? page.rows.find(m => m.getUid() === me.getUid()) : undefined;
            if (mine) setLoggedInUserScope(mine.getScope());
            if (emptyAfter) onEmpty?.();
          },
          onError: (error, notConnected, hasMore) => {
            settle();
            // A cached page painted in this same tick may not have reached the ref yet.
            const shown = membersRef.current.length > 0 || (notConnected && hasMore);
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
      const members = await managerRef.current.fetchNext();
      // Guard against stale fetches
      if (fetchIdRef.current !== currentFetchId) return;

      const hasMore = members.length > 0;
      dispatch({ type: 'FETCH_SUCCESS', members, hasMore });

      // Determine logged-in user's scope from the member list
      if (loggedInUser && loggedInUserScope === null) {
        const me = members.find(m => m.getUid() === loggedInUser.getUid());
        if (me) {
          setLoggedInUserScope(me.getScope());
        }
      }

      // Emit onEmpty if first fetch returned no results
      if (!hasMore && state.members.length === 0) {
        onEmpty?.();
      }
    } catch (error: unknown) {
      if (fetchIdRef.current !== currentFetchId) return;
      handleError(error);
    }
  }, [
    state.hasMore,
    state.fetchState,
    state.members.length,
    handleError,
    onEmpty,
    loggedInUser,
    loggedInUserScope,
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
        const manager = new CometChatGroupMembersManager(
          guid,
          offlineListBuilder(search, searchRequestBuilder, groupMemberRequestBuilder, () =>
            new CometChat.GroupMembersRequestBuilder(guid).setLimit(30)
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
      managerRef.current = new CometChatGroupMembersManager(guid, builder);
      dispatch({ type: 'RESET' });
      // Trigger fetch after reset
      const currentFetchId = `fetch_${String(Date.now())}`;
      fetchIdRef.current = currentFetchId;
      dispatch({ type: 'FETCH_START' });

      managerRef.current
        .fetchNext()
        .then(members => {
          if (fetchIdRef.current !== currentFetchId) return;
          const hasMore = members.length > 0;
          dispatch({ type: 'FETCH_SUCCESS', members, hasMore });

          // Determine logged-in user's scope from the member list
          if (loggedInUser) {
            const me = members.find(m => m.getUid() === loggedInUser.getUid());
            if (me) {
              setLoggedInUserScope(me.getScope());
            }
          }

          if (!hasMore) onEmpty?.();
        })
        .catch((error: unknown) => {
          if (fetchIdRef.current !== currentFetchId) return;
          handleError(error);
        });
    },
    [
      guid,
      buildRequestBuilder,
      handleError,
      onEmpty,
      loggedInUser,
      readOffline,
      searchRequestBuilder,
      groupMemberRequestBuilder,
    ]
  );

  // --- Initial fetch on mount and when builders/group change ---
  useEffect(() => {
    initializeAndFetch(searchKeyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guid, groupMemberRequestBuilder, searchRequestBuilder, searchKeyword]);

  // --- Set search text (triggers re-fetch) ---
  const setSearchText = useCallback(
    (text: string) => {
      dispatch({ type: 'SET_SEARCH_TEXT', searchText: text });
      initializeAndFetch(text);
    },
    [initializeAndFetch]
  );

  useEffect(() => {
    loggedInUserRef.current = loggedInUser;
  }, [loggedInUser]);

  // --- Group member listener ---
  useEffect(() => {
    const listenerId = `CometChatGroupMembers_group_${instanceId}`;
    const cleanup = CometChatGroupMembersManager.attachGroupListener(listenerId, {
      onGroupMemberJoined: (_message, joinedUser, joinedGroup) => {
        if (joinedGroup.getGuid() !== guid) return;
        memberCountRef.current = joinedGroup.getMembersCount();
        // Create a GroupMember from the User
        const member = new CometChat.GroupMember(
          joinedUser.getUid(),
          CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT as unknown as CometChat.GroupMemberScope
        );
        member.setName(joinedUser.getName());
        member.setAvatar(joinedUser.getAvatar());
        member.setStatus(joinedUser.getStatus());
        dispatch({ type: 'ADD_MEMBER', member });
      },
      onGroupMemberLeft: (_message, leavingUser, leftGroup) => {
        if (leftGroup.getGuid() !== guid) return;
        memberCountRef.current = leftGroup.getMembersCount();
        dispatch({ type: 'REMOVE_MEMBER', uid: leavingUser.getUid() });
      },
      onGroupMemberBanned: (_message, bannedUser, _bannedBy, bannedFrom) => {
        if (bannedFrom.getGuid() !== guid) return;
        memberCountRef.current = bannedFrom.getMembersCount();
        dispatch({ type: 'REMOVE_MEMBER', uid: bannedUser.getUid() });
      },
      onGroupMemberKicked: (_message, kickedUser, _kickedBy, kickedFrom) => {
        if (kickedFrom.getGuid() !== guid) return;
        memberCountRef.current = kickedFrom.getMembersCount();
        dispatch({ type: 'REMOVE_MEMBER', uid: kickedUser.getUid() });
      },
      onGroupMemberScopeChanged: (_message, changedUser, newScope, _oldScope, changedGroup) => {
        if (changedGroup.getGuid() !== guid) return;
        dispatch({ type: 'UPDATE_MEMBER_SCOPE', uid: changedUser.getUid(), scope: newScope });
        // If the logged-in user's scope was changed, update permissions in real-time
        if (changedUser.getUid() === loggedInUserRef.current?.getUid()) {
          setLoggedInUserScope(newScope);
        }
      },
    });

    return cleanup;
  }, [instanceId, guid]);

  // --- User status listener ---
  useEffect(() => {
    if (hideUserStatus) return;

    const listenerId = `CometChatGroupMembers_user_${instanceId}`;
    const cleanup = CometChatGroupMembersManager.attachUserListener(listenerId, {
      onUserOnline: user => {
        dispatch({ type: 'UPDATE_MEMBER_STATUS', uid: user.getUid(), status: 'online' });
      },
      onUserOffline: user => {
        dispatch({ type: 'UPDATE_MEMBER_STATUS', uid: user.getUid(), status: 'offline' });
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
    const listenerId = `CometChatGroupMembers_conn_${instanceId}`;
    const cleanup = CometChatGroupMembersManager.attachConnectionListener(listenerId, {
      onConnected: () => {
        CometChatLogger.info('CometChatGroupMembers', 'Connection recovered, re-fetching members');
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

  // --- UI Events subscription (cross-component communication) ---
  useCometChatGroupMembersEvents({ dispatch, guid });

  // Keep memberCountRef in sync with UI events from other components
  // (e.g., when AddMembers publishes ui:group/member-added)
  useCometChatEvents(
    event => {
      if (event.type === 'ui:group/member-added' && event.group.getGuid() === guid) {
        memberCountRef.current = event.group.getMembersCount();
      }
      if (event.type === 'ui:group/member-kicked' && event.group.getGuid() === guid) {
        memberCountRef.current = event.group.getMembersCount();
      }
      if (event.type === 'ui:group/member-banned' && event.group.getGuid() === guid) {
        memberCountRef.current = event.group.getMembersCount();
      }
      if (event.type === 'ui:group/member-joined' && event.joinedGroup.getGuid() === guid) {
        memberCountRef.current = event.joinedGroup.getMembersCount();
      }
      // If the logged-in user's scope was changed via UI event, update permissions
      if (event.type === 'ui:group/member-scope-changed' && event.group.getGuid() === guid) {
        if (event.user.getUid() === loggedInUser?.getUid()) {
          setLoggedInUserScope(event.newScope);
        }
      }
      if (event.type === 'ui:group/ownership-changed' && event.group.getGuid() === guid) {
        if (event.newOwner.getUid() === loggedInUser?.getUid()) {
          setLoggedInUserScope('owner');
        } else if (loggedInUser?.getUid() === event.previousOwnerUid) {
          setLoggedInUserScope('admin');
        }
      }
    },
    [guid, loggedInUser]
  );

  // --- Selection actions ---
  const selectMember = useCallback(
    (member: CometChat.GroupMember) => {
      dispatch({ type: 'SELECT_MEMBER', member });
      onSelect?.(member, true);
    },
    [onSelect]
  );

  const deselectMember = useCallback(
    (uid: string) => {
      const member = state.selectedMembersMap.get(uid);
      dispatch({ type: 'DESELECT_MEMBER', uid });
      if (member) onSelect?.(member, false);
    },
    [onSelect, state.selectedMembersMap]
  );

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const setActiveMember = useCallback((uid: string | null) => {
    dispatch({ type: 'SET_ACTIVE_MEMBER', uid });
  }, []);

  // --- Handle item click with selection logic ---
  const handleItemClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (member: CometChat.GroupMember, _event?: { shiftKey?: boolean }) => {
      const uid = member.getUid();

      if (selectionMode === 'multiple') {
        if (state.selectedMemberIds.includes(uid)) {
          deselectMember(uid);
        } else {
          selectMember(member);
        }
      } else if (selectionMode === 'single') {
        if (!state.selectedMemberIds.includes(uid)) {
          dispatch({ type: 'CLEAR_SELECTION' });
          selectMember(member);
        }
      }

      onItemClick?.(member);
    },
    [state.selectedMemberIds, selectionMode, selectMember, deselectMember, onItemClick]
  );

  // --- Mutation actions ---
  const kickMember = useCallback(
    async (uid: string): Promise<boolean> => {
      try {
        if (!loggedInUser) return false;
        const kickedMember = state.members.find(m => m.getUid() === uid);
        if (!kickedMember) return false;

        const result = await CometChatGroupMembersManager.kickMember(guid, uid);
        dispatch({ type: 'REMOVE_MEMBER', uid });

        // Use the ref for an always-accurate count, then decrement it
        memberCountRef.current = Math.max(0, memberCountRef.current - 1);
        const groupClone = clone(group);
        groupClone.setMembersCount(memberCountRef.current);

        publish({
          type: 'ui:group/member-kicked',
          message: createActionMessage(
            kickedMember,
            CometChatUIKitConstants.groupMemberAction.KICKED,
            groupClone,
            loggedInUser
          ),
          user: clone(kickedMember) as unknown as CometChat.User,
          group: groupClone,
        });

        return result;
      } catch (error) {
        handleError(error);
        return false;
      }
    },
    [guid, handleError, state.members, loggedInUser, group, publish]
  );

  const banMember = useCallback(
    async (uid: string): Promise<boolean> => {
      try {
        if (!loggedInUser) return false;
        const bannedMember = state.members.find(m => m.getUid() === uid);
        if (!bannedMember) return false;

        const result = await CometChatGroupMembersManager.banMember(guid, uid);
        dispatch({ type: 'REMOVE_MEMBER', uid });

        // Use the ref for an always-accurate count, then decrement it
        memberCountRef.current = Math.max(0, memberCountRef.current - 1);
        const groupClone = clone(group);
        groupClone.setMembersCount(memberCountRef.current);

        publish({
          type: 'ui:group/member-banned',
          message: createActionMessage(
            bannedMember,
            CometChatUIKitConstants.groupMemberAction.BANNED,
            groupClone,
            loggedInUser
          ),
          user: clone(bannedMember) as unknown as CometChat.User,
          group: groupClone,
        });

        return result;
      } catch (error) {
        handleError(error);
        return false;
      }
    },
    [guid, handleError, state.members, loggedInUser, group, publish]
  );

  const unbanMember = useCallback(
    async (uid: string): Promise<boolean> => {
      try {
        if (!loggedInUser) return false;
        const result = await CometChatGroupMembersManager.unbanMember(guid, uid);

        const unbannedUser = new CometChat.User(uid);
        // Unbanning increments member count
        memberCountRef.current = memberCountRef.current + 1;
        const groupClone = clone(group);
        groupClone.setMembersCount(memberCountRef.current);

        publish({
          type: 'ui:group/member-unbanned',
          user: unbannedUser,
          group: groupClone,
        });

        return result;
      } catch (error) {
        handleError(error);
        return false;
      }
    },
    [guid, handleError, loggedInUser, group, publish]
  );

  const changeScope = useCallback(
    async (uid: string, scope: string): Promise<boolean> => {
      try {
        if (!loggedInUser) return false;
        const changedMember = state.members.find(m => m.getUid() === uid);
        if (!changedMember) return false;

        const result = await CometChatGroupMembersManager.changeScope(guid, uid, scope);
        dispatch({ type: 'UPDATE_MEMBER_SCOPE', uid, scope });

        const updatedMember = clone(changedMember);
        updatedMember.setScope(scope as CometChat.GroupMemberScope);

        // Use memberCountRef to ensure the published group has the correct count,
        // since the group prop may be stale after add/remove operations.
        const groupClone = clone(group);
        groupClone.setMembersCount(memberCountRef.current);

        publish({
          type: 'ui:group/member-scope-changed',
          message: createActionMessage(
            updatedMember,
            CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE,
            groupClone,
            loggedInUser
          ),
          user: clone(updatedMember) as unknown as CometChat.User,
          group: groupClone,
          newScope: scope,
        });

        return result;
      } catch (error) {
        handleError(error);
        return false;
      }
    },
    [guid, handleError, state.members, loggedInUser, group, publish]
  );

  return {
    // State
    members: state.members,
    fetchState: state.fetchState,
    hasMore: state.hasMore,
    error: state.error,
    selectedMemberIds: state.selectedMemberIds,
    selectedMembersMap: state.selectedMembersMap,
    activeMemberId: state.activeMemberId,
    searchText: state.searchText,
    ...(state.connectToSearch !== undefined && { connectToSearch: state.connectToSearch }),
    ...(state.connectToLoad !== undefined && { connectToLoad: state.connectToLoad }),
    loggedInUser,
    loggedInUserScope,
    // Actions
    fetchNext,
    setSearchText,
    selectMember,
    deselectMember,
    clearSelection,
    setActiveMember,
    handleItemClick,
    kickMember,
    banMember,
    unbanMember,
    changeScope,
    setMemberToChangeScope,
    memberToChangeScope,
  };
}
