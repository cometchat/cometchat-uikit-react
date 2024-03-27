import { Action } from ".";
import React from "react";
type Args = {
    searchText: string;
    groupMemberRequestBuilder: CometChat.GroupMembersRequestBuilder | null;
    searchRequestBuilder: CometChat.GroupMembersRequestBuilder | null;
    groupGuid: string;
};
export declare class GroupMembersManager {
    private groupMembersRequest;
    /**
     * Sets `groupMembersRequest` of the instance
     */
    constructor(args: Args);
    /**
     * Calls `fetchNext` method of the set `groupMembersRequest`
     */
    fetchNext(): Promise<CometChat.GroupMember[]>;
    getCurrentPage(): number;
    /**
     * Attaches an SDK user listener
     *
     * @returns Function to call to remove the attached SDK user listener
     */
    static attachUserListener(callback: (user: CometChat.User) => void): () => void;
    /**
     * Creates a `CometChat.GroupMember` instance from the provided `user` and `group`
     */
    static createParticipantGroupMember(user: CometChat.User, group: CometChat.Group): CometChat.GroupMember;
    /**
     * Attaches an SDK user listener
     *
     * @returns Function to call to remove the attached SDK user listener
     */
    static attachGroupListener(groupGuid: string, dispatch: React.Dispatch<Action>): () => void;
}
export {};
