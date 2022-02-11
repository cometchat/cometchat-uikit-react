import { CometChat } from "@cometchat-pro/chat";

import { conversationType } from "../";

export class ConversationListManager {

    conversationRequest = null;

    conversationListenerId = "chatlist_" + new Date().getTime();
    userListenerId = "chatlist_user_" + new Date().getTime();
    groupListenerId = "chatlist_group_" + new Date().getTime();
    callListenerId = "chatlist_call_" + new Date().getTime();

    constructor(props) {

        switch (props.conversationType) {
            case conversationType["users"]:
                this.conversationRequest = new CometChat.ConversationsRequestBuilder().setConversationType(CometChat.ACTION_TYPE.TYPE_USER).setLimit(30).build();
            break;
            case conversationType["groups"]:
                this.conversationRequest = new CometChat.ConversationsRequestBuilder().setConversationType(CometChat.ACTION_TYPE.TYPE_GROUP).setLimit(30).build();
                break;
            default:
                this.conversationRequest = new CometChat.ConversationsRequestBuilder().setLimit(30).build();
            break;
        }
    }

    fetchNextConversation() {
        return this.conversationRequest.fetchNext();
    }

    attachListeners(callback) {

        CometChat.addUserListener(
            this.userListenerId,
            new CometChat.UserListener({
                onUserOnline: onlineUser => {
                    /* when someuser/friend comes online, user will be received here */
                    callback("onUserOnline", onlineUser);
                },
                onUserOffline: offlineUser => {
                    /* when someuser/friend went offline, user will be received here */
                    callback("onUserOffline", offlineUser);
                }
            })
        );

        CometChat.addGroupListener(
            this.groupListenerId,
            new CometChat.GroupListener({
                onGroupMemberScopeChanged: (message, changedUser, newScope, oldScope, changedGroup) => {
                    callback("onGroupMemberScopeChanged", message, changedUser, newScope, oldScope, changedGroup);
                }, 
                onGroupMemberKicked: (message, kickedUser, kickedBy, kickedFrom) => {
                    callback("onGroupMemberKicked", message, kickedUser, kickedBy, kickedFrom);
                }, 
                onGroupMemberLeft: (message, leavingUser, group) => {
                    callback("onGroupMemberLeft", message, leavingUser, null, group);
                }, 
                onGroupMemberBanned: (message, bannedUser, bannedBy, bannedFrom) => {
                    callback("onGroupMemberBanned", message, bannedUser, bannedBy, bannedFrom);
                }, 
                onMemberAddedToGroup: (message, userAdded, userAddedBy, userAddedIn) => {
                    callback("onMemberAddedToGroup", message, userAdded, userAddedBy, userAddedIn);
                }, 
                onGroupMemberJoined: (message, joinedUser, joinedGroup) => {
                    callback("onGroupMemberJoined", message, joinedUser, null, joinedGroup);
                }
            })
        );

        CometChat.addMessageListener(
            this.conversationListenerId,
            new CometChat.MessageListener({
                onTextMessageReceived: textMessage => {
                    callback("onTextMessageReceived", textMessage);
                },
                onMediaMessageReceived: mediaMessage => {
                    callback("onMediaMessageReceived", mediaMessage);
                },
                onCustomMessageReceived: customMessage => {
                    callback("onCustomMessageReceived", customMessage);
                },
                onMessageDeleted: deletedMessage => {
                    callback("onMessageDeleted", deletedMessage);
                },
                onMessageEdited: editedMessage => {
                    callback("onMessageEdited", editedMessage);
                },
                onMessagesRead: messageReceipt => {
                    callback("onMessagesRead", messageReceipt);
                },
                onTypingStarted: typingIndicator => {
                    callback("onTypingStarted", typingIndicator, true);
                },
                onTypingEnded: typingIndicator => {
                    callback("onTypingEnded", typingIndicator, false);
                }
            })
        );

        // CometChat.addCallListener(
        //     this.callListenerId,
        //     new CometChat.CallListener({
        //         onIncomingCallReceived: call => {
        //           callback("onIncomingCallReceived", call);
        //         },
        //         onIncomingCallCancelled: call => {
        //             callback("onIncomingCallCancelled", call);
        //         }
        //     })
        // );
    }

    removeListeners() {
        CometChat.removeMessageListener(this.conversationListenerId);
        CometChat.removeUserListener(this.userListenerId);
        CometChat.removeGroupListener(this.groupListenerId);
        //CometChat.removeCallListener(this.callListenerId);
    }

}
