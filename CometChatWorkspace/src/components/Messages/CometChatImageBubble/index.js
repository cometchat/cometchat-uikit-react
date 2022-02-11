import React from "react";
import PropTypes from "prop-types";

import { CometChatAvatar, CometChatMessageReceipt, CometChatDate } from "../../";
import { CometChatMessageHover, CometChatMessageReactions } from "../";
import { 
	CometChatMessageReceiverType,
	messageAlignment, 
	messageTimeAlignment, 
} from "../";

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
} from "./style";

import defaultImage from "./resources/1px.png";

/**
 * 
 * CometChatImageBubble is UI component for image message bubble.
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
const CometChatImageBubble = (props) => {

    const [name, setName] = React.useState(null);
	const [avatar, setAvatar] = React.useState(null);
    const [imageURL, setImageURL] = React.useState(defaultImage);
	const [isHovering, setIsHovering] = React.useState(false);

    let senderAvatar,
			senderName,
			leftView,
			rightView,
			usernameStyle,
			receiptStyle,
            messageTime,
			imageMessage = null;

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

    senderAvatar = getAvatar();
    senderName = getSenderName();
    messageTime = props.messageObject._composedAt || props.messageObject.sentAt;
    imageMessage = (
        <div style={messageKitBlockStyle(props)} className="message_kit__blocks">
            <img className="message__message-blocks" style={messageBlockStyle(props)} src={imageURL} alt={imageURL} />
        </div>
    );
 
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
			<CometChatMessageReceipt messageObject={props.messageObject} loggedInUser={props.loggedInUser} />) : null;

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
				{imageMessage}
				{messageReactions}
				{messageReplies}
				{receiptStyle}
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
					{imageMessage}
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
					{imageMessage}
					{messageReactions}
					{messageReplies}
					{receiptStyle}
				</div>
			);

			rightView = null;
		}
	}

	Hooks(props, setName, setAvatar, setImageURL, imageURL);

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

CometChatImageBubble.defaultProps = {
	width: "300px",
	height: "200px",
	cornerRadius: "12px",
	backgroundColor: "",
	border: "0 none",
	avatar: null,
	userName: null,
	usernameFont: "600 13px Inter",
	usernameColor: "#39f",
	messageAlignment: "standard",
	messageTimeAlignment: "top",
	imageURL: "",
	messageObject: null,
	loggedInUser: null,
};

CometChatImageBubble.propTypes = {
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
	imageURL: PropTypes.string,
	messageObject: PropTypes.object,
	loggedInUser: PropTypes.object,
};

export { CometChatImageBubble };