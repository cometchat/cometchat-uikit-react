import { CometChat } from "@cometchat-pro/chat";

export class MessageHeaderManager {
  userListenerId = "head_user_" + new Date().getTime();
  msgListenerId = "head_message_" + new Date().getTime();
  groupListenerId = "head_group_" + new Date().getTime();

  attachListeners(callback) {
    CometChat.addUserListener(
      this.userListenerId,
      new CometChat.UserListener({
        onUserOnline: (onlineUser) => {
          /* when someuser/friend comes online, user will be received here */
          callback("onUserOnline", onlineUser);
        },
        onUserOffline: (offlineUser) => {
          /* when someuser/friend went offline, user will be received here */
          callback("onUserOffline", offlineUser);
        },
      })
    );

    CometChat.addMessageListener(
      this.msgListenerId,
      new CometChat.MessageListener({
        onTypingStarted: (typingIndicator) => {
          callback("onTypingStarted", typingIndicator);
        },
        onTypingEnded: (typingIndicator) => {
          callback("onTypingEnded", typingIndicator);
        },
      })
    );

    CometChat.addGroupListener(
      this.groupListenerId,
      new CometChat.GroupListener({
        onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
          callback("onGroupMemberKicked", kickedFrom, kickedUser);
        },
        onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
          callback("onGroupMemberBanned", bannedFrom, bannedUser);
        },
        onMemberAddedToGroup: (
          message,
          userAdded,
          userAddedBy,
          userAddedIn
        ) => {
          callback("onMemberAddedToGroup", userAddedIn);
        },
        onGroupMemberLeft: (message, leavingUser, group) => {
          callback("onGroupMemberLeft", group, leavingUser);
        },
        onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
          callback("onGroupMemberJoined", joinedGroup);
        },
      })
    );
  }

  removeListeners() {
    CometChat.removeUserListener(this.userListenerId);
    CometChat.removeMessageListener(this.msgListenerId);
    CometChat.removeGroupListener(this.groupListenerId);
  }
}
