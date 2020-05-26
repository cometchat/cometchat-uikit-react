import { CometChat } from "@cometchat-pro/chat"

export class ConversationListManager {

    conversationRequest = null;
    conversationListenerId = new Date().getTime();

    constructor() {
        this.conversationRequest = new CometChat.ConversationsRequestBuilder().setLimit(30).build();
    }

    fetchNextConversation() {
        return this.conversationRequest.fetchNext();
    }

    attachListeners(callback) {

        CometChat.addMessageListener(
            this.conversationListenerId,
            new CometChat.MessageListener({
                onTextMessageReceived: textMessage => {
                    callback(textMessage, false);
                },
                onMediaMessageReceived: mediaMessage => {
                    callback(mediaMessage, false);
                },
                onCustomMessageReceived: customMessage => {
                    callback(customMessage, false);
                },
            })
        );

    }

    removeListeners() {
        CometChat.removeMessageListener(this.conversationListenerId);
    }

}