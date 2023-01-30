import { CometChat } from "@cometchat-pro/chat";

import * as enums from "../../../util/enums.js";

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
					callback(enums.USER_ONLINE, onlineUser);
				},
				onUserOffline: (offlineUser) => {
					/* when someuser/friend went offline, user will be received here */
					callback(enums.USER_OFFLINE, offlineUser);
				},
			})
		);

		CometChat.addMessageListener(
			this.msgListenerId,
			new CometChat.MessageListener({
				onTypingStarted: (typingIndicator) => {
					callback(enums.TYPING_STARTED, typingIndicator);
				},
				onTypingEnded: (typingIndicator) => {
					callback(enums.TYPING_ENDED, typingIndicator);
				},
			})
		);

		CometChat.addGroupListener(
			this.groupListenerId,
			new CometChat.GroupListener({
				onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
					callback(enums.GROUP_MEMBER_KICKED, kickedFrom, kickedUser);
				},
				onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
					callback(enums.GROUP_MEMBER_BANNED, bannedFrom, bannedUser);
				},
				onMemberAddedToGroup: (
					message,
					userAdded,
					userAddedBy,
					userAddedIn
				) => {
					callback(enums.GROUP_MEMBER_ADDED, userAddedIn);
				},
				onGroupMemberLeft: (message, leavingUser, group) => {
					callback(enums.GROUP_MEMBER_LEFT, group, leavingUser);
				},
				onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
					callback(enums.GROUP_MEMBER_JOINED, joinedGroup);
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
