import React, { useEffect } from "react";
import { CometChatMessageEvents } from "../../../";
import { CometChatConversationEvents } from "../CometChatConversationEvents"

export const Hooks = (
    onConversationClickHandler,
    updateMessageList,
    backButtonClickHandler,
    conversationRef,
    activeConversation
) => {

    /**ids */
    const onItemClickId = "onItemClick_" + new Date().getTime();
    const onDeleteConversationId = "onDeleteConversation_" + new Date().getTime();
    const onMessageReadId = "onMessageRead_" + new Date().getTime();
    const onMessageSentId = "onMessageSent_" + new Date().getTime();
    const onBackButtonClickId = "onBackButtonClick_" + new Date().getTime();

    useEffect(() => {
        CometChatConversationEvents.addListener(
            CometChatConversationEvents.onItemClick,
            onItemClickId,
            onConversationClickHandler
        );
        CometChatConversationEvents.addListener(
            CometChatConversationEvents.onDeleteConversation,
            onDeleteConversationId,
            (data) => updateMessageList(data, activeConversation)
        );
        CometChatMessageEvents.addListener(
            CometChatMessageEvents.onMessageRead,
            onMessageReadId,
            (data) => conversationRef?.current?.conversationListRef?.resetUnreadCount(data)
        );
        CometChatMessageEvents.addListener(
            CometChatMessageEvents.onMessageSent,
            onMessageSentId,
            (data) => conversationRef?.current?.conversationListRef?.updateLastMessage(data?.message)
        );
        CometChatMessageEvents.addListener(
            CometChatMessageEvents.onBackButtonClick,
            onBackButtonClickId,
            backButtonClickHandler
        );

        return () => {
            CometChatConversationEvents.removeListener(CometChatConversationEvents.onItemClick, onItemClickId);
            CometChatConversationEvents.removeListener(CometChatConversationEvents.onDeleteConversation, onDeleteConversationId);
            CometChatConversationEvents.removeListener(CometChatMessageEvents.onMessageRead, onMessageReadId);
            CometChatConversationEvents.removeListener(CometChatMessageEvents.onMessageSent, onMessageSentId);
            CometChatConversationEvents.removeListener(CometChatMessageEvents.onBackButtonClick, onBackButtonClickId);
        }
    }, [activeConversation]);
};