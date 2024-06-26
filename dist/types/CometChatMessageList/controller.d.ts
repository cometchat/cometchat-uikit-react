export declare class MessageListManager {
    messagesRequest: CometChat.MessagesRequest | null;
    static groupListenerId: string;
    static callListenerId: string;
    static connectionListenerId: string;
    constructor(messagesRequestBuilder?: CometChat.MessagesRequestBuilder, user?: CometChat.User, group?: CometChat.Group, messageId?: number, parentMessageId?: number);
    fetchNextMessages: () => Promise<[] | import("@cometchat/chat-sdk-javascript").BaseMessage[]> | undefined;
    fetchPreviousMessages: () => Promise<[] | import("@cometchat/chat-sdk-javascript").BaseMessage[]> | undefined;
    static attachListeners: (callback: any) => void;
    static removeListeners(): void;
    /**
* Attaches an SDK websocket  listener
*
* @returns - Function to remove the added SDK websocket listener
*/
    static attachConnectionListener(callback: () => void): void;
}
