import React from "react";
import { CometChat } from "@cometchat-pro/chat";

import { receiptTypes } from "./receiptTypes";

import { getExtensionsData, metadataKey, CometChatCustomMessageTypes } from "../../../";
import { localize } from "../../";

export const Hooks = (
	props, 
	setAvatar, 
	setPresence, 
	setTitle, 
	setSubTitle, 
	setTime, 
	setUnreadCount, 
	setReceiptType, 
	setThreadIndicator) => {
	
	const getTextMessage = React.useCallback(lastMessage => {

		//xss extensions data
		const xssData = getExtensionsData(lastMessage, metadataKey.extensions.xssfilter);
		if (xssData && xssData.hasOwnProperty("sanitized_text")) {
			return xssData.sanitized_text;
		}

		//datamasking extensions data
		const maskedData = getExtensionsData(lastMessage, metadataKey.extensions.datamasking);
		if (maskedData 
			&& maskedData.data 
			&& maskedData.data.sensitive_data 
			&& maskedData.data.message_masked 
			&& maskedData.data.sensitive_data === "yes") {
			return maskedData.data.message_masked;
		}

		//profanity extensions data
		const profaneData = getExtensionsData(lastMessage, metadataKey.extensions.profanityfilter);
		if (profaneData 
			&& profaneData.profanity 
			&& profaneData.message_clean 
			&& profaneData.profanity === "yes") {
			return profaneData.message_clean;
		}
		
		return lastMessage.text;
	}, []);

    const getMessage = React.useCallback(lastMessage => {

		switch (lastMessage.type) {
			case CometChat.MESSAGE_TYPE.TEXT:
				return getTextMessage(lastMessage);
			case CometChat.MESSAGE_TYPE.MEDIA:
				return localize("MEDIA_MESSAGE");
			case CometChat.MESSAGE_TYPE.IMAGE:
				return localize("MESSAGE_IMAGE");
			case CometChat.MESSAGE_TYPE.FILE:
				return localize("MESSAGE_FILE");
			case CometChat.MESSAGE_TYPE.VIDEO:
				return localize("MESSAGE_VIDEO");
			case CometChat.MESSAGE_TYPE.AUDIO:
				return localize("MESSAGE_AUDIO");
			case CometChat.MESSAGE_TYPE.CUSTOM:
				return localize("CUSTOM_MESSAGE");
			default:
				return;
		}

	}, [getTextMessage]);

    const getCallActionMessage = React.useCallback(lastMessage => {

		switch (lastMessage.type) {
			case CometChat.MESSAGE_TYPE.VIDEO:
				return localize("VIDEO_CALL");
			case CometChat.MESSAGE_TYPE.AUDIO:
				return localize("AUDIO_CALL");
			default:
				return;
		}
	}, []);

    const getGroupActionMessage = React.useCallback(lastMessage => {

		/** return null when the message is of category action and type groupMember */
		if(props.hideGroupActionMessages) {
			return;
		}

		const byUser = lastMessage?.actionBy?.name;
		const onUser = lastMessage?.actionOn?.name;

		switch (lastMessage.action) {
			case CometChat.ACTION_TYPE.MEMBER_JOINED:
				return `${byUser} ${localize("JOINED")}`;
			case CometChat.ACTION_TYPE.MEMBER_LEFT:
				return `${byUser} ${localize("LEFT")}`;
			case CometChat.ACTION_TYPE.MEMBER_ADDED:
				return `${byUser} ${localize("ADDED")} ${onUser}`;
			case CometChat.ACTION_TYPE.MEMBER_KICKED:
				return `${byUser} ${localize("KICKED")} ${onUser}`;
			case CometChat.ACTION_TYPE.MEMBER_BANNED:
				return `${byUser} ${localize("BANNED")} ${onUser}`;
			case CometChat.ACTION_TYPE.MEMBER_UNBANNED:
				return `${byUser} ${localize("UNBANNED")} ${onUser}`;
			case CometChat.ACTION_TYPE.MEMBER_SCOPE_CHANGED: {
				const newScope = lastMessage?.newScope;
				return `${byUser} ${localize("MADE")} ${onUser} ${localize(newScope)}`;
			}
			default:
				return;
		}

	}, []);

	const getCustomMessage = React.useCallback(lastMessage => {

		switch (lastMessage.type) {
			case CometChatCustomMessageTypes.poll:
				return localize("CUSTOM_MESSAGE_POLL");
			case CometChatCustomMessageTypes.sticker:
				return localize("CUSTOM_MESSAGE_STICKER");
			case CometChatCustomMessageTypes.document:
				return localize("CUSTOM_MESSAGE_DOCUMENT");
			case CometChatCustomMessageTypes.whiteboard:
				return localize("CUSTOM_MESSAGE_WHITEBOARD");
			case CometChatCustomMessageTypes.meeting:
				return localize("VIDEO_CALL");
			default:
				return;
		}
	}, []);

    const getLastMessage = React.useCallback(() => {

        const lastMessage = props.conversation.lastMessage;
        if(lastMessage.deletedAt) {

			/** return null when the message is deleted */
			if(props.hideDeletedMessages) {
				return ;
			}

            return "This message is deleted";

        } else {

            switch (lastMessage.category) {
				case CometChat.CATEGORY_MESSAGE:
					return getMessage(lastMessage);
				case CometChat.CATEGORY_CALL:
					return getCallActionMessage(lastMessage);
				case CometChat.CATEGORY_ACTION:
					return getGroupActionMessage(lastMessage);
				case CometChat.CATEGORY_CUSTOM:
					return getCustomMessage(lastMessage);
				default:
					return;
			}
        }
    }, [props, getMessage, getCallActionMessage, getGroupActionMessage, getCustomMessage])

	React.useEffect(() => {
		if (props.hideAvatar === false && props.avatar && props.avatar.length) {
			setAvatar(props.avatar);
		} else if (props.hideAvatar === false && props.conversation 
            && props.conversation.conversationType 
            && (props.conversation.conversationType === CometChat.RECEIVER_TYPE.USER 
                || props.conversation.conversationType === CometChat.RECEIVER_TYPE.GROUP)) {
            setAvatar(props.conversation.conversationWith);
		}
	}, [props, setAvatar]);

    React.useEffect(() => {
		if (props.hideStatusIndicator === false && props.statusIndicator && props.statusIndicator.length) {
			setPresence(props.statusIndicator);
		} else if (props.hideStatusIndicator === false && props.conversation 
            && props.conversation.conversationType
            && props.conversation.conversationWith
            && props.conversation.conversationWith.status 
            && props.conversation.conversationType === CometChat.RECEIVER_TYPE.USER) {
            setPresence(props.conversation.conversationWith.status);
		}
	}, [props, setPresence]);

    React.useEffect(() => {
		if (props.title && props.title.trim().length) {
			setTitle(props.title);
		} else if (props.conversation 
            && props.conversation.conversationWith
            && props.conversation.conversationWith.name) {
            setTitle(props.conversation.conversationWith.name);
		}
	}, [props, setTitle]);

    React.useEffect(() => {
		if (props.subTitle && props.subTitle.trim().length) {
			setSubTitle(props.subTitle);
		} else if (props.conversation && props.conversation.lastMessage) {

			const lastMessage = getLastMessage();
			setSubTitle(lastMessage);
		}
	}, [props, setSubTitle, getLastMessage]);

	React.useEffect(() => {
		if (props.hideReceipt === false && props.receipt && receiptTypes.hasOwnProperty(props.receipt)) {
			setReceiptType(receiptTypes[props.receipt]);
		} else if (props.hideReceipt === false && props.conversation && props.conversation.lastMessage) {
			if (props.conversation.lastMessage.readAt) {
				setReceiptType(receiptTypes["read"]);
			} else if (props.conversation.lastMessage.deliveredAt) {
				setReceiptType(receiptTypes["delivered"]);
			} else if (props.conversation.lastMessage.sentAt) {
				setReceiptType(receiptTypes["sent"]);
			} else if (props.conversation.lastMessage._composedAt) {
				setReceiptType(receiptTypes["sending"]);
			} else {
				setReceiptType(receiptTypes["received"]);
			}
		}
	}, [props, setReceiptType]);

    React.useEffect(() => {
		if (props.time && props.time.trim().length) {
			setTime(props.time);
		} else if (props.conversation 
			&& props.conversation.lastMessage
			&& (props.conversation.lastMessage._composedAt || props.conversation.lastMessage.sentAt)) {

				let timestamp = props.conversation.lastMessage._composedAt || props.conversation.lastMessage.sentAt;
				setTime(timestamp);
		}
	}, [props, setTime]);

	React.useEffect(() => {
		if (props.hideUnreadCount === false && props.unreadCount) {
			setUnreadCount(props.unreadCount);
		} else if (props.hideUnreadCount === false && props.conversation && props.conversation.unreadMessageCount) {
			setUnreadCount(props.conversation.unreadMessageCount);
		}
	}, [props, setUnreadCount]);

	React.useEffect(() => {
		if (props.hideThreadIndicator === false && props.conversation && props.conversation.lastMessage && props.conversation.lastMessage.parentMessageId) {
			setThreadIndicator(props.threadIndicatorText);
		}
	}, [props, setThreadIndicator]);
};