import { CometChat } from "@cometchat-pro/chat";

import * as enums from '../../util/enums.js';

export class SharedMediaManager {

    mediaMessageListenerId = new Date().getTime();
    mediaMessageRequest = null;

    constructor(guid, type) {

        this.mediaMessageRequest = new CometChat.MessagesRequestBuilder(guid)
        .setGUID(guid)
        .setLimit(10).setCategory("message").setType(type).build();

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