import { CometChat } from "@cometchat-pro/chat";

import * as enums from "../../../util/enums.js";

export class GroupListManager {
	groupRequest = null;
	groupListenerId = "grouplist_" + new Date().getTime();

	constructor(searchKey) {
		if (searchKey) {
			this.groupRequest = new CometChat.GroupsRequestBuilder()
				.setLimit(30)
				.setSearchKeyword(searchKey)
				.build();
		} else {
			this.groupRequest = new CometChat.GroupsRequestBuilder()
				.setLimit(30)
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
					callback(enums.GROUP_MEMBER_SCOPE_CHANGED, message, changedGroup, {
						user: changedUser,
						scope: newScope,
					});
				},
				onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
					callback(enums.GROUP_MEMBER_KICKED, message, kickedFrom, {
						user: kickedUser,
						hasJoined: false,
					});
				},
				onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
					callback(enums.GROUP_MEMBER_BANNED, message, bannedFrom, {
						user: bannedUser,
						hasJoined: false,
					});
				},
				onGroupMemberUnbanned: (
					message,
					unbannedUser,
					unbannedBy,
					unbannedFrom
				) => {
					callback(enums.GROUP_MEMBER_UNBANNED, message, unbannedFrom, {
						user: unbannedUser,
						hasJoined: false,
					});
				},
				onMemberAddedToGroup: (
					message,
					userAdded,
					userAddedBy,
					userAddedIn
				) => {
					callback(enums.GROUP_MEMBER_ADDED, message, userAddedIn, {
						user: userAdded,
						hasJoined: true,
					});
				},
				onGroupMemberLeft: (message, leavingUser, group) => {
					callback(enums.GROUP_MEMBER_LEFT, message, group, {
						user: leavingUser,
					});
				},
				onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
					callback(enums.GROUP_MEMBER_JOINED, message, joinedGroup, {
						user: joinedUser,
					});
				},
			})
		);
	}

	removeListeners() {
		CometChat.removeGroupListener(this.groupListenerId);
	}
}
