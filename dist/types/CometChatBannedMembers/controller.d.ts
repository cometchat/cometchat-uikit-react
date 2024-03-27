import { Action } from ".";
import React from "react";
type Args = {
    bannedMembersRequestBuilder: CometChat.BannedMembersRequestBuilder | null;
    searchRequestBuilder: CometChat.BannedMembersRequestBuilder | null;
    searchText: string;
    groupGuid: string;
};
export declare class BannedMembersManager {
    private bannedMembersRequest;
    /**
     * Set `bannedMembersRequest` of the instance
     */
    constructor(args: Args);
    /**
     * Calls `fetchNext` method of the set `bannedMembersRequest`
     */
    fetchNext(): Promise<CometChat.GroupMember[]>;
    /**
     * Creates `CometChat.GroupMember` instance
     */
    static createGroupMemberFromUser(user: CometChat.User, group: CometChat.Group): CometChat.GroupMember;
    /**
     * Attaches an SDK group listener
     *
     * @returns - Function to remove the added SDK group listener
     */
    static attachSDKGroupListener(groupRef: React.MutableRefObject<CometChat.Group>, dispatch: React.Dispatch<Action>): () => void;
    /**
     * Attaches an SDK user listener
     *
     * @returns - Function to remove the added SDK user listener
     */
    static attachSDKUserListener(dispatch: React.Dispatch<Action>): () => void;
}
export {};
