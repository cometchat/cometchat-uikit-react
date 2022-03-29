import { CometChat } from "@cometchat-pro/chat";
export class GroupListManager {
  groupRequest = null;
  groupListenerId = "grouplist_" + new Date().getTime();

  constructor(props) {
    if (props.searchKeyword) {
      this.groupRequest = new CometChat.GroupsRequestBuilder()
        .setLimit(props.limit)
        .joinedOnly(props.joinedOnly)
        .setTags(props.tags)
        .setSearchKeyword(props.searchKeyword)
        .build();
    } else {
      this.groupRequest = new CometChat.GroupsRequestBuilder()
        .setLimit(props.limit)
        .joinedOnly(props.joinedOnly)
        .setTags(props.tags)
        .build();
    }
  }

  fetchNextGroups() {
    return this.groupRequest.fetchNext();
  }

  attachListeners(callback) {
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
  }

  removeListeners() {
    CometChat.removeGroupListener(this.groupListenerId);
  }
}
