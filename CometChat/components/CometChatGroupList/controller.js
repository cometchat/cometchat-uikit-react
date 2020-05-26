import { CometChat } from "@cometchat-pro/chat";

import * as enums from '../../util/enums.js';

export class GroupListManager {

    groupRequest = null;
    groupListenerId = new Date().getTime();

    constructor(searchKey) {

        if (searchKey) {
            this.groupRequest = new CometChat.GroupsRequestBuilder().setLimit(30).setSearchKeyword(searchKey).build();
        } else {
            this.groupRequest = new CometChat.GroupsRequestBuilder().setLimit(30).build();
        }

    }

    fetchNextGroups() {
        return this.groupRequest.fetchNext();
    }

    attachListeners(callback) {

        CometChat.addGroupListener(
            this.groupListenerId,
            new CometChat.GroupListener({
                onGroupMemberScopeChanged: (message, changedUser, newScope, oldScope, changedGroup) => {
                    
                }, 
                onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
                    
                }, 
                onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
                    
                }, 
                onGroupMemberUnbanned: (message, unbannedUser, unbannedBy, unbannedFrom) => {
                    
                }, 
                onMemberAddedToGroup: (message, userAdded, userAddedBy, userAddedIn) => {
                    
                }, 
                onGroupMemberLeft: (message, leavingUser, group) => {
                    callback(enums.GROUP_MEMBER_LEFT, message, leavingUser, group);
                }, 
                onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
                    callback(enums.GROUP_MEMBER_JOINED, message, joinedUser, joinedGroup);
                }
            })
        );

    }

    removeListeners() {
        CometChat.removeGroupListener(this.groupListenerId);
    }
}