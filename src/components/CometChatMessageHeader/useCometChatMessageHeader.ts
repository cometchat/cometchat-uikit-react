/**
 * useCometChatMessageHeader — data hook for the message header component.
 *
 * Orchestrates the Manager (SDK listeners), Reducer (state), and exposes
 * a clean API for the Provider and UI sub-components.
 *
 * Responsibilities:
 * - Initializes state from user/group props
 * - Attaches SDK listeners (user status, typing, group member, connection)
 * - Manages typing timeout auto-clear (2 seconds)
 * - Connection recovery (re-attaches listeners on reconnect)
 *
 * Call logic has been moved to the standalone CometChatCallButtons component.
 */

import { useCallback, useEffect, useId, useReducer, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { messageHeaderReducer, initialMessageHeaderState } from './CometChatMessageHeader.reducer';
import {
  attachUserStatusListener,
  attachTypingListener,
  attachGroupMemberListener,
  attachConnectionListener,
} from './CometChatMessageHeaderManager';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import { useCometChatEvents } from '../../hooks/useCometChatEvents';

const TYPING_TIMEOUT_MS = 2000;

export interface CometChatUseCometChatMessageHeaderOptions {
  user?: CometChat.User;
  group?: CometChat.Group;
  hideUserStatus?: boolean;
  onError?: ((error: CometChat.CometChatException) => void) | null;
}

export function useCometChatMessageHeader(options: CometChatUseCometChatMessageHeaderOptions) {
  const { user, group, hideUserStatus = false } = options;
  const [state, dispatch] = useReducer(messageHeaderReducer, initialMessageHeaderState);
  const instanceId = useId();
  const loggedInUser = useLoggedInUser();

  // Typing timeout refs
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingUsersTimeoutRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // --- Clear typing timeout ---
  const clearTypingTimeout = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  // --- Initialize state from user/group ---
  useEffect(() => {
    dispatch({ type: 'RESET' });

    if (user) {
      const isBlocked = user.getBlockedByMe() || user.getHasBlockedMe();
      if (isBlocked) {
        dispatch({ type: 'SET_USER_STATUS', status: 'offline', lastActiveAt: null });
      } else {
        const rawStatus: string = user.getStatus();
        const status = rawStatus === 'online' ? ('online' as const) : ('offline' as const);
        const lastActiveAt: number | null = user.getLastActiveAt() || null;
        dispatch({ type: 'SET_USER_STATUS', status, lastActiveAt });
      }
    }

    if (group) {
      const count: number = (group.getMembersCount() as number | undefined) ?? 0;
      dispatch({ type: 'SET_GROUP_MEMBER_COUNT', count });
    }
  }, [user, group]);

  // --- User status listener ---
  useEffect(() => {
    if (!user || hideUserStatus) return;
    if (user.getBlockedByMe() || user.getHasBlockedMe()) return;

    const userId = user.getUid();
    const listenerId = `CometChatMessageHeader_user_${instanceId}`;

    const cleanup = attachUserStatusListener(listenerId, userId, {
      onUserOnline: () => {
        dispatch({ type: 'SET_USER_STATUS', status: 'online', lastActiveAt: null });
      },
      onUserOffline: (offlineUser: CometChat.User) => {
        const lastActive: number =
          (offlineUser.getLastActiveAt() as number | undefined) ?? Date.now();
        dispatch({ type: 'SET_USER_STATUS', status: 'offline', lastActiveAt: lastActive });
      },
    });

    return cleanup;
  }, [user, hideUserStatus, instanceId]);

  // --- Typing listener ---
  useEffect(() => {
    if (!user && !group) return;

    const entityId = user ? user.getUid() : group ? group.getGuid() : '';
    const entityType: 'user' | 'group' = user ? 'user' : 'group';
    const listenerId = `CometChatMessageHeader_typing_${instanceId}`;

    if (!entityId) return;

    // Copy ref value for cleanup (avoids stale ref warning)
    const typingUsersTimeouts = typingUsersTimeoutRef.current;

    const cleanup = attachTypingListener(listenerId, entityId, entityType, {
      onTypingStarted: (indicator: CometChat.TypingIndicator) => {
        clearTypingTimeout();
        dispatch({ type: 'SET_TYPING_INDICATOR', indicator });

        // For group conversations, track individual typing users
        if (entityType === 'group') {
          const sender = indicator.getSender();
          const senderId = sender.getUid();
          dispatch({ type: 'ADD_TYPING_USER', user: sender });

          // Clear individual user timeout if exists
          const existingTimeout = typingUsersTimeoutRef.current.get(senderId);
          if (existingTimeout) clearTimeout(existingTimeout);

          // Set individual user timeout
          const timeout = setTimeout(() => {
            dispatch({ type: 'REMOVE_TYPING_USER', userId: senderId });
            typingUsersTimeoutRef.current.delete(senderId);
          }, TYPING_TIMEOUT_MS);
          typingUsersTimeoutRef.current.set(senderId, timeout);
        }
      },
      onTypingEnded: (indicator: CometChat.TypingIndicator) => {
        if (entityType === 'group') {
          const sender = indicator.getSender();
          const senderId = sender.getUid();
          dispatch({ type: 'REMOVE_TYPING_USER', userId: senderId });
          const existingTimeout = typingUsersTimeoutRef.current.get(senderId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            typingUsersTimeoutRef.current.delete(senderId);
          }
        }

        clearTypingTimeout();
        dispatch({ type: 'SET_TYPING_INDICATOR', indicator: null });
      },
    });

    return () => {
      cleanup();
      clearTypingTimeout();
      typingUsersTimeouts.forEach(timeout => {
        clearTimeout(timeout);
      });
      typingUsersTimeouts.clear();
    };
  }, [user, group, instanceId, clearTypingTimeout]);

  // --- Group member listener ---
  useEffect(() => {
    if (!group) return;

    const groupId = group.getGuid();
    const listenerId = `CometChatMessageHeader_group_${instanceId}`;

    const cleanup = attachGroupMemberListener(listenerId, groupId, {
      onGroupMemberJoined: () => {
        dispatch({ type: 'INCREMENT_GROUP_MEMBER_COUNT' });
      },
      onGroupMemberLeft: () => {
        dispatch({ type: 'DECREMENT_GROUP_MEMBER_COUNT' });
      },
      onGroupMemberKicked: () => {
        dispatch({ type: 'DECREMENT_GROUP_MEMBER_COUNT' });
      },
      onGroupMemberBanned: () => {
        dispatch({ type: 'DECREMENT_GROUP_MEMBER_COUNT' });
      },
      onMemberAddedToGroup: () => {
        dispatch({ type: 'INCREMENT_GROUP_MEMBER_COUNT' });
      },
      onGroupMemberScopeChanged: () => {
        // Scope changes don't affect member count
      },
    });

    return cleanup;
  }, [group, instanceId]);

  // --- Connection listener ---
  useEffect(() => {
    if (!user && !group) return;

    const listenerId = `CometChatMessageHeader_conn_${instanceId}`;

    const cleanup = attachConnectionListener(listenerId, {
      onConnected: () => {
        dispatch({ type: 'SET_CONNECTION_STATUS', status: 'connected' });
      },
      onDisconnected: () => {
        dispatch({ type: 'SET_CONNECTION_STATUS', status: 'disconnected' });
      },
    });

    return cleanup;
  }, [user, group, instanceId]);

  // --- UI Events subscription (cross-component communication) ---
  useCometChatEvents(
    event => {
      // --- Group UI events: update member count and subtitle ---
      if (
        event.type === 'ui:group/member-added' ||
        event.type === 'ui:group/member-kicked' ||
        event.type === 'ui:group/member-banned'
      ) {
        if (event.group.getGuid() === group?.getGuid()) {
          const count = event.group.getMembersCount() || 0;
          if (count > 0) {
            dispatch({ type: 'SET_GROUP_MEMBER_COUNT', count });
          }
        }
      }
      if (event.type === 'ui:group/left') {
        if (event.group.getGuid() === group?.getGuid()) {
          const count = event.group.getMembersCount() || 0;
          if (count > 0) {
            dispatch({ type: 'SET_GROUP_MEMBER_COUNT', count });
          }
        }
      }
      if (event.type === 'ui:group/member-joined') {
        if (event.joinedGroup.getGuid() === group?.getGuid()) {
          const count = event.joinedGroup.getMembersCount() || 0;
          if (count > 0) {
            dispatch({ type: 'SET_GROUP_MEMBER_COUNT', count });
          }
        }
      }
    },
    [user?.getUid(), group?.getGuid()]
  );

  // --- Compute typing text ---
  const typingText = (() => {
    if (!state.typingIndicator) return '';

    if (user) {
      return 'typing';
    }

    if (group) {
      const { typingUsers } = state;
      if (typingUsers.length === 0) {
        const sender = state.typingIndicator.getSender();
        const senderName = sender.getName();
        if (senderName) {
          return `${senderName} is typing`;
        }
        return 'typing';
      }

      if (typingUsers.length === 1) {
        const firstName = typingUsers[0]?.getName() ?? '';
        return `${firstName} is typing`;
      }

      if (typingUsers.length === 2) {
        const firstName = typingUsers[0]?.getName() ?? '';
        const secondName = typingUsers[1]?.getName() ?? '';
        return `${firstName} and ${secondName} are typing`;
      }

      const othersCount = typingUsers.length - 1;
      const firstName = typingUsers[0]?.getName() ?? '';
      return `${firstName} and ${othersCount.toString()} others are typing`;
    }

    return 'typing';
  })();

  return {
    ...state,
    isTyping: state.typingIndicator !== null || state.typingUsers.length > 0,
    typingText,
    loggedInUser,
  };
}
