import React, { useCallback, useEffect, useId, useMemo, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatEvent,
  CometChatUIEvent,
  CometChatEventsProviderProps,
} from './CometChatEvents.types';
import { CometChatEventsContext } from './CometChatEventsContext';
import { CometChatLogger } from '../utils/CometChatLogger';

/**
 * CometChatEventsProvider — unified event system for CometChat UIKit.
 *
 * Merges SDK listener events (from network) with UI events (local actions)
 * into a single pub/sub system. Components subscribe via useCometChatEvents()
 * and publish via usePublishEvent().
 *
 *
 * SDK listeners attached: message, user, group, call, connection.
 * UI events: published by components (composer, message list, etc.) for
 * cross-component communication within the same tab.
 */
export const CometChatEventsProvider: React.FC<CometChatEventsProviderProps> = ({ children }) => {
  const instanceId = useId();
  const subscribersRef = useRef<Set<(event: CometChatEvent) => void>>(new Set());

  const emit = useCallback((event: CometChatEvent) => {
    subscribersRef.current.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        CometChatLogger.error('CometChatEventsProvider', 'Subscriber error', error);
      }
    });
  }, []);

  const subscribe = useCallback((handler: (event: CometChatEvent) => void) => {
    subscribersRef.current.add(handler);
    return () => {
      subscribersRef.current.delete(handler);
    };
  }, []);

  const publish = useCallback(
    (event: CometChatUIEvent) => {
      emit(event);
    },
    [emit]
  );

  // --- Message listener ---
  useEffect(() => {
    const id = `CometChatEvents_msg_${instanceId}`;
    CometChat.addMessageListener(
      id,
      new CometChat.MessageListener({
        onTextMessageReceived: (msg: CometChat.TextMessage) => {
          emit({ type: 'message/text-received', message: msg });
        },
        onMediaMessageReceived: (msg: CometChat.MediaMessage) => {
          emit({ type: 'message/media-received', message: msg });
        },
        onCustomMessageReceived: (msg: CometChat.CustomMessage) => {
          emit({ type: 'message/custom-received', message: msg });
        },
        onInteractiveMessageReceived: (msg: CometChat.InteractiveMessage) => {
          emit({ type: 'message/interactive-received', message: msg });
        },
        onMessageEdited: (msg: CometChat.BaseMessage) => {
          emit({ type: 'message/edited', message: msg });
        },
        onMessageDeleted: (msg: CometChat.BaseMessage) => {
          emit({ type: 'message/deleted', message: msg });
        },
        onMessageModerated: (msg: CometChat.BaseMessage) => {
          emit({ type: 'message/moderated', message: msg });
        },
        onMessagesDelivered: (receipt: CometChat.MessageReceipt) => {
          emit({ type: 'receipt/delivered', receipt });
        },
        onMessagesRead: (receipt: CometChat.MessageReceipt) => {
          emit({ type: 'receipt/read', receipt });
        },
        onMessagesDeliveredToAll: (receipt: CometChat.MessageReceipt) => {
          emit({ type: 'receipt/delivered-to-all', receipt });
        },
        onMessagesReadByAll: (receipt: CometChat.MessageReceipt) => {
          emit({ type: 'receipt/read-by-all', receipt });
        },
        onMessageReactionAdded: (event: CometChat.ReactionEvent) => {
          emit({ type: 'reaction/added', event });
        },
        onMessageReactionRemoved: (event: CometChat.ReactionEvent) => {
          emit({ type: 'reaction/removed', event });
        },
        onTypingStarted: (indicator: CometChat.TypingIndicator) => {
          emit({ type: 'typing/started', indicator });
        },
        onTypingEnded: (indicator: CometChat.TypingIndicator) => {
          emit({ type: 'typing/ended', indicator });
        },
      })
    );
    return () => {
      CometChat.removeMessageListener(id);
    };
  }, [instanceId, emit]);

  // --- User listener ---
  useEffect(() => {
    const id = `CometChatEvents_user_${instanceId}`;
    CometChat.addUserListener(
      id,
      new CometChat.UserListener({
        onUserOnline: (user: CometChat.User) => {
          emit({ type: 'user/online', user });
        },
        onUserOffline: (user: CometChat.User) => {
          emit({ type: 'user/offline', user });
        },
      })
    );
    return () => {
      CometChat.removeUserListener(id);
    };
  }, [instanceId, emit]);

  // --- Group listener ---
  useEffect(() => {
    const id = `CometChatEvents_group_${instanceId}`;
    CometChat.addGroupListener(
      id,
      new CometChat.GroupListener({
        onGroupMemberJoined: (
          action: CometChat.Action,
          joinedUser: CometChat.User,
          joinedGroup: CometChat.Group
        ) => {
          emit({ type: 'group/member-joined', action, joinedUser, joinedGroup });
        },
        onGroupMemberLeft: (
          action: CometChat.Action,
          leftUser: CometChat.User,
          leftGroup: CometChat.Group
        ) => {
          emit({ type: 'group/member-left', action, leftUser, leftGroup });
        },
        onGroupMemberKicked: (
          action: CometChat.Action,
          kickedUser: CometChat.User,
          kickedBy: CometChat.User,
          kickedFrom: CometChat.Group
        ) => {
          emit({ type: 'group/member-kicked', action, kickedUser, kickedBy, kickedFrom });
        },
        onGroupMemberBanned: (
          action: CometChat.Action,
          bannedUser: CometChat.User,
          bannedBy: CometChat.User,
          bannedFrom: CometChat.Group
        ) => {
          emit({ type: 'group/member-banned', action, bannedUser, bannedBy, bannedFrom });
        },
        onGroupMemberUnbanned: (
          action: CometChat.Action,
          unbannedUser: CometChat.User,
          unbannedBy: CometChat.User,
          unbannedFrom: CometChat.Group
        ) => {
          emit({
            type: 'group/member-unbanned',
            action,
            unbannedUser,
            unbannedBy,
            unbannedFrom,
          });
        },
        onMemberAddedToGroup: (
          action: CometChat.Action,
          addedBy: CometChat.User,
          addedUser: CometChat.User,
          addedTo: CometChat.Group
        ) => {
          emit({ type: 'group/member-added', action, addedBy, addedUser, addedTo });
        },
        onGroupMemberScopeChanged: (
          action: CometChat.Action,
          changedUser: CometChat.User,
          newScope: string,
          oldScope: string,
          changedGroup: CometChat.Group
        ) => {
          emit({
            type: 'group/member-scope-changed',
            action,
            changedUser,
            newScope,
            oldScope,
            changedGroup,
          });
        },
      })
    );
    return () => {
      CometChat.removeGroupListener(id);
    };
  }, [instanceId, emit]);

  // --- Call listener ---
  useEffect(() => {
    const id = `CometChatEvents_call_${instanceId}`;
    CometChat.addCallListener(
      id,
      new CometChat.CallListener({
        onIncomingCallReceived: (call: CometChat.Call) => {
          emit({ type: 'call/incoming', call });
        },
        onOutgoingCallAccepted: (call: CometChat.Call) => {
          emit({ type: 'call/accepted', call });
        },
        onOutgoingCallRejected: (call: CometChat.Call) => {
          emit({ type: 'call/rejected', call });
        },
        onIncomingCallCancelled: (call: CometChat.Call) => {
          emit({ type: 'call/cancelled', call });
        },
        onCallEndedMessageReceived: (call: CometChat.Call) => {
          emit({ type: 'call/ended', call });
        },
      })
    );
    return () => {
      CometChat.removeCallListener(id);
    };
  }, [instanceId, emit]);

  // --- Connection listener ---
  useEffect(() => {
    const id = `CometChatEvents_conn_${instanceId}`;
    CometChat.addConnectionListener(
      id,
      new CometChat.ConnectionListener({
        onConnected: () => {
          emit({ type: 'connection/connected' });
        },
        onDisconnected: () => {
          emit({ type: 'connection/disconnected' });
        },
      })
    );
    return () => {
      CometChat.removeConnectionListener(id);
    };
  }, [instanceId, emit]);

  const contextValue = useMemo(() => ({ subscribe, publish }), [subscribe, publish]);

  return (
    <CometChatEventsContext.Provider value={contextValue}>
      {children}
    </CometChatEventsContext.Provider>
  );
};

CometChatEventsProvider.displayName = 'CometChatEventsProvider';
