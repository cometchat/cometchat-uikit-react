import { CometChat } from "@cometchat-pro/chat";

import * as enums from "../../../util/enums.js";

export class GroupDetailManager {

    guid = null;
    groupMemberRequest = null;
    bannedGroupMemberRequest = null;

    userListenerId = "group_detail_user_" + new Date().getTime();
    groupListenerId = "group_detail_group_" + new Date().getTime();

    constructor(guid) {
        this.guid = guid;
        this.groupMemberRequest = new CometChat.GroupMembersRequestBuilder(guid).setLimit(10).build();
        this.bannedGroupMemberRequest = new CometChat.BannedMembersRequestBuilder(guid).setLimit(10).build();
    }

    fetchNextGroupMembers() {
        return this.groupMemberRequest.fetchNext();
    }

    fetchNextBannedGroupMembers() {
        return this.bannedGroupMemberRequest.fetchNext();
    }

    attachListeners(callback) {

        CometChat.addGroupListener(
            this.groupListenerId,
            new CometChat.GroupListener({
                onGroupMemberScopeChanged: (message, changedUser, newScope, oldScope, changedGroup) => {
                    callback(enums.GROUP_MEMBER_SCOPE_CHANGED, message, changedGroup, {"user": changedUser, "scope": newScope});
                }, 
                onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
                    callback(enums.GROUP_MEMBER_KICKED, message, kickedFrom, {"user": kickedUser, "hasJoined": false});
                }, 
                onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
                    callback(enums.GROUP_MEMBER_BANNED, message, bannedFrom, {"user": bannedUser});
                }, 
                onGroupMemberUnbanned: (message, unbannedUser, unbannedBy, unbannedFrom) => {
                    callback(enums.GROUP_MEMBER_UNBANNED, message, unbannedFrom, {"user": unbannedUser, "hasJoined": false});
                }, 
                onMemberAddedToGroup: (message, userAdded, userAddedBy, userAddedIn) => {
                    callback(enums.GROUP_MEMBER_ADDED, message, userAddedIn, {"user": userAdded, "hasJoined": true});
                }, 
                onGroupMemberLeft: (message, leavingUser, group) => {
                    callback(enums.GROUP_MEMBER_LEFT, message, group, {"user": leavingUser});
                }, 
                onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
                    callback(enums.GROUP_MEMBER_JOINED, message, joinedGroup, {"user": joinedUser});
                }
            })
        );

        CometChat.addUserListener(
            this.userListenerId,
            new CometChat.UserListener({
                onUserOnline: onlineUser => {
                    /* when someuser/friend comes online, user will be received here */
                    callback(enums.USER_ONLINE, null, {guid: this.guid}, {"user": onlineUser});
                },
                onUserOffline: offlineUser => {
                    /* when someuser/friend went offline, user will be received here */
                    callback(enums.USER_OFFLINE, null, {guid: this.guid}, {"user": offlineUser});
                }
            })
        );
    }

    removeListeners() {

        CometChat.removeUserListener(this.userListenerId);
        CometChat.removeGroupListener(this.groupListenerId);
    }
}