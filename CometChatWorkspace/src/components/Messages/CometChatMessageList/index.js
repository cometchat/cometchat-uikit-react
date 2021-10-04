import React from "react";
import dateFormat from "dateformat";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { MessageListManager } from "./controller";

import { 
  CometChatSenderTextMessageBubble, CometChatReceiverTextMessageBubble,
  CometChatSenderImageMessageBubble, CometChatReceiverImageMessageBubble,
  CometChatSenderFileMessageBubble, CometChatReceiverFileMessageBubble,
  CometChatSenderAudioMessageBubble, CometChatReceiverAudioMessageBubble,
  CometChatSenderVideoMessageBubble, CometChatReceiverVideoMessageBubble,
  CometChatSenderDirectCallBubble, CometChatReceiverDirectCallBubble,
  CometChatDeleteMessageBubble, CometChatActionMessageBubble
} from "../"

import {
  CometChatSenderPollMessageBubble, CometChatReceiverPollMessageBubble,
  CometChatSenderStickerBubble, CometChatReceiverStickerMessageBubble,
  CometChatSenderDocumentBubble, CometChatReceiverDocumentBubble,
  CometChatSenderWhiteboardBubble, CometChatReceiverWhiteboardBubble,
} from "../Extensions"

import { CometChatContext } from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";
import { getMessageDate } from "../../../util/common";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import { 
	chatListStyle,
	listWrapperStyle,
	messageDateContainerStyle,
	messageDateStyle,
	decoratorMessageStyle,
	decoratorMessageTxtStyle
} from "./style";

class CometChatMessageList extends React.PureComponent {
	loggedInUser = null;
	lastScrollTop = 0;
	times = 0;
	item = {};

	static contextType = CometChatContext;

	constructor(props, context) {
		super(props, context);
		this.state = {
			onItemClick: null,
			loggedInUser: null,
			decoratorMessage: "LOADING",
		};

		this.messagesEnd = React.createRef();	
	}

	componentDidMount() {

		CometChat.getLoggedinUser()
			.then(user => {
				this.setState({
					loggedInUser: user,
				});
			})
			.catch(error => this.props.actionGenerated(enums.ACTIONS["ERROR"], [], "SOMETHING_WRONG"));
		
		if (Object.keys(this.context.item).length === 0 && this.context.type.trim().length === 0) {
			return false;
		}

		this.item = this.context.type === CometChat.ACTION_TYPE.TYPE_USER || CometChat.ACTION_TYPE.TYPE_GROUP ? this.context.item : {};

		if (this.props.parentMessageId) {
			this.MessageListManager = new MessageListManager(this.context, this.context.item, this.context.type, this.props.parentMessageId);
		} else {
			this.MessageListManager = new MessageListManager(this.context, this.context.item, this.context.type);
		}

		
		this.MessageListManager.initializeMessageRequest().then(() => {
			this.messageHandler(this.context.item, enums.ACTIONS["MESSAGES_INITIAL_FETCH"]);
			this.MessageListManager.attachListeners(this.messageUpdated);
		});
	}

	componentDidUpdate(prevProps, prevState) {

		const ifChatWindowChanged = () => {
			let output = false;

			if (this.context.type === CometChat.ACTION_TYPE.TYPE_USER && (this.context.item.uid !== this.item.uid || this.context.item.blockedByMe !== this.item.blockedByMe)) {
				output = true;
			} else if (this.context.type === CometChat.ACTION_TYPE.TYPE_GROUP && this.context.item.guid !== this.item.guid) {
				output = true;
			} else if (prevProps.parentMessageId !== this.props.parentMessageId) {
				output = true;
			}
			return output;
		};

		if (ifChatWindowChanged() === true) {
			this.messageCount = 0;
			this.setState({ decoratorMessage: "LOADING" });

			this.MessageListManager?.removeListeners();

			if (this.props.parentMessageId) {
				this.MessageListManager = new MessageListManager(this.context, this.context.item, this.context.type, this.props.parentMessageId);
			} else {
				this.MessageListManager = new MessageListManager(this.context, this.context.item, this.context.type);
			}

			this.MessageListManager.initializeMessageRequest().then(() => {
				this.messageHandler(this.context.item, enums.ACTIONS["MESSAGES_INITIAL_FETCH"]);
				this.MessageListManager?.attachListeners(this.messageUpdated);
			});
		}

		const previousMessageStr = JSON.stringify(prevProps.messages);
		const currentMessageStr = JSON.stringify(this.props.messages);

		if (previousMessageStr !== currentMessageStr) {
			if (this.props.scrollToBottom) {
				this.scrollToBottom();
			} else {
				this.scrollToBottom(this.lastScrollTop);
			}
		}

		this.item = this.context.type === CometChat.ACTION_TYPE.TYPE_USER || CometChat.ACTION_TYPE.TYPE_GROUP ? this.context.item : {};
		if (this.context.leftGroupId.trim().length) {
			this.item = {};
		}
	}

	componentWillUnmount() {
		this.MessageListManager?.removeListeners();
		this.MessageListManager = null;
	}

	scrollToBottom = (scrollHeight = 0) => {

		if (this.messagesEnd) {
			this.messagesEnd.scrollTop = this.messagesEnd.scrollHeight - scrollHeight;
		}
	};

	messageHandler = (item, actionGenerated = enums.ACTIONS["MESSAGES_FETCHED"]) => {
		this.fetchMessages()
			.then(messageList => {
				if (messageList.length === 0) {
					this.setState({ decoratorMessage: "NO_MESSAGES_FOUND" });
				} else {
					this.setState({ decoratorMessage: "" });
				}

				//updating messagecount variable
				this.messageCount = messageList.length;

				messageList.forEach(message => {
					//if the sender of the message is not the loggedin user
					if (message.getSender().getUid() !== this.state.loggedInUser?.uid) {
						//mark the message as delivered
						this.markMessageAsDelivered(message);

						//mark the message as read
						if (message.hasOwnProperty("readAt") === false) {
							CometChat.markAsRead(message);
							this.props.actionGenerated(enums.ACTIONS["MESSAGE_READ"], message);
						}
					}
				});

				this.lastScrollTop = this.messagesEnd.scrollHeight;

				//abort(don't return messagelist), when the chat window changes
				if ((item.hasOwnProperty("uid") && this.context.item.hasOwnProperty("uid") && item.uid === this.context.item.uid) || (item.hasOwnProperty("guid") && this.context.item.hasOwnProperty("guid") && item.guid === this.context.item.guid)) {
					this.props.actionGenerated(actionGenerated, messageList);
				}
			})
			.catch(error => {
				if (this.props.messages.length === 0) {
					this.setState({ decoratorMessage: "SOMETHING_WRONG" });
				}

				if (error && error.hasOwnProperty("code") && error.code === "ERR_GUID_NOT_FOUND") {
					//this.context.setDeletedGroupId(this.context.item.guid);
				}
			});
	};

	fetchMessages = () => {
		const promise = new Promise((resolve, reject) => {
			this.MessageListManager.fetchPreviousMessages()
				.then(messageList => {
					resolve(messageList);
				})
				.catch(error => reject(error));
		});

		return promise;
	};

	//callback for listener functions
	messageUpdated = (key, message, group, options) => {

		switch (key) 
		{
			case enums.MESSAGE_DELETED:
				this.onMessageDeleted(message);
				break;
			case enums.MESSAGE_EDITED:
				this.onMessageEdited(message);
				break;
			case enums.MESSAGE_DELIVERED:
			case enums.MESSAGE_READ:
				this.onMessageReadAndDelivered(message);
				break;
			case enums.TEXT_MESSAGE_RECEIVED:
			case enums.MEDIA_MESSAGE_RECEIVED:
				this.onMessageReceived(message);
				break;
			case enums.CUSTOM_MESSAGE_RECEIVED:
				this.onCustomMessageReceived(message);
				break;
			case enums.GROUP_MEMBER_SCOPE_CHANGED:
			case enums.GROUP_MEMBER_JOINED:
			case enums.GROUP_MEMBER_LEFT:
			case enums.GROUP_MEMBER_ADDED:
			case enums.GROUP_MEMBER_KICKED:
			case enums.GROUP_MEMBER_BANNED:
			case enums.GROUP_MEMBER_UNBANNED:
				this.onGroupUpdated(key, message, group, options);
				break;
			case enums.INCOMING_CALL_RECEIVED:
			case enums.INCOMING_CALL_CANCELLED:
			case enums.OUTGOING_CALL_ACCEPTED:
			case enums.OUTGOING_CALL_REJECTED:
				this.onCallUpdated(key, message);
				break;
			case enums.TRANSIENT_MESSAGE_RECEIVED:
				this.onTransientMessageReceived(key, message);
				break;
			default:
				break;
		}
	};

	onMessageDeleted = message => {
		if (this.context.type === CometChat.RECEIVER_TYPE.GROUP && message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP && message.getReceiverId() === this.context.item.guid) {
			this.props.actionGenerated(enums.ACTIONS["ON_MESSAGE_DELETED"], [message]);
		} else if (this.context.type === CometChat.RECEIVER_TYPE.USER && message.getReceiverType() === CometChat.RECEIVER_TYPE.USER && message.getSender().uid === this.context.item.uid) {
			this.props.actionGenerated(enums.ACTIONS["ON_MESSAGE_DELETED"], [message]);
		}
	};

	onMessageEdited = message => {
		const messageList = [...this.props.messages];
		const updateEditedMessage = message => {
			let messageKey = messageList.findIndex(m => m.id === message.id);

			if (messageKey > -1) {
				const messageObj = messageList[messageKey];
				const newMessageObj = Object.assign({}, messageObj, message);

				messageList.splice(messageKey, 1, newMessageObj);
				this.props.actionGenerated(enums.ACTIONS["ON_MESSAGE_EDITED"], messageList, newMessageObj);
			}
		};

		if (this.context.type === CometChat.RECEIVER_TYPE.GROUP && message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP && message.getReceiverId() === this.context.item.guid) {
			updateEditedMessage(message);
		} else if (this.context.type === CometChat.RECEIVER_TYPE.USER && message.getReceiverType() === CometChat.RECEIVER_TYPE.USER && this.state.loggedInUser?.uid === message.getReceiverId() && message.getSender().uid === this.context.item.uid) {
			updateEditedMessage(message);
		} else if (this.context.type === CometChat.RECEIVER_TYPE.USER && message.getReceiverType() === CometChat.RECEIVER_TYPE.USER && this.state.loggedInUser?.uid === message.getSender().uid && message.getReceiverId() === this.context.item.uid) {
			updateEditedMessage(message);
		}
	};

	onMessageReadAndDelivered = message => {

		//read receipts
		if (message.getReceiverType() === CometChat.RECEIVER_TYPE.USER && message.getSender().getUid() === this.context.item.uid && message.getReceiver() === this.state.loggedInUser?.uid) {
			let messageList = [...this.props.messages];

			if (message.getReceiptType() === "delivery") {
				//search for message

				let messageKey = messageList.findIndex(m => m.id === message.messageId);

				if (messageKey > -1) {
					let messageObj = messageList[messageKey];
					let newMessageObj = Object.assign({}, messageObj, { deliveredAt: message.getDeliveredAt() });

					messageList.splice(messageKey, 1, newMessageObj);
					this.props.actionGenerated(enums.ACTIONS["ON_MESSAGE_READ_DELIVERED"], messageList);
				}
			} else if (message.getReceiptType() === "read") {
				//search for message
				let messageKey = messageList.findIndex(m => m.id === message.messageId);

				if (messageKey > -1) {
					let messageObj = { ...messageList[messageKey] };
					let newMessageObj = Object.assign({}, messageObj, { readAt: message.getReadAt() });

					messageList.splice(messageKey, 1, newMessageObj);
					this.props.actionGenerated(enums.ACTIONS["ON_MESSAGE_READ_DELIVERED"], messageList);
				}
			}
		} else if (message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP && message.getReceiver() === this.context.item.guid) {
			//not implemented
		}
	};

	reInitializeMessageBuilder = () => {
		if (this.props.hasOwnProperty("parentMessageId") === false) {
			this.messageCount = 0;
		}

		this.props.actionGenerated(enums.ACTIONS["REFRESHING_MESSAGES"], []);
		this.setState({ decoratorMessage: "LOADING" });
		this.MessageListManager.removeListeners();

		if (this.props.parentMessageId) {
			this.MessageListManager = new MessageListManager(this.context, this.context.item, this.context.type, this.props.parentMessageId);
		} else {
			this.MessageListManager = new MessageListManager(this.context, this.context.item, this.context.type);
		}

		this.MessageListManager.initializeMessageRequest().then(() => {
			this.messageHandler(this.context.item, enums.ACTIONS["MESSAGES_REFRESHED"]);
			this.MessageListManager.attachListeners(this.messageUpdated);
		});
	};

	//mark the message as delivered
	markMessageAsDelivered = message => {

		if (message.sender?.uid !== this.state.loggedInUser?.uid && message.hasOwnProperty("deliveredAt") === false) {
			CometChat.markAsDelivered(message);
		}
	};

	markMessageAsRead = (message, type) => {
		if (message.hasOwnProperty("readAt") === false) {
			CometChat.markAsRead(message);
		}
	};

	onMessageReceived = message => {

		//mark the message as delivered
		this.markMessageAsDelivered(message);

		/**
		 * message receiver is chat window group
		 */
		if (this.context.type === CometChat.RECEIVER_TYPE.GROUP && message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP && message.getReceiverId() === this.context.item.guid) {
			this.messageReceivedHandler(message, CometChat.RECEIVER_TYPE.GROUP);
		} else if (this.context.type === CometChat.RECEIVER_TYPE.USER && message.getReceiverType() === CometChat.RECEIVER_TYPE.USER) {
			/**
			 * If the message sender is chat window user and message receiver is logged-in user
			 * OR
			 * If the message sender is logged-in user and message receiver is chat window user
			 */
			if ((message.getSender().uid === this.context.item.uid && message.getReceiverId() === this.state.loggedInUser?.uid) || (message.getSender().uid === this.state.loggedInUser?.uid && message.getReceiverId() === this.context.item.uid)) {
				this.messageReceivedHandler(message, CometChat.RECEIVER_TYPE.USER);
			}
		}
	};

	messageReceivedHandler = (message, type) => {
		//handling dom lag - increment count only for main message list
		if (message.hasOwnProperty("parentMessageId") === false && this.props.hasOwnProperty("parentMessageId") === false) {
			++this.messageCount;
			//if the user has not scrolled in chat window(scroll is at the bottom of the chat window)
			if (this.messagesEnd.scrollHeight - this.messagesEnd.scrollTop - this.messagesEnd.clientHeight <= 1) {
				if (this.messageCount > enums.CONSTANTS["MAX_MESSAGE_COUNT"]) {
					this.reInitializeMessageBuilder();
				} else {
					this.markMessageAsRead(message, type);
					this.props.actionGenerated(enums.ACTIONS["MESSAGE_RECEIVED"], [message]);
				}
			} else {
				//if the user has scrolled up in chat window
				this.props.actionGenerated(enums.ACTIONS["NEW_MESSAGES"], [message]);
			}
		} else if (message.hasOwnProperty("parentMessageId") === true && this.props.hasOwnProperty("parentMessageId") === true) {
			if (message.parentMessageId === this.props.parentMessageId) {
				this.markMessageAsRead(message, type);
			}

			this.props.actionGenerated(enums.ACTIONS["MESSAGE_RECEIVED"], [message]);
		} else {
			this.props.actionGenerated(enums.ACTIONS["MESSAGE_RECEIVED"], [message]);
		}
	};

	//polls, stickers, collaborative document, collaborative whiteboard
	onCustomMessageReceived = message => {
		//mark the message as delivered
		this.markMessageAsDelivered(message);

		//new messages
		if (
			this.context.type === CometChat.RECEIVER_TYPE.GROUP &&
			message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP &&
			this.state.loggedInUser?.uid === message.getSender().uid &&
			message.getReceiverId() === this.context.item.guid &&
			(message.type === enums.CUSTOM_TYPE_POLL || message.type === enums.CUSTOM_TYPE_DOCUMENT || message.type === enums.CUSTOM_TYPE_WHITEBOARD)
		) {
			//showing polls, collaborative document and whiteboard for sender (custom message received listener for sender)
			this.props.actionGenerated(enums.ACTIONS["CUSTOM_MESSAGE_RECEIVED"], [message]);
		} else if (this.context.type === CometChat.RECEIVER_TYPE.GROUP && message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP && message.getReceiverId() === this.context.item.guid) {
			this.customMessageReceivedHandler(message, CometChat.RECEIVER_TYPE.GROUP);
		} else if (this.context.type === CometChat.RECEIVER_TYPE.USER && message.getReceiverType() === CometChat.RECEIVER_TYPE.USER && message.getSender().uid === this.context.item.uid) {
			this.customMessageReceivedHandler(message, CometChat.RECEIVER_TYPE.USER);
		} else if (
			this.context.type === CometChat.RECEIVER_TYPE.USER &&
			message.getReceiverType() === CometChat.RECEIVER_TYPE.USER &&
			this.state.loggedInUser?.uid === message.getSender().uid &&
			message.getReceiverId() === this.context.item.uid &&
			(message.type === enums.CUSTOM_TYPE_POLL || message.type === enums.CUSTOM_TYPE_DOCUMENT || message.type === enums.CUSTOM_TYPE_WHITEBOARD)
		) {
			//showing polls, collaborative document and whiteboard for sender (custom message received listener for sender)
			this.props.actionGenerated(enums.ACTIONS["CUSTOM_MESSAGE_RECEIVED"], [message]);
		}
	};

	customMessageReceivedHandler = (message, type) => {
		//handling dom lag - increment count only for main message list
		if (message.hasOwnProperty("parentMessageId") === false && this.props.hasOwnProperty("parentMessageId") === false) {
			++this.messageCount;

			//if the user has not scrolled in chat window(scroll is at the bottom of the chat window)
			if (this.messagesEnd.scrollHeight - this.messagesEnd.scrollTop - this.messagesEnd.clientHeight <= 1) {
				if (this.messageCount > enums.CONSTANTS["MAX_MESSAGE_COUNT"]) {
					this.reInitializeMessageBuilder();
				} else {
					this.markMessageAsRead(message, type);
					this.props.actionGenerated(enums.ACTIONS["CUSTOM_MESSAGE_RECEIVED"], [message]);
				}
			} else {
				//if the user has scrolled in chat window

				this.props.actionGenerated(enums.ACTIONS["NEW_MESSAGES"], [message]);
			}
		} else if (message.hasOwnProperty("parentMessageId") === true && this.props.hasOwnProperty("parentMessageId") === true) {
			if (message.parentMessageId === this.props.parentMessageId) {
				this.markMessageAsRead(message, type);
			}
			this.props.actionGenerated(enums.ACTIONS["CUSTOM_MESSAGE_RECEIVED"], [message]);
		} else {
			this.props.actionGenerated(enums.ACTIONS["CUSTOM_MESSAGE_RECEIVED"], [message]);
		}
	};

	onCallUpdated = (key, message) => {
		if (this.context.type === CometChat.RECEIVER_TYPE.GROUP && message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP && message.getReceiverId() === this.context.item.guid) {
			this.props.actionGenerated(key, message);
		} else if (this.context.type === CometChat.RECEIVER_TYPE.USER && message.getReceiverType() === CometChat.RECEIVER_TYPE.USER && message.getSender().uid === this.context.item.uid) {
			this.props.actionGenerated(key, message);
		}
	};

	onTransientMessageReceived = (key, message) => {

		if (this.context.type === CometChat.RECEIVER_TYPE.GROUP && message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP && message.getReceiverId() === this.context.item.guid) {
			this.props.actionGenerated(key, message);
		} else if (this.context.type === CometChat.RECEIVER_TYPE.USER && message.getReceiverType() === CometChat.RECEIVER_TYPE.USER && message.getSender().uid === this.context.item.uid) {
			this.props.actionGenerated(key, message);
		}
	};

	onGroupUpdated = (key, message, group, options) => {
		if (this.context.type === CometChat.RECEIVER_TYPE.GROUP && message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP && message.getReceiverId() === this.context.item.guid) {
			this.props.actionGenerated(key, message, null, group, options);
		}
	};

	handleScroll = e => {

		const scrollTop = e.currentTarget.scrollTop;
		const scrollHeight = e.currentTarget.scrollHeight;
		const clientHeight = e.currentTarget.clientHeight;

		this.lastScrollTop = scrollHeight - scrollTop;

		if (this.lastScrollTop === clientHeight) {
			this.props.actionGenerated(enums.ACTIONS["CLEAR_UNREAD_MESSAGES"]);
		}

		const top = Math.round(scrollTop) === 0;
		if (top && this.props.messages.length) {
			this.messageHandler(this.context.item);
		}
	};

	getSenderMessageComponent = message => {

		let component;
		const messageKey = message._id ? message._id : message.id;

		if (message.hasOwnProperty("deletedAt")) {
			component = <CometChatDeleteMessageBubble key={messageKey} message={message} />;
		} else {
			switch (message.type) {
				case CometChat.MESSAGE_TYPE.TEXT:
					component = <CometChatSenderTextMessageBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} />;
					break;
				case CometChat.MESSAGE_TYPE.IMAGE:
					component = <CometChatSenderImageMessageBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} />;
					break;
				case CometChat.MESSAGE_TYPE.FILE:
					component = <CometChatSenderFileMessageBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} />;
					break;
				case CometChat.MESSAGE_TYPE.VIDEO:
					component = <CometChatSenderVideoMessageBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} />;
					break;
				case CometChat.MESSAGE_TYPE.AUDIO:
					component = <CometChatSenderAudioMessageBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} />;
					break;
				default:
					break;
			}
		}

		return component;
	};

	getReceiverMessageComponent = message => {

		let component;
		const messageKey = message._id ? message._id : message.id;

		if (message.hasOwnProperty("deletedAt")) {
			component = <CometChatDeleteMessageBubble key={messageKey} message={message} />;
		} else {
			switch (message.type) {
				case CometChat.MESSAGE_TYPE.TEXT:
					component = message.text ? <CometChatReceiverTextMessageBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} /> : null;
					break;
				case CometChat.MESSAGE_TYPE.IMAGE:
					component = message.data.url ? <CometChatReceiverImageMessageBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} /> : null;
					break;
				case CometChat.MESSAGE_TYPE.FILE:
					component = message.data.attachments ? <CometChatReceiverFileMessageBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} /> : null;
					break;
				case CometChat.MESSAGE_TYPE.AUDIO:
					component = message.data.url ? <CometChatReceiverAudioMessageBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} /> : null;
					break;
				case CometChat.MESSAGE_TYPE.VIDEO:
					component = message.data.url ? <CometChatReceiverVideoMessageBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} /> : null;
					break;
				default:
					break;
			}
		}
		return component;
	};

	getSenderCustomMessageComponent = message => {

		let component;
		const messageKey = message._id ? message._id : message.id;

		if (message.hasOwnProperty("deletedAt")) {
			component = <CometChatDeleteMessageBubble key={messageKey} message={message} />;
		} else {
			switch (message.type) {
				case enums.CUSTOM_TYPE_POLL:
					component = <CometChatSenderPollMessageBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} />;
					break;
				case enums.CUSTOM_TYPE_STICKER:
					component = <CometChatSenderStickerBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} />;
					break;
				case enums.CUSTOM_TYPE_DOCUMENT:
					component = <CometChatSenderDocumentBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} />;
					break;
				case enums.CUSTOM_TYPE_WHITEBOARD:
					component = <CometChatSenderWhiteboardBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} />;
					break;
				case enums.CUSTOM_TYPE_MEETING:
					component = <CometChatSenderDirectCallBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} />;
					break;
				default:
					break;
			}
		}

		return component;
	};

	getReceiverCustomMessageComponent = message => {

		let component;
		const messageKey = message._id ? message._id : message.id;
		
		if (message.hasOwnProperty("deletedAt")) {
			component = <CometChatDeleteMessageBubble key={messageKey} message={message} />;
		} else {
			switch (message.type) {
				case enums.CUSTOM_TYPE_POLL:
					component = <CometChatReceiverPollMessageBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} />;
					break;
				case enums.CUSTOM_TYPE_STICKER:
					component = <CometChatReceiverStickerMessageBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} />;
					break;
				case enums.CUSTOM_TYPE_DOCUMENT:
					component = <CometChatReceiverDocumentBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} />;
					break;
				case enums.CUSTOM_TYPE_WHITEBOARD:
					component = <CometChatReceiverWhiteboardBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} />;
					break;
				case enums.CUSTOM_TYPE_MEETING:
					component = <CometChatReceiverDirectCallBubble key={messageKey} message={message} actionGenerated={this.props.actionGenerated} />;
					break;
				default:
					break;
			}
		}

		return component;
	};

	getActionMessageComponent = message => {

		const messageKey = message._id ? message._id : message.id;
		return <CometChatActionMessageBubble key={messageKey} message={message} />;
	};

	getComponent = (message, key) => {
		let component;

		switch (message.category) {
			case CometChat.CATEGORY_ACTION:
			case CometChat.CATEGORY_CALL:
				component = this.getActionMessageComponent(message);
				break;
			case CometChat.CATEGORY_MESSAGE:
				if (this.state.loggedInUser?.uid === message.sender?.uid) {
					component = this.getSenderMessageComponent(message);
				} else {
					component = this.getReceiverMessageComponent(message);
				}
				break;
			case CometChat.CATEGORY_CUSTOM:
				if (this.state.loggedInUser?.uid === message.sender?.uid) {
					component = this.getSenderCustomMessageComponent(message);
				} else {
					component = this.getReceiverCustomMessageComponent(message);
				}
				break;
			default:
				break;
		}

		return component;
	};

	render() {

		let messageContainer = null;
		if (this.state.decoratorMessage.length !== 0 && this.props.messages.length === 0) {
			messageContainer = (
				<div css={decoratorMessageStyle()} className="messages__decorator-message">
					<p css={decoratorMessageTxtStyle(this.context)} className="decorator-message">
						{Translator.translate(this.state.decoratorMessage, this.props.lang)}
					</p>
				</div>
			);
		}

		let cDate = null;
		const messages = this.props.messages.map((message, key) => {
			let dateSeparator = null;

			const dateField = message._composedAt || message.sentAt;

			const messageDate = message.sentAt * 1000;
			const messageSentDate = dateFormat(messageDate, "dd/mm/yyyy");

			if (cDate !== messageSentDate) {
				dateSeparator = (
					<div css={messageDateContainerStyle()} className="message__date">
						<span css={messageDateStyle(this.context)}>{getMessageDate(dateField, this.context.language)}</span>
					</div>
				);
			}
			cDate = messageSentDate;

			return (
				<React.Fragment key={key}>
					{dateSeparator}
					{this.getComponent(message, key)}
				</React.Fragment>
			);
		});

		return (
			<div className="chat__list" css={chatListStyle(this.context)}>
				{messageContainer}
				<div
					className="list__wrapper"
					css={listWrapperStyle()}
					ref={el => {
						this.messagesEnd = el;
					}}
					onScroll={this.handleScroll}>
					{messages}
				</div>
			</div>
		);
	}
}

// Specifies the default values for props:
CometChatMessageList.defaultProps = {
  theme: theme
};

CometChatMessageList.propTypes = {
  theme: PropTypes.object
}

export { CometChatMessageList };