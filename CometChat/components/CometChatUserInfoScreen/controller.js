import { CometChat } from "@cometchat-pro/chat"

export class CometChatManager {

    usersRequest
    constructor() {
        this.usersRequest = new CometChat.UsersRequestBuilder().setLimit(30).build();
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

}