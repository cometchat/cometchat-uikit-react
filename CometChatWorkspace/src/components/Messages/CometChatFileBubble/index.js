import React from "react";
import PropTypes from "prop-types";

import { CometChatAvatar, CometChatMessageReceipt, CometChatDate } from "../../";
import { CometChatMessageHover, CometChatMessageReactions } from "../";

import { 
	CometChatMessageReceiverType,
	messageAlignment, 
	messageTimeAlignment, 
} from "../"

import { messageHoverStyling } from "../CometChatMessageConstants";

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
	messageTitleStyle,
    messageTitleLinkStyle,
	messageSubTitleStyle,
	messageFileStyle,
	messageFileIconStyle,
} from "./style";

import fileUploadIcon from "./resources/file-upload.svg";

/**
 * 
 * CometChatTextBubble is UI component for file message bubble.
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
const CometChatFileBubble = props => {

    const [name, setName] = React.useState(null);
	const [avatar, setAvatar] = React.useState(null);
    const [fileURL, setFileURL] = React.useState("");
    const [title, setTitle] = React.useState("");
    const [subTitle, setSubTitle] = React.useState("");
    const [isHovering, setIsHovering] = React.useState(false);

    const messageReplies = null;//<CometChatThreadedMessageReplyCount messageObject={props.messageObject} />;
	const messageReactions = <CometChatMessageReactions messageObject={props.messageObject} loggedInUser={props.loggedInUser} />;

    const showMessageOptions = () => {
		if (!isHovering) {
			setIsHovering(true);
		}
	}

	const hideMessageOptions = () => {
		if (isHovering) {
			setIsHovering(false);
		}
	}

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
		}

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

    let senderAvatar,
        senderName,
        leftView,
        rightView,
        usernameStyle,
        receiptStyle,
        messageTime,
        fileMessage = null;


    senderAvatar = getAvatar();
    senderName = getSenderName();
    messageTime = props.messageObject._composedAt || props.messageObject.sentAt;
    fileMessage = (
        <div style={messageKitBlockStyle(props)} className="message_kit__blocks">
            <div style={messageBlockStyle(props)} className="message__message-blocks">
                <div style={messageTitleStyle(props)} className="message__message-title">
                    <a style={messageTitleLinkStyle(props)} rel="noreferrer" target="_blank" href={fileURL}>{title}</a>
                </div>
                <div style={messageSubTitleStyle(props)} className="message__message-subtitle">{subTitle}</div>
            </div>
            <div style={messageFileStyle(props)} className="message__message-audiourl">
                <i style={messageFileIconStyle(props)} className="message__message-audio-icon"></i>
            </div>
        </div>
    );

    if (props.messageAlignment === messageAlignment.leftAligned) {

        if (props.messageTimeAlignment.toLowerCase() === messageTimeAlignment.top) {
            usernameStyle = (
                <div style={messageTimestampStyle(props)} className="message_kit__username_bar">
                    {senderName}&nbsp;<CometChatDate timeStamp={messageTime} timeFormat="hh:mm am/pm" />
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
                {fileMessage}
                {messageReactions}
                {messageReplies}
                {receiptStyle}
            </div>
        );
    } else {
        //if the message sender is not same as logged in user i.e. message receiver
        if (props.loggedInUser?.uid !== props.messageObject?.sender?.uid) {
            leftView =
                props.messageObject.receiverType === CometChatMessageReceiverType.group && senderAvatar ? (
                    <div style={messageLeftGutterStyle(props)} className="message_kit__gutter__left">
                        {senderAvatar}
                    </div>
                ) : null;

            if (props.messageTimeAlignment.toLowerCase() === messageTimeAlignment.top) {
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
                usernameStyle =
                    props.messageObject.receiverType === CometChatMessageReceiverType.group ? (
                        <div style={messageTimestampStyle(props)} className="message_kit__username_bar">
                            {senderName}
                        </div>
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
                    {fileMessage}
                    {messageReactions}
                    {messageReplies}
                    {receiptStyle}
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
                    {fileMessage}
                    {messageReactions}
                    {messageReplies}
                    {receiptStyle}
                </div>
            );

            rightView = null;
        }
    }

    Hooks(props, setName, setAvatar, setTitle, setSubTitle, setFileURL);

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
};

CometChatFileBubble.defaultProps = {
	width: "300px",
	height: "200px",
	cornerRadius: "12px",
	backgroundColor: "linear-gradient(to right, red , yellow)",
	border: "0 none",
	avatar: null,
	userName: null,
	usernameFont: "600 13px Inter, sans-serif",
	usernameColor: "#39f",
	messageAlignment: "standard",
	messageTimeAlignment: "bottom",
	fileURL: null,
	title: null,
	titleFont: "400 15px Inter, sans-serif",
	titleColor: "#fff",
	subTitle: null,
	subTitleFont: "400 15px Inter, sans-serif",
	subTitleColor: "#fff",
	iconURL: fileUploadIcon,
	iconTint: "#fff",
	messageObject: null,
	loggedInUser: null,
};

CometChatFileBubble.propTypes = {
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
	fileURL: PropTypes.string,
	title: PropTypes.string,
	titleFont: PropTypes.string,
	titleColor: PropTypes.string,
	subTitle: PropTypes.string,
	subTitleFont: PropTypes.string,
	subTitleColor: PropTypes.string,
	iconURL: PropTypes.string,
	iconTint: PropTypes.string,
	messageObject: PropTypes.object,
	loggedInUser: PropTypes.object,
};

export { CometChatFileBubble };