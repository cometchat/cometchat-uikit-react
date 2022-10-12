import { CometChat } from "@cometchat-pro/chat";
export class GroupListManager {
	groupRequest = null;
	groupListenerId = "grouplist_" + new Date().getTime();

	
	constructor(limit, searchKeyword, joinedOnly, tags) {
		if (searchKeyword) {
			this.groupRequest = new CometChat.GroupsRequestBuilder()
				.setLimit(limit)
				.joinedOnly(joinedOnly)
				.setTags(tags)
				.setSearchKeyword(searchKeyword)
				.build();
		} else {
			this.groupRequest = new CometChat.GroupsRequestBuilder()
				.setLimit(limit)
				.joinedOnly(joinedOnly)
				.setTags(tags)
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
