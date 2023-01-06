import React, { useEffect } from "react";
import { CometChat } from "@cometchat-pro/chat";
import { ConversationListManager } from "./controller";
import { CometChatConversationEvents } from "../CometChatConversationEvents";

export const Hooks = (
  conversationType,
  limit,
  tags,
  userAndGroupTags,
  setConversationList,
  conversationCallback,
  conversationListManager,
  loggedInUser,
  handleConversations,
) => {
  useEffect(() => {
    CometChat.getLoggedinUser()
      .then((user) => {
        loggedInUser.current = { ...user };
      })
      .catch((error) => {
        CometChatConversationEvents.emit(
          CometChatConversationEvents.onError,
          error
        );
      });
  }, []);

  useEffect(() => {
    try {
      conversationListManager.current = new ConversationListManager({
        conversationType: conversationType,
        limit: limit,
        tags: tags,
        userAndGroupTags: userAndGroupTags,
      });
      conversationListManager.current?.attachListeners(conversationCallback);
      setConversationList([]);
      handleConversations();

      return () => {
        if (conversationListManager?.current?.removeListeners) {
          conversationListManager.current.removeListeners();
        }
      };
    } catch (e) {
      CometChatConversationEvents.emit(CometChatConversationEvents.onError, e);
    }
  }, [conversationType, limit, tags?.length, userAndGroupTags]);
};
