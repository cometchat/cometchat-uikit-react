import { CometChat } from "@cometchat-pro/chat";

import {UIKitSettings} from "../../../util/UIKitSettings";

export class UserListManager {

    userRequest = null;
    userListenerId = "userlist_" + new Date().getTime();

    constructor(context, searchKey) {

        this.context = context;
        this.searchKey = searchKey;
    }

    initializeUsersRequest = () => {

        const userListMode = this.context.UIKitSettings.userListMode;
		const userListModeOptions = UIKitSettings.userListFilterOptions;

        return new Promise((resolve, reject) => {
            if (userListMode === userListModeOptions["ALL"]) {
                if (this.searchKey) {
                    this.usersRequest = new CometChat.UsersRequestBuilder().setLimit(30).setSearchKeyword(this.searchKey).build();
                } else {
                    this.usersRequest = new CometChat.UsersRequestBuilder().setLimit(30).build();
                }

                return resolve(this.usersRequest);
            } else if (userListMode === userListModeOptions["FRIENDS"]) {
                if (this.searchKey) {
                    this.usersRequest = new CometChat.UsersRequestBuilder().setLimit(30).friendsOnly(true).setSearchKeyword(this.searchKey).build();
                } else {
                    this.usersRequest = new CometChat.UsersRequestBuilder().setLimit(30).friendsOnly(true).build();
                }

                return resolve(this.usersRequest);
            } else {
                return reject({message: "Invalid filter for userlist"});
            }
        });
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