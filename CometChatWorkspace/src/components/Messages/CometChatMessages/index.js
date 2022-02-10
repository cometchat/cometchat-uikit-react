import React from "react";
import PropTypes from "prop-types";

import { 
	CometChatMessageEvents,
    CometChatMessageHeader,
	CometChatMessageList,
	CometChatMessageComposer,
    CometChatLiveReactions,
	messageConstants,
    metadataKey,
} from "../";

import { messageStatus } from "../CometChatMessageConstants";

import { MessagesManager } from "./controller";
import { Hooks } from "./hooks";

import { chatWrapperStyle, liveReactionWrapperStyle } from "./style";

import insertEmoticon from "./resources/emoji.svg";

const CometChatMessages = props => {

    let messageListRef = React.useRef(null);
    let messageComposerRef = React.useRef(null);

    const [messagesManager] = React.useState(new MessagesManager());

    const [loggedInUser, setLoggedInUser] = React.useState(null);
    const [viewLiveReaction, setViewLiveReaction] = React.useState(false);
    const [liveReactionTemplate, setLiveReactionTemplate] = React.useState(null);

    let headerConfig = React.useRef({});
    let listConfig = React.useRef({});
    let composerConfig = React.useRef({});

    let liveReactionTimeout = 0;

    /**
     * Preview message before edit
     */
    const previewMessageForEdit = message => {

        if (messageComposerRef && messageComposerRef.current) {
            messageComposerRef.current.previewMessageForEdit(message);
        }
    };

    /**
     * Update message list on successfully editing the message
     */
    const updateMessage = payload => {

        if(messageListRef && messageListRef.current) {
            messageListRef.current.updateMessage(payload.message);
        }
    }

    /**
     * Draft a message before sending
     */
    const draftMessage = message => {

        if (messageComposerRef && messageComposerRef.current) {
            messageComposerRef.current.draftMessage(message);
        }
    }

    const addNewMessage = payload => {

        console.log("payload", payload);

        if(messageListRef && messageListRef.current) {

            if (payload.status === messageStatus.inprogress) {
                messageListRef.current.addMessage(payload.message);
            } else if(payload.status === messageStatus.success) {
                messageListRef.current.updateMessageAsSent(payload.message);
            }
            
        }
    }

    const messagesCallback = (listener, message) => {

        switch(listener) {
            case "onTransientMessageReceived": 
                onTransientMessageReceived(message);
                break;
            default:
                break;
        }

    }

    const onTransientMessageReceived = message => {

        if (message.data.type === metadataKey.liveReaction) {

            const payload = {
                reaction: message.data.reaction,
                style: { font: props.liveReactionFont, color: props.liveReactionColor },
            };

			shareLiveReaction(payload);
		}
    }

    const clearLiveReaction = () => {
        clearTimeout(liveReactionTimeout);
        setViewLiveReaction(false);
    }

    const shareLiveReaction = payload => {

        //if already live reaction in progress
		if (liveReactionTimeout) {
			return false;
		}

        setViewLiveReaction(true);
        setLiveReactionTemplate(payload);

        //set timeout till the next share
		liveReactionTimeout = setTimeout(clearLiveReaction, messageConstants.liveReactionTimeout);
    }

    CometChatMessageEvents.addListener(CometChatMessageEvents.messageEdited, "messageEdited", updateMessage);
    CometChatMessageEvents.addListener(CometChatMessageEvents.onMessageError, "messageError", updateMessage);
    CometChatMessageEvents.addListener(CometChatMessageEvents.previewMessageForEdit, "previewMessageForEdit", previewMessageForEdit);
    CometChatMessageEvents.addListener(CometChatMessageEvents.onMessageSent, "messageSent", addNewMessage);
    CometChatMessageEvents.addListener(CometChatMessageEvents.onLiveReaction, "liveReactionId", shareLiveReaction);

    Hooks(props, setLoggedInUser, messagesManager, messagesCallback, headerConfig, listConfig, composerConfig);

    let liveReactionView = (viewLiveReaction) ? (
        <div style={liveReactionWrapperStyle()}>
            <CometChatLiveReactions reaction={liveReactionTemplate.reaction} style={liveReactionTemplate.style} />
        </div>
    ) : null

    return (
			<div className="main__chat" style={chatWrapperStyle()}>
				<CometChatMessageHeader user={props.user} group={props.group} background={headerConfig.current?.background} />
				<CometChatMessageList
					ref={messageListRef}
					loggedInUser={loggedInUser}
					user={props.user}
					group={props.group}
					parentMessage={props.parentMessage}
					messageAlignment={props.messageAlignment}
					messageFilterList={props.messageFilterList}
					background={listConfig.current?.background}>
					{/* {renderItems()} */}
				</CometChatMessageList>
				{liveReactionView}
				<CometChatMessageComposer
					ref={messageComposerRef}
					user={props.user}
					group={props.group}
					parentMessage={props.parentMessage}
					hideEmoji={props.hideEmoji}
					emojiIconURL={props.emojiIconURL}
					emojiIconTint={props.emojiIconTint}
					hideLiveReaction={props.hideLiveReaction}
					liveReaction={props.liveReaction}
					liveReactionFont={props.liveReactionFont}
					liveReactionColor={props.liveReactionColor}
					hideAttachment={props.hideAttachment}
					messageFilterList={props.messageFilterList}
					background={composerConfig.current?.background}
					placeholder={composerConfig.current?.placeholder}
					sendButtonIconURL={composerConfig.current?.sendButtonIconURL}
				/>
			</div>
		);
}

CometChatMessages.propTypes = {
	user: PropTypes.object,
	group: PropTypes.object,
	parentMessage: PropTypes.object,
	hideDeletedMessage: PropTypes.bool,
	hideCallActionMessage: PropTypes.bool,
	hideGroupActionMessage: PropTypes.bool,
	hideEmoji: PropTypes.bool,
	emojiIconURL: PropTypes.string,
	emojiIconTint: PropTypes.string,
	hideLiveReaction: PropTypes.bool,
	liveReaction: PropTypes.string,
	liveReactionFont: PropTypes.string,
	liveReactionColor: PropTypes.string,
	hideAttachment: PropTypes.bool,
	messageAlignment: PropTypes.oneOf(["leftAligned", "standard"]),
	messageFilterList: PropTypes.array,
	configurations: PropTypes.object,
};

CometChatMessages.defaultProps = {
	user: null,
	group: null,
	parentMessage: null,
	hideDeletedMessage: false,
	hideCallActionMessage: false,
	hideGroupActionMessage: false,
	hideEmoji: false,
	emojiIconURL: insertEmoticon,
	emojiIconTint: "rgba(20, 20, 20, 0.46)",
	hideLiveReaction: false,
	liveReaction: "❤️",
	liveReactionFont: "400 18px Inter,sans-serif",
	liveReactionColor: "#D7443E",
	hideSendingOneOnOneMessage: false,
	hideSendingGroupMessage: false,
	hideAttachment: false,
	messageAlignment: "standard",
	messageFilterList: [],
	configurations: {},
};

export { CometChatMessages };