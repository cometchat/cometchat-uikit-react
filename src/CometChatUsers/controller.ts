import { CometChat } from "@cometchat-pro/chat";

type Args = {
    searchText : string,
    usersRequestBuilder : CometChat.UsersRequestBuilder | null,
    searchRequestBuilder : CometChat.UsersRequestBuilder | null
};

export class UsersManager {
    private usersRequest : CometChat.UsersRequest; 
    private static defaultLimit = 30;

    /**
     * Set `usersRequest` of the instance
     */
    constructor(args : Args) {
        const {
            searchText,
            usersRequestBuilder,
            searchRequestBuilder
        } = args;

        let currentUsersRequestBuilder = usersRequestBuilder;
        if (currentUsersRequestBuilder === null) {
            currentUsersRequestBuilder = new CometChat.UsersRequestBuilder()
                                                      .setLimit(UsersManager.defaultLimit);
        }

        if (searchText.length !== 0) {
            if (searchRequestBuilder === null) {
                currentUsersRequestBuilder.setSearchKeyword(searchText);
            }
            else {
                currentUsersRequestBuilder = searchRequestBuilder.setSearchKeyword(searchText);
            }
        }

        this.usersRequest = currentUsersRequestBuilder.build();
    }

    /**
     * Calls `fetchNext` method of the set `usersRequest` 
     */
    fetchNext() {
        return this.usersRequest.fetchNext();
    }

    /**
     * Attaches an SDK user listener
     * 
     * @returns Function to call to remove the attached SDK user listener
     */
    static atttachListeners(cb : (user : CometChat.User) => void) {
        const listenerId = "UsersList_" + String(Date.now());
        const userListener = new CometChat.UserListener({onUserOnline: cb, onUserOffline: cb});
        CometChat.addUserListener(listenerId, userListener);
        return () => CometChat.removeUserListener(listenerId);
    }
}
