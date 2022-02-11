import React from "react";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatMessageTypes, CometChatCustomMessageTypes, CometChatMessageReceiverType } from "../";

import fileUploadIcon from "./resources/file-upload.svg";
import imageUploadIcon from "./resources/image.svg";
import audioUploadIcon from "./resources/audio-file.svg";
import videoUploadIcon from "./resources/video.svg";
import sharePollIcon from "./resources/polls.svg";
import shareCDocumentIcon from "./resources/collaborative-document.svg";
import shareCWhiteboardIcon from "./resources/collaborative-whiteboard.svg";
import shareLocationIcon from "./resources/location.svg";

export const Hooks = (
	props,
	setLoggedInUser,
	setChatWith,
	setChatWithId,
	chatRef,
	setViewAttachButton,
	setViewComposer,
	setViewSticker,
	setStickerTemplate,
	setActionSheetItems,
	actionSheetClickHandler,
) => {

	//fetch logged in user
	React.useEffect(() => {
		
		CometChat.getLoggedinUser().then(user => setLoggedInUser(user));
	}, []);

	React.useEffect(() => {
		//update receiver user
		if (props.user && props.user.uid) {

			chatRef.current = { chatWith: CometChatMessageReceiverType.user, chatWithId: props.user.uid };
			
			setChatWith(CometChatMessageReceiverType.user);
			setChatWithId(props.user.uid);

		} else if (props.group && props.group.guid) {

			chatRef.current = { chatWith: CometChatMessageReceiverType.group, chatWithId: props.group.guid };

			setChatWith(CometChatMessageReceiverType.group);
			setChatWithId(props.group.guid);
		}
	}, [props.user, props.group, setChatWith, setChatWithId, chatRef]);

	React.useEffect(() => {

		//if message filter list is empty, hide attachment icon and show message input box
		if (props.messageFilterList.length === 0) {
			setViewComposer(true);
			if (!props.hideAttachment) {
				setViewAttachButton(false);
			}
		}

		//if stickers is part of message filter list
		const stickerMessageTemplate = props.messageFilterList.find(messageTemplate => messageTemplate.type === CometChatCustomMessageTypes.sticker);
		if (stickerMessageTemplate) {
			setViewSticker(true);
			setStickerTemplate(stickerMessageTemplate);
		}

		const actionItemFont = "400 13px Inter, sans-serif";
		const actionItemColor = "#141414";
		const actionItemIconTint = "#fff";

		const actionItems = [];
		props.messageFilterList.forEach(eachMessageTemplate => {
			const actionItemCallback = eachMessageTemplate.actionCallback ? eachMessageTemplate.actionCallback : actionSheetClickHandler;

			switch (eachMessageTemplate.type) {
				case CometChatMessageTypes.file: {
					actionItems.push({
						id: CometChatMessageTypes.file,
						iconURL: eachMessageTemplate.icon || fileUploadIcon,
						iconTint: actionItemIconTint,
						title: eachMessageTemplate.name,
						titleFont: actionItemFont,
						titleColor: actionItemColor,
						onActionItemClick: actionItemCallback,
					});
					break;
				}
				case CometChatMessageTypes.image: {
					actionItems.push({
						id: CometChatMessageTypes.image,
						iconURL: eachMessageTemplate.icon || imageUploadIcon,
						iconTint: actionItemIconTint,
						title: eachMessageTemplate.name,
						titleFont: actionItemFont,
						titleColor: actionItemColor,
						onActionItemClick: actionItemCallback,
					});
					break;
				}
				case CometChatMessageTypes.audio: {
					actionItems.push({
						id: CometChatMessageTypes.audio,
						iconURL: eachMessageTemplate.icon || audioUploadIcon,
						iconTint: actionItemIconTint,
						title: eachMessageTemplate.name,
						titleFont: actionItemFont,
						titleColor: actionItemColor,
						onActionItemClick: actionItemCallback,
					});
					break;
				}
				case CometChatMessageTypes.video: {
					actionItems.push({
						id: CometChatMessageTypes.video,
						iconURL: eachMessageTemplate.icon || videoUploadIcon,
						iconTint: actionItemIconTint,
						title: eachMessageTemplate.name,
						titleFont: actionItemFont,
						titleColor: actionItemColor,
						onActionItemClick: actionItemCallback,
					});
					break;
				}
				case CometChatCustomMessageTypes.poll: {
					actionItems.push({
						id: CometChatCustomMessageTypes.poll,
						iconURL: eachMessageTemplate.icon || sharePollIcon,
						iconTint: actionItemIconTint,
						title: eachMessageTemplate.name,
						titleFont: actionItemFont,
						titleColor: actionItemColor,
						onActionItemClick: actionItemCallback,
					});
					break;
				}
				case CometChatCustomMessageTypes.document: {
					actionItems.push({
						id: CometChatCustomMessageTypes.document,
						iconURL: eachMessageTemplate.icon || shareCDocumentIcon,
						iconTint: actionItemIconTint,
						title: eachMessageTemplate.name,
						titleFont: actionItemFont,
						titleColor: actionItemColor,
						onActionItemClick: actionItemCallback,
					});
					break;
				}
				case CometChatCustomMessageTypes.whiteboard: {
					actionItems.push({
						id: CometChatCustomMessageTypes.whiteboard,
						iconURL: eachMessageTemplate.icon || shareCWhiteboardIcon,
						iconTint: actionItemIconTint,
						title: eachMessageTemplate.name,
						titleFont: actionItemFont,
						titleColor: actionItemColor,
						onActionItemClick: actionItemCallback,
					});
					break;
				}
				case CometChatCustomMessageTypes.location: {
					actionItems.push({
						id: CometChatCustomMessageTypes.location,
						iconURL: eachMessageTemplate.icon || shareLocationIcon,
						iconTint: actionItemIconTint,
						title: eachMessageTemplate.name,
						titleFont: actionItemFont,
						titleColor: actionItemColor,
						onActionItemClick: actionItemCallback,
					});
					break;
				}
				case CometChatMessageTypes.text:
				case CometChatCustomMessageTypes.sticker:
					break;
				default:
					actionItems.push({
						id: eachMessageTemplate.type,
						iconURL: eachMessageTemplate?.icon,
						iconTint: actionItemIconTint,
						title: eachMessageTemplate.name,
						titleFont: actionItemFont,
						titleColor: actionItemColor,
						onActionItemClick: eachMessageTemplate?.actionCallback,
					});
					break;
			}
		});

		//if message filters are set, show attachment button
		if (actionItems.length && !props.hideAttachment) {
			setViewAttachButton(true);
			setActionSheetItems(actionItems);
		}
	}, []);
};