import { CometChat } from "@cometchat-pro/chat";
import { ChatConfigurator } from "../Shared/Framework/ChatConfigurator";
import { CometChatUIKitConstants } from "uikit-resources-lerna";

export class MessageListManager {
    messagesRequest: CometChat.MessagesRequest | null = null;
    static messageListListenerId: string = "messagelist_" + new Date().getTime();
    static groupListenerId: string = "group_" + new Date().getTime();
    static callListenerId: string = "call_" + new Date().getTime();

    constructor(messagesRequestBuilder?: CometChat.MessagesRequestBuilder, user?: CometChat.User, group?: CometChat.Group, messageId?: number) {
        if (messagesRequestBuilder) {
            this.messagesRequest = messagesRequestBuilder.build();
            if (messageId) {
                this.messagesRequest = messagesRequestBuilder.setMessageId(messageId).build();
            }
        } else {
            if (messageId) {
                if (user) {
                    this.messagesRequest = new CometChat.MessagesRequestBuilder()
                        .setUID(user.getUid())
                        .setTypes(ChatConfigurator.dataSource.getAllMessageTypes())
                        .setCategories(ChatConfigurator.dataSource.getAllMessageCategories())
                        .hideReplies(true)
                        .setMessageId(messageId)
                        .setLimit(30)
                        .build();
                }
                if (group) {
                    this.messagesRequest = new CometChat.MessagesRequestBuilder()
                        .setGUID(group.getGuid())
                        .setTypes(ChatConfigurator.dataSource.getAllMessageTypes())
                        .setCategories(ChatConfigurator.dataSource.getAllMessageCategories())
                        .hideReplies(true)
                        .setMessageId(messageId)
                        .setLimit(30)
                        .build();
                }
            } else {
                if (user) {
                    this.messagesRequest = new CometChat.MessagesRequestBuilder()
                        .setUID(user.getUid())
                        .setTypes(ChatConfigurator.dataSource.getAllMessageTypes())
                        .setCategories(ChatConfigurator.dataSource.getAllMessageCategories())
                        .hideReplies(true)
                        .setLimit(30)
                        .build();
                }
                if (group) {
                    this.messagesRequest = new CometChat.MessagesRequestBuilder()
                        .setGUID(group.getGuid())
                        .setTypes(ChatConfigurator.dataSource.getAllMessageTypes())
                        .setCategories(ChatConfigurator.dataSource.getAllMessageCategories())
                        .hideReplies(true)
                        .setLimit(30)
                        .build();
                }
            }
        }
    }

    fetchNextMessages = () => {
        return this.messagesRequest?.fetchNext();
    };

    fetchPreviousMessages = () => {
        return this.messagesRequest?.fetchPrevious();
    }

    static attachListeners = (callback: any) => {
        CometChat.addMessageListener(
            this.messageListListenerId,
            new CometChat.MessageListener({
                onTextMessageReceived: (textMessage: CometChat.TextMessage) => {
                    callback(CometChatUIKitConstants.messages.TEXT_MESSAGE_RECEIVED, textMessage);
                },
                onMediaMessageReceived: (mediaMessage: CometChat.MediaMessage) => {
                    callback(CometChatUIKitConstants.messages.MEDIA_MESSAGE_RECEIVED, mediaMessage);
                },
                onCustomMessageReceived: (customMessage: CometChat.CustomMessage) => {
                    console.log("onCustomMessageReceived", customMessage);
                    callback(CometChatUIKitConstants.messages.CUSTOM_MESSAGE_RECEIVED, customMessage);
                },
                onMessagesDelivered: (messageReceipt: CometChat.MessageReceipt) => {
                    callback(CometChatUIKitConstants.messages.MESSAGE_DELIVERED, messageReceipt);
                },
                onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
                    callback(CometChatUIKitConstants.messages.MESSAGE_READ, messageReceipt);
                },
                onMessageDeleted: (deletedMessage: CometChat.BaseMessage) => {
                    callback(CometChatUIKitConstants.messages.MESSAGE_DELETED, deletedMessage);
                },
                onMessageEdited: (editedMessage: CometChat.BaseMessage) => {
                    callback(CometChatUIKitConstants.messages.MESSAGE_EDITED, editedMessage);
                },
                onTransientMessageReceived: (transientMessage: CometChat.TransientMessage) => {
                    callback(CometChatUIKitConstants.messages.TRANSIENT_MESSAGE_RECEIVED, transientMessage);
                },
            })
        );      
        
        /** Add Group Listener to listen to group action messages */
        CometChat.addGroupListener(
            this.groupListenerId,
            new CometChat.GroupListener({
                onGroupMemberScopeChanged: (message: CometChat.BaseMessage, changedUser: CometChat.User, newScope: CometChat.GroupMemberScope, oldScope: CometChat.GroupMemberScope, changedGroup: CometChat.Group) => {
                    callback(CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE, message, changedGroup);
                },
                onGroupMemberKicked: (message: CometChat.BaseMessage, kickedUser: CometChat.User, kickedBy: CometChat.User, kickedFrom: CometChat.Group) => {
                    callback(CometChatUIKitConstants.groupMemberAction.KICKED, message, kickedFrom);
                },
                onGroupMemberBanned: (message: CometChat.BaseMessage, bannedUser: CometChat.User, bannedBy: CometChat.User, bannedFrom: CometChat.Group) => {
                    callback(CometChatUIKitConstants.groupMemberAction.BANNED, message, bannedFrom);
                },
                onGroupMemberUnbanned: (message: CometChat.BaseMessage, unbannedUser: CometChat.User, unbannedBy: CometChat.User, unbannedFrom: CometChat.Group) => {
                    callback(CometChatUIKitConstants.groupMemberAction.UNBANNED, message, unbannedFrom);
                },
                onMemberAddedToGroup: (message: CometChat.BaseMessage, userAdded: CometChat.User, userAddedBy: CometChat.User, userAddedIn: CometChat.Group) => {
                    callback(CometChatUIKitConstants.groupMemberAction.ADDED, message, userAddedIn);
                },
                onGroupMemberLeft: (message: CometChat.BaseMessage, leavingUser: CometChat.GroupMember, group: CometChat.Group) => {
                    callback(CometChatUIKitConstants.groupMemberAction.LEFT, message, group);
                },
                onGroupMemberJoined: (message: CometChat.BaseMessage, joinedUser: CometChat.GroupMember, joinedGroup: CometChat.Group) => {
                    callback(CometChatUIKitConstants.groupMemberAction.JOINED, message, joinedGroup);
                },
            })
        );

        if (ChatConfigurator.names.includes("calling")) {
            CometChat.addCallListener(
                this.callListenerId,
                new CometChat.CallListener({
                    onIncomingCallReceived: (call: CometChat.Call) => {
                        callback('incoming', call);
                    },
                    onIncomingCallCancelled: (call: CometChat.Call) => {
                        callback('cancelled', call);
                    },
                    onOutgoingCallRejected: (call: CometChat.Call) => {
                        callback('rejected', call);
                    },
                    onOutgoingCallAccepted: (call: CometChat.Call) => {
                        callback('accepted', call);
                    },
                })
            );
        }
    };

    static removeListeners() {
        CometChat.removeMessageListener(this.messageListListenerId);
        CometChat.removeGroupListener(this.groupListenerId);
        if (ChatConfigurator.names.includes("calling")) {
            CometChat.removeCallListener(this.callListenerId);
        }
    }
}

