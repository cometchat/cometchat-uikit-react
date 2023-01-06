import { CometChat } from "@cometchat-pro/chat";

export class MessageListManager {
  parentMessageId = null;
  messageRequest = null;

  messageListenerId = "message_" + new Date().getTime();
  groupListenerId = "group_" + new Date().getTime();
  user = null;
  group = null;

  constructor(
    limit,
    user,
    group,
    onlyUnread,
    hideDeletedMessages,
    hideMessagesFromBlockedUsers,
    tags,
    messageTypesRef,
    messageCategoryRef
  ) {
    const types = messageTypesRef;
    const categories = messageCategoryRef;

    if (user && user.uid) {
      this.messageRequest = new CometChat.MessagesRequestBuilder()
        .setLimit(limit)
        .setUID(user.uid)
        .setCategories(categories)
        .setTypes(types)
        .setUnread(onlyUnread)
        .hideMessagesFromBlockedUsers(hideMessagesFromBlockedUsers)
        .setTags(tags)
        .hideDeletedMessages(hideDeletedMessages)
        .build();
    } else if (group && group.guid) {
      this.messageRequest = new CometChat.MessagesRequestBuilder()
        .setGUID(group.guid)
        .setLimit(limit)
        .setCategories(categories)
        .setTypes(types)
        .setUnread(onlyUnread)
        .hideMessagesFromBlockedUsers(hideMessagesFromBlockedUsers)
        .setTags(tags)
        .hideDeletedMessages(hideDeletedMessages)
        .build();
    }
  }

  fetchPreviousMessages() {
    return this.messageRequest.fetchPrevious();
  }

  attachListeners(callback) {
    CometChat.addMessageListener(
      this.messageListenerId,
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
        onMessagesDelivered: (messageReceipt) => {
          callback("onMessagesDelivered", messageReceipt);
        },
        onMessagesRead: (messageReceipt) => {
          callback("onMessagesRead", messageReceipt);
        },
        onMessageDeleted: (deletedMessage) => {
          callback("onMessageDeleted", deletedMessage);
        },
        onMessageEdited: (editedMessage) => {
          callback("onMessageEdited", editedMessage);
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
        onGroupMemberLeft: (message, leavingUser, group) => {
          callback("onGroupMemberLeft", message, leavingUser, group);
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
        onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
          callback(
            "onGroupMemberBanned",
            message,
            bannedUser,
            bannedBy,
            bannedFrom
          );
        },
        onGroupMemberUnbanned: (
          message,
          unbannedUser,
          unbannedBy,
          unbannedFrom
        ) => {
          callback(
            "onGroupMemberUnbanned",
            message,
            unbannedUser,
            unbannedBy,
            unbannedFrom
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
  }

  removeListeners() {
    CometChat.removeMessageListener(this.messageListenerId);
    CometChat.removeGroupListener(this.groupListenerId);
  }
}
