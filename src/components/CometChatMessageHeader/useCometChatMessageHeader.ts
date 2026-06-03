/**
 * useCometChatMessageHeader — data hook for the message header component.
 *
 * Orchestrates the Manager (SDK listeners), Reducer (state), and exposes
 * a clean API for the Provider and UI sub-components.
 *
 * Responsibilities:
 * - Initializes state from user/group props
 * - Attaches SDK listeners (user status, typing, group member, connection, call)
 * - Manages typing timeout auto-clear (2 seconds)
 * - Handles call initiation (user calls via CometChat.initiateCall, group calls via custom message)
 * - Connection recovery (re-attaches listeners on reconnect)
 */

import { useCallback, useEffect, useId, useReducer, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { messageHeaderReducer, initialMessageHeaderState } from './CometChatMessageHeader.reducer';
import {
  attachUserStatusListener,
  attachTypingListener,
  attachGroupMemberListener,
  attachConnectionListener,
  attachCallListener,
} from './CometChatMessageHeaderManager';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import { useCometChatEvents } from '../../hooks/useCometChatEvents';
import { usePublishEvent } from '../../hooks/usePublishEvent';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';
import { CometChatMessageStatus } from '../../context/CometChatEvents.types';

const TYPING_TIMEOUT_MS = 2000;

export interface CometChatUseCometChatMessageHeaderOptions {
  user?: CometChat.User;
  group?: CometChat.Group;
  hideUserStatus?: boolean;
  onError?: ((error: CometChat.CometChatException) => void) | null;
}

export function useCometChatMessageHeader(options: CometChatUseCometChatMessageHeaderOptions) {
  const { user, group, hideUserStatus = false, onError } = options;
  const [state, dispatch] = useReducer(messageHeaderReducer, initialMessageHeaderState);
  const instanceId = useId();
  const loggedInUser = useLoggedInUser();
  const publish = usePublishEvent();

  // Typing timeout refs
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingUsersTimeoutRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // --- Error handler ---
  const handleError = useCallback(
    (error: unknown) => {
      if (onError) {
        onError(error as CometChat.CometChatException);
      }
    },
    [onError]
  );

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
      const rawStatus: string = user.getStatus();
      const status = rawStatus === 'online' ? ('online' as const) : ('offline' as const);
      const lastActiveAt: number | null = user.getLastActiveAt() || null;
      dispatch({ type: 'SET_USER_STATUS', status, lastActiveAt });
    }

    if (group) {
      const count: number = (group.getMembersCount() as number | undefined) ?? 0;
      dispatch({ type: 'SET_GROUP_MEMBER_COUNT', count });
    }
  }, [user, group]);

  // --- User status listener ---
  useEffect(() => {
    if (!user || hideUserStatus) return;

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
          // Only clear main indicator if no one else is typing
          // The component will check typingUsers.length
        }

        clearTypingTimeout();
        dispatch({ type: 'SET_TYPING_INDICATOR', indicator: null });
      },
    });

    return () => {
      cleanup();
      clearTypingTimeout();
      // Copy the ref value inside cleanup to avoid stale ref
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
      onGroupMemberJoined: (_action, _joinedUser, joinedGroup) => {
        dispatch({ type: 'SET_GROUP_MEMBER_COUNT', count: joinedGroup.getMembersCount() });
      },
      onGroupMemberLeft: (_action, _leftUser, leftGroup) => {
        dispatch({ type: 'SET_GROUP_MEMBER_COUNT', count: leftGroup.getMembersCount() });
      },
      onGroupMemberKicked: (_action, _kickedUser, _kickedBy, kickedFrom) => {
        dispatch({ type: 'SET_GROUP_MEMBER_COUNT', count: kickedFrom.getMembersCount() });
      },
      onGroupMemberBanned: (_action, _bannedUser, _bannedBy, bannedFrom) => {
        dispatch({ type: 'SET_GROUP_MEMBER_COUNT', count: bannedFrom.getMembersCount() });
      },
      onMemberAddedToGroup: (_action, _addedBy, _addedUser, addedTo) => {
        dispatch({ type: 'SET_GROUP_MEMBER_COUNT', count: addedTo.getMembersCount() });
      },
      onGroupMemberScopeChanged: () => {
        // Scope changes don't affect member count, but we could update group metadata
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

  // --- Call listener ---
  useEffect(() => {
    if (!user && !group) return;

    const listenerId = `CometChatMessageHeader_call_${instanceId}`;

    const cleanup = attachCallListener(listenerId, {
      onIncomingCallReceived: () => {
        dispatch({ type: 'SET_CALL_BUTTONS_DISABLED', disabled: true });
      },
      onIncomingCallCancelled: () => {
        dispatch({ type: 'SET_CALL_BUTTONS_DISABLED', disabled: false });
      },
      onOutgoingCallAccepted: (call: CometChat.Call) => {
        // This fires on the CALLER's side when the callee accepts.
        // call.getSender() is the callee (acceptor).
        // Ignore if:
        // 1. The sender is the logged-in user (this is the callee's own listener firing)
        // 2. The session doesn't match our active outgoing call
        const currentCall = state.activeCall;
        const senderUid = call.getSender().getUid();

        if (senderUid === loggedInUser?.getUid()) {
          // This is the callee's side — IncomingCall component handles it
          return;
        }

        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (!currentCall || call.getSessionId() !== currentCall.getSessionId()) {
          // Not our call — ignore
          return;
        }

        // Our outgoing call was accepted — transition to ongoing call
        dispatch({
          type: 'SHOW_ONGOING_CALL',
          show: true,
          sessionId: call.getSessionId(),
          isDirectCalling: false,
        });
      },
      onOutgoingCallRejected: () => {
        CometChat.clearActiveCall();
        dispatch({ type: 'RESET_CALL_STATE' });
      },
    });

    return cleanup;
  }, [user, group, instanceId, state.activeCall, loggedInUser]);

  // --- UI Events subscription (cross-component communication) ---
  useCometChatEvents(
    event => {
      if (event.type === 'ui:call/rejected') {
        // Re-enable call buttons when the local user rejects an incoming call
        CometChat.clearActiveCall();
        dispatch({ type: 'SET_CALL_BUTTONS_DISABLED', disabled: false });
      }
      if (event.type === 'ui:call/ended') {
        CometChat.clearActiveCall();
        dispatch({ type: 'RESET_CALL_STATE' });
      }
      if (event.type === 'ui:call/join') {
        // User clicked "Join" on a meeting bubble — start direct call
        const joinEvent = event as {
          type: 'ui:call/join';
          sessionId: string;
          message: CometChat.BaseMessage;
        };
        const msg = joinEvent.message as CometChat.CustomMessage;
        const customData = msg.getCustomData() as Record<string, unknown> | undefined;
        const callType = customData?.callType;
        const isAudio = callType === 'audio';
        dispatch({
          type: 'SHOW_ONGOING_CALL',
          show: true,
          sessionId: joinEvent.sessionId,
          isDirectCalling: true,
          isGroupAudioCall: isAudio,
        });
      }

      // --- Group UI events: update member count and subtitle ---
      // Note: The SDK group listener already handles member count updates from the server.
      // These UI event handlers are for immediate local feedback when the SDK event
      // hasn't arrived yet (e.g., the user who performed the action sees it instantly).
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
      if (event.type === 'ui:group/ownership-changed') {
        if (event.group.getGuid() === group?.getGuid()) {
          const count = event.group.getMembersCount() || 0;
          if (count > 0) {
            dispatch({ type: 'SET_GROUP_MEMBER_COUNT', count });
          }
        }
      }
      if (event.type === 'ui:group/member-scope-changed') {
        if (event.group.getGuid() === group?.getGuid()) {
          // Scope change doesn't affect count, but update if the group has a new count
          const count = event.group.getMembersCount() || 0;
          if (count > 0) {
            dispatch({ type: 'SET_GROUP_MEMBER_COUNT', count });
          }
        }
      }
    },
    [user?.getUid(), group?.getGuid()]
  );

  // --- Call actions ---

  // --- Send group call "meeting" custom message ---
  const sendGroupCallMessage = useCallback(
    (targetGroup: CometChat.Group, sessionId: string, callType: string) => {
      const receiverId = targetGroup.getGuid();
      const customData = {
        sessionID: sessionId,
        sessionId: sessionId,
        callType,
      };

      const customMessage = new CometChat.CustomMessage(
        receiverId,
        CometChat.RECEIVER_TYPE.GROUP,
        CometChatUIKitConstants.calls.meeting,
        customData
      );

      (
        customMessage as unknown as { setMetadata: (m: Record<string, unknown>) => void }
      ).setMetadata({ incrementUnreadCount: true });

      (
        customMessage as unknown as { shouldUpdateConversation: (v: boolean) => void }
      ).shouldUpdateConversation(true);
      if (loggedInUser) {
        customMessage.setSender(loggedInUser);
      }

      CometChat.sendCustomMessage(customMessage).then(
        (sentMessage: CometChat.CustomMessage) => {
          publish({
            type: 'ui:message/sent',
            message: sentMessage,
            status: CometChatMessageStatus.success,
          });
        },
        (error: unknown) => {
          handleError(error);
        }
      );
    },
    [loggedInUser, publish, handleError]
  );

  const initiateAudioCall = useCallback(async () => {
    try {
      if (user) {
        const callObj = new CometChat.Call(
          user.getUid(),
          CometChat.CALL_TYPE.AUDIO,
          CometChat.RECEIVER_TYPE.USER
        );
        const outgoingCall = await CometChat.initiateCall(callObj);
        publish({ type: 'ui:call/outgoing', call: outgoingCall });
        dispatch({ type: 'SET_ACTIVE_CALL', call: outgoingCall });
        dispatch({ type: 'SHOW_OUTGOING_CALL_SCREEN', show: true });
      } else if (group) {
        // Group audio call — direct calling workflow
        const sessionId = group.getGuid();
        // Send meeting custom message so other group members can see and join
        sendGroupCallMessage(group, sessionId, 'audio');
        dispatch({
          type: 'SHOW_ONGOING_CALL',
          show: true,
          sessionId,
          isDirectCalling: true,
          isGroupAudioCall: true,
        });
      }
    } catch (error) {
      handleError(error);
    }
  }, [user, group, publish, sendGroupCallMessage, handleError]);

  const initiateVideoCall = useCallback(async () => {
    try {
      if (user) {
        const callObj = new CometChat.Call(
          user.getUid(),
          CometChat.CALL_TYPE.VIDEO,
          CometChat.RECEIVER_TYPE.USER
        );
        const outgoingCall = await CometChat.initiateCall(callObj);
        publish({ type: 'ui:call/outgoing', call: outgoingCall });
        dispatch({ type: 'SET_ACTIVE_CALL', call: outgoingCall });
        dispatch({ type: 'SHOW_OUTGOING_CALL_SCREEN', show: true });
      } else if (group) {
        // Group video call — direct calling workflow
        const sessionId = group.getGuid();
        // Send meeting custom message so other group members can see and join
        sendGroupCallMessage(group, sessionId, 'video');
        dispatch({
          type: 'SHOW_ONGOING_CALL',
          show: true,
          sessionId,
          isDirectCalling: true,
          isGroupAudioCall: false,
        });
      }
    } catch (error) {
      handleError(error);
    }
  }, [user, group, publish, sendGroupCallMessage, handleError]);

  const cancelOutgoingCall = useCallback(async () => {
    const call = state.activeCall;
    if (!call) return;

    try {
      const sessionId = call.getSessionId();
      await CometChat.rejectCall(sessionId, CometChat.CALL_STATUS.CANCELLED);
      CometChat.clearActiveCall();
    } catch (error) {
      handleError(error);
    }
    dispatch({ type: 'RESET_CALL_STATE' });
  }, [state.activeCall, handleError]);

  const resetCallState = useCallback(() => {
    dispatch({ type: 'RESET_CALL_STATE' });
  }, []);

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
        return `${typingUsers[0].getName()} is typing`;
      }

      if (typingUsers.length === 2) {
        return `${typingUsers[0].getName()} and ${typingUsers[1].getName()} are typing`;
      }

      const othersCount = typingUsers.length - 1;
      return `${typingUsers[0].getName()} and ${othersCount.toString()} others are typing`;
    }

    return 'typing';
  })();

  return {
    ...state,
    isTyping: state.typingIndicator !== null || state.typingUsers.length > 0,
    typingText,
    loggedInUser,
    // Actions
    initiateAudioCall,
    initiateVideoCall,
    cancelOutgoingCall,
    resetCallState,
  };
}
