import { CometChatUIKitLoginListener } from '../../CometChatUIKit/CometChatUIKitLoginListener';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';
import { handleWebsocketMessage, startStreamingMessage } from '../../services/stream-message.service';
import { ChatConfigurator } from "../../utils/ChatConfigurator";
import { CometChat } from "@cometchat/chat-sdk-javascript";

/**
The MessageListManager is  responsible for controlling chat operations like fetching messages and managing listener lifecycles. It  attaches listeners for group and call activities for a particular user or group, which are activated when the chat is open and deactivated when it's closed or when switching to a new chat.
In addition, it supports real-time connection monitoring by attaching an SDK websocket listener to the chat session.
*/
export class MessageListManager {
    messagesRequest: CometChat.MessagesRequest | null = null;
    static groupListenerId: string = "group_" + new Date().getTime();
    static callListenerId: string = "call_" + new Date().getTime();
    static connectionListenerId: string = "MessageList_connection_" + String(Date.now());
    static streamListenerId: string = "agent_" + new Date().getTime();
    private static errorHandler: (error: unknown, source?: string) => void;
    /**
     * Creates an instance of MessageListManager which constructs a request builder for fetching messages from a particular user/group in the chat.
     * @param {CometChat.MessagesRequestBuilder} [messagesRequestBuilder]
     * @param {CometChat.User} [user]
     * @param {CometChat.Group} [group]
     * @param {number} [messageId]
     * @param {number} [parentMessageId]
     * @param {boolean} [hideGroupActionMessages]
     * @memberof MessageListManager
     */
    constructor(errorHandler: (error: unknown, source?: string) => void, messagesRequestBuilder?: CometChat.MessagesRequestBuilder, user?: CometChat.User, group?: CometChat.Group, messageId?: number, parentMessageId?: number, hideGroupActionMessages?: boolean,isAgentChat?:boolean) {
        MessageListManager.errorHandler = errorHandler;
        if (messagesRequestBuilder) {
            let requestBuilder!: CometChat.MessagesRequestBuilder;
            if (user) {
                messagesRequestBuilder.guid = undefined;
                requestBuilder = messagesRequestBuilder.setUID(user.getUid())

            } else if (group) {
                messagesRequestBuilder.uid = undefined;
                requestBuilder = messagesRequestBuilder.setGUID(group!.getGuid())
            }
            if (messageId) {
                requestBuilder!.setMessageId(messageId);
            }
         
            this.messagesRequest = requestBuilder.build()!;
        } else {
            const builder: CometChat.MessagesRequestBuilder = new CometChat.MessagesRequestBuilder()
                .setTypes(ChatConfigurator.dataSource.getAllMessageTypes())
                .setCategories(ChatConfigurator.dataSource.getAllMessageCategories({ hideGroupActionMessages }))
                .hideReplies(true)
                .setLimit(30)

            if (messageId) {
                builder.setMessageId(messageId)
            }
            if (parentMessageId) {

                builder.setParentMessageId(parentMessageId);
                if (isAgentChat) {
                    builder.hideReplies(false)
                    builder.withParent(true)
                }
            }
            if (user) {
                builder.setUID(user.getUid())
                builder.guid = undefined;
            } else if (group) {
                builder.setGUID(group.getGuid())
                builder.uid = undefined;
            }
            this.messagesRequest = builder.build();
        }
    }

    /**
     * Function to invoke the fetchNext method of the messagesRequestBuilder to retrieve the subsequent messages following the latest fetched message.
     *
     * @returns {Promise}
     */
    fetchNextMessages: () => Promise<CometChat.BaseMessage[] | []> | undefined = () => {
        return this.messagesRequest?.fetchNext();
    };
    /**
    * Function to invoke the fetchPrevious method of the messagesRequestBuilder to retrieve the subsequent messages following the last fetched message.
    *
    * @returns {Promise}
    */
    fetchPreviousMessages: () => Promise<CometChat.BaseMessage[] | []> | undefined = () => {
        return this.messagesRequest?.fetchPrevious();
    }

    /**
     * Function to attach the group and call listeners for a particular user/group. This listener is attached when the chat is opened and is removed once the chat is closed or when switching to a new chat, where it creates a new listener for the particular chat.
     *
     * @param {Function} callback
     */
    static attachListeners: (addStreamListener: boolean, callback: (key: string, mesage: CometChat.BaseMessage, group?: CometChat.Group) => void,addMessage:(message:CometChat.BaseMessage)=> void,user?:CometChat.User) => void = (addStreamListener: boolean = false, callback: (key: string, mesage: CometChat.BaseMessage, group?: CometChat.Group) => void,addMessage:(message:CometChat.BaseMessage)=> void,user?:CometChat.User) => {

        try {
            if (addStreamListener && user) {
                CometChat.addAIAssistantListener(this.streamListenerId, {
                    onAIAssistantEventReceived: (message: CometChat.AIAssistantBaseEvent) => {
                        if (message.getConversationId() && (!message.getConversationId().includes(user.getUid()) || !message.getConversationId().includes(CometChatUIKitLoginListener.getLoggedInUser()!.getUid()))) {
                            return;
                        }
                        handleWebsocketMessage(message);
                    }
                })
            }

            else {
                /** Add Group Listener to listen to group action messages */
                CometChat.addGroupListener(
                    this.groupListenerId,
                    new CometChat.GroupListener({
                        onGroupMemberScopeChanged: (message: CometChat.BaseMessage, changedUser: CometChat.User, newScope: CometChat.GroupMemberScope, oldScope: CometChat.GroupMemberScope, changedGroup: CometChat.Group): void => {
                            callback(CometChatUIKitConstants.MessageCategory.action, message, changedGroup);
                        },
                        onGroupMemberKicked: (message: CometChat.BaseMessage, kickedUser: CometChat.User, kickedBy: CometChat.User, kickedFrom: CometChat.Group): void => {
                            callback(CometChatUIKitConstants.MessageCategory.action, message, kickedFrom);
                        },
                        onGroupMemberBanned: (message: CometChat.BaseMessage, bannedUser: CometChat.User, bannedBy: CometChat.User, bannedFrom: CometChat.Group): void => {
                            callback(CometChatUIKitConstants.MessageCategory.action, message, bannedFrom);
                        },
                        onGroupMemberUnbanned: (message: CometChat.BaseMessage, unbannedUser: CometChat.User, unbannedBy: CometChat.User, unbannedFrom: CometChat.Group): void => {
                            callback(CometChatUIKitConstants.MessageCategory.action, message, unbannedFrom);
                        },
                        onMemberAddedToGroup: (message: CometChat.BaseMessage, userAdded: CometChat.User, userAddedBy: CometChat.User, userAddedIn: CometChat.Group): void => {
                            callback(CometChatUIKitConstants.MessageCategory.action, message, userAddedIn);
                        },
                        onGroupMemberLeft: (message: CometChat.BaseMessage, leavingUser: CometChat.GroupMember, group: CometChat.Group): void => {
                            callback(CometChatUIKitConstants.MessageCategory.action, message, group);
                        },
                        onGroupMemberJoined: (message: CometChat.BaseMessage, joinedUser: CometChat.GroupMember, joinedGroup: CometChat.Group): void => {
                            callback(CometChatUIKitConstants.MessageCategory.action, message, joinedGroup);
                        },
                    })
                );
                /** Add Calls Listener to listen to call activities if  Calling is enabled. */
                if (ChatConfigurator.names.includes("calling")) {
                    CometChat.addCallListener(
                        this.callListenerId,
                        new CometChat.CallListener({
                            onIncomingCallReceived: (call: CometChat.Call): void => {
                                callback(CometChatUIKitConstants.MessageCategory.call, call);
                            },
                            onIncomingCallCancelled: (call: CometChat.Call): void => {
                                callback(CometChatUIKitConstants.MessageCategory.call, call);
                            },
                            onOutgoingCallRejected: (call: CometChat.Call): void => {
                                callback(CometChatUIKitConstants.MessageCategory.call, call);
                            },
                            onOutgoingCallAccepted: (call: CometChat.Call): void => {
                                callback(CometChatUIKitConstants.MessageCategory.call, call);
                            },
                            onCallEndedMessageReceived: (call: CometChat.Call): void => {
                                callback(CometChatUIKitConstants.MessageCategory.call, call);
                            },
                        })
                    );
                }
            }
        } catch (error) {
            this.errorHandler(error, "attachListeners")
        }
    };
    /**
     * Function to remove the attached listeners for a particular user/group.
     *  */
    static removeListeners(): void {
        try {
            CometChat.removeGroupListener(this.groupListenerId);
            CometChat.removeConnectionListener(this.connectionListenerId);
            CometChat.removeAIAssistantListener(this.streamListenerId);
            if (ChatConfigurator.names.includes("calling")) {
                CometChat.removeCallListener(this.callListenerId);
            }
        } catch (error) {
            this.errorHandler(error, "removeListeners")
        }
    }
    /**
* Attaches an SDK websocket listener to monitor when the connection disconnects or reconnects.
*
* @returns - Function to remove the added SDK websocket listener
*/
    static attachConnectionListener(callback: () => void): void {
        try {
            CometChat.addConnectionListener(
                this.connectionListenerId,
                new CometChat.ConnectionListener({
                    onConnected: (): void => {
                        console.log("ConnectionListener =>connected");
                        if (callback) {
                            callback()
                        }
                    },
                    onDisconnected: (): void => {
                        console.log("ConnectionListener => On Disconnected");
                    }
                })
            );
        } catch (error) {
            this.errorHandler(error, "attachConnectionListener")
        }
    }
}
