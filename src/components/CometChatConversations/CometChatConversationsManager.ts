/* eslint-disable @typescript-eslint/no-unsafe-return */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKit } from '../../CometChatUIKit/CometChatUIKit';

/**
 * CometChatConversationsManager — SDK wrapper for conversation list operations.
 *
 * No React imports. No state. Pure SDK orchestration.
 * Encapsulates conversation fetching, deletion, and listener management.
 */
export class CometChatConversationsManager {
  private conversationsRequest: CometChat.ConversationsRequest;
  private static readonly DEFAULT_LIMIT = 30;

  /**
   * Creates a new ConversationsManager instance.
   * @param builder - Optional ConversationsRequestBuilder. Defaults to limit 30.
   */
  constructor(builder?: CometChat.ConversationsRequestBuilder) {
    const requestBuilder =
      builder ??
      new CometChat.ConversationsRequestBuilder().setLimit(
        CometChatConversationsManager.DEFAULT_LIMIT
      );
    this.conversationsRequest = requestBuilder.build();
  }

  /**
   * Fetch the next page of conversations.
   * @returns Array of conversations. Empty array when exhausted.
   */
  fetchNext(): Promise<CometChat.Conversation[]> {
    return this.conversationsRequest.fetchNext();
  }

  /**
   * Delete a conversation by ID.
   * @param conversationId - The conversation ID to delete.
   * @param conversationType - The type of conversation ('user' or 'group').
   */
  static deleteConversation(conversationWith: string, conversationType: string): Promise<string> {
    return CometChat.deleteConversation(conversationWith, conversationType);
  }

  /**
   * Mark a conversation as read.
   * @param message - The last message in the conversation to mark as read.
   */
  static markAsRead(message: CometChat.BaseMessage): Promise<void> {
    return CometChat.markAsRead(message);
  }

  /**
   * Determines whether a message should trigger a conversation update
   * (last message + unread count). Checks dashboard conversationUpdateSettings.
   */
  static shouldLastMessageAndUnreadCountBeUpdated(message: CometChat.BaseMessage): boolean {
    try {
      const settings = CometChatUIKit.getConversationUpdateSettings();

      const isCustomMessage = message.getCategory() === CometChat.MessageCategory.CUSTOM;

      // Check if the message is a reply to another message
      if (message.getParentMessageId() && !settings?.shouldUpdateOnMessageReplies()) {
        return false;
      }

      if (isCustomMessage) {
        if (
          message.getParentMessageId() &&
          settings?.shouldUpdateOnMessageReplies() &&
          CometChatConversationsManager.shouldIncrementForCustomMessage(
            message as CometChat.CustomMessage,
            settings
          )
        ) {
          return true;
        }
        return CometChatConversationsManager.shouldIncrementForCustomMessage(
          message as CometChat.CustomMessage,
          settings
        );
      }

      // Check if the message is an action message
      if (message.getCategory() === CometChat.MessageCategory.ACTION) {
        // Check if the message is a group member action
        if (message.getType() === 'groupMember') {
          return settings?.shouldUpdateOnGroupActions() ?? true;
        }
        // By default, action messages should trigger an update
        return true;
      }

      // Check if the message is a call (either audio or video)
      if (
        message.getCategory() === CometChat.MessageCategory.CALL &&
        (message.getType() === 'audio' || message.getType() === 'video')
      ) {
        return settings?.shouldUpdateOnCallActivities() ?? true;
      }

      // By default, messages should trigger an update
      return true;
    } catch {
      return true;
    }
  }

  /**
   * Checks if a custom message should increment the unread count / update conversation.
   *
   */
  private static shouldIncrementForCustomMessage(
    message: CometChat.CustomMessage,
    settings: CometChat.ConversationUpdateSettings | null
  ): boolean {
    try {
      const metadata = message.getMetadata() as Record<string, unknown> | null;
      return (
        (message.willUpdateConversation() ||
          (metadata != null &&
            Object.prototype.hasOwnProperty.call(metadata, 'incrementUnreadCount') &&
            !!(metadata as { incrementUnreadCount?: boolean }).incrementUnreadCount) ||
          settings?.shouldUpdateOnCustomMessages()) ??
        false
      );
    } catch {
      return false;
    }
  }

  /**
   * Attach an SDK MessageListener for real-time message events.
   * @param listenerId - Unique listener ID.
   * @param callbacks - Callbacks for message events.
   * @returns Cleanup function to remove the listener.
   */
  static attachMessageListener(
    listenerId: string,
    callbacks: {
      onTextMessageReceived?: (message: CometChat.TextMessage) => void;
      onMediaMessageReceived?: (message: CometChat.MediaMessage) => void;
      onCustomMessageReceived?: (message: CometChat.CustomMessage) => void;
      onCardMessageReceived?: (message: CometChat.BaseMessage) => void;
      onMessageEdited?: (message: CometChat.BaseMessage) => void;
      onMessageDeleted?: (message: CometChat.BaseMessage) => void;
      onMessagesDelivered?: (receipt: CometChat.MessageReceipt) => void;
      onMessagesRead?: (receipt: CometChat.MessageReceipt) => void;
      onMessagesDeliveredToAll?: (receipt: CometChat.MessageReceipt) => void;
      onMessagesReadByAll?: (receipt: CometChat.MessageReceipt) => void;
      onTypingStarted?: (typingIndicator: CometChat.TypingIndicator) => void;
      onTypingEnded?: (typingIndicator: CometChat.TypingIndicator) => void;
    }
  ): () => void {
    CometChat.addMessageListener(
      listenerId,
      new CometChat.MessageListener({
        onTextMessageReceived: callbacks.onTextMessageReceived,
        onMediaMessageReceived: callbacks.onMediaMessageReceived,
        onCustomMessageReceived: callbacks.onCustomMessageReceived,
        onCardMessageReceived: callbacks.onCardMessageReceived,
        onMessageEdited: callbacks.onMessageEdited,
        onMessageDeleted: callbacks.onMessageDeleted,
        onMessagesDelivered: callbacks.onMessagesDelivered,
        onMessagesRead: callbacks.onMessagesRead,
        onMessagesDeliveredToAll: callbacks.onMessagesDeliveredToAll,
        onMessagesReadByAll: callbacks.onMessagesReadByAll,
        onTypingStarted: callbacks.onTypingStarted,
        onTypingEnded: callbacks.onTypingEnded,
      })
    );
    return () => {
      CometChat.removeMessageListener(listenerId);
    };
  }

  /**
   * Attach an SDK UserListener for online/offline status updates.
   * @param listenerId - Unique listener ID.
   * @param callbacks - Callbacks for user status events.
   * @returns Cleanup function to remove the listener.
   */
  static attachUserStatusListener(
    listenerId: string,
    callbacks: {
      onUserOnline: (user: CometChat.User) => void;
      onUserOffline: (user: CometChat.User) => void;
    }
  ): () => void {
    CometChat.addUserListener(
      listenerId,
      new CometChat.UserListener({
        onUserOnline: callbacks.onUserOnline,
        onUserOffline: callbacks.onUserOffline,
      })
    );
    return () => {
      CometChat.removeUserListener(listenerId);
    };
  }

  /**
   * Attach an SDK GroupListener for group events that affect conversations.
   * @param listenerId - Unique listener ID.
   * @param callbacks - Callbacks for group events.
   * @returns Cleanup function to remove the listener.
   */
  static attachGroupListener(
    listenerId: string,
    callbacks: {
      onGroupMemberJoined?: (
        message: CometChat.Action,
        joinedUser: CometChat.User,
        joinedGroup: CometChat.Group
      ) => void;
      onGroupMemberLeft?: (
        message: CometChat.Action,
        leavingUser: CometChat.User,
        group: CometChat.Group
      ) => void;
      onGroupMemberKicked?: (
        message: CometChat.Action,
        kickedUser: CometChat.User,
        kickedBy: CometChat.User,
        kickedFrom: CometChat.Group
      ) => void;
      onGroupMemberBanned?: (
        message: CometChat.Action,
        bannedUser: CometChat.User,
        bannedBy: CometChat.User,
        bannedFrom: CometChat.Group
      ) => void;
      onGroupMemberScopeChanged?: (
        message: CometChat.Action,
        changedUser: CometChat.User,
        newScope: string,
        oldScope: string,
        changedGroup: CometChat.Group
      ) => void;
      onMemberAddedToGroup?: (
        message: CometChat.Action,
        addedBy: CometChat.User,
        addedUser: CometChat.User,
        addedTo: CometChat.Group
      ) => void;
    }
  ): () => void {
    CometChat.addGroupListener(
      listenerId,
      new CometChat.GroupListener({
        onGroupMemberJoined: callbacks.onGroupMemberJoined,
        onGroupMemberLeft: callbacks.onGroupMemberLeft,
        onGroupMemberKicked: callbacks.onGroupMemberKicked,
        onGroupMemberBanned: callbacks.onGroupMemberBanned,
        onGroupMemberScopeChanged: callbacks.onGroupMemberScopeChanged,
        onMemberAddedToGroup: callbacks.onMemberAddedToGroup,
      })
    );
    return () => {
      CometChat.removeGroupListener(listenerId);
    };
  }

  /**
   * Attach an SDK ConnectionListener for reconnect recovery.
   * @param listenerId - Unique listener ID.
   * @param callbacks - Callbacks for connection events.
   * @returns Cleanup function to remove the listener.
   */
  static attachConnectionListener(
    listenerId: string,
    callbacks: {
      onConnected: () => void;
      onDisconnected?: () => void;
    }
  ): () => void {
    CometChat.addConnectionListener(
      listenerId,
      new CometChat.ConnectionListener({
        onConnected: callbacks.onConnected,
        onDisconnected:
          callbacks.onDisconnected ??
          (() => {
            /* no-op */
          }),
      })
    );
    return () => {
      CometChat.removeConnectionListener(listenerId);
    };
  }
}
