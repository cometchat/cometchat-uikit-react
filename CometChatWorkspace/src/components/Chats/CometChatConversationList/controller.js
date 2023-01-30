import { CometChat } from "@cometchat-pro/chat";

import * as enums from "../../../util/enums.js";
import { UIKitSettings } from "../../../util/UIKitSettings";

export class ConversationListManager {
	conversationRequest = null;

	conversationListenerId = "chatlist_" + new Date().getTime();
	userListenerId = "chatlist_user_" + new Date().getTime();
	groupListenerId = "chatlist_group_" + new Date().getTime();
	callListenerId = "chatlist_call_" + new Date().getTime();

	constructor(context) {
		const chatListMode = context.UIKitSettings.chatListMode;
		const chatListFilterOptions = UIKitSettings.chatListFilterOptions;

		switch (chatListMode) {
			case chatListFilterOptions["USERS"]:
				this.conversationRequest = new CometChat.ConversationsRequestBuilder()
					.setConversationType(CometChat.ACTION_TYPE.TYPE_USER)
					.setLimit(30)
					.build();
				break;
			case chatListFilterOptions["GROUPS"]:
				this.conversationRequest = new CometChat.ConversationsRequestBuilder()
					.setConversationType(CometChat.ACTION_TYPE.TYPE_GROUP)
					.setLimit(30)
					.build();
				break;
			default:
				this.conversationRequest = new CometChat.ConversationsRequestBuilder()
					.setLimit(30)
					.build();
				break;
		}
	}

	fetchNextConversation() {
		return this.conversationRequest.fetchNext();
	}

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
					callback(enums.GROUP_MEMBER_SCOPE_CHANGED, changedGroup, message, {
						user: changedUser,
						scope: newScope,
					});
				},
				onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
					callback(enums.GROUP_MEMBER_KICKED, kickedFrom, message, {
						user: kickedUser,
						hasJoined: false,
					});
				},
				onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
					callback(enums.GROUP_MEMBER_BANNED, bannedFrom, message, {
						user: bannedUser,
					});
				},
				onGroupMemberUnbanned: (
					message,
					unbannedUser,
					unbannedBy,
					unbannedFrom
				) => {
					callback(enums.GROUP_MEMBER_UNBANNED, unbannedFrom, message, {
						user: unbannedUser,
					});
				},
				onMemberAddedToGroup: (
					message,
					userAdded,
					userAddedBy,
					userAddedIn
				) => {
					callback(enums.GROUP_MEMBER_ADDED, userAddedIn, message, {
						user: userAdded,
						hasJoined: true,
					});
				},
				onGroupMemberLeft: (message, leavingUser, group) => {
					callback(enums.GROUP_MEMBER_LEFT, group, message, {
						user: leavingUser,
					});
				},
				onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
					callback(enums.GROUP_MEMBER_JOINED, joinedGroup, message, {
						user: joinedUser,
					});
				},
			})
		);

		CometChat.addMessageListener(
			this.conversationListenerId,
			new CometChat.MessageListener({
				onTextMessageReceived: (textMessage) => {
					callback(enums.TEXT_MESSAGE_RECEIVED, null, textMessage);
				},
				onMediaMessageReceived: (mediaMessage) => {
					callback(enums.MEDIA_MESSAGE_RECEIVED, null, mediaMessage);
				},
				onCustomMessageReceived: (customMessage) => {
					callback(enums.CUSTOM_MESSAGE_RECEIVED, null, customMessage);
				},
				onMessageDeleted: (deletedMessage) => {
					callback(enums.MESSAGE_DELETED, null, deletedMessage);
				},
				onMessageEdited: (editedMessage) => {
					callback(enums.MESSAGE_EDITED, null, editedMessage);
				},
				onMessagesRead: (messageReceipt) => {
					callback(enums.MESSAGE_READ, null, messageReceipt);
				},
			})
		);

		CometChat.addCallListener(
			this.callListenerId,
			new CometChat.CallListener({
				onIncomingCallReceived: (call) => {
					callback(enums.INCOMING_CALL_RECEIVED, null, call);
				},
				onIncomingCallCancelled: (call) => {
					callback(enums.INCOMING_CALL_CANCELLED, null, call);
				},
			})
		);
	}

	removeListeners() {
		CometChat.removeMessageListener(this.conversationListenerId);
		CometChat.removeUserListener(this.userListenerId);
		CometChat.removeGroupListener(this.groupListenerId);
		CometChat.removeCallListener(this.callListenerId);
	}
}
