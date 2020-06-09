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
                    callback(enums.TEXT_MESSAGE_RECEIVED, textMessage, false);
                },
                onMediaMessageReceived: mediaMessage => {
                    callback(enums.MEDIA_MESSAGE_RECEIVED, mediaMessage, false);
                },
                onCustomMessageReceived: customMessage => {
                    callback(enums.CUSTOM_MESSAGE_RECEIVED, customMessage, false);
                },
                onMessagesDelivered: messageReceipt => {
                    callback(enums.MESSAGE_DELIVERED, messageReceipt, true);
                },
                onMessagesRead: messageReceipt => {
                    callback(enums.MESSAGE_READ, messageReceipt, true);
                }
            })
        );
    }

    removeListeners() {

        CometChat.removeMessageListener(this.msgListenerId);
    }
}