import React, { useState } from "react";
import PropTypes from "prop-types";
import {
	CometChatAvatar,
	CometChatBadgeCount,
	CometChatStatusIndicator,
	CometChatDate,
	CometChatMessageReceipt,
	CometChatLocalize,
	localize,
	CometChatTheme,
	CometChatConversationEvents,
	MessageCategoryConstants,
	MessageTypeConstants,
	AvatarConfiguration,
	StatusIndicatorConfiguration,
	BadgeCountConfiguration,
	MessageReceiptConfiguration,
	DateConfiguration,
	fontHelper,
	ReceiverTypeConstants,
	GroupTypeConstants,
	UserStatusConstants,
	CometChatMenuList,
} from "../../../";
import {
	ConversationInputData,
} from "../../../Chats";
import { groupTypeColorCode } from "../../../Groups/CometChatGroupConstants";
import {
	ConversationListItemStyles,
	BadgeCountStyles,
	AvatarStyles,
	StatusIndicatorStyles,
	DateStyles,
	MessageReceiptStyles,
} from "../../../Shared/";
import passwordIcon from "./resources/passwordIcon.svg";
import privateIcon from "./resources/privateIcon.svg";
import * as styles from "./style";

/**
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @description CometChatConversationsListItem is comprised of title, subtitle, avatar, badgecount and more.
 * with additonal CometChat SDK conversation object.
 *
 */
const ConversationListItem = (props) => {
	/**
	 * Props destructuring
	 */
	const {
		isActive,
		conversationObject,

		conversationInputData,
		style,
		showTypingIndicator,
		typingIndicatorText,
		hideThreadIndicator,
		threadIndicatorText,
		hideGroupActions,
		hideDeletedMessages,
		conversationOptions,
		avatarConfiguration,
		statusIndicatorConfiguration,
		badgeCountConfiguration,
		messageReceiptConfiguration,
		dateConfiguration,
		theme,
	} = props;

	/**
	 * Component internal state
	 */
	const [isHovering, setIsHovering] = useState(false);

	/**
	 * Component private scoping
	 */
	const _avatarConfiguration = new AvatarConfiguration(avatarConfiguration ?? {});
	const _statusIndicatorConfiguration = new StatusIndicatorConfiguration(statusIndicatorConfiguration ?? {});
	const _badgeCountConfiguration = new BadgeCountConfiguration(badgeCountConfiguration ?? {});
	const _messageReceiptConfiguration = new MessageReceiptConfiguration(messageReceiptConfiguration ?? {});
	const _dateConfiguration = new DateConfiguration(dateConfiguration ?? {});
	const _theme = new CometChatTheme(theme ?? {});

	let _isActive = isHovering || isActive;
	
	/**
	 * Component internal handlers/methods
	 */
	const toggleConversationOptions = () => {
		setIsHovering(!isHovering);
	};

	const showToolTip = (event) => {
		const elem = event.target;

		const scrollWidth = elem.scrollWidth;
		const clientWidth = elem.clientWidth;

		if (scrollWidth <= clientWidth) {
			return false;
		}

		elem.setAttribute("title", elem.textContent);
	};

	const hideToolTip = (event) => {
		const elem = event.target;

		const scrollWidth = elem.scrollWidth;
		const clientWidth = elem.clientWidth;

		if (scrollWidth <= clientWidth) {
			return false;
		}

		elem.removeAttribute("title");
	};

	const clickHandler = () => {
		CometChatConversationEvents.emit(
			CometChatConversationEvents.onItemClick,
			conversationObject
		);
	};

	const getId = () => {
		return conversationInputData.id && conversationObject.conversationId
			? conversationObject.conversationId
			: "";
	};

	/**
	 * Calculate input data for child component
	 */
	if (conversationInputData && !conversationInputData.subtitle()) {
		conversationInputData.subtitle = (conversation) => {
			if (
				conversation?.lastMessage?.receiverType === ReceiverTypeConstants.user ||
				conversation?.lastMessage?.receiverType === ReceiverTypeConstants.group
			) {
				if (conversation?.lastMessage?.type === MessageTypeConstants.text) {
					return conversation?.lastMessage?.text;
				} else if (
					conversation?.lastMessage?.type === MessageTypeConstants.image
				) {
					return localize("MESSAGE_IMAGE");
				} else if (
					conversation?.lastMessage?.type === MessageTypeConstants.poll
				) {
					return localize("CUSTOM_MESSAGE_POLL");
				} else if (
					conversation?.lastMessage?.type === MessageTypeConstants.file
				) {
					return localize("MESSAGE_FILE");
				} else if (
					conversation?.lastMessage?.type === MessageTypeConstants.video
				) {
					return localize("MESSAGE_VIDEO");
				} else if (
					conversation?.lastMessage?.type === MessageTypeConstants.audio
				) {
					return localize("MESSAGE_AUDIO");
				} else if (
					conversation?.lastMessage?.type === MessageTypeConstants.whiteboard
				) {
					return localize("CUSTOM_MESSAGE_WHITEBOARD");
				} else if (
					conversation?.lastMessage?.type === MessageTypeConstants.sticker
				) {
					return localize("CUSTOM_MESSAGE_STICKER");
				} else if (
					conversation?.lastMessage?.type === MessageTypeConstants.document
				) {
					return localize("CUSTOM_MESSAGE_DOCUMENT");
				} else if (
					conversation?.lastMessage?.category === MessageCategoryConstants.action &&
					hideGroupActions === false
				) {
					//TODO: what if actionMessages are set to true
					return "";
				}
			} else if (!conversation?.lastMessage) {
				return localize("NO_MESSAGES_FOUND");
			}
		};
	}

	/**
	 * Component template scoping
	 */
	const getAvatar = () => {
		const outerViewWidth = _avatarConfiguration?.style?.outerViewWidth;
		const outerView = `${outerViewWidth} solid ${_theme?.palette?.getPrimary()}`;
		const borderWidth = _avatarConfiguration?.style?.borderWidth;
		let avatarStyle = new AvatarStyles({
			width: _avatarConfiguration?.style?.width,
			height: _avatarConfiguration?.style?.height,
			outerViewSpacing: _avatarConfiguration?.style?.outerViewSpacing,
			outerView: _avatarConfiguration?.style?.outerView || outerView,
			textColor:
				_avatarConfiguration?.style?.textColor ||
				_theme?.palette?.getAccent900(),
			textFont:
				_avatarConfiguration?.style?.textFont ||
				fontHelper(_theme?.typography?.name),
			border: `${borderWidth} solid ${_theme?.palette?.getAccent600()}`,
			borderRadius: _avatarConfiguration?.style?.borderRadius,
			backgroundSize: _avatarConfiguration?.style?.backgroundSize,
			backgroundColor:
				_avatarConfiguration?.style?.backgroundColor ||
				_theme?.palette?.getAccent600(),
		});

		if (conversationInputData?.thumbnail) {
			if (
				conversationObject?.conversationType &&
				conversationObject?.conversationType === ReceiverTypeConstants?.user
			) {
				if (conversationObject?.conversationWith?.avatar) {
					return (
						<CometChatAvatar
							image={conversationObject?.conversationWith?.avatar}
							style={avatarStyle}
						/>
					);
				} else if (conversationObject?.conversationWith?.name) {
					return (
						<CometChatAvatar
							name={conversationObject?.conversationWith?.name}
							style={avatarStyle}
						/>
					);
				}
			} else if (
				conversationObject?.conversationType &&
				conversationObject?.conversationType === ReceiverTypeConstants?.group
			) {
				if (conversationObject?.conversationWith.icon) {
					return (
						<CometChatAvatar
							image={conversationObject?.conversationWith?.icon}
							style={avatarStyle}
						/>
					);
				} else if (conversationObject?.conversationWith?.name) {
					return (
						<CometChatAvatar
							name={conversationObject?.conversationWith?.name}
							style={avatarStyle}
						/>
					);
				}
			}
		}
	};

	const getPresence = () => {
		let presence;

		const statusIndicatorStyles = new StatusIndicatorStyles({
			width: _statusIndicatorConfiguration?.style?.width,
			height: _statusIndicatorConfiguration?.style?.height,
			border:
				_statusIndicatorConfiguration?.style?.border ||
				`2px solid ${_theme?.palette?.getBackground()}`,
			borderRadius: _statusIndicatorConfiguration?.style?.borderRadius,
		});

		if (
			conversationObject?.conversationType &&
			conversationObject?.conversationType === ReceiverTypeConstants?.group
		) {
			if (
				conversationObject?.conversationWith?.type ===
				GroupTypeConstants?.private
			) {
				presence = (
					<CometChatStatusIndicator
						backgroundImage={privateIcon}
						style={{
							...statusIndicatorStyles,
							backgroundColor: groupTypeColorCode?.private,
						}}
					/>
				);
			} else if (
				conversationObject?.conversationWith &&
				conversationObject?.conversationWith?.type === GroupTypeConstants?.password
			) {
				presence = (
					<CometChatStatusIndicator
						backgroundImage={passwordIcon}
						style={{
							...statusIndicatorStyles,
							backgroundColor: groupTypeColorCode?.password,
						}}
					/>
				);
			}
		} else if (
			conversationObject?.conversationType && conversationObject?.conversationType === ReceiverTypeConstants?.user &&
			conversationObject?.conversationWith?.status === UserStatusConstants.online
		) {
			presence = (
				<CometChatStatusIndicator
					style={{
						...statusIndicatorStyles,
						backgroundColor: _theme?.palette?.getSuccess(),
					}}
				/>
			);
		}
		return presence;
	};

	const getTime = () => {
		const pattern = _dateConfiguration?.pattern || "dayDateTimeFormat";
		const customPattern = _dateConfiguration?.customPattern;
		const dateStyle = new DateStyles({
			..._dateConfiguration?.style,
			textColor:
				_dateConfiguration?.style?.textColor ||
				_theme?.palette?.accent500[_theme?.palette?.mode],
			textFont:
				_dateConfiguration?.style?.textFont ||
				fontHelper(_theme?.typography?.caption2),
		});

		if (
			conversationInputData?.timestamp &&
			conversationObject?.lastMessage?.updatedAt
		) {
			return (
				<CometChatDate
					timestamp={conversationObject?.lastMessage?.updatedAt}
					pattern={pattern}
					customPattern={customPattern}
					style={dateStyle}
				/>
			);
		}

		return null;
	};

	const getTypingIndicator = () => {
		if (showTypingIndicator && typingIndicatorText?.trim().length) {
			return (
				<div
					style={styles.typingTextStyle(style)}
					className='item__typingtext'
				>
					{typingIndicatorText.trim()}
				</div>
			);
		} else return null;
	};

	const getTitle = () => {
		if (
			conversationInputData?.title &&
			conversationObject?.conversationWith?.name
		) {
			return (
				<div
					style={styles.titleStyle(style)}
					className='item__innerTitle'
					onMouseEnter={showToolTip}
					onMouseLeave={hideToolTip}
				>
					{conversationObject?.conversationWith?.name}
				</div>
			);
		} else return null;
	};

	const getSubtitle = () => {
		if (conversationInputData?.subtitle) {
			//TODO: This condition is not required, what if they start a conversation and leave without sending a message
			// if (
			// 	conversationObject &&
			// 	conversationObject?.lastMessage &&
			// 	(
			// 		conversationObject?.lastMessage?.receiverType === ReceiverTypeConstants?.user ||
			// 		conversationObject?.lastMessage?.receiverType === ReceiverTypeConstants?.group
			// 	)
			// ) {

			return <div
				style={styles.subTitleStyle(style)}
				className="subtitle__text"
				onMouseEnter={showToolTip}
				onMouseLeave={hideToolTip}
			>
				{conversationInputData?.subtitle(conversationObject, props) ?? localize('EMPTY_CHAT')}
			</div>

			// }
		}
	};

	const getUnreadCount = () => {
		if (
			conversationInputData?.unreadCount &&
			conversationObject &&
			conversationObject?.unreadMessageCount
		) {
			const badgecountStyles = new BadgeCountStyles({
				textFont:
					_badgeCountConfiguration?.style?.textFont ||
					fontHelper(_theme?.typography?.caption1),
				textColor:
					_badgeCountConfiguration?.style?.textColor ||
					_theme?.palette?.getBackground(),
				background:
					_badgeCountConfiguration?.style?.background ||
					_theme?.palette?.getPrimary(),
				width: _badgeCountConfiguration?.style?.width,
				height: _badgeCountConfiguration?.style?.height,
				border: _badgeCountConfiguration?.style?.border,
				borderRadius: _badgeCountConfiguration?.style?.borderRadius,
			});

			return (
				<CometChatBadgeCount
					count={conversationObject?.unreadMessageCount}
					style={badgecountStyles}
				/>
			);
		}
		return null;
	};

	const getReceiptType = () => {
		const messageWaitIcon = _messageReceiptConfiguration?.messageWaitIcon;
		const messageSentIcon = _messageReceiptConfiguration?.messageSentIcon;
		const messageDeliveredIcon =
			_messageReceiptConfiguration?.messageDeliveredIcon;
		const messageReadIcon = _messageReceiptConfiguration?.messageReadIcon;
		const messageErrorIcon = _messageReceiptConfiguration?.messageErrorIcon;
		if (
			// conversationInputData?.readreceipt &&
			// conversationObject?.lastMessage?.receiverType === ReceiverTypeConstants?.user &&
			// conversationObject?.lastMessage?.sender?.uid === loggedInUser?.uid

			// &&

			conversationInputData?.readReceipt &&
			conversationObject?.lastMessage?.sender?.uid != conversationObject?.conversationWith.uid && !conversationObject?.conversationWith?.guid &&
			!conversationObject?.lastMessage?.deletedAt &&
			// !isTyping &&
			conversationObject?.lastMessage?.category != "call" &&
			conversationObject?.lastMessage?.type != "DIRECT_CALL"
		) {
			let receiptKey = conversationObject?.lastMessage;
			if (receiptKey?.error) {
				return (
					<CometChatMessageReceipt
						messageErrorIcon={messageErrorIcon}
						messageObject={receiptKey}
						style={
							new MessageReceiptStyles(
								_messageReceiptConfiguration?.style ?? {}
							)
						}
					/>
				);
			} else if (receiptKey?.readAt) {
				return (
					<CometChatMessageReceipt
						messageReadIcon={messageReadIcon}
						messageObject={receiptKey}
						style={
							new MessageReceiptStyles(
								_messageReceiptConfiguration?.style ?? {}
							)
						}
					/>
				);
			} else if (receiptKey?.deliveredAt) {
				return (
					<CometChatMessageReceipt
						messageDeliveredIcon={messageDeliveredIcon}
						messageObject={receiptKey}
						style={
							new MessageReceiptStyles(
								_messageReceiptConfiguration?.style ?? {}
							)
						}
					/>
				);
			} else if (receiptKey?.sentAt) {
				return (
					<CometChatMessageReceipt
						messageSentIcon={messageSentIcon}
						messageObject={receiptKey}
						style={
							new MessageReceiptStyles(
								_messageReceiptConfiguration?.style ?? {}
							)
						}
					/>
				);
			} else {
				return (
					<CometChatMessageReceipt
						messageWaitIcon={messageWaitIcon}
						messageObject={receiptKey}
						style={
							new MessageReceiptStyles(
								_messageReceiptConfiguration?.style ?? {}
							)
						}
					/>
				);
			}
		}
		return null;
	};

	const getThreadIndicator = () => {
		if (
			hideThreadIndicator === false &&
			threadIndicatorText &&
			conversationObject?.lastMessage?.parentMessageId
		) {
			return (
				<div
					style={styles.itemThreadIndicatorStyle(style)}
					className='item__thread'
				>
					{threadIndicatorText}
				</div>
			);
		}

		return null;
	};

	const getAvatarWithPresence = () => {
		if (conversationInputData?.thumbnail || conversationInputData?.status) {
			return (
				<div style={styles.itemThumbnailStyle()} className='item__thumbnail'>
					{conversationInputData?.thumbnail ? getAvatar() : null}
					{conversationInputData?.status ? getPresence() : null}
				</div>
			);
		} else return null;
	};

	/**
	 * Component template
	 */
	return (
		<div
			data-id={getId()}
			style={styles.listItemStyle(style, _theme, _isActive)}
			dir={CometChatLocalize.getDir()}
			className='list__item'
			onMouseEnter={toggleConversationOptions}
			onMouseLeave={toggleConversationOptions}
			onClick={clickHandler}
		>
			{getAvatarWithPresence()}

			<div
				style={styles.itemDetailStyle(style, _theme)}
				className='item__details'
			>
				<div style={styles.itemTitleStyle()} className='item__title'>
					{getTitle()}
					{conversationInputData.timestamp && !isHovering ? getTime() : null}
				</div>
				{getThreadIndicator()}
				<div style={styles.itemSubTitleStyle()} className='item__subtitle'>
					{conversationInputData?.readreceipt ? getReceiptType() : null}
					{conversationInputData?.subtitle && !typingIndicatorText?.trim().length ? getSubtitle() : null}
					{showTypingIndicator ? getTypingIndicator() : null}
					{conversationInputData.unreadCount && !isHovering ? getUnreadCount() : null}
				</div>
			</div>

			{isHovering ? (
				<CometChatMenuList
					style={styles.subMenuStyles(style, _theme)}
					isOpen={isHovering}
					list={conversationOptions}
					mainMenuLimit={1}
					data={conversationObject}
				/>
			) : null}
		</div>
	);
};

/**
 * Component default props types
 */
ConversationListItem.defaultProps = {
	style: {
		width: "100%",
		height: "100%",
		background: "transparent",
		activeBackground: "gray",
		border: "1px solid gray",
		borderRadius: "50%",
		titleColor: "rgba(20,20,20)",
		titleFont: "600 15px Inter, sans-serif",
		subtitleColor: "rgba(20, 20, 20, 60%)",
		subtitleFont: "400 13px Inter, sans-serif",
		typingIndicatorTextColor: "rgba(20, 20, 20, 60%)",
		typingIndicatorTextFont: "400 13px Inter, sans-serif",
		threadIndicatorTextColor: "rgba(20, 20, 20, 60%)",
		threadIndicatorTextFont: "400 13px Inter, sans-serif",
	},
};

/**
 * Component default props types
 */
ConversationListItem.propTypes = {
	style: PropTypes.object,
	conversationInputData: PropTypes.object,
	showTypingIndicator: PropTypes.bool,
	typingIndicatorText: PropTypes.string,
	hideThreadIndicator: PropTypes.bool,
	hideGroupActions: PropTypes.bool,
	hideDeletedMessages: PropTypes.bool,
	threadIndicatorText: PropTypes.string,
	isActive: PropTypes.bool,
	conversationOptions: PropTypes.array,
	conversationObject: PropTypes.object,
	avatarConfiguration: PropTypes.object,
	statusIndicatorConfiguration: PropTypes.object,
	badgeCountConfiguration: PropTypes.object,
	messageReceiptConfiguration: PropTypes.object,
	dateConfiguration: PropTypes.object,
	loggedInUser: PropTypes.object,
};

export const CometChatConversationListItem = React.memo(ConversationListItem);
