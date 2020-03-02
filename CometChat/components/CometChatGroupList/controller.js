import { CometChat } from "@cometchat-pro/chat"

export class CometChatManager {

    groupsRequest
    constructor(searchKey) {
        if (searchKey) {
            this.groupsRequest = new CometChat.GroupsRequestBuilder().setLimit(30).setSearchKeyword(searchKey).build();
        } else
        this.groupsRequest = new CometChat.GroupsRequestBuilder().setLimit(30).build();

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

    fetchNextGroups() {
        return this.groupsRequest.fetchNext();
    }
    attachGroupListener(callback) {
        var listenerID = "UNIQUE_LISTENER_ID";
        CometChat.addGroupListener(
            listenerID,
            new CometChat.GroupListener({
                onUserOnline: onlineUser => {
                    /* when someuser/friend comes online, user will be received here */
                    callback(onlineUser);
                },
                onUserOffline: offlineUser => {
                    /* when someuser/friend went offline, user will be received here */
                    callback(offlineUser);
                }
            })
        );
    }
}