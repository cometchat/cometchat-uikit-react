import React from "react";
import PropTypes from "prop-types";

import { CometChatAvatar, CometChatMessageReceipt, CometChatDate } from "../../../";
import { 
    CometChatMessageHover, 
    CometChatMessageReactions, 
	CometChatMessageReceiverType,
	messageAlignment, 
	messageTimeAlignment, 
} from "../../";

import { messageHoverStyling } from "../../CometChatMessageConstants";

import { Hooks } from "./hooks";

import {
	messageHoverStyle,
	messageActionsStyle,
	messageGutterStyle,
	messageLeftGutterStyle,
	messageRightGutterStyle,
	messageKitBlockStyle,
	messageBlockStyle,
	messageAvatarStyle,
	messageSenderStyle,
	messageKitReceiptStyle,
	messageTimestampStyle,
	messageIconStyle,
	messageTxtStyle,
	messageBtnStyle,
    messageBtnItemStyle,
    messageBtnItemTextStyle,
	messageReplyReceiptStyle,
} from "./style";

import documentIcon from "./resources/collaborative-document.svg";

/**
 * 
 * CometChatDocumentBubble is UI component for collaborative document message bubble.
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
const CometChatDocumentBubble = props => {

    const [name, setName] = React.useState(null);
    const [avatar, setAvatar] = React.useState(null);
    const [documentURL, setDocumentURL] = React.useState("");
    const [isHovering, setIsHovering] = React.useState(false);

    let senderAvatar,
        senderName,
        leftView,
        rightView,
        usernameStyle,
        receiptStyle,
        messageTime,
        documentMessage = null;

    const timeFont = "500 11px Inter, sans-serif";
    const timeColor = "rgba(20, 20, 20, 40%)";
    const timeFormat = "MESSAGE_BUBBLE";

    const messageReplies = null;//<CometChatThreadedMessageReplyCount messageObject={props.messageObject} />;
    const messageReactions = <CometChatMessageReactions messageObject={props.messageObject} loggedInUser={props.loggedInUser} />;

    const showMessageOptions = () => {
		if (!isHovering) {
			setIsHovering(true);
		}
	};

	const hideMessageOptions = () => {
		if (isHovering) {
			setIsHovering(false);
		}
	};

    const getAvatar = () => {
        if (!avatar) {
            return null;
        }

        const getAvatarTemplate = () => {
			if (props.avatar && props.avatar.length) {
				return <CometChatAvatar image={avatar} />;
			} else if (props.messageObject && props.messageObject.sender) {
				return <CometChatAvatar user={avatar} />;
			}
		};

        return (
            <div style={messageAvatarStyle()} className="message_kit__avatar">
                {getAvatarTemplate()}
            </div>
        );
    };

    const getSenderName = () => {
        if (!name) {
            return null;
        }

        return (
            <span style={messageSenderStyle(props)} className="message_kit__sender">
                {name}
            </span>
        );
    };

    const launchCollaborativeDocument = () => {
        window.open(documentURL, "", "fullscreen=yes, scrollbars=auto");
    }

    const getDocumentMessage = () => {

        return (
            <div style={messageKitBlockStyle(props)} className="message_kit__blocks">
                <div style={messageBlockStyle(props)} className="message__message-blocks">
                    <i style={messageIconStyle(props)} className="message__message-icon"></i>
                    <p style={messageTxtStyle(props)} className="message__message-title">
                        {props.title}
                    </p>
                </div>
                <ul style={messageBtnStyle(props)} className="message__message-button">
                    <li style={messageBtnItemStyle(props)} onClick={launchCollaborativeDocument}>
                        <p style={messageBtnItemTextStyle(props)}>{props.buttonText}</p>
                    </li>
                </ul>
            </div>
        );
    };

    senderAvatar = getAvatar();
    senderName = getSenderName();
    documentMessage = getDocumentMessage();
    messageTime = props.messageObject._composedAt || props.messageObject.sentAt;
    
    if (props.messageAlignment === messageAlignment.leftAligned) {
        if (props.messageTimeAlignment.toLowerCase() === messageTimeAlignment.top) {
            usernameStyle = (
                <div style={messageTimestampStyle(props)} className="message_kit__username_bar">
                    {senderName}&nbsp;
                    <CometChatDate timeStamp={messageTime} timeFormat="hh:mm am/pm" />
                </div>
            );

            receiptStyle =
                (props.loggedInUser?.uid === props.messageObject?.sender?.uid) ? (
                    <div style={messageKitReceiptStyle(props)} className="message_kit__receipt_bar">
                        <CometChatMessageReceipt messageObject={props.messageObject} loggedInUser={props.loggedInUser} />
                    </div>
                ) : null;
        } else {
            usernameStyle = (
                <div style={messageTimestampStyle(props)} className="message_kit__username_bar">
                    {senderName}
                </div>
            );

            const messageReceipt = (props.loggedInUser?.uid === props.messageObject?.sender?.uid) ? (
				<CometChatMessageReceipt messageObject={props.messageObject} loggedInUser={props.loggedInUser} />
			) : null;

            receiptStyle = (
                <div style={messageKitReceiptStyle(props)} className="message_kit__receipt_bar">
                    {messageReceipt}
                    <CometChatDate timeStamp={messageTime} timeFormat="hh:mm am/pm" />
                </div>
            );
        }

        leftView = senderAvatar ? (
            <div style={messageLeftGutterStyle(props)} className="message_kit__gutter__left">
                {senderAvatar}
            </div>
        ) : null;

        rightView = (
            <div style={messageRightGutterStyle()} className="message_kit__gutter__right">
                {usernameStyle}
                {documentMessage}
                {messageReactions}
                <div style={messageReplyReceiptStyle(props)} className="message_kit__reply__receipt_bar">
                    {messageReplies}
                    {receiptStyle}
                </div>
            </div>
        );
    } else {

        //if the message sender is not same as logged in user i.e. message receiver
		if (props.loggedInUser?.uid !== props.messageObject?.sender?.uid) {
            leftView =
                props.messageObject?.receiverType === CometChatMessageReceiverType.group && senderAvatar ? (
                    <div style={messageLeftGutterStyle(props)} className="message_kit__gutter__left">
                        {senderAvatar}
                    </div>
                ) : null;

            if (props.messageTimeAlignment.toLowerCase() === messageTimeAlignment.top) {

                /**
                 * Not showing the message sender name in 1-1 conversation
                 */
                if (props.messageObject?.receiverType !== CometChatMessageReceiverType.group) {
                    senderName = null;
                }

                usernameStyle = (
                    <div style={messageTimestampStyle(props)} className="message_kit__username_bar">
                        {senderName}&nbsp;
                        <CometChatDate timeStamp={messageTime} timeFormat="hh:mm am/pm" />
                    </div>
                );
                receiptStyle = null;

            } else {
                usernameStyle = (props.messageObject.receiverType === CometChatMessageReceiverType.group) ? (
                    <div style={messageTimestampStyle(props)} className="message_kit__username_bar">{senderName}</div>
                ) : null;
                receiptStyle = (
                    <div style={messageKitReceiptStyle(props)} className="message_kit__receipt_bar">
                        <CometChatDate timeStamp={messageTime} timeFormat="hh:mm am/pm" />
                    </div>
                );
            }

            rightView = (
                <div style={messageRightGutterStyle()} className="message_kit__gutter__right">
                    {usernameStyle}
                    {documentMessage}
                    {messageReactions}
                    <div style={messageReplyReceiptStyle(props)} className="message_kit__reply__receipt_bar">
                        {messageReplies}
                        {receiptStyle}
                    </div>
                </div>
            );
        } else {
            if (props.messageTimeAlignment.toLowerCase() === messageTimeAlignment.top) {
                usernameStyle = (
                    <div style={messageTimestampStyle(props)} className="message_kit__username_bar">
                        <CometChatDate timeStamp={messageTime} timeFormat="hh:mm am/pm" />
                    </div>
                );

                receiptStyle = (
                    <div style={messageKitReceiptStyle(props)} className="message_kit__receipt_bar">
                        <CometChatMessageReceipt messageObject={props.messageObject} loggedInUser={props.loggedInUser} />
                    </div>
                );
            } else {
                usernameStyle = null;
                receiptStyle = (
                    <div style={messageKitReceiptStyle(props)} className="message_kit__receipt_bar">
                        <CometChatDate timeStamp={messageTime} timeFormat="hh:mm am/pm" />
                        <CometChatMessageReceipt messageObject={props.messageObject} loggedInUser={props.loggedInUser} />
                    </div>
                );
            }

            leftView = (
                <div style={messageLeftGutterStyle(props)} className="message_kit__gutter__left">
                    {usernameStyle}
                    {documentMessage}
                    {messageReactions}
                    <div style={messageReplyReceiptStyle(props)} className="message_kit__reply__receipt_bar">
                        {messageReplies}
                        {receiptStyle}
                    </div>
                </div>
            );

            rightView = null;
        }
    }

    Hooks(props, setName, setAvatar, setDocumentURL);

	const messageOptions = isHovering ? <CometChatMessageHover options={props.messageOptions} style={messageHoverStyling(props)} /> : null;

    return (
        <div style={messageHoverStyle(props)} className="message_kit__hover" onMouseEnter={showMessageOptions} onMouseLeave={hideMessageOptions}>
            <div style={messageActionsStyle()} className="message_kit__actions">
                {messageOptions}
                <div style={messageGutterStyle(props)} className="c-message_kit__gutter">
                    {leftView}
                    {rightView}
                </div>
            </div>
        </div>
    );
}

CometChatDocumentBubble.defaultProps = {
	width: "100%",
	height: "auto",
	cornerRadius: "12px",
	backgroundColor: "",
	border: "0 none",
	avatar: null,
	userName: null,
	usernameFont: "600 13px Inter,sans-serif",
	usernameColor: "#39f",
	messageAlignment: "standard",
	messageTimeAlignment: "bottom",
	title: "",
	titleFont: "400 14px Inter,sans-serif",
	titleColor: "#fff",
	buttonText: "Launch",
	buttonTextFont: "400 14px Inter,sans-serif",
	buttonTextColor: "#39f",
	buttonBackgroundColor: "#fff",
	documentURL: "",
	iconURL: documentIcon,
	iconTint: "#fff",
	messageObject: null,
	loggedInUser: null,
	messageOptions: PropTypes.array,
};

CometChatDocumentBubble.propTypes = {
	width: PropTypes.string,
	height: PropTypes.string,
	cornerRadius: PropTypes.string,
	backgroundColor: PropTypes.string,
	border: PropTypes.string,
	avatar: PropTypes.string,
	userName: PropTypes.string,
	usernameFont: PropTypes.string,
	usernameColor: PropTypes.string,
	messageAlignment: PropTypes.oneOf(["standard", "leftAligned"]),
	messageTimeAlignment: PropTypes.oneOf(["top", "bottom"]),
	title: PropTypes.string,
	titleFont: PropTypes.string,
	titleColor: PropTypes.string,
	buttonText: PropTypes.string,
	buttonTextFont: PropTypes.string,
	buttonTextColor: PropTypes.string,
	buttonBackgroundColor: PropTypes.string,
	documentURL: PropTypes.string,
	iconURL: PropTypes.string,
	iconTint: PropTypes.string,
	messageObject: PropTypes.object,
	loggedInUser: PropTypes.object,
	messageOptions: PropTypes.array,
};

export { CometChatDocumentBubble };