/**
The MessageListManager is  responsible for controlling chat operations like fetching messages and managing listener lifecycles. It  attaches listeners for group and call activities for a particular user or group, which are activated when the chat is open and deactivated when it's closed or when switching to a new chat.
In addition, it supports real-time connection monitoring by attaching an SDK websocket listener to the chat session.
*/
export declare class MessageListManager {
    messagesRequest: CometChat.MessagesRequest | null;
    static groupListenerId: string;
    static callListenerId: string;
    static connectionListenerId: string;
    /**
     * Creates an instance of MessageListManager which constructs a request builder for fetching messages from a particular user/group in the chat.
     * @param {CometChat.MessagesRequestBuilder} [messagesRequestBuilder]
     * @param {CometChat.User} [user]
     * @param {CometChat.Group} [group]
     * @param {number} [messageId]
     * @param {number} [parentMessageId]
     * @memberof MessageListManager
     */
    constructor(messagesRequestBuilder?: CometChat.MessagesRequestBuilder, user?: CometChat.User, group?: CometChat.Group, messageId?: number, parentMessageId?: number);
    /**
     * Function to invoke the fetchNext method of the messagesRequestBuilder to retrieve the subsequent messages following the latest fetched message.
     *
     * @returns {Promise}
     */
    fetchNextMessages: () => Promise<CometChat.BaseMessage[] | []> | undefined;
    /**
    * Function to invoke the fetchPrevious method of the messagesRequestBuilder to retrieve the subsequent messages following the last fetched message.
    *
    * @returns {Promise}
    */
    fetchPreviousMessages: () => Promise<CometChat.BaseMessage[] | []> | undefined;
    /**
     * Function to attach the group and call listeners for a particular user/group. This listener is attached when the chat is opened and is removed once the chat is closed or when switching to a new chat, where it creates a new listener for the particular chat.
     *
     * @param {Function} callback
     */
    static attachListeners: (callback: (key: string, mesage: CometChat.BaseMessage, group?: CometChat.Group) => void) => void;
    /**
     * Function to remove the attached listeners for a particular user/group.
     *  */
    static removeListeners(): void;
    /**
* Attaches an SDK websocket listener to monitor when the connection disconnects or reconnects.
*
* @returns - Function to remove the added SDK websocket listener
*/
    static attachConnectionListener(callback: () => void): void;
}
