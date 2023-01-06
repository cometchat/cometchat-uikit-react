import { CometChat } from "@cometchat-pro/chat";
import { ConversationTypeConstants } from "../../Shared/Constants/UIKitConstants";

export class ConversationListManager {
  conversationRequest = null;

  conversationListenerId = "chatlist_" + new Date().getTime();
  userListenerId = "chatlist_user_" + new Date().getTime();
  groupListenerId = "chatlist_group_" + new Date().getTime();

  constructor({
    conversationType = "both",
    limit = 30,
    tags = [],
    userAndGroupTags = false,
  }) {
    switch (conversationType) {
      case ConversationTypeConstants[ConversationTypeConstants.users]:
        this.conversationRequest = new CometChat.ConversationsRequestBuilder()
          .setConversationType(conversationType)
          .setLimit(limit)
          .withTags(tags.length === 0 ? false : true)
          .setTags(tags)
          .withUserAndGroupTags(userAndGroupTags)
          .build();

        break;
      case ConversationTypeConstants[ConversationTypeConstants.groups]:
        this.conversationRequest = new CometChat.ConversationsRequestBuilder()
          .setConversationType(conversationType)
          .setLimit(limit)
          .withTags(tags.length === 0 ? false : true)
          .setTags(tags)
          .withUserAndGroupTags(userAndGroupTags)
          .build();
        break;
      default:
        this.conversationRequest = new CometChat.ConversationsRequestBuilder()
          .setLimit(limit)
          .withTags(tags.length === 0 ? false : true)
          .setTags(tags)
          .withUserAndGroupTags(userAndGroupTags)
          .build();

        break;
    }
  }

  fetchNextConversation() {
    return this.conversationRequest.fetchNext();
  }

  attachListeners(callback) {
    CometChat.addUserListener(
      this.userListenerId,
      new CometChat.UserListener({
        onUserOnline: (onlineUser) => {
          callback("onUserOnline", onlineUser);
        },
        onUserOffline: (offlineUser) => {
          callback("onUserOffline", offlineUser);
        },
      })
    );

    CometChat.addGroupListener(
      this.groupListenerId,
      new CometChat.GroupListener({
        onGroupMemberScopeChanged: (
          message,
          changedUser,
          newScope,
          oldScope,
          changedGroup
        ) => {
          callback(
            "onGroupMemberScopeChanged",
            message,
            changedUser,
            newScope,
            oldScope,
            changedGroup
          );
        },
        onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
          callback(
            "onGroupMemberKicked",
            message,
            kickedUser,
            kickedBy,
            kickedFrom
          );
        },
        onGroupMemberLeft: (message, leavingUser, group) => {
          callback("onGroupMemberLeft", message, leavingUser, null, group);
        },
        onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
          callback(
            "onGroupMemberBanned",
            message,
            bannedUser,
            bannedBy,
            bannedFrom
          );
        },
        onMemberAddedToGroup: (
          message,
          userAdded,
          userAddedBy,
          userAddedIn
        ) => {
          callback(
            "onMemberAddedToGroup",
            message,
            userAdded,
            userAddedBy,
            userAddedIn
          );
        },
        onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
          callback(
            "onGroupMemberJoined",
            message,
            joinedUser,
            null,
            joinedGroup
          );
        },
      })
    );

    CometChat.addMessageListener(
      this.conversationListenerId,
      new CometChat.MessageListener({
        onTextMessageReceived: (textMessage) => {
          callback("onTextMessageReceived", textMessage);
        },
        onMediaMessageReceived: (mediaMessage) => {
          callback("onMediaMessageReceived", mediaMessage);
        },
        onCustomMessageReceived: (customMessage) => {
          callback("onCustomMessageReceived", customMessage);
        },
        onMessageDeleted: (deletedMessage) => {
          callback("onMessageDeleted", deletedMessage);
        },
        onMessageEdited: (editedMessage) => {
          callback("onMessageEdited", editedMessage);
        },
        onMessagesRead: (messageReceipt) => {
          callback("onMessagesRead", messageReceipt);
        },
        onTypingStarted: (typingIndicator) => {
          callback("onTypingStarted", typingIndicator, true);
        },
        onTypingEnded: (typingIndicator) => {
          callback("onTypingEnded", typingIndicator, false);
        },
      })
    );
  }
  removeListeners() {
    CometChat.removeMessageListener(this.conversationListenerId);
    CometChat.removeUserListener(this.userListenerId);
    CometChat.removeGroupListener(this.groupListenerId);
  }
}
