import React from "react";
import PropTypes from "prop-types";
import twemoji from "twemoji";
import parse from "html-react-parser";

import { Hooks } from "./hooks";

import { CometChatAvatar, CometChatMessageReceipt, CometChatDate } from "../../";
import { 
	CometChatMessageHover, 
	CometChatMessageReactions,
	CometChatMessageReceiverType,
	messageAlignment, 
	messageTimeAlignment, 
	getExtensionsData,
} from "../";

import { 
	messageHoverStyling,
	emailPattern,
	urlPattern,
	phoneNumPattern 
} from "../CometChatMessageConstants";

import {
	messageHoverStyle,
	messageActionsStyle,
	messageGutterStyle,
	messageLeftGutterStyle,
	messageRightGutterStyle,
	messageKitBlockStyle,
	messageBlockStyle,
	emojiStyle,
	messageAvatarStyle,
	messageSenderStyle,
	messageKitReceiptStyle,
	messageTimestampStyle,
} from "./style";

/**
 * 
 * CometChatTextBubble is UI component for text message bubble.
 * 
 * @version 1.0.0
 * @author CometChatTeams
 * @copyright © 2022 CometChat Inc.
 * 
 */
const CometChatTextBubble = (props) => {

	const [name, setName] = React.useState(null);
	const [avatar, setAvatar] = React.useState(null);
	const [isHovering, setIsHovering] = React.useState(false);

    let senderAvatar,
			senderName,
			messageText,
			messageTime = null;

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
	}

	const getSenderName = () => {

		if (!name) {
			return null;
		}

		return (
			<span style={messageSenderStyle(props)} className="message_kit__sender">{name}</span>
		);
	}

	const linkify = (messageText) => {

		let outputStr = messageText.replace(phoneNumPattern, "<a target='blank' rel='noopener noreferrer' href='tel:$&'>$&</a>");
		outputStr = outputStr.replace(emailPattern, "<a target='blank' rel='noopener noreferrer' href='mailto:$&'>$&</a>");

		const results = outputStr.match(urlPattern);

		results &&
			results.forEach(url => {
				url = url.trim();
				let normalizedURL = url;
				if (!url.startsWith("http")) {
					normalizedURL = `//${url}`;
				}
				outputStr = outputStr.replace(url, `<a target='blank' rel='noopener noreferrer' href="${normalizedURL}">${url}</a>`);
			});

		return outputStr;
	}

	const getLinkPreview = () => {

	}

	const countEmojiOccurences = (string, word) => {

		if (string.split(word).length - 1 >= 3) {
			return 3;
		} else {
			let content = string;
			content = string.replace(/<img[^>"']*((("[^"]*")|('[^']*'))[^"'>]*)*>/g, "");

			if (content.length > 0) {
				return 3;
			} else {
				return string.split(word).length - 1;
			}
		}
	};

	const getMessageText = () => {

		let messageText;
		if(props.text && props.text.length) {
			messageText = props.text;
		} else {

			if (!props.messageObject) {
				messageText = null;
			}

			if (!props.messageObject.text) {
				messageText = null;
			}

			messageText = props.messageObject.text;

			//xss extensions data
			const xssData = getExtensionsData(props.messageObject, "xss-filter");
			if (xssData && xssData.hasOwnProperty("sanitized_text") && xssData.hasOwnProperty("hasXSS") && xssData.hasXSS === "yes") {
				messageText = xssData.sanitized_text;
			}

			//datamasking extensions data
			const maskedData = getExtensionsData(props.messageObject, "data-masking");
			if (maskedData && maskedData.hasOwnProperty("data") && maskedData.data.hasOwnProperty("sensitive_data") && maskedData.data.hasOwnProperty("message_masked") && maskedData.data.sensitive_data === "yes") {
				messageText = maskedData.data.message_masked;
			}

			//profanity extensions data
			const profaneData = getExtensionsData(props.messageObject, "profanity-filter");
			if (profaneData && profaneData.hasOwnProperty("profanity") && profaneData.hasOwnProperty("message_clean") && profaneData.profanity === "yes") {
				messageText = profaneData.message_clean;
			}
		}

		const formattedText = linkify(messageText);
		const emojiParsedMessage = twemoji.parse(formattedText, { folder: "svg", ext: ".svg" });

		let count = countEmojiOccurences(emojiParsedMessage, 'class="emoji"');
		const parsedMessage = parse(emojiParsedMessage);

		//const parsedMessage = ReactHtmlParser(emojiParsedMessage, { decodeEntities: false });

		return (
			<p className="message__message-blocks" style={messageBlockStyle(props, true, count)}>
				{parsedMessage}
			</p>
		);
	}
    
    senderAvatar = getAvatar();
    senderName = getSenderName();
	messageText = getMessageText();
	messageTime = props.messageObject._composedAt || props.messageObject.sentAt;

	let leftView, rightView = null;
	let usernameStyle, receiptStyle = null;
	
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
				<div style={messageKitBlockStyle(props)} className="message_kit__blocks">
					{messageText}
				</div>
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
					<div style={messageKitBlockStyle(props)} className="message_kit__blocks">
						{messageText}
					</div>
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
					<div style={messageKitBlockStyle(props)} className="message_kit__blocks">
						{messageText}
					</div>
					{messageReactions}
					{messageReplies}
					{receiptStyle}
				</div>
			);

			rightView = null;
		}
	}

	Hooks(props, setName, setAvatar);

	const messageOptions = isHovering ? <CometChatMessageHover options={props.messageOptions} style={messageHoverStyling(props)} /> : null;

    return (
		<div style={messageHoverStyle(props)} className="message_kit__hover" onMouseEnter={showMessageOptions} onMouseLeave={hideMessageOptions}>
			<div style={messageActionsStyle()} className="message_kit__actions">
				{messageOptions}
				<div style={messageGutterStyle()} className="c-message_kit__gutter">
					{leftView}
					{rightView}
				</div>
			</div>
		</div>
	);
};

CometChatTextBubble.defaultProps = {
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
	messageTimeAlignment: "top",
	text: "",
	textFont: "400 15px Inter,sans-serif",
	textColor: "#fff",
	messageObject: null,
	messageOptions: []
};

CometChatTextBubble.propTypes = {
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
	text: PropTypes.string,
	textFont: PropTypes.string,
	textColor: PropTypes.string,
	messageObject: PropTypes.object,
	messageOptions: PropTypes.array,
};

export { CometChatTextBubble };