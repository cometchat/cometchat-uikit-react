import { CometChat } from "@cometchat-pro/chat";

export class GroupDetailManager {

    groupMemberRequest = null;
    bannedGroupMemberRequest = null;
    groupDetailListenerId = new Date().getTime();

    constructor(guid) {
        this.groupMemberRequest = new CometChat.GroupMembersRequestBuilder(guid).setLimit(10).build();
        this.bannedGroupMemberRequest = new CometChat.BannedMembersRequestBuilder(guid).setLimit(10).build();
    }

    fetchNextGroupMembers() {
        return this.groupMemberRequest.fetchNext();
    }

    fetchNextBannedGroupMembers() {
        return this.bannedGroupMemberRequest.fetchNext();
    }

}