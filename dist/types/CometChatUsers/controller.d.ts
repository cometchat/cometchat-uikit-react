type Args = {
    searchText: string;
    usersRequestBuilder: CometChat.UsersRequestBuilder | null;
    searchRequestBuilder: CometChat.UsersRequestBuilder | null;
};
export declare class UsersManager {
    private usersRequest;
    private static defaultLimit;
    /**
     * Set `usersRequest` of the instance
     */
    constructor(args: Args);
    private getDefaultRequestBuilder;
    /**
     * Calls `fetchNext` method of the set `usersRequest`
     */
    fetchNext(): Promise<[] | import("@cometchat/chat-sdk-javascript").User[]>;
    getCurrentPage(): number;
    /**
     * Attaches an SDK user listener
     *
     * @returns Function to call to remove the attached SDK user listener
     */
    static atttachListeners(cb: (user: CometChat.User) => void): () => void;
    /**
* Attaches an SDK websocket  listener
*
* @returns - Function to remove the added SDK websocket listener
*/
    static attachConnestionListener(callback: () => void): () => void;
}
export {};
