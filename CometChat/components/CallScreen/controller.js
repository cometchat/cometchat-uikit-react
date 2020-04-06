import { CometChat } from "@cometchat-pro/chat"

export class CometChatManager {

    constructor() {

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
    attachCallListener(callback) {
        var listenerID = "UNIQUE_LISTENER_ID";

    }
    checkAndSendToCallback(callback, message, isReceipt = false) {
        callback(message, isReceipt);
    }
}