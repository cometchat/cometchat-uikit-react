import { CometChat } from "@cometchat-pro/chat"

export class CometChatManager {
    messagesRequest
    item;
    type;
    constructor(item, type) {
        this.item = item;
        this.type = type;
        if (type === "user") {
            const uid = item.uid
            this.messagesRequest = new CometChat.MessagesRequestBuilder().setLimit(30).setUID(uid).build();
        }
        else if (type === "group") {
            const guid = item.guid
            this.messagesRequest = new CometChat.MessagesRequestBuilder().setLimit(30).setGUID(guid).build();
        }
    }
    isUserLogedIn;
    logedInUser;
    isCometChatUserLogedIn() {
        let timerCounter = 10000;
        let timer = 0;
        return new Promise((resolve, reject) => {
            if (timerCounter === timer) reject();
            if (this.logedInUser) { resolve(this.logedInUser); return; }

            this.isUserLogedIn = setInterval(() => {
                if (CometChat.isInitialized()) {
                    CometChat.getLoggedinUser().then(user => {
                        this.logedInUser = user;
                        clearInterval(this.isUserLogedIn);
                        resolve(user);
                        timer = 0;
                    }, error => {
                        console.log(error);
                    })
                } else {
                }
                timer = + 100;
            }, 100);
        });
    }

    fetchPreviousMessages() {
        return this.messagesRequest.fetchPrevious();
    }
    attachMessageListener(callback) {
        var listenerID = "UNIQUE_LISTENER_ID";

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
                onMessagesDelivered: messageReceipt => {
                    this.checkAndSendToCallback(callback, messageReceipt, true);
                },
                onMessagesRead: messageReceipt => {
                    this.checkAndSendToCallback(callback, messageReceipt, true);
                }
            })
        );

        CometChat.addCallListener(
            listenerID,
            new CometChat.CallListener({
                onIncomingCallReceived: (call) => {
                    console.log(call);
                    this.checkAndSendToCallback(callback, call);
                },
                onOutgoingCallAccepted: (call) => {
                    this.checkAndSendToCallback(callback, call);

                },
                onOutgoingCallRejected: (call) => {
                    this.checkAndSendToCallback(callback, call);

                },
                onIncomingCallCancelled: (call) => {
                    this.checkAndSendToCallback(callback, call);
                }
            })
        );

    }
    checkAndSendToCallback(callback, message, isReceipt = false) {
        if (this.type === 'group') {
            if (message.receiver.guid === this.item.guid) {
                if (!isReceipt) {
                    CometChat.markAsRead(message.messageId, message.receiver.guid, 'group');
                }
                callback(message, isReceipt);

            }
        } else {
            if (message.sender.uid === this.item.uid) {
                callback(message, isReceipt);
                if (!isReceipt) {
                    CometChat.markAsRead(message.id, message.sender.uid, 'user');
                }

            }
        }

    }
}