import { CometChat } from "@cometchat-pro/chat";

export class AddMembersManager {

    membersRequest = null;
    userListenerId = new Date().getTime();

    constructor(friendsOnly, searchKey) {

        if (searchKey) {
            this.membersRequest = new CometChat.UsersRequestBuilder().setLimit(30).friendsOnly(friendsOnly).setSearchKeyword(searchKey).build();
        } else {
            this.membersRequest = new CometChat.UsersRequestBuilder().setLimit(30).friendsOnly(friendsOnly).build();
        }
    }

    fetchNextUsers() {
        return this.membersRequest.fetchNext();
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