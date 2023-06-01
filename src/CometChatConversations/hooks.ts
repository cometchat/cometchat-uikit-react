import { CometChat } from "@cometchat-pro/chat";
import React, { useEffect, JSX } from "react";
import { CometChatCallEvents, CometChatConversationEvents, CometChatGroupEvents, CometChatMessageEvents, CometChatUserEvents, MessageStatus } from "uikit-resources-lerna";
import { CometChatUIKitUtility } from "uikit-utils-lerna";
import { Action } from ".";
import { ConversationsManager } from "./controller";

type Args = {
    conversationsRequestBuilder : CometChat.ConversationsRequestBuilder | null,
    conversationsManagerRef : React.MutableRefObject<ConversationsManager | null>,
    fetchNextAndAppendConversations : (fetchId : string) => Promise<void>,
    fetchNextIdRef : React.MutableRefObject<string>,
    dispatch : React.Dispatch<Action>,
    confirmDialogElement : JSX.IntrinsicElements["cometchat-confirm-dialog"] | null,
    conversationToBeDeleted : CometChat.Conversation | null,
    errorHandler : (error: unknown) => void,
    refreshSingleConversation : (message : CometChat.BaseMessage, remove? : boolean) => Promise<void>,
    onMessageReceived : (message : CometChat.BaseMessage) => Promise<void>,
    setReceipts : (messageReceipt : CometChat.MessageReceipt, updateReadAt : boolean) => void,
    setTypingIndicator : (typingIndicator : CometChat.TypingIndicator, typingStarted : boolean) => void,
    disableTyping : boolean,
    loggedInUser : CometChat.User | null
};

export function Hooks(args : Args) {
    const {
        conversationsRequestBuilder,
        conversationsManagerRef,
        fetchNextAndAppendConversations,
        fetchNextIdRef,
        dispatch,
        confirmDialogElement,
        conversationToBeDeleted,
        errorHandler,
        refreshSingleConversation,
        onMessageReceived,
        setReceipts,
        setTypingIndicator,
        disableTyping,
        loggedInUser
    } = args;

    useEffect(
        /**
         * Creates a new request builder -> empties the `conversationList` state -> initiates a new fetch
         */
        () => {
            conversationsManagerRef.current = new ConversationsManager({conversationsRequestBuilder});
            dispatch({type: "setConversationList", conversationList: []});
            fetchNextAndAppendConversations(fetchNextIdRef.current = "initialFetchNext_" + String(Date.now()));
    }, [conversationsRequestBuilder, fetchNextAndAppendConversations, dispatch, conversationsManagerRef, fetchNextIdRef]);

    useEffect(
        /**
         * Sets `loggedInUserRef` to the currently logged-in user
         */
        () => {
            (async () => {
                try {
                    dispatch({type: "setLoggedInUser", loggedInUser: await CometChat.getLoggedinUser()});
                }
                catch(error) {
                    errorHandler(error);
                }
            })();
    }, [errorHandler, dispatch]);

    useEffect(
        /**
         * Attaches event listeners to elements related to the conversation delete view
         */
        () => {
            if (confirmDialogElement === null) {
                return;
            }
            const confirmClickEventName = "cc-confirm-clicked";
            const cancelClickEventName = "cc-cancel-clicked";
            async function handleConfirmClick() {
                if (conversationToBeDeleted) {
                    const convWith = conversationToBeDeleted.getConversationWith();
                    const id = convWith instanceof CometChat.Group ? convWith.getGuid() : convWith.getUid();

                    try {
                        await CometChat.deleteConversation(id, conversationToBeDeleted.getConversationType());
                        CometChatConversationEvents.ccConversationDeleted.next(CometChatUIKitUtility.clone(conversationToBeDeleted));
                        dispatch({type: "removeConversation", conversation: conversationToBeDeleted});
                        dispatch({type: "setConversationToBeDeleted", conversation: null});
                    }
                    catch(error) {
                        errorHandler(error);
                    }
                }
            }
            function handleCancelClick() {
                dispatch({type: "setConversationToBeDeleted", conversation: null});
            }
            confirmDialogElement.addEventListener(confirmClickEventName, handleConfirmClick);
            confirmDialogElement.addEventListener(cancelClickEventName, handleCancelClick);
            return () => {
                confirmDialogElement.removeEventListener(confirmClickEventName, handleConfirmClick);
                confirmDialogElement.removeEventListener(cancelClickEventName, handleCancelClick);
            };
    }, [conversationToBeDeleted, confirmDialogElement, errorHandler, dispatch]);

    useEffect(
        /**
         * Attaches an SDK user listener
         * 
         * @returns - Function to remove the added SDK user listener
         */
        () => {
            return ConversationsManager.attachUserListener((user : CometChat.User) => dispatch({type: "updateConversationWithUser", user}));
    }, [dispatch]);

    useEffect(
        /**
         * Attaches an SDK group listener
         * 
         * @returns - Function to remove the added SDK group listener
         */
        () => {
            return ConversationsManager.attachGroupListener(refreshSingleConversation, loggedInUser);
    }, [refreshSingleConversation, loggedInUser]);

    useEffect(
        /**
         * Attaches an SDK message received listener
         * 
         * @returns - Function to remove the added SDK message received listener
         */
        () => {   
            return ConversationsManager.attachMessageReceivedListener(onMessageReceived);
    }, [onMessageReceived]); 

    useEffect(
        /**
         * Attaches an SDK message modified listener
         * 
         * @returns - Function to remove the added SDK message modified listener
         */
        () => {
            return ConversationsManager.attachMessageModifiedListener((message : CometChat.BaseMessage) => {
                dispatch({type: "updateConversationLastMessage", message});
            })
    }, [dispatch]);

    useEffect(
        /**
         * Attaches an SDK message receipt listener
         * 
         * @returns - Function to remove the added SDK message receipt listener
         */
        () => {
            return ConversationsManager.attachMessageReceiptListener(setReceipts);
    }, [setReceipts]);

    useEffect(
        /**
         * Attaches an SDK message typing listener
         * 
         * @returns - Function to remove the added SDK message typing listener
         */
        () => {
            if (disableTyping) {
                return;
            }
            return ConversationsManager.attachMessageTypingListener(setTypingIndicator);
    }, [disableTyping, setTypingIndicator]);

    useEffect(
        /**
         * Attaches an SDK call listener
         * 
         * @returns - Function to remove the added SDK call listener
         */
        () => {
            return ConversationsManager.attachCallListener(refreshSingleConversation);
    }, [refreshSingleConversation]);

    useEffect(
        /**
         * Subscribes to User, Group, Message & Call UI events
         */
        () => {
            const groupMemberScopeChangedSub = CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe(item => {
                dispatch({type: "updateConversationLastMessageAndPlaceAtTheTop", message: item.message});
            });
            const groupMemberAddedSub = CometChatGroupEvents.ccGroupMemberAdded.subscribe(item => {
                const message = item.messages.at(-1);
                if (message) {
                    dispatch({type: "updateConversationLastMessageAndGroupAndPlaceAtTheTop", group: item.userAddedIn, message});
                }
            });
            const groupMemberKickedSub = CometChatGroupEvents.ccGroupMemberKicked.subscribe(item => {
                dispatch({type: "updateConversationLastMessageAndGroupAndPlaceAtTheTop", group: item.kickedFrom, message: item.message});
            });
            const groupMemberBannedSub = CometChatGroupEvents.ccGroupMemberBanned.subscribe(item => {
                dispatch({type: "updateConversationLastMessageAndGroupAndPlaceAtTheTop", group: item.kickedFrom, message: item.message});
            });
            const groupDeletedSub = CometChatGroupEvents.ccGroupDeleted.subscribe(group => {
                dispatch({type: "removeConversationOfTheGroup", group});
            });
            const groupLeftSub = CometChatGroupEvents.ccGroupLeft.subscribe(item => {
                dispatch({type: "removeConversationOfTheGroup", group: item.leftGroup});
            });
            const userBlockedSub = CometChatUserEvents.ccUserBlocked.subscribe(user => {
                dispatch({type: "removeConversationOfTheUser", user});
            });
            const messageEditedSub = CometChatMessageEvents.ccMessageEdited.subscribe(item => {
                if (item.status === MessageStatus.success) {
                    dispatch({type: "updateConversationLastMessage", message: item.message});
                }
            });
            const messageSentSub = CometChatMessageEvents.ccMessageSent.subscribe(item => {
                if (item.status === MessageStatus.success) {
                    dispatch({type: "updateConversationLastMessageResetUnreadCountAndPlaceAtTheTop", message: item.message});
                }
            });
            const messageDeletedSub = CometChatMessageEvents.ccMessageDeleted.subscribe(message => {
                dispatch({type: "updateConversationLastMessage", message: CometChatUIKitUtility.clone(message)}); // Cloning message since I don't know if the developer is passing a cloned copy
            });
            const messageReadSub = CometChatMessageEvents.ccMessageRead.subscribe(message => {
                dispatch({type: "resetUnreadCountAndSetReadAtIfLastMessage", message});
            });
            const callAcceptedSub = CometChatCallEvents.ccCallAccepted.subscribe(message => {
                dispatch({type: "updateConversationLastMessageAndPlaceAtTheTop", message});
            });
            const outgoingCallSub = CometChatCallEvents.ccOutgoingCall.subscribe(message => {
                dispatch({type: "updateConversationLastMessageAndPlaceAtTheTop", message});
            });
            const callRejectedSub = CometChatCallEvents.ccCallRejected.subscribe(message => {
                dispatch({type: "updateConversationLastMessageAndPlaceAtTheTop", message});
            });
            const callEndedSub = CometChatCallEvents.ccCallEnded.subscribe(message => {
                dispatch({type: "updateConversationLastMessageAndPlaceAtTheTop", message});
            });
            return () => {
                groupMemberScopeChangedSub.unsubscribe();
                groupMemberAddedSub.unsubscribe();
                groupMemberKickedSub.unsubscribe();
                groupMemberBannedSub.unsubscribe();
                groupDeletedSub.unsubscribe();
                groupLeftSub.unsubscribe();
                userBlockedSub.unsubscribe();
                messageEditedSub.unsubscribe();
                messageSentSub.unsubscribe();
                messageDeletedSub.unsubscribe();
                messageReadSub.unsubscribe();
                callAcceptedSub.unsubscribe();
                outgoingCallSub.unsubscribe();
                callRejectedSub.unsubscribe();
                callEndedSub.unsubscribe();
            };
    }, [dispatch]);
}
