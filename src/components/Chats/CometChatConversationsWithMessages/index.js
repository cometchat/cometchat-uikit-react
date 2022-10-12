import React, { useRef, useState } from "react"
import PropTypes from "prop-types";
import * as styles from "./style";
import { CometChatConversations } from "../CometChatConversations";
import {
    ConversationsWithMessagesStyles,
    ConversationsStyles
} from "../../Chats";
import {
    ConversationsConfiguration,
    MessagesConfiguration,
    CometChatMessages,
    CometChatTheme,
    CometChatDecoratorMessage,
    localize,
    fontHelper
} from "../../../";
import { Hooks } from "./hooks";
import { CometChat } from "@cometchat-pro/chat";

/**
 *
 * @version 1.0.0
 * @author CometChat
 * @description CometChatConversationsWithMessages is a container component that wraps and
 * formats CometChatConversations and CometChatMessages component, with no behavior of its own.
 *
 */

const CometChatConversationsWithMessages = (props) => {
    /**
     * Props destructuring
     */
    const {
        user,
        group,

        messageText,
        style,
        isMobileView,
        conversationsConfiguration,
        messagesConfiguration,
        theme
    } = props;

    /**
     * Component internal state
     */
    const [activeConversation, setActiveConversation] = useState(null)
    const conversationRef = useRef();

    /**
     * Component private scoping
     */
    const _conversationsConfiguration = new ConversationsConfiguration(conversationsConfiguration ?? {});
    const _messagesConfiguration = new MessagesConfiguration(messagesConfiguration ?? {});
    const _theme = new CometChatTheme(theme ?? {});

    /**
     * Component internal handlers/methods 
     */
    const onConversationClickHandler = (data) => {
        setActiveConversation(data);
    }

    const updateMessageList = (conversation, activeConversation) => {
        if (activeConversation?.conversationWith?.uid == conversation?.conversationWith?.uid) {
            setActiveConversation(null)
        } else if (activeConversation?.conversationWith?.guid == conversation?.conversationWith?.guid) {
            setActiveConversation(null)
        } else {
            return
        }
    }

    const backButtonClickHandler = () => {
        setActiveConversation(null);
    }


    /**
     * Component hooks
     */
    Hooks(
        onConversationClickHandler,
        updateMessageList,
        backButtonClickHandler,
        conversationRef,
        activeConversation
    );

    /**
     * Component template scoping
     */
    const ConversationsBar = (
        <CometChatConversations
            ref={conversationRef}
            title={localize("CHATS")}
            searchPlaceholder={localize("SEARCH")}
            style={new ConversationsStyles({
                ..._conversationsConfiguration?.style,
                width: isMobileView ? "100%" : (_conversationsConfiguration?.style?.width ?? "280px"),
            })}
            backButtonIconURL={_conversationsConfiguration?.backButtonIconURL}
            searchIconURL={_conversationsConfiguration?.searchIconURL}
            showBackButton={_conversationsConfiguration?.showBackButton}
            hideSearch={_conversationsConfiguration?.hideSearch}
            startConversationIconURL={_conversationsConfiguration?.startConversationIconURL}
            hideStartConversation={_conversationsConfiguration?.hideStartConversation}
            activeConversation={activeConversation}
            conversationListConfiguration={_conversationsConfiguration?.conversationListConfiguration}
            theme={_theme}
        />
    );

    /**
     * If User or Group changes then prioritize it as props to CometChatMessages
     */
    let _user = activeConversation?.conversationWith?.uid ? activeConversation?.conversationWith : null;
    let _group = activeConversation?.conversationWith?.guid ? activeConversation?.conversationWith : null;

    if (user) _user = user;
    if (group) _group = group;

    const MessagesBar = (
        <CometChatMessages
            user={_user}
            group={_group}
            hideDeletedMessage={_messagesConfiguration?.hideDeletedMessage}
            hideCallActionMessage={_messagesConfiguration?.hideCallActionMessage}
            hideGroupActionMessage={_messagesConfiguration?.hideGroupActionMessage}
            hideEmoji={_messagesConfiguration?.hideEmoji}
            emojiIconURL={_messagesConfiguration?.emojiIconURL}
            emojiIconTint={_messagesConfiguration?.emojiIconTint}
            hideLiveReaction={_messagesConfiguration?.hideLiveReaction}
            liveReaction={_messagesConfiguration?.liveReaction}
            liveReactionFont={_messagesConfiguration?.liveReactionFont}
            liveReactionColor={_messagesConfiguration?.liveReactionColor}
            hideAttachment={_messagesConfiguration?.hideAttachment}
            messageAlignment={_messagesConfiguration?.messageAlignment}
            messageFilterList={_messagesConfiguration?.messageFilterList}
            messageHeaderConfiguration={_messagesConfiguration?.messageHeaderConfiguration}
            messageListConfiguration={_messagesConfiguration?.messageListConfiguration}
            messageComposerConfiguration={_messagesConfiguration?.messageComposerConfiguration}
            liveReactionConfiguration={_messagesConfiguration?.liveReactionConfiguration}
            theme={_theme}
        />
    );

    const getTemplate = () => {
        if (isMobileView && (activeConversation || _user || _group)) {
            return MessagesBar;
        } else if (isMobileView && !(activeConversation || _user || _group)) {
            return ConversationsBar;
        } else if (!isMobileView && !(activeConversation || _user || _group)) {
            return (
                <>
                    {ConversationsBar}
                    <CometChatDecoratorMessage
                        text={messageText || localize("NO_CHATS_SELECTED")}
                        textColor={_theme?.palette?.getAccent400()}
                        textFont={fontHelper(_theme?.typography?.heading)}
                        background={_theme?.palette?.getAccent900()}
                    />
                </>
            );
        } else if (!isMobileView && (activeConversation || _user || _group)) {
            return (
                <>
                    {ConversationsBar}
                    {MessagesBar}
                </>
            );
        }
    }

    /**
     * Component template
     */
    return (
        <div
            style={styles.chatScreenStyle(style)}
            className="cometchat__conversations__with__messages"
        >
            {getTemplate()}
        </div>
    )
};

/**
 * Component default props types values
 */
CometChatConversationsWithMessages.defaultProps = {
    messageText: "",
    user: null,
    group: null,
};

/**
 * Component default props types
 */
CometChatConversationsWithMessages.propTypes = {
    user: PropTypes.object,
    group: PropTypes.object,
    isMobileView: PropTypes.bool,
    messageText: PropTypes.string,
    conversationsConfiguration: PropTypes.object,
    messagesConfiguration: PropTypes.object,
    theme: PropTypes.object,
    style: PropTypes.object,
};

export { CometChatConversationsWithMessages };