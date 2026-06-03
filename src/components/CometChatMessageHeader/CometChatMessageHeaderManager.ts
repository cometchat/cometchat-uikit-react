/**
 * CometChatMessageHeaderManager — SDK listener management for message header.
 *
 * Encapsulates all SDK listener attachment for user status, typing indicators,
 * group member events, connection recovery, and call events.
 *
 * No React imports. Pure SDK orchestration.
 * Each static method returns a cleanup function that removes the listener.
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';

// --- User Status Listener ---

export function attachUserStatusListener(
  listenerId: string,
  userId: string,
  callbacks: {
    onUserOnline: (user: CometChat.User) => void;
    onUserOffline: (user: CometChat.User) => void;
  }
): () => void {
  CometChat.addUserListener(
    listenerId,
    new CometChat.UserListener({
      onUserOnline: (user: CometChat.User) => {
        if (user.getUid() === userId) {
          callbacks.onUserOnline(user);
        }
      },
      onUserOffline: (user: CometChat.User) => {
        if (user.getUid() === userId) {
          callbacks.onUserOffline(user);
        }
      },
    })
  );
  return () => {
    CometChat.removeUserListener(listenerId);
  };
}

// --- Typing Listener ---

export function attachTypingListener(
  listenerId: string,
  entityId: string,
  entityType: 'user' | 'group',
  callbacks: {
    onTypingStarted: (indicator: CometChat.TypingIndicator) => void;
    onTypingEnded: (indicator: CometChat.TypingIndicator) => void;
  }
): () => void {
  CometChat.addMessageListener(
    listenerId,
    new CometChat.MessageListener({
      onTypingStarted: (indicator: CometChat.TypingIndicator) => {
        const receiverId = indicator.getReceiverId();
        const senderId = indicator.getSender().getUid();

        let isRelevant = false;
        if (entityType === 'user') {
          isRelevant = senderId === entityId;
        } else {
          isRelevant =
            indicator.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP &&
            receiverId === entityId;
        }

        if (isRelevant) {
          callbacks.onTypingStarted(indicator);
        }
      },
      onTypingEnded: (indicator: CometChat.TypingIndicator) => {
        const receiverId = indicator.getReceiverId();
        const senderId = indicator.getSender().getUid();

        let isRelevant = false;
        if (entityType === 'user') {
          isRelevant = senderId === entityId;
        } else {
          isRelevant =
            indicator.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP &&
            receiverId === entityId;
        }

        if (isRelevant) {
          callbacks.onTypingEnded(indicator);
        }
      },
    })
  );
  return () => {
    CometChat.removeMessageListener(listenerId);
  };
}

// --- Group Member Listener ---

export function attachGroupMemberListener(
  listenerId: string,
  groupId: string,
  callbacks: {
    onGroupMemberJoined: (
      action: CometChat.Action,
      joinedUser: CometChat.User,
      joinedGroup: CometChat.Group
    ) => void;
    onGroupMemberLeft: (
      action: CometChat.Action,
      leftUser: CometChat.User,
      leftGroup: CometChat.Group
    ) => void;
    onGroupMemberKicked: (
      action: CometChat.Action,
      kickedUser: CometChat.User,
      kickedBy: CometChat.User,
      kickedFrom: CometChat.Group
    ) => void;
    onGroupMemberBanned: (
      action: CometChat.Action,
      bannedUser: CometChat.User,
      bannedBy: CometChat.User,
      bannedFrom: CometChat.Group
    ) => void;
    onMemberAddedToGroup: (
      action: CometChat.Action,
      addedBy: CometChat.User,
      addedUser: CometChat.User,
      addedTo: CometChat.Group
    ) => void;
    onGroupMemberScopeChanged: (
      action: CometChat.Action,
      changedUser: CometChat.User,
      newScope: string,
      oldScope: string,
      changedGroup: CometChat.Group
    ) => void;
  }
): () => void {
  CometChat.addGroupListener(
    listenerId,
    new CometChat.GroupListener({
      onGroupMemberJoined: (
        action: CometChat.Action,
        joinedUser: CometChat.User,
        joinedGroup: CometChat.Group
      ) => {
        if (joinedGroup.getGuid() === groupId) {
          callbacks.onGroupMemberJoined(action, joinedUser, joinedGroup);
        }
      },
      onGroupMemberLeft: (
        action: CometChat.Action,
        leftUser: CometChat.User,
        leftGroup: CometChat.Group
      ) => {
        if (leftGroup.getGuid() === groupId) {
          callbacks.onGroupMemberLeft(action, leftUser, leftGroup);
        }
      },
      onGroupMemberKicked: (
        action: CometChat.Action,
        kickedUser: CometChat.User,
        kickedBy: CometChat.User,
        kickedFrom: CometChat.Group
      ) => {
        if (kickedFrom.getGuid() === groupId) {
          callbacks.onGroupMemberKicked(action, kickedUser, kickedBy, kickedFrom);
        }
      },
      onGroupMemberBanned: (
        action: CometChat.Action,
        bannedUser: CometChat.User,
        bannedBy: CometChat.User,
        bannedFrom: CometChat.Group
      ) => {
        if (bannedFrom.getGuid() === groupId) {
          callbacks.onGroupMemberBanned(action, bannedUser, bannedBy, bannedFrom);
        }
      },
      onMemberAddedToGroup: (
        action: CometChat.Action,
        addedBy: CometChat.User,
        addedUser: CometChat.User,
        addedTo: CometChat.Group
      ) => {
        if (addedTo.getGuid() === groupId) {
          callbacks.onMemberAddedToGroup(action, addedBy, addedUser, addedTo);
        }
      },
      onGroupMemberScopeChanged: (
        action: CometChat.Action,
        changedUser: CometChat.User,
        newScope: string,
        oldScope: string,
        changedGroup: CometChat.Group
      ) => {
        if (changedGroup.getGuid() === groupId) {
          callbacks.onGroupMemberScopeChanged(
            action,
            changedUser,
            newScope,
            oldScope,
            changedGroup
          );
        }
      },
    })
  );
  return () => {
    CometChat.removeGroupListener(listenerId);
  };
}

// --- Connection Listener ---

export function attachConnectionListener(
  listenerId: string,
  callbacks: {
    onConnected: () => void;
    onDisconnected: () => void;
  }
): () => void {
  CometChat.addConnectionListener(
    listenerId,
    new CometChat.ConnectionListener({
      onConnected: callbacks.onConnected,
      onDisconnected: callbacks.onDisconnected,
    })
  );
  return () => {
    CometChat.removeConnectionListener(listenerId);
  };
}

// --- Call Listener ---

export function attachCallListener(
  listenerId: string,
  callbacks: {
    onIncomingCallReceived: (call: CometChat.Call) => void;
    onIncomingCallCancelled: (call: CometChat.Call) => void;
    onOutgoingCallAccepted: (call: CometChat.Call) => void;
    onOutgoingCallRejected: (call: CometChat.Call) => void;
  }
): () => void {
  CometChat.addCallListener(
    listenerId,
    new CometChat.CallListener({
      onIncomingCallReceived: callbacks.onIncomingCallReceived,
      onIncomingCallCancelled: callbacks.onIncomingCallCancelled,
      onOutgoingCallAccepted: callbacks.onOutgoingCallAccepted,
      onOutgoingCallRejected: callbacks.onOutgoingCallRejected,
    })
  );
  return () => {
    CometChat.removeCallListener(listenerId);
  };
}
