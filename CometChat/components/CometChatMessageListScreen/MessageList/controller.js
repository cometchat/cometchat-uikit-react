import { CometChat } from "@cometchat-pro/chat";

import * as enums from '../../../util/enums.js';

export class MessageListManager {

    item = {};
    type = "";
    messageRequest = null;
    msgListenerId = new Date().getTime();
    groupListenerId = new Date().getTime();

    constructor(item, type) {

        this.item = item;
        this.type = type;

        if (type === "user") {
            this.messageRequest = new CometChat.MessagesRequestBuilder().setLimit(30).setUID(item.uid).build();
        }
        else if (type === "group") {
            this.messageRequest = new CometChat.MessagesRequestBuilder().setLimit(30).setGUID(item.guid).build();
        }
    }

    fetchPreviousMessages() {
        return this.messageRequest.fetchPrevious();
    }

    attachListeners(callback) {

        CometChat.addMessageListener(
            this.msgListenerId,
            new CometChat.MessageListener({
                onTextMessageReceived: textMessage => {
                    callback(enums.TEXT_MESSAGE_RECEIVED, textMessage);
                },
                onMediaMessageReceived: mediaMessage => {
                    callback(enums.MEDIA_MESSAGE_RECEIVED, mediaMessage);
                },
                onCustomMessageReceived: customMessage => {
                    callback(enums.CUSTOM_MESSAGE_RECEIVED, customMessage);
                },
                onMessagesDelivered: messageReceipt => {
                    callback(enums.MESSAGE_DELIVERED, messageReceipt);
                },
                onMessagesRead: messageReceipt => {
                    callback(enums.MESSAGE_READ, messageReceipt);
                },
                onMessageDeleted: deletedMessage => {
                    callback(enums.MESSAGE_DELETED, deletedMessage);
                }
            })
        );

        CometChat.addGroupListener(
            this.groupListenerId,
            new CometChat.GroupListener({
                onGroupMemberScopeChanged: (message, changedUser, newScope, oldScope, changedGroup) => {
                    callback(enums.GROUP_MEMBER_SCOPE_CHANGED, message, changedUser, newScope, oldScope, changedGroup);
                }, 
                onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
                    callback(enums.GROUP_MEMBER_KICKED, message, kickedUser, kickedBy, kickedFrom);
                }, 
                onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
                    callback(enums.GROUP_MEMBER_BANNED, message, bannedUser, bannedBy, bannedFrom);
                }, 
                onGroupMemberUnbanned: (message, unbannedUser, unbannedBy, unbannedFrom) => {
                    callback(enums.GROUP_MEMBER_UNBANNED, message, unbannedUser, unbannedBy, unbannedFrom);
                }, 
                onMemberAddedToGroup: (message, userAdded, userAddedBy, userAddedIn) => {
                    callback(enums.GROUP_MEMBER_ADDED, message, userAdded, userAddedBy, userAddedIn);
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
        CometChat.removeMessageListener(this.msgListenerId);
        CometChat.removeGroupListener(this.groupListenerId);
    }
}