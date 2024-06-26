import React from "react";
import { Action } from ".";
type Args = {
    searchText: string;
    groupsRequestBuilder: CometChat.GroupsRequestBuilder;
    searchRequestBuilder: CometChat.GroupsRequestBuilder | null;
};
export declare class GroupsManager {
    private groupsRequest;
    private static loggedInUser;
    /**
     * Set `groupsRequest` of the instance
     */
    constructor(args: Args);
    /**
     * Calls `fetchNext` method of the set `groupsRequest`
     */
    fetchNext(): Promise<[] | import("@cometchat/chat-sdk-javascript").Group[]>;
    /**
     * Sets `loggedInUser` of the instance
     * @returns The logged-in user
     */
    private static getLoggedInUser;
    /**
     * Creates an SDK group listener
     */
    private static createGroupListener;
    /**
     * Attaches an SDK group listener
     *
     * @returns Function to call to remove the attached SDK group listener
     */
    static attachListeners(dispatch: React.Dispatch<Action>): () => void;
    /**
* Attaches an SDK websocket  listener
*
* @returns - Function to remove the added SDK websocket listener
*/
    static attachConnestionListener(callback: () => void): () => void;
}
export {};
