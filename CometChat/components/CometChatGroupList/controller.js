import { CometChat } from "@cometchat-pro/chat";

export class GroupListManager {

    groupRequest = null;

    constructor(searchKey) {

        if (searchKey) {
            this.groupRequest = new CometChat.GroupsRequestBuilder().setLimit(30).setSearchKeyword(searchKey).build();
        } else {
            this.groupRequest = new CometChat.GroupsRequestBuilder().setLimit(30).build();
        }
    }

    fetchNextGroups() {
        return this.groupRequest.fetchNext();
    }
}