import { CometChat } from "@cometchat-pro/chat";

export class UserListManager {

    userRequest = null;
    userListenerId = new Date().getTime();

    constructor(searchKey) {

        if (searchKey) {
            this.usersRequest = new CometChat.UsersRequestBuilder().setLimit(30).setSearchKeyword(searchKey).build();
        } else {
            this.usersRequest = new CometChat.UsersRequestBuilder().setLimit(30).build();
        }
    }

    fetchNextUsers() {
        return this.usersRequest.fetchNext();
    }

    attachListeners(callback) {
        
        CometChat.addUserListener(
            this.userListenerId,
            new CometChat.UserListener({
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

    removeListeners() {

        CometChat.removeUserListener(this.userListenerId);
    }
}