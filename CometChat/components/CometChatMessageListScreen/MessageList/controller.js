import { CometChat } from "@cometchat-pro/chat";

import * as enums from '../../../util/enums.js';

export class MessageListManager {

    item = {};
    type = "";
    messageRequest = null;
    msgListenerId = new Date().getTime();

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
    }

    removeListeners() {

        CometChat.removeMessageListener(this.msgListenerId);
    }
}