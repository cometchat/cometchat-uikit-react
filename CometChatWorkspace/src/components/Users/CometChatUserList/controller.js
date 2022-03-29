import { CometChat } from "@cometchat-pro/chat";

export class UserListManager {
  usersRequest = null;
  userListenerId = "userlist_" + new Date().getTime();

  constructor(props) {
    if (props.searchKeyword.trim().length) {
      this.usersRequest = new CometChat.UsersRequestBuilder()
        .setLimit(props.limit)
        .hideBlockedUsers(props.hideBlockedUsers)
        .setRoles(props.roles)
        .friendsOnly(props.friendsOnly)
        .setSearchKeyword(props.searchKeyword)
        .setStatus(props.status)
        .setTags(props.tags)
        .setUIDs(props.uids)
        .build();
    } else {
      this.usersRequest = new CometChat.UsersRequestBuilder()
        .setLimit(props.limit)
        .hideBlockedUsers(props.hideBlockedUsers)
        .setRoles(props.roles)
        .friendsOnly(props.friendsOnly)
        .setStatus(props.status)
        .setTags(props.tags)
        .setUIDs(props.uids)
        .build();
    }
  }

  fetchNextUsers = () => {
    return this.usersRequest.fetchNext();
  };

  attachListeners = (callback) => {
    CometChat.addUserListener(
      this.userListenerId,
      new CometChat.UserListener({
        onUserOnline: (onlineUser) => {
          /* when someuser/friend comes online, user will be received here */
          callback(onlineUser);
        },
        onUserOffline: (offlineUser) => {
          /* when someuser/friend went offline, user will be received here */
          callback(offlineUser);
        },
      })
    );
  };

  removeListeners() {
    CometChat.removeUserListener(this.userListenerId);
  }
}
