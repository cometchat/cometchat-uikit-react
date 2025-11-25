import { MessageStatus } from '../../Enums/Enums';
import React, { JSX, useEffect, useRef } from "react";

import { Action } from "./CometChatConversations";
import { CometChat, Conversation } from "@cometchat/chat-sdk-javascript";
import { ConversationsManager } from "./controller";
import { CometChatUIKitUtility } from '../../CometChatUIKit/CometChatUIKitUtility';
import { CometChatUIKitLoginListener } from '../../CometChatUIKit/CometChatUIKitLoginListener';
import { CometChatConversationEvents } from '../../events/CometChatConversationEvents';
import { CometChatGroupEvents } from '../../events/CometChatGroupEvents';
import { CometChatUserEvents } from '../../events/CometChatUserEvents';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { CometChatCallEvents } from '../../events/CometChatCallEvents';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';

type Args = {
  conversationsRequestBuilder: CometChat.ConversationsRequestBuilder | null,
  conversationsManagerRef: React.MutableRefObject<ConversationsManager | null>,
  fetchNextAndAppendConversations: (fetchId: string) => Promise<void>,
  fetchNextIdRef: React.MutableRefObject<string>,
  dispatch: React.Dispatch<Action>,
  errorHandler: (error: unknown,source?:string) => void,
  refreshSingleConversation: (message: CometChat.BaseMessage, remove?: boolean) => Promise<void>,
  onMessageReceived: (message: CometChat.BaseMessage) => Promise<void>,
  setReceipts: (messageReceipt: CometChat.MessageReceipt, updateReadAt: boolean) => void,
  setTypingIndicator: (typingIndicator: CometChat.TypingIndicator, typingStarted: boolean) => void,
  loggedInUser: CometChat.User | null,
  activeConversation: Conversation | null,
  setActiveConversationState: React.Dispatch<React.SetStateAction<Conversation | null>>,
  hideUserStatus?:boolean,
  hideConversation: (
    conversationsRequest: CometChat.ConversationsRequest | null,
    message: CometChat.BaseMessage
  ) => boolean;
};

export function useCometChatConversations(args: Args) {
  const {
    conversationsRequestBuilder,
    conversationsManagerRef,
    fetchNextAndAppendConversations,
    fetchNextIdRef,
    dispatch,
    errorHandler,
    refreshSingleConversation,
    onMessageReceived,
    setReceipts,
    setTypingIndicator,
    loggedInUser,
    activeConversation,
    setActiveConversationState,
    hideUserStatus,
    hideConversation
  } = args;

  const isFirstRenderRef = useRef<boolean>(true);

  useEffect(
    /**
     * Creates a new request builder -> empties the `conversationList` state -> initiates a new fetch
     */
    () => {
      if(!isFirstRenderRef.current) return;
      try {
        dispatch({ type: "setIsFirstReload", isFirstReload: true });
      conversationsManagerRef.current = new ConversationsManager({ conversationsRequestBuilder,errorHandler });
      dispatch({ type: "setConversationList", conversationList: [] });
      fetchNextAndAppendConversations(fetchNextIdRef.current = "initialFetchNext_" + String(Date.now()));
      isFirstRenderRef.current = false;

      } catch (error) {
        errorHandler(error,"useEffect")
      }

    }, [conversationsRequestBuilder, fetchNextAndAppendConversations, dispatch, conversationsManagerRef, fetchNextIdRef]);

  useEffect(
    /**
     * Sets `loggedInUserRef` to the currently logged-in user
     */
    () => {
      (async () => {
        try {
          dispatch({ type: "setLoggedInUser", loggedInUser: CometChatUIKitLoginListener.getLoggedInUser() });
        }
        catch (error) {
          errorHandler(error,"setLoggedInUser");
        }
      })();
    }, [errorHandler, dispatch]);



  useEffect(
    /**
     * Attaches an SDK user listener
     *
     * @returns - Function to remove the added SDK user listener
     */
    () => {
    
 if(!hideUserStatus){
  return ConversationsManager.attachUserListener((user: CometChat.User) => dispatch({ type: "updateConversationWithUser", user }));
 }
      
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
      return ConversationsManager.attachMessageModifiedListener((message: CometChat.BaseMessage) => {
        dispatch({ type: "updateConversationLastMessage", message });
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
      return ConversationsManager.attachMessageTypingListener(setTypingIndicator);
    }, [ setTypingIndicator]);

  useEffect(
    /**
     * Attaches an SDK call listener
     *
     * @returns - Function to remove the added SDK call listener
     */
    () => {
      return ConversationsManager.attachCallListener(refreshSingleConversation);
    }, [refreshSingleConversation]);


  useEffect(() => {
  try {
      /**
     * Subscribes to Conversations UI events
     */
      const ccConversationDeleted =
      CometChatConversationEvents.ccConversationDeleted.subscribe(
        (conversation: CometChat.Conversation) => {
          if (conversation) {
            dispatch({ type: "removeConversation", conversation });
            dispatch({ type: "setConversationToBeDeleted", conversation: null });
          }
        }
      );
    return () => {
      ccConversationDeleted.unsubscribe();
    }
  } catch (error) {
    errorHandler(error,"ccConversationDeleted")
  }
  }, [dispatch])

  const handleGroupCreated = async (group: CometChat.Group) => {
    try {
        const conversation = await CometChat.getConversation(
            group.getGuid(),
            CometChatUIKitConstants.MessageReceiverType.group
        );
        if (conversation) {
            dispatch({
              type: "addConversationOfTheGroupAtTheTop",
              conversation: conversation 
            });
          }
    } catch (error) {
        console.error("Failed to fetch conversation:", error);
    }
};

  useEffect(
    /**
     * Subscribes to User, Group, Message & Call UI events
     */
    () => {
      try {
        let builder = conversationsRequestBuilder;
        var builtBuilder:CometChat.ConversationsRequest;
        if(builder){
          builtBuilder = builder.build();
        }

      const groupCreatedSub = CometChatGroupEvents.ccGroupCreated.subscribe(group => {
          handleGroupCreated(group);
      });
      const groupMemberScopeChangedSub = CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe(item => {
        dispatch({ type: "updateConversationLastMessageAndPlaceAtTheTop", message: item.message });
      });
      const groupMemberAddedSub = CometChatGroupEvents.ccGroupMemberAdded.subscribe(item => {
        const message = item.messages[item.messages.length - 1];
        if (message) {
          dispatch({ type: "updateConversationLastMessageAndGroupAndPlaceAtTheTop", group: item.userAddedIn, message });
        }
      });
      const groupMemberKickedSub = CometChatGroupEvents.ccGroupMemberKicked.subscribe(item => {
        dispatch({ type: "updateConversationLastMessageAndGroupAndPlaceAtTheTop", group: item.kickedFrom, message: item.message });
      });
      const groupMemberBannedSub = CometChatGroupEvents.ccGroupMemberBanned.subscribe(item => {
        dispatch({ type: "updateConversationLastMessageAndGroupAndPlaceAtTheTop", group: item.kickedFrom, message: item.message });
      });
      const groupDeletedSub = CometChatGroupEvents.ccGroupDeleted.subscribe(group => {
        dispatch({ type: "removeConversationOfTheGroup", group });
      });
      const groupLeftSub = CometChatGroupEvents.ccGroupLeft.subscribe(item => {
        if (!ConversationsManager.shouldLastMessageAndUnreadCountBeUpdated(item.message)) {
          return;
        }
        dispatch({ type: "removeConversationOfTheGroup", group: item.leftGroup });
      });
      const userBlockedSub = CometChatUserEvents.ccUserBlocked.subscribe(user => {
        if (builtBuilder && !builtBuilder?.isIncludeBlockedUsers()) {
          dispatch({ type: "removeConversationOfTheUser", user });
        } else {
          dispatch({ type: "updateConversationWithUser", user });
        }
      });
      const userUnBlockedSub = CometChatUserEvents.ccUserUnblocked.subscribe(user => {
        if (builtBuilder && builtBuilder.isIncludeBlockedUsers()) {
          dispatch({ type: "updateConversationWithUser", user });
        }
      });
      const messageEditedSub = CometChatMessageEvents.ccMessageEdited.subscribe(item => {
        if (item.status === MessageStatus.success) {
          dispatch({ type: "updateConversationLastMessage", message: item.message });
        }
      });
      const messageSentSub = CometChatMessageEvents.ccMessageSent.subscribe(item => {
        if (item.status === MessageStatus.success) {
          if (hideConversation(builtBuilder, item.message)) {
            return;
          }
          CometChat.CometChatHelper.getConversationFromMessage(item.message).then(conversation => {
            setActiveConversationState(conversation);
            dispatch({ type: "updateConversationLastMessageResetUnreadCountAndPlaceAtTheTop", message: item.message, conversation: conversation });
          });
        }
      });
      const messageDeletedSub = CometChatMessageEvents.ccMessageDeleted.subscribe(message => {
        dispatch({ type: "updateConversationLastMessage", message: CometChatUIKitUtility.clone(message) }); // Cloning message since I don't know if the developer is passing a cloned copy
      });
      const messageReadSub = CometChatMessageEvents.ccMessageRead.subscribe(message => {
        dispatch({ type: "resetUnreadCountAndSetReadAtIfLastMessage", message });
      });
      const callAcceptedSub = CometChatCallEvents.ccCallAccepted.subscribe(message => {
        dispatch({ type: "updateConversationLastMessageAndPlaceAtTheTop", message });
      });
      const outgoingCallSub = CometChatCallEvents.ccOutgoingCall.subscribe(message => {
        dispatch({ type: "updateConversationLastMessageAndPlaceAtTheTop", message });
      });
      const callRejectedSub = CometChatCallEvents.ccCallRejected.subscribe(message => {
        dispatch({ type: "updateConversationLastMessageAndPlaceAtTheTop", message });
      });
      const callEndedSub = CometChatCallEvents.ccCallEnded.subscribe(message => {
        dispatch({ type: "updateConversationLastMessageAndPlaceAtTheTop", message });
      });
      return () => {
        groupCreatedSub.unsubscribe();
        groupMemberScopeChangedSub.unsubscribe();
        groupMemberAddedSub.unsubscribe();
        groupMemberKickedSub.unsubscribe();
        groupMemberBannedSub.unsubscribe();
        groupDeletedSub.unsubscribe();
        groupLeftSub.unsubscribe();
        userBlockedSub.unsubscribe();
        userUnBlockedSub.unsubscribe();
        messageEditedSub.unsubscribe();
        messageSentSub.unsubscribe();
        messageDeletedSub.unsubscribe();
        messageReadSub.unsubscribe();
        callAcceptedSub.unsubscribe();
        outgoingCallSub.unsubscribe();
        callRejectedSub.unsubscribe();
        callEndedSub.unsubscribe();
      };
      } catch (error) {
        errorHandler(error,"useEffect")
      }
    }, [dispatch]);

  useEffect(() => {
    setActiveConversationState(activeConversation);
  }, [activeConversation]);
}
