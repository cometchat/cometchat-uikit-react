import { CometChat } from "@cometchat-pro/chat";

import * as enums from "../../../util/enums.js";

export class SharedMediaManager {

    mediaMessageListenerId = new Date().getTime();
    mediaMessageRequest = null;

    constructor(item, type, messagetype) {

        if(type === "user") {

            this.mediaMessageRequest = new CometChat.MessagesRequestBuilder()
            .setUID(item.uid)
            .setLimit(10).setCategory("message").setType(messagetype).build();

        } else {

            this.mediaMessageRequest = new CometChat.MessagesRequestBuilder()
            .setGUID(item.guid)
            .setLimit(10).setCategory("message").setType(messagetype).build();
        }
    }

    fetchPreviousMessages() {
        return this.mediaMessageRequest.fetchPrevious();
    }
    
    attachListeners(callback) {

        CometChat.addMessageListener(
            this.msgListenerId,
            new CometChat.MessageListener({
                onMediaMessageReceived: mediaMessage => {
                    callback(enums.MEDIA_MESSAGE_RECEIVED, mediaMessage);
                },
                onMessageDeleted: deletedMessage => {
                    callback(enums.MESSAGE_DELETED, deletedMessage);
                }
            })
        );
    }

    removeListeners() {
        CometChat.removeMessageListener(this.mediaMessageListenerId);
    }

}