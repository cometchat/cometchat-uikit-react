import { CometChat } from "@cometchat-pro/chat";

export class AddMembersManager {

    membersRequest = null;

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
}