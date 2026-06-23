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

  // --- Fetch next page ---
  const fetchNext = useCallback(async () => {
    if (!managerRef.current || !state.hasMore || state.fetchState === 'loading') return;

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
  ]);

  // --- Initialize Manager + first fetch ---
  const initializeAndFetch = useCallback(
    (search: string) => {
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
    [guid, buildRequestBuilder, handleError, onEmpty, loggedInUser]
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
        if (changedUser.getUid() === loggedInUser?.getUid()) {
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

  // --- Connection recovery ---
  useEffect(() => {
    const listenerId = `CometChatGroupMembers_conn_${instanceId}`;
    const cleanup = CometChatGroupMembersManager.attachConnectionListener(listenerId, {
      onConnected: () => {
        CometChatLogger.info('CometChatGroupMembers', 'Connection recovered, re-fetching members');
        initializeAndFetch(state.searchText);
      },
    });

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
