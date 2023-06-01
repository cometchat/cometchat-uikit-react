import { CometChat } from "@cometchat-pro/chat";

type Args = {
    conversationsRequestBuilder : CometChat.ConversationsRequestBuilder | null
};

export class ConversationsManager {
    private static limit = 30;
    private conversationsRequest : CometChat.ConversationsRequest;

    /**
     * Set `conversationsRequest` of the instance
     */
    constructor(args : Args) {
        const {
            conversationsRequestBuilder
        } = args;
        const convRequestBuilder = conversationsRequestBuilder || new CometChat.ConversationsRequestBuilder().setLimit(ConversationsManager.limit);
        this.conversationsRequest = convRequestBuilder.build(); 
    }

    /**
     * Calls `fetchNext` method of the set `conversationsRequest` 
     */
    fetchNext() {
        return this.conversationsRequest.fetchNext();
    }

    /**
     * Attaches an SDK user listener
     * 
     * @returns Function to call to remove the attached SDK user listener 
     */
    static attachUserListener(callback : (user : CometChat.User) => void) {
        const listenerId = "ConversationList_User_" + String(Date.now());
        CometChat.addUserListener(
            listenerId,
            new CometChat.UserListener({
                onUserOnline: callback,
                onUserOffline: callback
            })
        );
        return () => CometChat.removeUserListener(listenerId);
    }

    /**
     * Attaches an SDK group listener
     * 
     * @returns Function to call to remove the attached SDK group listener 
     */
    static attachGroupListener(callback : (message : CometChat.BaseMessage, remove? : boolean) => Promise<void>, loggedInUser : CometChat.User | null) {
        const listenerId = "ConversationList_Group_" + String(Date.now());
        CometChat.addGroupListener(
            listenerId,
            new CometChat.GroupListener({
                onGroupMemberJoined: (message : CometChat.Action) => {
                    callback(message);
                },
                onGroupMemberLeft: (message : CometChat.Action, leavingUser : CometChat.User) => {
                    if (loggedInUser?.getUid() === leavingUser.getUid()) {
                        callback(message, true);
                    }
                    else {
                        callback(message);
                    }
                },
                onGroupMemberKicked: (message : CometChat.Action, kickedUser : CometChat.User) => {
                    if (loggedInUser?.getUid() === kickedUser.getUid()) {
                        callback(message, true);
                    }
                    else {
                        callback(message);
                    }
                },
                onGroupMemberBanned: (message : CometChat.Action, bannedUser : CometChat.User) => {
                    if (loggedInUser?.getUid() === bannedUser.getUid()) {
                        callback(message, true);
                    }
                    else {
                        callback(message);
                    }
                },
                onGroupMemberUnbanned: (message : CometChat.Action) => {
                    callback(message);
                },
                onMemberAddedToGroup: (message : CometChat.Action) => {
                    callback(message);
                }, 
                onGroupMemberScopeChanged: (message : CometChat.Action) => {
                    callback(message);
                }
            })
        );
        return () => CometChat.removeGroupListener(listenerId);
    }

    /**
     * Attaches an SDK message received listener
     * 
     * @returns - Function to remove the added SDK message received listener
     */
    static attachMessageReceivedListener(callback : (message : CometChat.BaseMessage) => Promise<void>) {
        const listenerId = "ConversationList_Message_Received_" + String(Date.now());
        CometChat.addMessageListener(
            listenerId,
            new CometChat.MessageListener({
                onTextMessageReceived: (textMessage : CometChat.TextMessage) => {
                    callback(textMessage);
                },
                onMediaMessageReceived: (mediaMessage : CometChat.MediaMessage) => {
                    callback(mediaMessage)
                },
                onCustomMessageReceived: (customMessage : CometChat.CustomMessage) => {
                    callback(customMessage);
                }
            })
        );
        return () => CometChat.removeMessageListener(listenerId);
    }

    /**
     * Attaches an SDK message receipt listener
     * 
     * @returns - Function to remove the added SDK message receipt listener
     */
    static attachMessageReceiptListener(callback : (receipt : CometChat.MessageReceipt, updateReadAt : boolean) => void) {
        const listenerId = "ConversationList_Message_Receipt_" + String(Date.now());
        CometChat.addMessageListener(
            listenerId,
            new CometChat.MessageListener({
                onMessagesRead: (messageReceipt : CometChat.MessageReceipt) => {
                    callback(messageReceipt, true);
                },
                onMessagesDelivered: (messageReceipt : CometChat.MessageReceipt) => {
                    callback(messageReceipt, false);
                }
            })
        );
        return () => CometChat.removeMessageListener(listenerId);
    }

    /**
     * Attaches an SDK message typing listener
     * 
     * @returns - Function to remove the added SDK message typing listener
     */
    static attachMessageTypingListener(callback : (typingIndicator : CometChat.TypingIndicator, typingStarted : boolean) => void) {
        const listenerId = "ConversationList_Message_Typing_" + String(Date.now());
        CometChat.addMessageListener(
            listenerId,
            new CometChat.MessageListener({
                onTypingStarted: (typingIndicator : CometChat.TypingIndicator) => {
                    callback(typingIndicator, true);
                },
                onTypingEnded: (typingIndicator : CometChat.TypingIndicator) => {
                    callback(typingIndicator, false);
                }
            })
        );
        return () => CometChat.removeMessageListener(listenerId);
    }

    /**
     * Attaches an SDK message modified listener
     * 
     * @returns - Function to remove the added SDK message modified listener
     */
    static attachMessageModifiedListener(callback : (message : CometChat.BaseMessage) => void) {
        const listenerId = "ConversationList_Message_Modified_" + String(Date.now());
        CometChat.addMessageListener(
            listenerId,
            new CometChat.MessageListener({
                onMessageDeleted: callback,
                onMessageEdited: callback
            })
        );
        return () => CometChat.removeMessageListener(listenerId);
    }

    /**
     * Attaches an SDK call listener
     * 
     * @returns - Function to remove the added SDK call listener
     */
    static attachCallListener(callback : (message : CometChat.BaseMessage) => void) {
        const listenerId = "ConversationList_Call_" + String(Date.now());
        CometChat.addCallListener(
            listenerId,
            new CometChat.CallListener({
                onIncomingCallReceived: callback,
                onOutgoingCallAccepted: callback,
                onOutgoingCallRejected: callback,
                onIncomingCallCancelled: callback
            })
        );
        return () => CometChat.removeCallListener(listenerId);
    }
}
