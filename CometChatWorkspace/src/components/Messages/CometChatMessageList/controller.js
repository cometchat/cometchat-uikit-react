import { CometChat } from "@cometchat-pro/chat";

import { CometChatMessageCategories, CometChatMessageTypes } from "../";

export class MessageListManager {

	limit = 30;
	parentMessageId = null;
	messageRequest = null;

	messageListenerId = "message_" + new Date().getTime();
	groupListenerId = "group_" + new Date().getTime();
	callListenerId = "call_" + new Date().getTime();

	constructor(props) {

		const messageCategories = new Set();
		const messageTypes = new Set();

		//if there is no message filtering set, show just text messages
		if (props.messageFilterList.length === 0) {
			messageCategories.add(CometChatMessageCategories.message);
			messageTypes.add(CometChatMessageTypes.text);
		} 

		//message filter applied
		props.messageFilterList.forEach(eachMessageTemplate => {
			messageCategories.add(eachMessageTemplate.category);
			messageTypes.add(eachMessageTemplate.type);
		});

		const categories = Array.from(messageCategories);
		const types = Array.from(messageTypes);

		if(props.user && props.user.uid) {

			if (props.parentMessage && props.parentMessage.id) {

                this.messageRequest = new CometChat.MessagesRequestBuilder()
										.setUID(props.user.uid)
										.setParentMessageId(props.parentMessage.id)
										.setCategories(categories)
										.setTypes(types)
										.hideDeletedMessages(props.hideDeletedMessages)
										.setLimit(this.limit)
										.build();

            } else {

                this.messageRequest = new CometChat.MessagesRequestBuilder()
                                        .setUID(props.user.uid)
                                        .setCategories(categories)
                                        .setTypes(types)
                                        .hideReplies(true)
                                        .hideDeletedMessages(props.hideDeletedMessages)
                                        .setLimit(this.limit)
                                        .build();

            }

		} else if(props.group && props.group.guid) {

			if (props.parentMessage && props.parentMessage.id) {

                this.messageRequest = new CometChat.MessagesRequestBuilder()
										.setGUID(props.group.guid)
										.setParentMessageId(props.parentMessage.id)
										.setCategories(categories)
										.setTypes(types)
										.hideDeletedMessages(props.hideDeletedMessages)
										.setLimit(this.limit)
										.build();

            } else {

                this.messageRequest = new CometChat.MessagesRequestBuilder()
                                        .setGUID(props.group.guid)
                                        .setCategories(categories)
                                        .setTypes(types)
                                        .hideReplies(true)
                                        .hideDeletedMessages(props.hideDeletedMessages)
                                        .setLimit(this.limit)
                                        .build();

            }
		}

	}

	fetchPreviousMessages() {
		return this.messageRequest.fetchPrevious();
	}

	attachListeners(callback) {
		CometChat.addMessageListener(
			this.messageListenerId,
			new CometChat.MessageListener({
				onTextMessageReceived: textMessage => {
					callback("onTextMessageReceived", textMessage);
				},
				onMediaMessageReceived: mediaMessage => {
					callback("onMediaMessageReceived", mediaMessage);
				},
				onCustomMessageReceived: customMessage => {
					callback("onCustomMessageReceived", customMessage);
				},
				onMessagesDelivered: messageReceipt => {
					callback("onMessagesDelivered", messageReceipt);
				},
				onMessagesRead: messageReceipt => {
					callback("onMessagesRead", messageReceipt);
				},
				onMessageDeleted: deletedMessage => {
					callback("onMessageDeleted", deletedMessage);
				},
				onMessageEdited: editedMessage => {
					callback("onMessageEdited", editedMessage);
				},
			}),
		);

		CometChat.addGroupListener(
			this.groupListenerId,
			new CometChat.GroupListener({
				onGroupMemberScopeChanged: (message, changedUser, newScope, oldScope, changedGroup) => {
					callback("onGroupMemberScopeChanged", message, changedUser, newScope, oldScope, changedGroup);
				},
				onGroupMemberLeft: (message, leavingUser, group) => {
					callback("onGroupMemberLeft", message, leavingUser, group);
				},
				onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
					callback("onGroupMemberKicked", message, kickedUser, kickedBy, kickedFrom);
				},
				onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
					callback("onGroupMemberBanned", message, bannedUser, bannedBy, bannedFrom);
				},
				onGroupMemberUnbanned: (message, unbannedUser, unbannedBy, unbannedFrom) => {
					callback("onGroupMemberUnbanned", message, unbannedUser, unbannedBy, unbannedFrom);
				},
				onMemberAddedToGroup: (message, userAdded, userAddedBy, userAddedIn) => {
					callback("onMemberAddedToGroup", message, userAdded, userAddedBy, userAddedIn);
				},
				onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
					callback("onGroupMemberJoined", message, joinedUser, null, joinedGroup);
				},
			}),
		);

		CometChat.addCallListener(
			this.callListenerId,
			new CometChat.CallListener({
				onIncomingCallReceived: call => {
					callback("onIncomingCallReceived", call);
				},
				onIncomingCallCancelled: call => {
					callback("onIncomingCallCancelled", call);
				},
				onOutgoingCallAccepted: call => {
					callback("onOutgoingCallAccepted", call);
				},
				onOutgoingCallRejected: call => {
					callback("onOutgoingCallAccepted", call);
				},
			}),
		);
	}

	removeListeners() {
		CometChat.removeMessageListener(this.messageListenerId);
		CometChat.removeGroupListener(this.groupListenerId);
		CometChat.removeCallListener(this.callListenerId);
	}
}