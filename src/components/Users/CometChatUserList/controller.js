import { CometChat } from "@cometchat-pro/chat";

export class UserListManager {
	usersRequest = null;
	userListenerId = "userlist_" + new Date().getTime();

	constructor(
		limit,
		searchKeyword,
		hideBlockedUsers,
		roles,
		friendsOnly,
		status,
		uids,
		tags
	) {
		if (searchKeyword.trim().length) {
			this.usersRequest = new CometChat.UsersRequestBuilder()
				.setLimit(limit)
				.hideBlockedUsers(hideBlockedUsers)
				.setRoles(roles)
				.friendsOnly(friendsOnly)
				.setSearchKeyword(searchKeyword)
				.setStatus(status)
				.setTags(tags)
				.setUIDs(uids)
				.build();
		} else {
			this.usersRequest = new CometChat.UsersRequestBuilder()
				.setLimit(limit)
				.hideBlockedUsers(hideBlockedUsers)
				.setRoles(roles)
				.friendsOnly(friendsOnly)
				.setStatus(status)
				.setTags(tags)
				.setUIDs(uids)
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
