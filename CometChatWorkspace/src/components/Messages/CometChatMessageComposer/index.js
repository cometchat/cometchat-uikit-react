import React from "react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";
import "emoji-mart/css/emoji-mart.css";

import { 
	CometChatBackdrop,
	CometChatActionSheet, 
	CometChatSoundManager, 
	CometChatLocalize, 
	localize 
} from "../../";

import {
	CometChatMessageEvents,
	metadataKey,
	CometChatMessageTypes,
	CometChatCustomMessageTypes,
	getExtensionsData,
	CometChatEmojiKeyboard,
	CometChatStickerKeyboard,
	CometChatMessagePreview,
	messageConstants,
	CometChatCreatePoll
} from "../";

import { ID, getUnixTimestamp } from "../CometChatMessageHelper";
import { messageStatus } from "../CometChatMessageConstants";

import { Hooks } from "./hooks";

import { 
	chatComposerStyle, 
	composerInputStyle, 
	inputInnerStyle, 
	messageInputStyle, 
	stickyAttachButtonStyle,
	attchButtonIconStyle,
	inputStickyStyle,
	stickerBtnStyle,
	stickerBtnIconStyle,
	emojiButtonStyle,
	emojiBtnIconStyle,
	reactionBtnStyle,
	reactionBtnIconStyle,
	sendButtonStyle,
	sendBtnIconStyle,
	fileInputStyle,
	stickyButtonStyle
} from "./style";

import roundedPlus from "./resources/add-circle-filled.svg";
import insertEmoticon from "./resources/emoji.svg";
import sendBtn from "./resources/send-message.svg";

/**
 * 
 * CometChatMessageComposer is comprised of title, subtitle, avatar, badgecount and more.
 * with additonal CometChat SDK conversation object
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
const CometChatMessageComposer = React.forwardRef((props, ref) => {
	const [loggedInUser, setLoggedInUser] = React.useState(null);
	const [chatWith, setChatWith] = React.useState(null);
	const [chatWithId, setChatWithId] = React.useState(null);

	const [messageInput, setMessageInput] = React.useState("");

	const [viewComposer, setViewComposer] = React.useState(false);
	const [viewAttachButton, setViewAttachButton] = React.useState(false);

	const [viewSticker, setViewSticker] = React.useState(false);
	const [stickerTemplate, setStickerTemplate] = React.useState(null);
	const [viewStickerTray, setViewStickerTray] = React.useState(null);

	const [viewActionSheet, setViewActionSheet] = React.useState(false);
	const [actionSheetItems, setActionSheetItems] = React.useState([]);

	const [viewCreatePoll, setViewCreatePoll] = React.useState(false);
	const [viewEmojiTray, setViewEmojiTray] = React.useState(false);

	const [messagePreview, setMessagePreview] = React.useState(null);

	let isTyping = null;
	let liveReactionTimeout = 0;
	const disabledState = false;

	const messageInputRef = React.useRef(null);
	const fileInputRef = React.useRef(null);
	const chatRef = React.useRef(chatWith);

	/**
	 * Event callbacks
	 */
	React.useImperativeHandle(ref, () => ({
		previewMessageForEdit: previewMessageForEdit,
	}));

	const previewMessageForEdit = message => {
		setMessagePreview({
			message: message,
			mode: "edit",
		});

		setMessageInput(message);

		const element = messageInputRef.current;
		let messageText = message.text;

		//xss extensions data
		const xssData = getExtensionsData(message, metadataKey.extensions.xssfilter);
		if (xssData && xssData.hasOwnProperty("sanitized_text") && xssData.hasOwnProperty("hasXSS") && xssData.hasXSS === "yes") {
			messageText = xssData.sanitized_text;
		}

		element.focus();
		element.textContent = "";
		pasteHtmlAtCaret(messageText, false);
	};

	const closeMessagePreview = () => setMessagePreview(null);

	const draftMessage = message => {
		setMessageInput(message);
	};

	const sendMessageOnEnter = event => {
		if (event.keyCode === 13 && !event.shiftKey) {
			event.preventDefault();
			sendTextMessage();
		}
	};

	const sendTextMessage = message => {
		setViewEmojiTray(false);

		if (!messageInput.trim().length) {
			return false;
		}

		if (messagePreview && messagePreview.mode === "edit") {
			editMessage(messagePreview.message);
			return false;
		}

		let textMessage = new CometChat.TextMessage(chatWithId, messageInput, chatWith);
		// if (this.props.parentMessageId) {
		// 	textMessage.setParentMessageId(this.props.parentMessageId);
		// }
		textMessage.setSender(loggedInUser);
		textMessage.setReceiver(chatWith);
		textMessage.setText(messageInput);
		textMessage._composedAt = getUnixTimestamp();
		textMessage._id = ID();

		CometChatMessageEvents.emit(CometChatMessageEvents.onMessageSent, { message: textMessage, status: messageStatus.inprogress });
		CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage);

		setMessageInput("");
		messageInputRef.current.textContent = "";

		CometChat.sendMessage(textMessage)
			.then(message => {
				const messageObject = { ...message, _id: textMessage._id };
				CometChatMessageEvents.emit(CometChatMessageEvents.onMessageSent, { message: messageObject, status: messageStatus.success });
			})
			.catch(error => {
				CometChatMessageEvents.emit(CometChatMessageEvents.onMessageError, { message: textMessage, error: error });
			});
	};

	const sendMediaMessage = (messageInput, messageType) => {
		setViewActionSheet(false);

		let mediaMessage = new CometChat.MediaMessage(chatWithId, messageInput, messageType, chatWith);
		// if (this.props.parentMessageId) {
		// 	mediaMessage.setParentMessageId(this.props.parentMessageId);
		// }
		mediaMessage.setSender(loggedInUser);
		mediaMessage.setReceiver(chatWith);
		mediaMessage.setType(messageType);
		mediaMessage.setMetadata({
			[metadataKey.file]: messageInput,
		});
		mediaMessage._composedAt = getUnixTimestamp();
		mediaMessage._id = ID();

		CometChatMessageEvents.emit(CometChatMessageEvents.onMessageSent, { message: mediaMessage, status: messageStatus.inprogress });
		CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage);

		CometChat.sendMessage(mediaMessage)
			.then(message => {
				const messageObject = { ...message, _id: mediaMessage._id };
				CometChatMessageEvents.emit(CometChatMessageEvents.onMessageSent, { message: messageObject, status: messageStatus.success });
			})
			.catch(error => {
				CometChatMessageEvents.emit(CometChatMessageEvents.onMessageError, { message: mediaMessage, error: error });
			});
	};

	const sendSticker = stickerMessage => {
		const customData = { sticker_url: stickerMessage.stickerUrl, sticker_name: stickerMessage.stickerName };
		const customMessage = new CometChat.CustomMessage(chatWithId, chatWith, CometChatCustomMessageTypes.sticker, customData);
		// if (props.parentMessage && props.parentMessage.id) {
		// 	customMessage.setParentMessageId(this.props.parentMessageId);
		// }
		customMessage.setSender(loggedInUser);
		customMessage.setReceiver(chatWith);
		customMessage.setMetadata({ incrementUnreadCount: true });
		customMessage._composedAt = getUnixTimestamp();
		customMessage._id = ID();

		CometChatMessageEvents.emit(CometChatMessageEvents.onMessageSent, { message: customMessage, status: messageStatus.inprogress });
		CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage);

		CometChat.sendCustomMessage(customMessage)
			.then(message => {
				const messageObject = { ...message, _id: customMessage._id };
				CometChatMessageEvents.emit(CometChatMessageEvents.onMessageSent, { message: messageObject, status: messageStatus.success });
			})
			.catch(error => {
				CometChatMessageEvents.emit(CometChatMessageEvents.onMessageError, { message: customMessage, error: error });
			});
	};

	const editMessage = message => {
		endTyping(null, null);

		let messageText = messageInput.trim();
		let textMessage = new CometChat.TextMessage(chatWithId, messageText, chatWith);
		textMessage.setId(messagePreview.message.id);

		//const newMessage = { ...textMessage, messageFrom: messagePreview.message.messageFrom };
		//CometChatMessageEvents.emit(CometChatMessageEvents.messageEdited, newMessage);

		setMessageInput("");
		messageInputRef.current.textContent = "";
		CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage);

		setMessagePreview(null);

		CometChat.editMessage(textMessage)
			.then(editedMessage => {
				CometChatMessageEvents.emit(CometChatMessageEvents.messageEdited, { message: editedMessage, status: messageStatus.success });
			})
			.catch(error => {
				CometChatMessageEvents.emit(CometChatMessageEvents.onMessageError, { error: error, message: message });
			});
	};

	const replyToMessage = message => {};

	const startTyping = (endTypingTimeout, typingMetadata) => {
		//if typing is disabled
		if (!props.enableTyping) {
			return false;
		}

		//if typing is in progress
		if (isTyping) {
			return false;
		}

		let typingInterval = endTypingTimeout || 5000;
		let metadata = typingMetadata || undefined;

		let typingNotification = new CometChat.TypingIndicator(chatWithId, chatWith, metadata);
		CometChat.startTyping(typingNotification);

		isTyping = setTimeout(() => {
			endTyping(null, typingMetadata);
		}, typingInterval);
	};

	const endTyping = (event, typingMetadata) => {
		//fixing synthetic issue
		if (event) {
			event.persist();
		}

		//if typing is disabled
		if (!props.enableTyping) {
			return false;
		}

		let metadata = typingMetadata || undefined;

		let typingNotification = new CometChat.TypingIndicator(chatWithId, chatWith, metadata);
		CometChat.endTyping(typingNotification);

		clearTimeout(isTyping);
		isTyping = null;
	};

	const fileInputHandler = id => {
		if (!fileInputRef.current) {
			return false;
		}

		fileInputRef.current.id = id;
		fileInputRef.current.click();
	};

	const fileInputChangeHandler = event => {
		const uploadedFile = event.target.files["0"];
		var reader = new FileReader(); // Creating reader instance from FileReader() API
		reader.addEventListener(
			"load",
			event => {
				const newFile = new File([reader.result], uploadedFile.name, uploadedFile);
				sendMediaMessage(newFile, fileInputRef.current.id);
				fileInputRef.current.value = "";
			},
			false,
		);

		reader.readAsArrayBuffer(uploadedFile);
	};

	const closeCreatePoll = () => {
		setViewCreatePoll(false);
	};

	const onPollSubmit = () => {
		setViewCreatePoll(false);
	};

	const shareCollaborativeDocument = () => {
		CometChat.callExtension("document", "POST", "v1/create", {
			receiver: chatRef.current.chatWithId,
			receiverType: chatRef.current.chatWith,
		}).catch(error => {});
	};

	const shareCollaborativeWhiteboard = () => {
		CometChat.callExtension("whiteboard", "POST", "v1/create", {
			receiver: chatRef.current.chatWithId,
			receiverType: chatRef.current.chatWith,
		}).catch(error => {});
	};

	const inputChangeHandler = event => {
		startTyping();

		const elem = event.currentTarget;
		let messageInput = elem.textContent.trim();

		if (!messageInput.length) {
			event.currentTarget.textContent = messageInput;
		}

		setMessageInput(elem.innerText);
	};

	const toggleStickersTray = () => {
		setViewStickerTray(prevViewStickerOption => !prevViewStickerOption);
	};

	const onEmojiSelect = emoji => {
		const element = messageInputRef.current;
		element.focus();
		pasteHtmlAtCaret(emoji.native, false);

		setMessageInput(element.innerText);
	};

	const pasteHtmlAtCaret = (html, selectPastedContent) => {
		var sel, range;
		const chatWindow = window;
		if (chatWindow.getSelection) {
			// IE9 and non-IE
			sel = chatWindow.getSelection();
			if (sel.getRangeAt && sel.rangeCount) {
				range = sel.getRangeAt(0);
				range.deleteContents();

				// Range.createContextualFragment() would be useful here but is
				// only relatively recently standardized and is not supported in
				// some browsers (IE9, for one)
				var el = document.createElement("div");
				el.innerText = html;
				var frag = document.createDocumentFragment(),
					node,
					lastNode;
				while ((node = el.firstChild)) {
					lastNode = frag.appendChild(node);
				}
				var firstNode = frag.firstChild;
				range.insertNode(frag);

				// Preserve the selection
				if (lastNode) {
					range = range.cloneRange();
					range.setStartAfter(lastNode);
					if (selectPastedContent) {
						range.setStartBefore(firstNode);
					} else {
						range.collapse(true);
					}
					sel.removeAllRanges();
					sel.addRange(range);
				}
			}
		} else if ((sel = document.selection) && sel.type !== "Control") {
			// IE < 9
			var originalRange = sel.createRange();
			originalRange.collapse(true);
			sel.createRange().pasteHTML(html);
			if (selectPastedContent) {
				range = sel.createRange();
				range.setEndPoint("StartToStart", originalRange);
				range.select();
			}
		}
	};

	const attachmentClickHandler = () => {
		setViewActionSheet(prevViewActionSheet => !prevViewActionSheet);
	};

	const actionSheetClickHandler = actionSheetItemProps => {

		switch (actionSheetItemProps.id) {
			case CometChatMessageTypes.file:
			case CometChatMessageTypes.image:
			case CometChatMessageTypes.audio:
			case CometChatMessageTypes.video:
				fileInputHandler(actionSheetItemProps.id);
				setViewActionSheet(false);
				break;
			case CometChatCustomMessageTypes.poll: {
				setViewActionSheet(false);
				setViewCreatePoll(true);
				break;
			}
			case CometChatCustomMessageTypes.document: {
				shareCollaborativeDocument();
				setViewActionSheet(false);
				break;
			}
			case CometChatCustomMessageTypes.whiteboard: {
				shareCollaborativeWhiteboard();
				setViewActionSheet(false);
				break;
			}
			case CometChatCustomMessageTypes.location:
				break;
			default:
				break;
		}
	};

	const emojiClickHandler = () => {
		setViewEmojiTray(prevViewEmojiOption => !prevViewEmojiOption);
	};

	const stickerClickHandler = () => {
		if (stickerTemplate.actionCallback) {
			stickerTemplate.actionCallback();
		} else {
			toggleStickersTray();
		}
	};

	const shareLiveReaction = () => {
		//if already live reaction in progress
		if (liveReactionTimeout) {
			return false;
		}

		//fetching the metadata type from constants
		const data = { type: metadataKey.liveReaction, reaction: props.liveReaction };

		//send transient message
		let transientMessage = new CometChat.TransientMessage(chatWithId, chatWith, data);
		CometChat.sendTransientMessage(transientMessage);

		//set timeout till the next share
		liveReactionTimeout = setTimeout(clearTimeout(liveReactionTimeout), messageConstants.liveReactionTimeout);

		//emit event to share live reaction
		const payload = {
			reaction: props.liveReaction,
			style: { font: props.liveReactionFont, color: props.liveReactionColor },
		};
		CometChatMessageEvents.emit(CometChatMessageEvents.onLiveReaction, payload);
	};

	const attachOption = viewAttachButton ? (
		<div style={stickyAttachButtonStyle(props)} className="attachment__icon" onClick={attachmentClickHandler} title={localize("ATTACH")}>
			<i style={attchButtonIconStyle(props)}></i>
		</div>
	) : null;

	const actionSheet = viewActionSheet ? (
		<CometChatActionSheet
			title="Add to Chat"
			width="305px"
			actions={actionSheetItems}
			style={{
				position: "absolute",
				zIndex: "3",
				left: "35px",
				bottom: "55px",
			}}
		/>
	) : null;

	const createPoll = viewCreatePoll ? (
		<CometChatBackdrop isOpen={viewCreatePoll}>
			<CometChatCreatePoll user={props.user} group={props.group} onClose={closeCreatePoll} onSubmit={onPollSubmit} />
		</CometChatBackdrop>
	) : null;

	const stickerButton = viewSticker ? (
		<div title={localize("STICKER")} style={stickerBtnStyle(props)} className="button__sticker" onClick={stickerClickHandler}>
			<i style={stickerBtnIconStyle(props, stickerTemplate)}></i>
		</div>
	) : null;

	const previewTray = messagePreview ? <CometChatMessagePreview messageObject={messagePreview.message} onClose={closeMessagePreview} /> : null;

	const stickerTray = viewStickerTray ? <CometChatStickerKeyboard onClick={sendSticker} onClose={toggleStickersTray} /> : null;

	const emojiButton = !props.hideEmoji ? (
		<div title={localize("EMOJI")} style={emojiButtonStyle(props)} className="button__emoji" onClick={emojiClickHandler}>
			<i style={emojiBtnIconStyle(props)}></i>
		</div>
	) : null;

	const emojiTray = viewEmojiTray ? <CometChatEmojiKeyboard emojiClicked={onEmojiSelect} /> : null;

	const liveReactionButton = !props.hideLiveReaction ? (
		<div title={localize("LIVE_REACTION")} style={reactionBtnStyle(props)} className="button__reactions" onClick={shareLiveReaction}>
			<i title={props.liveReaction} style={reactionBtnIconStyle(props)}>
				{props.liveReaction}
			</i>
		</div>
	) : null;

	const sendButton = messageInput.length ? (
		<div title={localize("SEND_MESSAGE")} style={sendButtonStyle(props)} className="button__send" onClick={sendTextMessage}>
			<i style={sendBtnIconStyle(props)}></i>
		</div>
	) : null;

	//CometChatMessageEvents.addListener(CometChatMessageEvents.previewMessageForEdit, previewMessageForEdit);

	Hooks(props, setLoggedInUser, setChatWith, setChatWithId, chatRef, setViewAttachButton, setViewComposer, setViewSticker, setStickerTemplate, setActionSheetItems, actionSheetClickHandler);

	return (
		<div style={chatComposerStyle(props)} className="chat__composer">
			{previewTray}
			{stickerTray}
			{emojiTray}
			{actionSheet}
			<input type="file" ref={fileInputRef} style={fileInputStyle()} onChange={fileInputChangeHandler} />
			<div style={composerInputStyle(props)} className="composer__input">
				<div tabIndex="-1" style={inputInnerStyle(props)} className="input__inner">
					<div
						style={messageInputStyle(props, disabledState)}
						className="input__message-input"
						contentEditable="true"
						placeholder={props.placeholder}
						dir={CometChatLocalize.getDir()}
						onInput={inputChangeHandler}
						onBlur={event => endTyping(event)}
						onKeyDown={sendMessageOnEnter}
						ref={messageInputRef}></div>
					<div style={inputStickyStyle(disabledState, attachOption, props)} className="input__sticky">
						{attachOption}
						<div className="input__sticky__buttons" style={stickyButtonStyle(props)}>
							{stickerButton}
							{emojiButton}
							{liveReactionButton}
							{sendButton}
						</div>
					</div>
				</div>
			</div>
			{createPoll}
		</div>
	);
});

CometChatMessageComposer.propTypes = {
	width: PropTypes.string,
	height: PropTypes.string,
	background: PropTypes.string,
	border: PropTypes.string,
	cornerRadius: PropTypes.string,
	placeholder: PropTypes.string,
	placeholderFont: PropTypes.string,
	placeholderColor: PropTypes.string,
	hideEmoji: PropTypes.bool,
	emojiIconURL: PropTypes.string,
	emojiIconTint: PropTypes.string,
	hideLiveReaction: PropTypes.bool,
	liveReaction: PropTypes.string,
	liveReactionFont: PropTypes.string,
	liveReactionColor: PropTypes.string,
	hideAttachment: PropTypes.bool,
	attachmentIconURL: PropTypes.string,
	attachmentIconTint: PropTypes.string,
	hideMicrophone: PropTypes.bool,
	microphoneIconURL: PropTypes.string,
	microphoneIconTint: PropTypes.string,
	sendButtonIconURL: PropTypes.string,
	sendButtonIconTint: PropTypes.string,
	enableTyping: PropTypes.bool,
	user: PropTypes.object,
	group: PropTypes.object,
	configurations: PropTypes.array,
	messageFilterList: PropTypes.array,
};

CometChatMessageComposer.defaultProps = {
	width: "100%",
	height: "105px",
	background: "rgb(255, 255, 255)",
	border: "1px solid rgb(234, 234, 234)",
	cornerRadius: "0 0 8px 8px",
	inputCornerRadius: "8px",
	placeholder: "Enter your message here",
	placeholderFont: "400 15px Inter, sans-serif",
	placeholderColor: "rgba(20, 20, 20, 0.6)",
	hideEmoji: false,
	emojiIconURL: insertEmoticon,
	emojiIconTint: "rgba(20, 20, 20, 0.46)",
	hideLiveReaction: false,
	liveReaction: "❤️",
	liveReactionFont: "400 18px Inter,sans-serif",
	liveReactionColor: "#D7443E",
	hideAttachment: false,
	attachmentIconURL: roundedPlus,
	attachmentIconTint: "rgba(20, 20, 20, 0.46)",
	hideMicrophone: true,
	microphoneIconURL: "",
	microphoneIconTint: "rgba(20, 20, 20, 0.46)",
	sendButtonIconURL: sendBtn,
	sendButtonIconTint: "#39f",
	typingIndicator: true,
	user: null,
	group: null,
	messageFilterList: [],
};

export { CometChatMessageComposer };