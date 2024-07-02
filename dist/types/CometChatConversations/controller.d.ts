import { CometChat } from "@cometchat/chat-sdk-javascript";
type Args = {
    conversationsRequestBuilder: CometChat.ConversationsRequestBuilder | null;
};
export declare class ConversationsManager {
    private static limit;
    private conversationsRequest;
    /**
     * Set `conversationsRequest` of the instance
     */
    constructor(args: Args);
    /**
     * Calls `fetchNext` method of the set `conversationsRequest`
     */
    fetchNext(): Promise<[] | import("@cometchat/chat-sdk-javascript").Conversation[]>;
    /**
     * Attaches an SDK user listener
     *
     * @returns Function to call to remove the attached SDK user listener
     */
    static attachUserListener(callback: (user: CometChat.User) => void): () => void;
    /**
     * Attaches an SDK group listener
     *
     * @returns Function to call to remove the attached SDK group listener
     */
    static attachGroupListener(callback: (message: CometChat.BaseMessage, remove?: boolean) => Promise<void>, loggedInUser: CometChat.User | null): () => void;
    /**
     * Attaches an SDK message received listener
     *
     * @returns - Function to remove the added SDK message received listener
     */
    static attachMessageReceivedListener(callback: (message: CometChat.BaseMessage) => Promise<void>): () => void;
    /**
     * Attaches an SDK message receipt listener
     *
     * @returns - Function to remove the added SDK message receipt listener
     */
    static attachMessageReceiptListener(callback: (receipt: CometChat.MessageReceipt, updateReadAt: boolean) => void): () => void;
    /**
     * Attaches an SDK message typing listener
     *
     * @returns - Function to remove the added SDK message typing listener
     */
    static attachMessageTypingListener(callback: (typingIndicator: CometChat.TypingIndicator, typingStarted: boolean) => void): () => void;
    /**
     * Attaches an SDK message modified listener
     *
     * @returns - Function to remove the added SDK message modified listener
     */
    static attachMessageModifiedListener(callback: (message: CometChat.BaseMessage) => void): () => void;
    /**
     * Attaches an SDK call listener
     *
     * @returns - Function to remove the added SDK call listener
     */
    static attachCallListener(callback: (message: CometChat.BaseMessage) => void): () => void;
    /**
  * Attaches an SDK websocket  listener
  *
  * @returns - Function to remove the added SDK websocket listener
  */
    static attachConnestionListener(callback: () => void): () => void;
    /**
     * Determines if the last message should trigger an update based on its category and type.
     *
     * @param message - The last message sent or received in the conversation.
     * @returns {boolean} - Returns true if the message should trigger an update, false otherwise.
     */
    static shouldLastMessageAndUnreadCountBeUpdated: (message: CometChat.BaseMessage) => any;
    static shouldIncrementForCustomMessage(message: CometChat.CustomMessage): any;
}
export {};
