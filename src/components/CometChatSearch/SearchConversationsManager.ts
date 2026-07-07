import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatUIKit } from "../../CometChatUIKit/CometChatUIKit";
import { CometChatUIKitConstants } from "../../constants/CometChatUIKitConstants";
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { ConversationsManager } from "../CometChatConversations/controller";

/**
 * Controller class to manage search conversation related operations
 */
export class SearchConversationsManager {

    private static errorHandler: (error: unknown, source?: string) => void = (error: unknown, source?: string) => {
    };

    /**
     * Set error handler for the manager
     */
    static setErrorHandler(handler: (error: unknown, source?: string) => void) {
        SearchConversationsManager.errorHandler = handler;
    }

    /**
     * Attaches an SDK user listener
     *
     * @returns Function to call to remove the attached SDK user listener
     */
    static attachUserListener(callback: (user: CometChat.User) => void) {
        try {
            const listenerId = "ConversationList_User_" + String(Date.now());
            CometChat.addUserListener(
                listenerId,
                new CometChat.UserListener({
                    onUserOnline: callback,
                    onUserOffline: callback
                })
            );
            return () => CometChat.removeUserListener(listenerId);
        } catch (error) {
            SearchConversationsManager.errorHandler(error, "attachUserListener");
            return () => {};
        }
    }

    /**
     * Attaches an SDK group listener
     *
     * @returns Function to call to remove the attached SDK group listener
     */
    static attachGroupListener(callback: (message: CometChat.BaseMessage, remove?: boolean) => Promise<void>, loggedInUser: CometChat.User | null) {
        try {
            const listenerId = "ConversationList_Group_" + String(Date.now());
            CometChat.addGroupListener(
                listenerId,
                new CometChat.GroupListener({
                    onGroupMemberJoined: (message: CometChat.Action) => {
                        callback(message);
                    },
                    onGroupMemberLeft: (message: CometChat.Action, leavingUser: CometChat.User) => {
                        if (loggedInUser?.getUid() === leavingUser.getUid()) {
                            callback(message, true);
                        }
                        else {
                            callback(message);
                        }
                    },
                    onGroupMemberKicked: (message: CometChat.Action, kickedUser: CometChat.User) => {
                        if (loggedInUser?.getUid() === kickedUser.getUid()) {
                            callback(message, true);
                        }
                        else {
                            callback(message);
                        }
                    },
                    onGroupMemberBanned: (message: CometChat.Action, bannedUser: CometChat.User) => {
                        if (loggedInUser?.getUid() === bannedUser.getUid()) {
                            callback(message, true);
                        }
                        else {
                            callback(message);
                        }
                    },
                    onGroupMemberUnbanned: (message: CometChat.Action) => {
                        callback(message);
                    },
                    onMemberAddedToGroup: (message: CometChat.Action) => {
                        callback(message);
                    },
                    onGroupMemberScopeChanged: (message: CometChat.Action) => {
                        callback(message);
                    }
                })
            );
            return () => CometChat.removeGroupListener(listenerId);
        } catch (error) {
            SearchConversationsManager.errorHandler(error, "attachGroupListener")
        }
    }

    /**
     * Attaches an SDK message received listener
     *
     * @returns - Function to remove the added SDK message received listener
     */
    static attachMessageReceivedListener(callback: (message: CometChat.BaseMessage) => Promise<void>) {
        try {
            const messageListenerId: string = "message_" + new Date().getTime();

            CometChat.addMessageListener(messageListenerId, new CometChat.MessageListener({
                onTextMessageReceived: (textMessage: CometChat.TextMessage) => {
                    callback(textMessage);
                },
                onMediaMessageReceived: (mediaMessage: CometChat.MediaMessage) => {
                    callback(mediaMessage);
                },
                onCustomMessageReceived: (customMessage: CometChat.CustomMessage) => {
                    callback(customMessage);
                },
                onSchedulerMessageReceived: (message: CometChat.InteractiveMessage) => {
                    callback(message);
                },
                onInteractiveMessageReceived: (message: CometChat.InteractiveMessage) => {
                    callback(message);
                },
                // Developer card messages (category: "card") arrive via this dedicated
                // SDK callback, not onText/onInteractive.
                onCardMessageReceived: (message: CometChat.BaseMessage) => {
                    callback(message);
                }
            }))
            return () => {
                CometChat.removeMessageListener(messageListenerId)
            };
        } catch (error) {
            SearchConversationsManager.errorHandler(error, "attachMessageReceivedListener");
        }
    }

    /**
     * Attaches an SDK message receipt listener
     *
     * @returns - Function to remove the added SDK message receipt listener
     */
    static attachMessageReceiptListener(callback: (receipt: CometChat.MessageReceipt, updateReadAt: boolean) => void) {
        try {
            const onMessagesDelivered = CometChatMessageEvents.onMessagesDelivered.subscribe((messageReceipt: CometChat.MessageReceipt) => {
                if (messageReceipt.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user) {
                    callback(messageReceipt, false);
                }
            });
            const onMessagesRead = CometChatMessageEvents.onMessagesRead.subscribe((messageReceipt: CometChat.MessageReceipt) => {
                if (messageReceipt.getReceiverType() == CometChatUIKitConstants.MessageReceiverType.user) {
                    callback(messageReceipt, true);
                }
            });
            const onMessagesDeliveredToAll = CometChatMessageEvents.onMessagesDeliveredToAll.subscribe((messageReceipt: CometChat.MessageReceipt) => {
                callback(messageReceipt, false);
            });
            const onMessagesReadByAll = CometChatMessageEvents.onMessagesReadByAll.subscribe((messageReceipt: CometChat.MessageReceipt) => {
                callback(messageReceipt, true);
            });

            return () => {
                onMessagesDelivered?.unsubscribe();
                onMessagesRead?.unsubscribe();
                onMessagesDeliveredToAll?.unsubscribe();
                onMessagesReadByAll?.unsubscribe();
            };
        } catch (error) {
            SearchConversationsManager.errorHandler(error, "attachMessageReceiptListener")
        }
    }

    /**
     * Attaches an SDK message modified listener
     *
     * @returns - Function to remove the added SDK message modified listener
     */
    static attachMessageModifiedListener(callback: (message: CometChat.BaseMessage) => void) {
        try {
            const messageListenerId: string = "delete_" + new Date().getTime();
            CometChat.addMessageListener(messageListenerId, new CometChat.MessageListener({
                onMessageEdited: (message: CometChat.BaseMessage) => {
                    callback(message);
                },
                onMessageDeleted: (message: CometChat.BaseMessage) => {
                    callback(message);
                },
                onMessageModerated: (message: CometChat.BaseMessage) => {
                    callback(message);
                }
            }))
            return () => {
                CometChat.removeMessageListener(messageListenerId)
            };
        } catch (error) {
            SearchConversationsManager.errorHandler(error, "attachMessageModifiedListener")
        }
    }

    /**
     * Attaches an SDK call listener
     *
     * @returns - Function to remove the added SDK call listener
     */
    static attachCallListener(callback: (message: CometChat.BaseMessage) => void) {
        try {
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
        } catch (error) {
            SearchConversationsManager.errorHandler(error, "attachCallListener")
        }
    }


    /**
     * Determines if the last message should trigger an update based on its category and type.
     */
    static shouldLastMessageAndUnreadCountBeUpdated = ConversationsManager.shouldLastMessageAndUnreadCountBeUpdated;
}
