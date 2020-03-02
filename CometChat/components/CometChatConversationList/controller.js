import { CometChat } from "@cometchat-pro/chat"

export class CometChatManager {

    conversationRequest
    constructor() {
        this.conversationRequest = new CometChat.ConversationsRequestBuilder().setLimit(30).build();
    }
    isUserLogedIn;
    logedInUser;
    isCometChatUserLogedIn() {
        let timerCounter = 10000;
        let timer = 0;
        return new Promise((resolve, reject) => {
            if (timerCounter === timer) reject();
            this.isUserLogedIn = setInterval(() => {
                if (CometChat.isInitialized()) {
                    CometChat.getLoggedinUser().then(user => {
                        this.logedInUser = user;
                        clearInterval(this.isUserLogedIn);
                        resolve(user);
                    }, error => {
                        //TODO do something if user is not loggedIn
                    })
                } else {
                }
                timer = + 100;
            }, 100);
        });
    }

    fetchNextConversation() {
        return this.conversationRequest.fetchNext();
    }
    attachMessageListener(callback) {
        var listenerID = "UNIQUE_LISTENER_ID_COVE";

        CometChat.addMessageListener(
            listenerID,
            new CometChat.MessageListener({
                onTextMessageReceived: textMessage => {
                    this.checkAndSendToCallback(callback, textMessage);
                },
                onMediaMessageReceived: mediaMessage => {
                    this.checkAndSendToCallback(callback, mediaMessage);
                },
                onCustomMessageReceived: customMessage => {
                    this.checkAndSendToCallback(callback, customMessage);
                },
            })
        );

    }
    checkAndSendToCallback(callback, message, isReceipt = false) {
        callback(message, isReceipt);
    }

}