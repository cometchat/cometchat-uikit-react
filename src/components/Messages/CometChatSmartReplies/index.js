import React from "react";
import PropTypes from "prop-types";
import { getExtensionsData } from "..";
import { CometChat } from "@cometchat-pro/chat";
import {
	CometChatSoundManager,
	CometChatTheme,
	MessageStatusConstants,
} from "../../Shared";
import { CometChatMessageEvents } from "..";
import { getUnixTimestamp } from "../CometChatMessageHelper";

import { CometChatListItem } from "../../Shared";
import {
	previewWrapperStyle,
	previewCloseStyle,
	previewOptionsWrapperStyle,
	previewOptionStyle,
} from "./style";
import closeIcon from "./resources/close.svg";
import { Hooks } from "./hooks";

const CometChatSmartReplies = (props) => {
	const {
		messageObject,
		customOutgoingMessageSound,
		enableSoundForMessages,
		loggedInUser,
		onClick,
		onClose,
		style,
		theme,
	} = props;

	const _theme = theme || new CometChatTheme({});

	const [chatWith, setChatWith] = React.useState(null);
	const [chatWithId, setChatWithId] = React.useState(null);

	let options = [];

	/**
	 * Function to get Smart reply data from extensions
	 */
	const smartReplyData = getExtensionsData(messageObject, "smart-reply");
	if (
		smartReplyData &&
		Object.keys(smartReplyData).length &&
		!smartReplyData.hasOwnProperty("error")
	) {
		options.push(smartReplyData["reply_positive"]);
		options.push(smartReplyData["reply_neutral"]);
		options.push(smartReplyData["reply_negative"]);
	}

	/**
	 * Play Outgoing Audio sound on send
	 */
	const playOutgoingAudio = () => {
		if (enableSoundForMessages) {
			if (customOutgoingMessageSound) {
				CometChatSoundManager.play(
					CometChatSoundManager.Sound.outgoingMessage,
					customOutgoingMessageSound
				);
			} else {
				CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage);
			}
		}
	};

	Hooks(messageObject, setChatWith, setChatWithId);

	/**
	 *
	 * @param {*} smartReply
	 * performs send Message Function
	 */
	const sendMessage = (smartReply) => {
		if (onClick) {
			return onClick(smartReply);
		}

		if (!smartReply.trim().length) {
			return false;
		}

		let textMessage = new CometChat.TextMessage(
			chatWithId,
			smartReply,
			chatWith
		);

		textMessage.setSender(loggedInUser);
		textMessage.setReceiver(chatWith);
		textMessage.setText(smartReply);
		textMessage.setSentAt(getUnixTimestamp());
		textMessage.setMuid(String(getUnixTimestamp()));
		CometChatMessageEvents.emit(CometChatMessageEvents.onMessageSent, {
			message: textMessage,
			status: MessageStatusConstants.inprogress,
		});

		playOutgoingAudio();

		CometChat.sendMessage(textMessage)
			.then((message) => {
				const messageObject = { ...message };
				CometChatMessageEvents.emit(CometChatMessageEvents.onMessageSent, {
					message: messageObject,
					status: MessageStatusConstants.success,
				});
			})
			.catch((error) => {
				CometChatMessageEvents.emit(CometChatMessageEvents.onMessageError, {
					message: textMessage,
					error: error,
				});
			});

		if (onClose) {
			return onClose();
		}
	};

	/**
	 *
	 * @returns Single smart reply option
	 */
	const CometChatSmartReplyOptions = () => {
		if (options && options.length) {
			return options.map((option) => {
				return (
					<CometChatListItem
						key={option.id}
						style={previewOptionStyle(style, _theme)}
						text={option}
						className='smartreplies__option'
						onItemClick={sendMessage.bind(this, option)}
					/>
				);
			});
		}
	};

	/**
	 *
	 * @returns items to be rendered
	 */
	const renderItems = () => {
		if (options?.length && messageObject !== null) {
			return (
				<div
					style={previewWrapperStyle(style, _theme)}
					className='smartreplies__wrapper'
				>
					<div
						style={previewCloseStyle(style, closeIcon)}
						onClick={onClose.bind(this)}
						className='smartreplies__close'
					></div>

					<div
						style={previewOptionsWrapperStyle()}
						className='smartreplies__options'
					>
						{CometChatSmartReplyOptions()}
					</div>
				</div>
			);
		} else {
			return null;
		}
	};

	return renderItems();
};

CometChatSmartReplies.defaultProps = {
	messageObject: null,
	customOutgoingMessageSound: null,
	enableSoundForMessages: false,
	loggedInUser: null,
	onClick: () => {},
	onClose: () => {},
	style: null,
};
CometChatSmartReplies.propTypes = {
	messageObject: PropTypes.object,
	customOutgoingMessageSound: PropTypes.string,
	enableSoundForMessages: PropTypes.bool,
	loggedInUser: PropTypes.object,
	onClick: PropTypes.func,
	onClose: PropTypes.func,
	style: PropTypes.object,
};
export { CometChatSmartReplies };
