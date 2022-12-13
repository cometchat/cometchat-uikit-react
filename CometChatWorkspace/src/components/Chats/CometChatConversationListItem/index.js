import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import {
	CometChatAvatar,
	CometChatBadgeCount,
	CometChatUserPresence,
} from "../../Shared";
import { CometChatConversationListActions } from "../CometChatConversationListActions";

import * as enums from "../../../util/enums.js";
import {
	checkMessageForExtensionsData,
	getTimeStampForLastMessage,
} from "../../../util/common";
import { CometChatContext } from "../../../util/CometChatContext";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
	listItem,
	itemThumbnailStyle,
	itemDetailStyle,
	itemRowStyle,
	itemNameStyle,
	itemLastMsgStyle,
	itemLastMsgTimeStyle,
} from "./style";

class CometChatConversationListItem extends React.PureComponent {
	static contextType = CometChatContext;

	constructor(props) {
		super(props);

		this.state = {
			lastMessage: "",
			lastMessageTimestamp: "",
			enableUnreadCount: false,
			isHovering: false,
			enableHideDeletedMessages: false,
		};
	}

	componentDidMount() {
		const message = this.getLastMessage();
		const timestamp = this.getLastMessageTimestamp();
		this.enableUnreadCount();
		this.enableHideDeletedMessages();

		this.setState({ lastMessage: message, lastMessageTimestamp: timestamp });
	}

	componentDidUpdate(prevProps) {
		const previousItem = JSON.stringify(prevProps.conversation);
		const currentItem = JSON.stringify(this.props.conversation);

		if (previousItem !== currentItem) {
			const message = this.getLastMessage();
			const timestamp = this.getLastMessageTimestamp();

			this.setState({ lastMessage: message, lastMessageTimestamp: timestamp });
		}

		this.enableUnreadCount();
		this.enableHideDeletedMessages();
	}

	getLastMessage = () => {
		if (this.props.hasOwnProperty("conversation") === false) {
			return false;
		}

		if (this.props.conversation.hasOwnProperty("lastMessage") === false) {
			return false;
		}

		let message = null;
		const lastMessage = this.props.conversation.lastMessage;

		if (lastMessage.hasOwnProperty("deletedAt")) {
			if (this.state.enableHideDeletedMessages) {
				message = "";
			} else {
				message =
					this.props.loggedInUser.uid === lastMessage.sender.uid
						? `${Translator.translate(
								"YOU_DELETED_THIS_MESSAGE",
								this.context.language
						  )}`
						: `${Translator.translate(
								"THIS_MESSAGE_DELETED",
								this.context.language
						  )}`;
			}
		} else {
			switch (lastMessage.category) {
				case CometChat.CATEGORY_MESSAGE:
					message = this.getMessage(lastMessage);
					break;
				case CometChat.CATEGORY_CALL:
					message = this.getCallMessage(lastMessage);
					break;
				case CometChat.CATEGORY_ACTION:
					message = this.getActionMessage(lastMessage);
					break;
				case CometChat.CATEGORY_CUSTOM:
					message = this.getCustomMessage(lastMessage);
					break;
				default:
					break;
			}
		}
		return message;
	};

	getLastMessageTimestamp = () => {
		if (this.props.hasOwnProperty("conversation") === false) {
			return false;
		}

		if (this.props.conversation.hasOwnProperty("lastMessage") === false) {
			return false;
		}

		if (
			this.props.conversation.lastMessage.hasOwnProperty("sentAt") === false &&
			this.props.conversation.lastMessage.hasOwnProperty("_composedAt") ===
				false
		) {
			return false;
		}

		let timestamp =
			this.props.conversation.lastMessage._composedAt ||
			this.props.conversation.lastMessage.sentAt;
		timestamp = getTimeStampForLastMessage(timestamp, this.context.language);

		return timestamp;
	};

	getCustomMessage = (lastMessage) => {
		let message = null;
		const sender =
			this.props.loggedInUser.uid !== lastMessage.sender.uid
				? `${lastMessage.sender.name}: `
				: ``;

		switch (lastMessage.type) {
			case enums.CUSTOM_TYPE_POLL:
				{
					const pollMessage = Translator.translate(
						"CUSTOM_MESSAGE_POLL",
						this.context.language
					);
					message =
						lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP
							? `${sender} ${pollMessage}`
							: `${pollMessage}`;
				}
				break;
			case enums.CUSTOM_TYPE_STICKER:
				{
					const stickerMessage = Translator.translate(
						"CUSTOM_MESSAGE_STICKER",
						this.context.language
					);
					message =
						lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP
							? `${sender} ${stickerMessage}`
							: `${stickerMessage}`;
				}
				break;
			case enums.CUSTOM_TYPE_DOCUMENT:
				{
					const docMessage = Translator.translate(
						"CUSTOM_MESSAGE_DOCUMENT",
						this.context.language
					);
					message =
						lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP
							? `${sender} ${docMessage}`
							: `${docMessage}`;
				}
				break;
			case enums.CUSTOM_TYPE_WHITEBOARD:
				{
					const whiteboardMessage = Translator.translate(
						"CUSTOM_MESSAGE_WHITEBOARD",
						this.context.language
					);
					message =
						lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP
							? `${sender} ${whiteboardMessage}`
							: `${whiteboardMessage}`;
				}
				break;
			case enums.CUSTOM_TYPE_MEETING:
				{
					const meetingMessage = Translator.translate(
						"VIDEO_CALL",
						this.context.language
					);
					message = `${sender} ${meetingMessage}`;
				}
				break;
			default:
				break;
		}
		return message;
	};

	getTextMessage = (message) => {
		let messageText = message.text;

		//xss extensions data
		const xssData = checkMessageForExtensionsData(message, "xss-filter");
		if (xssData && xssData.hasOwnProperty("sanitized_text")) {
			messageText = xssData.sanitized_text;
		}

		//datamasking extensions data
		const maskedData = checkMessageForExtensionsData(message, "data-masking");
		if (
			maskedData &&
			maskedData.hasOwnProperty("data") &&
			maskedData.data.hasOwnProperty("sensitive_data") &&
			maskedData.data.hasOwnProperty("message_masked") &&
			maskedData.data.sensitive_data === "yes"
		) {
			messageText = maskedData.data.message_masked;
		}

		//profanity extensions data
		const profaneData = checkMessageForExtensionsData(
			message,
			"profanity-filter"
		);
		if (
			profaneData &&
			profaneData.hasOwnProperty("profanity") &&
			profaneData.hasOwnProperty("message_clean") &&
			profaneData.profanity === "yes"
		) {
			messageText = profaneData.message_clean;
		}

		return messageText;
	};

	getMessage = (lastMessage) => {
		let message = null;
		const sender =
			this.props?.loggedInUser?.uid !== lastMessage?.sender?.uid
				? `${lastMessage?.sender?.name}: `
				: ``;

		switch (lastMessage.type) {
			case CometChat.MESSAGE_TYPE.TEXT:
				{
					const textMessage = this.getTextMessage(lastMessage);
					message =
						lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP
							? `${sender} ${textMessage}`
							: `${textMessage}`;
				}
				break;
			case CometChat.MESSAGE_TYPE.MEDIA:
				{
					const mediaMessage = Translator.translate(
						"MEDIA_MESSAGE",
						this.context.language
					);
					message =
						lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP
							? `${sender} ${mediaMessage}`
							: `${mediaMessage}`;
				}
				break;
			case CometChat.MESSAGE_TYPE.IMAGE:
				{
					const imageMessage = Translator.translate(
						"MESSAGE_IMAGE",
						this.context.language
					);
					message =
						lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP
							? `${sender} ${imageMessage}`
							: `${imageMessage}`;
				}
				break;
			case CometChat.MESSAGE_TYPE.FILE:
				{
					const fileMessage = Translator.translate(
						"MESSAGE_FILE",
						this.context.language
					);
					message =
						lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP
							? `${sender} ${fileMessage}`
							: `${fileMessage}`;
				}
				break;
			case CometChat.MESSAGE_TYPE.VIDEO:
				{
					const videoMessage = Translator.translate(
						"MESSAGE_VIDEO",
						this.context.language
					);
					message =
						lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP
							? `${sender} ${videoMessage}`
							: `${videoMessage}`;
				}
				break;
			case CometChat.MESSAGE_TYPE.AUDIO:
				{
					const audioMessage = Translator.translate(
						"MESSAGE_AUDIO",
						this.context.language
					);
					message =
						lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP
							? `${sender} ${audioMessage}`
							: `${audioMessage}`;
				}
				break;
			case CometChat.MESSAGE_TYPE.CUSTOM:
				{
					const customMessage = Translator.translate(
						"CUSTOM_MESSAGE",
						this.context.language
					);
					message =
						lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP
							? `${sender} ${customMessage}`
							: `${customMessage}`;
				}
				break;
			default:
				break;
		}

		return message;
	};

	getCallMessage = (lastMessage) => {
		let message = null;
		const sender =
			this.props.loggedInUser.uid !== lastMessage.sender.uid
				? `${lastMessage.sender.name}: `
				: ``;

		switch (lastMessage.type) {
			case CometChat.MESSAGE_TYPE.VIDEO:
				{
					const videoMessage = Translator.translate(
						"VIDEO_CALL",
						this.context.language
					);
					message =
						lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP
							? `${sender} ${videoMessage}`
							: `${videoMessage}`;
				}
				break;
			case CometChat.MESSAGE_TYPE.AUDIO:
				{
					const audioMessage = Translator.translate(
						"AUDIO_CALL",
						this.context.language
					);
					message =
						lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP
							? `${sender} ${audioMessage}`
							: `${audioMessage}`;
				}
				break;
			default:
				break;
		}

		return message;
	};

	getActionMessage = (message) => {
		let actionMessage = null;

		if (
			message.hasOwnProperty("actionBy") === false ||
			message.hasOwnProperty("actionOn") === false
		) {
			return actionMessage;
		}

		if (
			message.action !== CometChat.ACTION_TYPE.MEMBER_JOINED &&
			message.action !== CometChat.ACTION_TYPE.MEMBER_LEFT &&
			(message.actionBy.hasOwnProperty("name") === false ||
				message.actionOn.hasOwnProperty("name") === false)
		) {
			return actionMessage;
		}

		if (message.action === CometChat.ACTION_TYPE.MEMBER_SCOPE_CHANGED) {
			if (
				message.hasOwnProperty("data") &&
				message.data.hasOwnProperty("extras")
			) {
				if (message.data.extras.hasOwnProperty("scope")) {
					if (message.data.extras.scope.hasOwnProperty("new") === false) {
						return actionMessage;
					}
				} else {
					return actionMessage;
				}
			} else {
				return actionMessage;
			}
		}

		if (
			message.action === CometChat.ACTION_TYPE.MEMBER_SCOPE_CHANGED &&
			message.data.extras.hasOwnProperty("scope") === false
		) {
			return actionMessage;
		}

		if (
			message.action === CometChat.ACTION_TYPE.MEMBER_SCOPE_CHANGED &&
			message.data.extras.scope.hasOwnProperty("new") === false
		) {
			return actionMessage;
		}

		const byEntity = message.actionBy;
		const onEntity = message.actionOn;

		const byString = byEntity.name;
		const forString =
			message.action !== CometChat.ACTION_TYPE.MEMBER_JOINED &&
			message.action !== CometChat.ACTION_TYPE.MEMBER_LEFT
				? onEntity.name
				: "";

		switch (message.action) {
			case CometChat.ACTION_TYPE.MEMBER_ADDED:
				actionMessage = `${byString} ${Translator.translate(
					"ADDED",
					this.context.language
				)} ${forString}`;
				break;
			case CometChat.ACTION_TYPE.MEMBER_JOINED:
				actionMessage = `${byString} ${Translator.translate(
					"JOINED",
					this.context.language
				)}`;
				break;
			case CometChat.ACTION_TYPE.MEMBER_LEFT:
				actionMessage = `${byString} ${Translator.translate(
					"LEFT",
					this.context.language
				)}`;
				break;
			case CometChat.ACTION_TYPE.MEMBER_KICKED:
				actionMessage = `${byString} ${Translator.translate(
					"KICKED",
					this.context.language
				)} ${forString}`;
				break;
			case CometChat.ACTION_TYPE.MEMBER_BANNED:
				actionMessage = `${byString} ${Translator.translate(
					"BANNED",
					this.context.language
				)} ${forString}`;
				break;
			case CometChat.ACTION_TYPE.MEMBER_UNBANNED:
				actionMessage = `${byString} ${Translator.translate(
					"UNBANNED",
					this.context.language
				)} ${forString}`;
				break;
			case CometChat.ACTION_TYPE.MEMBER_SCOPE_CHANGED: {
				const newScope = message["data"]["extras"]["scope"]["new"];
				actionMessage = `${byString} ${Translator.translate(
					"MADE",
					this.context.language
				)} ${forString} ${Translator.translate(
					newScope,
					this.context.language
				)}`;
				break;
			}
			default:
				break;
		}

		return actionMessage;
	};

	toggleTooltip = (event, flag) => {
		const elem = event.target;

		const scrollWidth = elem.scrollWidth;
		const clientWidth = elem.clientWidth;

		if (scrollWidth <= clientWidth) {
			return false;
		}

		if (flag) {
			elem.setAttribute("title", elem.textContent);
		} else {
			elem.removeAttribute("title");
		}
	};

	enableUnreadCount = () => {
		this.context.FeatureRestriction.isUnreadCountEnabled()
			.then((response) => {
				/**
				 * Don't update state if the response has the same value
				 */
				if (response !== this.state.enableUnreadCount) {
					this.setState({ enableUnreadCount: response });
				}
			})
			.catch((error) => {
				if (this.state.enableUnreadCount !== false) {
					this.setState({ enableUnreadCount: false });
				}
			});
	};

	enableHideDeletedMessages = () => {
		this.context.FeatureRestriction.isHideDeletedMessagesEnabled()
			.then((response) => {
				if (response !== this.state.enableHideDeletedMessages) {
					this.setState({ enableHideDeletedMessages: response });
				}
			})
			.catch((error) => {
				if (this.state.enableHideDeletedMessages !== false) {
					this.setState({ enableHideDeletedMessages: false });
				}
			});
	};

	handleMouseHover = (toggleFlag) => {
		if (toggleFlag && !this.state.isHovering) {
			this.setState({ isHovering: true });
		} else if (!toggleFlag && this.state.isHovering) {
			this.setState({ isHovering: false });
		}
	};

	render() {
		let lastMessageTimeStamp = null;
		if (this.state.lastMessage) {
			lastMessageTimeStamp = (
				<span
					css={itemLastMsgTimeStyle(this.props)}
					className='item__details__timestamp'
				>
					{this.state.lastMessageTimestamp}
				</span>
			);
		}

		let presence;
		if (
			this.props.conversation.conversationType === CometChat.RECEIVER_TYPE.USER
		) {
			const status = this.props.conversation.conversationWith.status;
			presence = (
				<CometChatUserPresence
					status={status}
					borderColor={this.props.theme.borderColor.primary}
				/>
			);
		}

		let avatar = null;
		if (
			this.props.conversation.conversationType === CometChat.RECEIVER_TYPE.USER
		) {
			avatar = (
				<CometChatAvatar user={this.props.conversation.conversationWith} />
			);
		} else if (
			this.props.conversation.conversationType === CometChat.RECEIVER_TYPE.GROUP
		) {
			avatar = (
				<CometChatAvatar group={this.props.conversation.conversationWith} />
			);
		}

		let unreadCount = null;
		if (this.state.enableUnreadCount) {
			unreadCount = (
				<CometChatBadgeCount
					count={this.props.conversation.unreadMessageCount}
				/>
			);
		}

		let toolTipView = null;
		if (this.state.isHovering) {
			toolTipView = (
				<CometChatConversationListActions
					{...this.props}
					conversation={this.props.conversation}
				/>
			);
		}

		return (
			<div
				css={listItem(this.props)}
				className='list__item'
				onMouseEnter={() => this.handleMouseHover(true)}
				onMouseLeave={() => this.handleMouseHover(false)}
				onClick={() => this.props.handleClick(this.props.conversation)}
			>
				<div css={itemThumbnailStyle()} className='list__item__thumbnail'>
					{avatar}
					{presence}
				</div>
				<div
					css={itemDetailStyle()}
					className='list__item__details'
					dir={Translator.getDirection(this.context.language)}
				>
					<div css={itemRowStyle()} className='item__details_block_one'>
						<div
							css={itemNameStyle(this.props)}
							className='item__details__name'
							onMouseEnter={(event) => this.toggleTooltip(event, true)}
							onMouseLeave={(event) => this.toggleTooltip(event, false)}
						>
							{this.props.conversation.conversationWith.name}
						</div>
						{lastMessageTimeStamp}
					</div>
					<div css={itemRowStyle()} className='item__details_block_two'>
						<div
							css={itemLastMsgStyle(this.props)}
							className='item__details__last-message'
							onMouseEnter={(event) => this.toggleTooltip(event, true)}
							onMouseLeave={(event) => this.toggleTooltip(event, false)}
						>
							{this.state.lastMessage}
						</div>
						{unreadCount}
					</div>
				</div>
				{toolTipView}
			</div>
		);
	}
}

// Specifies the default values for props:
CometChatConversationListItem.defaultProps = {
	theme: theme,
	loggedInUser: null,
	conversation: {
		conversationWith: {},
	},
};

CometChatConversationListItem.propTypes = {
	theme: PropTypes.object,
	loggedInUser: PropTypes.shape(CometChat.User),
	conversation: PropTypes.shape(CometChat.Conversation),
};

export { CometChatConversationListItem };
