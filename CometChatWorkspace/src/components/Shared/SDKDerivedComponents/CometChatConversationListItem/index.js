import React from "react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { Hooks } from "./hooks";
import { receiptTypes } from "./receiptTypes";

import { CometChatAvatar, CometChatBadgeCount, CometChatStatusIndicator, CometChatDate } from "../../";

import { CometChatMessageReceipt, CometChatLocalize, localize } from "../../";
import { CometChatConversationListItemActions, CometChatConversationEvents } from "../../../";

import blueDoubleTick from "./resources/last-message-read.svg";
import greyDoubleTick from "./resources/last-message-delivered.svg";
import greyTick from "./resources/last-message-sent.svg";
import sendingTick from "./resources/last-message-wait.svg";
import errorTick from "./resources/last-message-error.svg";

import {
	listItemStyle,
	itemThumbnailStyle,
	itemDetailStyle,
	itemTitleStyle,
	itemSubTitleStyle,
	titleStyle,
	subTitleStyle,
	typingTextStyle,
	itemThreadIndicatorStyle,
	itemTimeStyle,
} from "./style";

/**
 * 
 * CometChatConversationsListItem is comprised of title, subtitle, avatar, badgecount and more.
 * with additonal CometChat SDK conversation object
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
const CometChatConversationListItem = props => {
	
	const [avatar, setAvatar] = React.useState(null);
	const [presence, setPresence] = React.useState(null);
	const [isHovering, setIsHovering] = React.useState(false);
	const [title, setTitle] = React.useState("");
	const [subTitle, setSubTitle] = React.useState("");
	const [time, setTime] = React.useState("");
	const [unreadCount, setUnreadCount] = React.useState(0);
	const [receiptType, setReceiptType] = React.useState("");
	const [threadIndicator, setThreadIndicator] = React.useState(null);

	Hooks(
		props, 
		setAvatar, 
		setPresence, 
		setTitle, 
		setSubTitle, 
		setTime, 
		setUnreadCount, 
		setReceiptType, 
		setThreadIndicator
	);

	const showConversationItemActions = () => {
		if (isHovering === false) {
			setIsHovering(true);
		}
	};

	const hideConversationItemActions = () => {
		if (isHovering === true) {
			setIsHovering(false);
		}
	};

	const showToolTip = event => {

		const elem = event.target;

		const scrollWidth = elem.scrollWidth;
		const clientWidth = elem.clientWidth;

		if (scrollWidth <= clientWidth) {
			return false;
		}
		
		elem.setAttribute("title", elem.textContent);
	}

	const hideToolTip = event => {

		const elem = event.target;

		const scrollWidth = elem.scrollWidth;
		const clientWidth = elem.clientWidth;

		if (scrollWidth <= clientWidth) {
			return false;
		}

		elem.removeAttribute("title");
	}

	const clickHandler = () => {

		CometChatConversationEvents.emit(CometChatConversationEvents.onItemClick, props.conversation);
	};

	const getAvatar = () => {

		if (!avatar) {
			return null;
		}

		const width = (props.configurations?.avatarConfiguration?.width) || "36px";
		const height = (props.configurations?.avatarConfiguration?.height) || "36px";
		const cornerRadius = (props.configurations?.avatarConfiguration?.cornerRadius) || "50%";
		const borderWidth = props.configurations?.avatarConfiguration?.borderWidth || "1px";
		const borderStyle = props.configurations?.avatarConfiguration?.borderStyle || "solid";
		const outerViewWidth = (props.configurations?.avatarConfiguration?.outerViewWidth) || "2px";
		const outerViewStyle = (props.configurations?.avatarConfiguration?.outerViewStyle) || "2px";
		const outerViewSpacing = (props.configurations?.avatarConfiguration?.outerViewSpacing) || "4px";

		const border = `${borderWidth} ${borderStyle} rgba(20, 20, 20, 8%)`;
		const outerView = `${outerViewWidth} ${outerViewStyle} #39f`;

		if (props.hideAvatar === false && props.avatar && props.avatar.length) {
			return <CometChatAvatar 
			image={avatar} 
			width={width}
			height={height}
			cornerRadius={cornerRadius}
			border={border}
			outerView={outerView}
			outerViewSpacing={outerViewSpacing} />;
		} else if (props.hideAvatar === false && props.conversation 
			&& props.conversation.conversationType && props.conversation.conversationType === CometChat.RECEIVER_TYPE.USER) {
			return <CometChatAvatar 
			user={avatar} 
			width={width}
			height={height}
			cornerRadius={cornerRadius}
			border={border}
			outerView={outerView}
			outerViewSpacing={outerViewSpacing} />;
		} else if (props.hideAvatar === false && props.conversation 
			&& props.conversation.conversationType && props.conversation.conversationType === CometChat.RECEIVER_TYPE.GROUP) {
			return <CometChatAvatar 
			group={avatar} 
			width={width}
			height={height}
			cornerRadius={cornerRadius}
			border={border}
			outerView={outerView}
			outerViewSpacing={outerViewSpacing} />;
		}

		return null;
	}

	const getPresence = () => {

		if (!presence) {
			return null;
		}

		if (props.hideStatusIndicator === false && (props.statusIndicator
		|| (props.conversation 
		&& props.conversation.conversationType
		&& props.conversation.conversationWith
		&& props.conversation.conversationWith.status 
		&& props.conversation.conversationType === CometChat.RECEIVER_TYPE.USER))) {

			const width = props.configurations?.statusIndicatorConfiguration?.width || "14px";
			const height = props.configurations?.statusIndicatorConfiguration?.height || "14px";
			const cornerRadius = props.configurations?.statusIndicatorConfiguration?.cornerRadius || "50%";
			const border = props.configurations?.statusIndicatorConfiguration?.border || "2px solid #fff";
			const onlineBackgroundColor = props.configurations?.statusIndicatorConfiguration?.onlineBackgroundColor || "#3BDF2F";
			const offlineBackgroundColor = props.configurations?.statusIndicatorConfiguration?.offlineBackgroundColor || "#C4C4C4";
			const style = props.configurations?.statusIndicatorConfiguration?.style || { position: "absolute", bottom: "1px", right: "0px" };

			return (
				<CometChatStatusIndicator
					status={presence}
					width={width}
					height={height}
					cornerRadius={cornerRadius}
					border={border}
					onlineBackgroundColor={onlineBackgroundColor}
					offlineBackgroundColor={offlineBackgroundColor}
					style={style}
				/>
			);
		}  

		return null;
	}

	const getTime = () => {

		if (!time) {
			return null;
		}

		if(props.time
			|| (props.conversation 
			&&  (props.conversation.lastMessage._composedAt 
			|| props.conversation.lastMessage.sentAt))) {

			return <CometChatDate timeStamp={time} timeFormat="days" />;
			// return (
			// 	<span style={itemTimeStyle(props)} className="list__item__timestamp">
			// 		{time}
			// 	</span>
			// );
		}

		return null;
	}

	const getTypingIndicator = () => {

		if (props.showTypingIndicator && props.typingIndicatorText.trim().length) {

			return (
				<div style={typingTextStyle(props)} className="item__typingtext">
					{props.typingIndicatorText.trim()}
				</div>
			);
		}
	};

	const  getSubTitle = () => {

		if (!props.showTypingIndicator && subTitle) {
			return (
				<div style={subTitleStyle(props)} className="item__subtitle" onMouseEnter={showToolTip} onMouseLeave={hideToolTip}>
					{subTitle}
				</div>
			);
		}

		return null;
	};

	const getUnreadCount = () => {

		if (props.hideUnreadCount === false && (props.unreadCount || (props.conversation && props.conversation.unreadMessageCount))) {

			const width = props.configurations?.badgeCountConfiguration?.width || "24px";
			const height = props.configurations?.badgeCountConfiguration?.height || "20px";
			const cornerRadius = props.configurations?.badgeCountConfiguration?.cornerRadius || "11px";
			const borderWidth = props.configurations?.badgeCountConfiguration?.borderWidth || "1px";
			const borderStyle = props.configurations?.badgeCountConfiguration?.borderStyle || "solid";
			const border = `${borderWidth} ${borderStyle} transparent`;

			return <CometChatBadgeCount 
			count={unreadCount}
			width={width}
			height={height}
			cornerRadius={cornerRadius}
			border={border} />;
		}

		return null;
	}

	const getReceiptType = () => {

		if (props.hideReceipt) {
			return null;
		}

		if (props.receipt && receiptTypes.hasOwnProperty(props.receipt)) {

			if (props.receipt === receiptTypes["sending"]) {
				return <CometChatMessageReceipt messageWaitIcon={receiptType} />;
			} else if (props.receipt === receiptTypes["sent"]) {
				return <CometChatMessageReceipt messageSentIcon={receiptType} />;
			} else if (props.receipt === receiptTypes["delivered"]) {
				return <CometChatMessageReceipt messageDeliveredIcon={receiptType} />;
			} else if (props.receipt === receiptTypes["read"]) {
				return <CometChatMessageReceipt messageReadIcon={receiptType} />;
			} else if (props.receipt === receiptTypes["error"]) {
				return <CometChatMessageReceipt messageErrorIcon={receiptType} />;
			}
			
		}  else if (props.conversation && props.conversation.lastMessage) {

			const messageWaitIcon = props.configurations?.messageReceiptConfiguration?.messageWaitIcon || sendingTick;
			const messageSentIcon = props.configurations?.messageReceiptConfiguration?.messageSentIcon || greyTick;
			const messageDeliveredIcon = props.configurations?.messageReceiptConfiguration?.messageDeliveredIcon || greyDoubleTick;
			const messageReadIcon = props.configurations?.messageReceiptConfiguration?.messageReadIcon || blueDoubleTick;
			const messageErrorIcon = props.configurations?.messageReceiptConfiguration?.messageErrorIcon || errorTick;

			return (
				<CometChatMessageReceipt
					messageObject={props.conversation.lastMessage}
					messageWaitIcon={messageWaitIcon}
					messageSentIcon={messageSentIcon}
					messageDeliveredIcon={messageDeliveredIcon}
					messageReadIcon={messageReadIcon}
					messageErrorIcon={messageErrorIcon}
				/>
			);
		}

		return null;
	}

	const getThreadIndicator = () => {

		if (props.hideThreadIndicator === false && props.conversation && props.conversation.lastMessage && props.conversation.lastMessage.parentMessageId) {
			return (
				<div style={itemThreadIndicatorStyle(props)} className="item__thread">
					{threadIndicator}
				</div>
			);
		}

		return null;
	}

	let showDeleteConversation = false;
	if (props.showDeleteConversation) {
		showDeleteConversation = isHovering ? true : false;
	}

	const leftRightPosition = CometChatLocalize.isRTL() ? { left: "16px" } : { right: "16px" };

	const style = {
		position: "absolute",
		top: "0",
		minWidth: "70px",
		width: "auto",
		height: "100%",
		...leftRightPosition,
	};
	
	return (
		<div style={listItemStyle(props)} 
		dir={CometChatLocalize.getDir()}
		className="list__item" 
		onMouseEnter={showConversationItemActions} 
		onMouseLeave={hideConversationItemActions} 
		onClick={clickHandler}>
			<div style={itemThumbnailStyle()} className="item__thumbnail">
				{getAvatar()}
				{getPresence()}
			</div>
			<div style={itemDetailStyle(props)} className="item__details">
				<div style={itemTitleStyle()} className="item__title">
					<div style={titleStyle(props)} className="item__title" onMouseEnter={showToolTip} onMouseLeave={hideToolTip}>
						{title}
					</div>
					{getTime()}
				</div>
				{getThreadIndicator()}
				<div style={itemSubTitleStyle()} className="item__subtitle">
					{getReceiptType()}
					{getSubTitle()}
					{getTypingIndicator()}
					{getUnreadCount()}
				</div>
			</div>
			<CometChatConversationListItemActions conversation={props.conversation} isOpen={showDeleteConversation} style={style} />
		</div>
	);
};

CometChatConversationListItem.propTypes = {
	/**  Width of the component  */
	width: PropTypes.string,
	/**  Height of the component  */
	height: PropTypes.string,
	/** This property sets the component's border. It sets the values of border-width, border-style, and border-color. */
	border: PropTypes.string,
	/** Background of the component, sets all background style properties at once, such as color, image, origin and size, or repeat method  */
	background: PropTypes.string,
	/** Conversation object of CometChat SDK */
	conversation: PropTypes.object,
	/** Title for each conversation */
	title: PropTypes.string,
	/** This property sets the foreground color value for the title text  */
	titleColor: PropTypes.string,
	/** This property sets all the different properties of font for the title text */
	titleFont: PropTypes.string,
	/** Subtitle for each conversation */
	subTitle: PropTypes.string,
	/** This property sets the foreground color value for the subtitle text  */
	subTitleColor: PropTypes.string,
	/** This property sets all the different properties of font for the subtitle text */
	subTitleFont: PropTypes.string,
	/** timestamp of each conversation */
	time: PropTypes.string,
	/** This property sets the foreground color value of the timestamp */
	timeColor: PropTypes.string,
	/** This property sets all the different properties of font of the timestamp */
	timeFont: PropTypes.string,
	/** Disable user presence of the user in the conversation */
	hideStatusIndicator: PropTypes.bool,
	/** User presence of the user in the conversation */
	statusIndicator: PropTypes.oneOf(["online", "offline"]),
	/** Disable avatar for a conversation */
	hideAvatar: PropTypes.bool,
	/** Thumbnail URL for the avatar */
	avatar: PropTypes.string,
	/** Disable badge count of a conversation */
	hideUnreadCount: PropTypes.bool,
	/** Count of unread messages */
	unreadCount: PropTypes.number,
	/** Enable read receipt for a conversation */
	hideReceipt: PropTypes.bool,
	/** Read receipt for the last message */
	receipt: PropTypes.oneOf(["", "error", "sending", "sent", "delivered", "read"]),
	/** Enable typing text */
	showTypingIndicator: PropTypes.bool,
	/** Typing text to be shown */
	typingIndicatorText: PropTypes.string,
	/** This property sets the foreground color value of the typing text */
	typingIndicatorTextColor: PropTypes.string,
	/** This property sets all the different properties of font of the typing text */
	typingIndicatorTextFont: PropTypes.string,
	/** Disable indicator if the last message is part of a threaded conversation */
	hideThreadIndicator: PropTypes.bool,
	/** Text to be shown if the last message is part of a threaded conversation */
	threadIndicatorText: PropTypes.string,
	/** This property sets the foreground color value for the thread indicator */
	threadIndicatorTextColor: PropTypes.string,
	/** This property sets all the different properties of font of the thread indicator */
	threadIndicatorTextFont: PropTypes.string,
	/** Hide last message when the message is of category action and type groupMember */
	hideGroupActionMessages: PropTypes.bool,
	/** Hide last message when the last message was deleted */
	hideDeletedMessages: PropTypes.bool,
	/** Hide delete conversation button */
	showDeleteConversation: PropTypes.bool,
	/** Used to apply selected styling */
	isActive: PropTypes.bool,
	/** Configurable options of child component */
	configurations: PropTypes.object,
};

// Specifies the default values for props:
CometChatConversationListItem.defaultProps = {
	conversation: null,
	width: "100%",
	height: "auto",
	border: "1px solid rgba(20, 20, 20, 10%)",
	background: "transparent",
	title: "",
	titleColor: "rgba(20,20,20)",
	titleFont: "600 15px Inter, sans-serif",
	subTitle: "",
	subTitleColor: "rgba(20, 20, 20, 60%)",
	subTitleFont: "400 13px Inter, sans-serif",
	time: "",
	timeColor: "#141414",
	timeFont: "400 12px Inter",
	statusIndicator: null,
	hideStatusIndicator: false,
	avatar: null,
	hideAvatar: false,
	unreadCount: 0,
	hideUnreadCount: false,
	receipt: "",
	hideReceipt: true,
	showTypingIndicator: false,
	typingIndicatorText: "",
	typingIndicatorTextColor: "rgba(20, 20, 20, 60%)",
	typingIndicatorTextFont: "400 13px Inter, sans-serif",
	hideThreadIndicator: false,
	threadIndicatorText: localize("IN_A_THREAD"),
	threadIndicatorTextColor: "rgba(20, 20, 20, 60%)",
	threadIndicatorTextFont: "400 13px Inter, sans-serif",
	hideGroupActionMessages: false,
	hideDeletedMessages: false,
	showDeleteConversation: true,
	isActive: false,
	configurations: null,
};

export { CometChatConversationListItem };