import React from "react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { 
	CometChatMessageEvents,
	messageConstants, 
	CometChatMessageOptions, 
	CometChatMessageBubble, 
	CometChatCustomMessageTypes,
	CometChatMessageReceiverType,
	messageAlignment
} from "../";

import { CometChatSoundManager, CometChatLocalize, localize } from "../../";

import { MessageListManager } from "./controller";
import { fetchMessages, usePrevious, Hooks } from "./hooks";


import { 
	chatListStyle,
	listWrapperStyle,
	messageDateContainerStyle,
	messageDateStyle,
	decoratorMessageStyle,
	decoratorMessageTxtStyle,
	messageBubbleStyle
} from "./style";

const CometChatMessageList = React.forwardRef((props, ref)  => {
	let messageCount = 0;
	let lastScrollTop = 0;

	let [messageListManager] = React.useState(new MessageListManager(props));

	const [loggedInUser, setLoggedInUser] = React.useState(null);
	const [messageList, setMessageList] = React.useState([]);
	const [unreadMessageList, setUnreadMessageList] = React.useState([]);
	const [callbackData, setCallbackData] = React.useState(null);

	const [decoratorMessage, setDecoratorMessage] = React.useState(localize("LOADING"));
	const [chatWith, setChatWith] = React.useState(null);
	const [chatWithType, setChatWithType] = React.useState(null);
	const [chatWithId, setChatWithId] = React.useState(null);

	const messageListEndRef = React.useRef(null);
	const prevChatWithIdRef = React.useRef(chatWithId);

	/**
	 * Update messagelist
	 */
	React.useImperativeHandle(ref, () => ({
		addMessage: addMessage,
		updateMessageAsSent: updateMessageAsSent,
		draftMessage: draftMessage,
		updateMessage: updateMessage,
	}));

	const messageListCallback = (listenerName, ...args) => {
		setCallbackData({ name: listenerName, args: [...args] });
	};

	const errorHandler = errorCode => {};

	const handleMessageOptionClick = (option, message) => {
		switch (option.id) {
			case CometChatMessageOptions.edit: {
				CometChatMessageEvents.emit(CometChatMessageEvents.previewMessageForEdit, message);
				break;
			}
			case CometChatMessageOptions.delete: {
				CometChat.deleteMessage(message.id)
					.then(deletedMessage => {
						updateMessageAsDeleted(deletedMessage);
					})
					.catch(error => errorHandler("SOMETHING_WRONG"));
				break;
			}
			case CometChatMessageOptions.translate: {
				break;
			}
			default:
				break;
		}
	};

	const translateMessage = message => {
		const messageId = message.id;
		const messageText = message.text;

		let translateToLanguage = CometChatLocalize.getLocale();

		let translatedMessage = "";
		CometChat.callExtension("message-translation", "POST", "v2/translate", {
			msgId: messageId,
			text: messageText,
			languages: [translateToLanguage],
		})
			.then(result => {
				if (result.hasOwnProperty("language_original") && result["language_original"] !== translateToLanguage) {
					if (result.hasOwnProperty("translations") && result.translations.length) {
						const messageTranslation = result.translations[0];
						if (messageTranslation.hasOwnProperty("message_translated")) {
							translatedMessage = `\n(${messageTranslation["message_translated"]})`;
						}
					} else {
						//this.props.actionGenerated(enums.ACTIONS["ERROR"], [], "SOMETHING_WRONG");
					}
				} else {
					//this.props.actionGenerated(enums.ACTIONS["INFO"], [], "SAME_LANGUAGE_MESSAGE");
				}

				//this.setState({ translatedMessage: translatedMessage });
			})
			.catch(error => errorHandler("SOMETHING_WRONG"));
	};

	const reInitializeMessageBuilder = () => {
		if (!props.parentMessage || !props.parentMessage.id) {
			messageCount = 0;
		}

		resetChatWindow();
		//CometChatMessageEvents.emit(CometChatMessageEvents.refreshingMessages);
		//this.props.actionGenerated(enums.ACTIONS["REFRESHING_MESSAGES"], []);

		setDecoratorMessage(localize("LOADING"));
		messageListManager.removeListeners();

		if (props.parentMessage && props.parentMessage.id) {
			messageListManager = new MessageListManager(props);
		} else {
			messageListManager = new MessageListManager(props);
		}

		fetchMessages.then(messageList => {
			messageHandler(messageList, true);
			messageListManager.attachListeners(messageListCallback);
		});
	};

	const markMessageAsRead = message => {
		if (!message.readAt) {
			CometChat.markAsRead(message).catch(error => {});;
		}
	};

	const handleNewMessages = message => {
		//handling dom lag - increment count only for main message list
		const messageReceivedHandler = message => {
			if (!message.parentMessageId && (!props.parentMessage || !props.parentMessage.id)) {
				++messageCount;

				//if the user has not scrolled in chat window(scroll is at the bottom of the chat window)
				if (messageListEndRef && messageListEndRef.current 
				&& messageListEndRef.current.scrollHeight - messageListEndRef.current.scrollTop - messageListEndRef.current.clientHeight < 20) {
					if (messageCount > messageConstants.maximumNumOfMessages) {
						reInitializeMessageBuilder();
					} else {
						markMessageAsRead(message);
						addMessage(message);
						//CometChatMessageEvents.emit(CometChatMessageEvents.messageReceived, message);
						//this.props.actionGenerated(enums.ACTIONS["MESSAGE_RECEIVED"], [message]);
					}
				} else {
					//if the user has scrolled up in chat window
					storeMessage(message);
					//CometChatMessageEvents.emit(CometChatMessageEvents.storeMessage, message);
					//this.props.actionGenerated(enums.ACTIONS["NEW_MESSAGES"], [message]);
				}
			} else if (props.parentMessage && props.parentMessage.id && message.parentMessageId) {
				if (message.parentMessageId === props.parentMessage.id) {
					markMessageAsRead(message);
				}

				addMessage(message);
				//CometChatMessageEvents.emit(CometChatMessageEvents.messageReceived, message);
				//this.props.actionGenerated(enums.ACTIONS["MESSAGE_RECEIVED"], [message]);
			} else {
				addMessage(message);
				//CometChatMessageEvents.emit(CometChatMessageEvents.messageReceived, message);
				//this.props.actionGenerated(enums.ACTIONS["MESSAGE_RECEIVED"], [message]);
			}
		};

		/**
		 * message receiver is chat window group
		 */
		if (chatWithType === CometChatMessageReceiverType.group && message.getReceiverType() === CometChatMessageReceiverType.group && message.getReceiverId() === chatWith?.guid) {
			messageReceivedHandler(message);
		} else if (chatWithType === CometChatMessageReceiverType.user && message.getReceiverType() === CometChatMessageReceiverType.user) {
			/**
			 * If the message sender is chat window user and message receiver is logged-in user
			 * OR
			 * If the message sender is logged-in user and message receiver is chat window user
			 */
			if ((message.getSender().uid === chatWith?.uid && message.getReceiverId() === loggedInUser?.uid) || (message.getSender().uid === loggedInUser?.uid && message.getReceiverId() === chatWith?.uid)) {
				messageReceivedHandler(message);
			}
		}
	};

	const handleNewCustomMessages = message => {
		const customMessageReceivedHandler = message => {
			//handling dom lag - increment count only for main message list
			if (!message.parentMessageId && (!props.parentMessage || !props.parentMessage.id)) {
				++messageCount;

				//if the user has not scrolled in chat window(scroll is at the bottom of the chat window)
				if (messageListEndRef && messageListEndRef.current 
				&& messageListEndRef.current.scrollHeight - messageListEndRef.current.scrollTop === messageListEndRef.current.clientHeight) {
					if (messageCount > messageConstants.maximumNumOfMessages) {
						reInitializeMessageBuilder();
					} else {
						markMessageAsRead(message);
						addMessage(message);

						//CometChatMessageEvents.emit(CometChatMessageEvents.customMessageReceived, message);
						//this.props.actionGenerated(enums.ACTIONS["CUSTOM_MESSAGE_RECEIVED"], [message]);
					}
				} else {
					//if the user has scrolled in chat window
					storeMessage(message);
					//CometChatMessageEvents.emit(CometChatMessageEvents.storeMessage, message);
					//this.props.actionGenerated(enums.ACTIONS["NEW_MESSAGES"], [message]);
				}
			} else if (message.parentMessageId && props.parentMessage.id && message.parentMessageId) {
				if (message.parentMessageId === props.parentMessage.id) {
					markMessageAsRead(message)
				}
				addMessage(message);
				//CometChatMessageEvents.emit(CometChatMessageEvents.customMessageReceived, message);
				//this.props.actionGenerated(enums.ACTIONS["CUSTOM_MESSAGE_RECEIVED"], [message]);
			} else {
				addMessage(message);
				//CometChatMessageEvents.emit(CometChatMessageEvents.customMessageReceived, message);
				//this.props.actionGenerated(enums.ACTIONS["CUSTOM_MESSAGE_RECEIVED"], [message]);
			}
		};

		//new custom messages
		if (
			chatWithType === CometChatMessageReceiverType.group &&
			message.getReceiverType() === CometChatMessageReceiverType.group &&
			loggedInUser.uid === message.getSender().uid &&
			message.getReceiverId() === chatWith?.guid &&
			(message.type === CometChatCustomMessageTypes.poll || message.type === CometChatCustomMessageTypes.document || message.type === CometChatCustomMessageTypes.whiteboard)
		) {
			//showing polls, collaborative document and whiteboard for sender (custom message received listener for sender)
			addMessage(message);
			//CometChatMessageEvents.emit(CometChatMessageEvents.customMessageReceived, message);
			//this.props.actionGenerated(enums.ACTIONS["CUSTOM_MESSAGE_RECEIVED"], [message]);
		} else if (chatWithType === CometChatMessageReceiverType.group && message.getReceiverType() === CometChatMessageReceiverType.group && message.getReceiverId() === chatWith?.guid) {
			customMessageReceivedHandler(message, CometChatMessageReceiverType.group);
		} else if (chatWithType === CometChatMessageReceiverType.user && message.getReceiverType() === CometChatMessageReceiverType.user && message.getSender().uid === chatWith?.uid) {
			customMessageReceivedHandler(message, CometChatMessageReceiverType.user);
		} else if (
			chatWithType === CometChatMessageReceiverType.user &&
			message.getReceiverType() === CometChatMessageReceiverType.user &&
			loggedInUser.uid === message.getSender().uid &&
			message.getReceiverId() === chatWith?.uid &&
			(message.type === CometChatCustomMessageTypes.poll || message.type === CometChatCustomMessageTypes.document || message.type === CometChatCustomMessageTypes.whiteboard)
		) {
			//showing polls, collaborative document and whiteboard for sender (custom message received listener for sender)
			addMessage(message);
			//CometChatMessageEvents.emit(CometChatMessageEvents.customMessageReceived, message);
			//this.props.actionGenerated(enums.ACTIONS["CUSTOM_MESSAGE_RECEIVED"], [message]);
		}
	};

	const handleMessageDeliveryAndReadReceipt = messageReceipt => {
		//read receipts
		if (messageReceipt.getReceiverType() === CometChatMessageReceiverType.user && messageReceipt.getSender().getUid() === chatWith?.uid && messageReceipt.getReceiver() === loggedInUser.uid) {
			if (messageReceipt.getReceiptType() === "delivery") {
				updateMessageAsDelivered(messageReceipt);
				//CometChatMessageEvents.emit(CometChatMessageEvents.messageDelivered, messageReceipt);
				//this.props.actionGenerated(enums.ACTIONS["updateMessageAsDelivered"], messageList);
			} else if (messageReceipt.getReceiptType() === "read") {
				updateMessageAsRead(messageReceipt);
				//CometChatMessageEvents.emit(CometChatMessageEvents.messageRead, messageReceipt);
				//this.props.actionGenerated(enums.ACTIONS["updateMessageAsRead"], messageList);
			}
		} else if (messageReceipt.getReceiverType() === CometChatMessageReceiverType.group && messageReceipt.getReceiver() === chatWith?.guid) {
			//not implemented
		}
	};

	const handleMessageDelete = message => {
		if (chatWithType === CometChatMessageReceiverType.group && message.getReceiverType() === CometChatMessageReceiverType.group && message.getReceiverId() === chatWith?.guid) {
			updateMessageAsDeleted(message);
			//CometChatMessageEvents.emit(CometChatMessageEvents.messageDeleted, message);
			//this.props.actionGenerated(enums.ACTIONS["ON_MESSAGE_DELETED"], [message]);
		} else if (chatWith === CometChatMessageReceiverType.user && message.getReceiverType() === CometChatMessageReceiverType.user && message.getSender().uid === chatWith?.uid) {
			updateMessageAsDeleted(message);
			//CometChatMessageEvents.emit(CometChatMessageEvents.messageDeleted, message);
			//this.props.actionGenerated(enums.ACTIONS["ON_MESSAGE_DELETED"], [message]);
		}
	};

	const handleMessageEdit = message => {
		if (chatWithType === CometChatMessageReceiverType.group && message.getReceiverType() === CometChatMessageReceiverType.group && message.getReceiverId() === chatWith?.guid) {
			updateMessage(message);
			//CometChatMessageEvents.emit(CometChatMessageEvents.messageEdited, message);
			//this.props.actionGenerated(enums.ACTIONS["ON_MESSAGE_EDITED"], messageList, newMessageObj);
		} else if (chatWithType === CometChatMessageReceiverType.user && message.getReceiverType() === CometChatMessageReceiverType.user && loggedInUser.uid === message.getReceiverId() && message.getSender().uid === chatWith?.uid) {
			updateMessage(message);
			//CometChatMessageEvents.emit(CometChatMessageEvents.messageEdited, message);
			//this.props.actionGenerated(enums.ACTIONS["ON_MESSAGE_EDITED"], messageList, newMessageObj);
		} else if (chatWithType === CometChatMessageReceiverType.user && message.getReceiverType() === CometChatMessageReceiverType.user && loggedInUser.uid === message.getSender().uid && message.getReceiverId() === chatWith?.uid) {
			updateMessage(message);
			//CometChatMessageEvents.emit(CometChatMessageEvents.messageEdited, message);
			//this.props.actionGenerated(enums.ACTIONS["ON_MESSAGE_EDITED"], messageList, newMessageObj);
		}
	};

	const handleNewGroupActionMessage = message => {
		if (chatWithType === CometChatMessageReceiverType.group && message.getReceiverType() === CometChatMessageReceiverType.group && message.getReceiverId() === chatWith?.guid) {
			addGroupActionMessage(message);
			//CometChatMessageEvents.emit(CometChatMessageEvents.groupActionMessageReceived, message);
			//this.props.actionGenerated(key, message, null, group, options);
		}
	};

	const handleNewCallActionMessage = message => {
		if (chatWithType === CometChatMessageReceiverType.group && message.getReceiverType() === CometChatMessageReceiverType.group && message.getReceiverId() === chatWith?.guid) {
			addCallActionMessage(message);
			//CometChatMessageEvents.emit(CometChatMessageEvents.callActionMessageReceived, message);
			//this.props.actionGenerated(enums.ACTIONS["MESSAGE_RECEIVED"], [message]);
		} else if (chatWithType === CometChatMessageReceiverType.user && message.getReceiverType() === CometChatMessageReceiverType.user && message.getSender().uid === chatWith?.uid) {
			addCallActionMessage(message);
			//CometChatMessageEvents.emit(CometChatMessageEvents.callActionMessageReceived, message);
			//this.props.actionGenerated(enums.ACTIONS["MESSAGE_RECEIVED"], [message]);
		}
	};

	const messageHandler = (messagelist, scroll) => {
		messageCount = messagelist.length;

		messagelist.forEach(message => {
			//if the sender of the message is not the loggedin user, mark the message as read.
			if (message.getSender().getUid() !== loggedInUser?.uid && !message.readAt) {
				if (message.getReceiverType() === CometChat.RECEIVER_TYPE.USER) {
					CometChat.markAsRead(message).catch(error => {});
					CometChatMessageEvents.emit(CometChatMessageEvents.markMessageAsRead, message);

					//this.props.actionGenerated(enums.ACTIONS["MESSAGE_READ"], message);
				} else if (message.getReceiverType() === CometChatMessageReceiverType.group) {
					CometChat.markAsRead(message).catch(error => {});
					CometChatMessageEvents.emit(CometChatMessageEvents.markMessageAsRead, message);

					//this.props.actionGenerated(enums.ACTIONS["MESSAGE_READ"], message);
				}
			}
		});

		//lastScrollTop = messageListEndRef.scrollHeight;

		//update message list
		populateMessages(messagelist);
		if (scroll) {
			scrollToBottom();
		}

		//scrollToBottom ? populateMessagesAndScrollToBottom(messagelist) : populateMessages(messagelist);
		//CometChatMessageEvents.emit(emitAction, messagelist);

		//abort(don't return messagelist), when the chat window changes
		// if (prevChatWithIdRef && prevChatWithIdRef.current && prevChatWithIdRef.current === chatWithId) {
		//     CometChatMessageEvents.emit(emitAction, messagelist);
		//     //this.props.actionGenerated(enums.ACTIONS["MESSAGES_FETCHED"], messageList);
		// }
	};

	const scrollToBottom = (scrollHeight = 0) => {
		if (messageListEndRef && messageListEndRef.current) {
			messageListEndRef.current.scrollTop = messageListEndRef.current.scrollHeight - scrollHeight;
		}
	};

	const handleScroll = event => {
		const scrollTop = event.currentTarget.scrollTop;
		const scrollHeight = event.currentTarget.scrollHeight;
		const clientHeight = event.currentTarget.clientHeight;

		lastScrollTop = scrollHeight - scrollTop;

		if (lastScrollTop === clientHeight) {
			scrolledToBottom();
			CometChatMessageEvents.emit(CometChatMessageEvents.scrolledToBottom, event);
		}

		const top = Math.round(scrollTop) === 0;
		if (top && messageList.length) {
			fetchMessages(messageListManager)
				.then(messageList => messageHandler(messageList, false))
				.catch(error => {
					//setDecoratorMessage(localize("SOMETHING_WRONG"));
				});
		}
	};

	const draftMessage = message => {};

	/**
	 * new text and custom message
	 */
	const addMessage = message => {
		CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage);

		if (message.parentMessageId) {
			updateRepliesCount(message);
		} else {
			appendMessage(message);
		}
	};

	/** Update replies count in the parent message */
	const updateRepliesCount = message => {
		let messagelist = [...messageList];
		let messageKey = messagelist.findIndex(m => m.id === message.parentMessageId);
		if (messageKey > -1) {
			//const messageObject = new CometChat.BaseMessage({ ...messageList[messageKey] });
			const messageObject = { ...messageList[messageKey] };

			let replyCount = messageObject.getReplyCount() ? messageObject.getReplyCount() : 0;
			replyCount = replyCount + 1;
			messageObject.setReplyCount(replyCount);

			messagelist.splice(messageKey, 1, messageObject);
			setMessageList(messagelist);
		}
	};

	/** Append message to the message list and scroll to the bottom */
	const appendMessage = message => {
		
		const messagelist = [...messageList];
		messagelist.push(message);
		setMessageList(messagelist);
		scrollToBottom();

		//setScrollToBottom(true);
	};

	const storeMessage = message => {
		let unreadmessagelist = [...unreadMessageList];
		unreadmessagelist.push(message);

		setUnreadMessageList(unreadmessagelist);
	};

	/**
	 * Update message as sent; show single grey tick
	 */
	const updateMessageAsSent = message => {

		const messagelist = [...messageList];

		let messageKey = messagelist.findIndex(m => m._id === message._id);
		if (messageKey > -1) {

			const messageObject = { ...message };

			messagelist.splice(messageKey, 1, messageObject);
			messagelist.sort((a, b) => a.id - b.id);

			setMessageList(messagelist);
			scrollToBottom();
		}
	};

	/**
	 * Update message as delivered; show double grey tick
	 */
	const updateMessageAsDelivered = message => {
		const messagelist = [...messageList];
		let messageKey = messagelist.findIndex(m => m.id === message.id);

		if (messageKey > -1) {
			//const messageObject = new CometChat.BaseMessage({ ...messageList[messageKey] });
			const messageObject = { ...messageList[messageKey] };

			messageObject.setDeliveredAt(message.getDeliveredAt());
			messagelist.splice(messageKey, 1, messageObject);

			setMessageList(messagelist);
			//setScrollToBottom(false);
		}
	};

	/**
	 * Update message as read; show double blue tick
	 */
	const updateMessageAsRead = message => {
		const messagelist = [...messageList];
		let messageKey = messagelist.findIndex(m => m.id === message.id);

		if (messageKey > -1) {
			//const messageObject = new CometChat.BaseMessage({ ...messageList[messageKey] });

			const messageObject = { ...messageList[messageKey] };
			messageObject.setReadAt(message.getReadAt());
			messagelist.splice(messageKey, 1, messageObject);
			setMessageList(messagelist);

			//setScrollToBottom(false);
		}
	};

	/**
	 * Update message as deleted; show deleted message bubble
	 */
	const updateMessageAsDeleted = message => {
		const messages = [...messageList];
		let messageKey = messages.findIndex(m => m.id === message.id);
		if (messageKey > -1) {
			if (props.hideDeletedMessage) {
				messages.splice(messageKey, 1);
			} else {
				const messageObject = { ...messages[messageKey], ...message };
				//const newMessageObject = getCometChatMessage(messageObject);
				//newMessageObject.setDeletedAt(newMessageObject.getDeletedAt());
				messages.splice(messageKey, 1, messageObject);
			}

			setMessageList(messages);
			//setScrollToBottom(false);
		}
	};

	/**
	 * Update message
	 */
	const updateMessage = message => {
	
		const messagelist = [...messageList];
		let messageKey = messagelist.findIndex(m => m.id === message.id);
		
		if (messageKey > -1) {
			const messageObject = { ...messageList[messageKey], ...message };
			messagelist.splice(messageKey, 1, messageObject);

			setMessageList(messagelist);
			//setScrollToBottom(false);
		}
	};

	/**
	 * append group action message
	 */
	const addGroupActionMessage = message => {
		if (props.hideGroupActionMessage) {
			return false;
		}

		appendMessage(message);
	};

	/**
	 * append group action message
	 */
	const addCallActionMessage = message => {
		if (props.hideCallActionMessage) {
			return false;
		}

		appendMessage(message);
	};

	/**
	 * update message list
	 */
	const populateMessages = messages => {
		const messagelist = [...messages, ...messageList];
		setMessageList(messagelist);
	};

	/**
	 * update message list and scroll to bottom
	 */
	// const populateMessagesAndScrollToBottom = messages => {
	// 	const messagelist = [...messageList, ...messages];
	// 	setMessageList(messagelist);
	// 	setScrollToBottom(true);
	// };

	/**
	 * Upon scrolling to bottom, reload the chat if messages cross the maximum count,
	 * or else render and update (mark them as read) the stored messages
	 */
	const scrolledToBottom = () => {
		if (!unreadMessageList.length) {
			return false;
		}

		let unreadMessages = [...unreadMessageList];
		let messages = [...messageList];
		messages = messages.concat(unreadMessages);

		if (messages.length > messageConstants.maximumNumOfMessages) {
			reInitializeMessageBuilder();
		} else {
			updateStoredMessages();
		}
	};

	/**
	 * upon scrolling to the bottom, update the unread messagess
	 */
	const updateStoredMessages = () => {
		let unreadMessages = [...unreadMessageList];
		let messages = [...messageList];

		unreadMessages.forEach(unreadMessage => {
			//if (unreadMessage.receiverType === CometChat.RECEIVER_TYPE.USER || unreadMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
			messages.push(unreadMessage);
			markMessageAsRead(unreadMessage);
			//}
		});

		setMessageList(messages);
		setUnreadMessageList([]);
		scrollToBottom();
	};

	/**
	 * reset message list
	 */
	const resetChatWindow = () => {
		setMessageList([]);
	};

	const handlers = {
		onTextMessageReceived: handleNewMessages,
		onMediaMessageReceived: handleNewMessages,
		onCustomMessageReceived: handleNewCustomMessages,
		onMessagesDelivered: handleMessageDeliveryAndReadReceipt,
		onMessagesRead: handleMessageDeliveryAndReadReceipt,
		onMessageDeleted: handleMessageDelete,
		onMessageEdited: handleMessageEdit,
		onGroupMemberScopeChanged: handleNewGroupActionMessage,
		onGroupMemberKicked: handleNewGroupActionMessage,
		onGroupMemberBanned: handleNewGroupActionMessage,
		onGroupMemberUnbanned: handleNewGroupActionMessage,
		onMemberAddedToGroup: handleNewGroupActionMessage,
		onGroupMemberLeft: handleNewGroupActionMessage,
		onGroupMemberJoined: handleNewGroupActionMessage,
		onIncomingCallReceived: handleNewCallActionMessage,
		onIncomingCallCancelled: handleNewCallActionMessage,
		onOutgoingCallAccepted: handleNewCallActionMessage,
		onOutgoingCallRejected: handleNewCallActionMessage,
	};

	Hooks(props, setLoggedInUser, messageList, setMessageList, prevChatWithIdRef, chatWithId, setDecoratorMessage, setChatWith, setChatWithType, setChatWithId, messageHandler, messageListManager, messageListCallback, handlers, callbackData);

	const decoratorMessageContainer =
		decoratorMessage.length && !props.children ? (
			<div style={decoratorMessageStyle()} className="messages__decorator-message">
				<p style={decoratorMessageTxtStyle(props)} className="decorator-message">
					{decoratorMessage}
				</p>
			</div>
		) : null;

	const renderItems = () => {
		//const messageAlignment = props.configurations?.messageAlignment || defaultMessageConfiguration.messageAlignment;
		//const messageTimeAlignment = props.configurations?.messageTimeAlignment || defaultMessageConfiguration.messageTimeAlignment;

		return messageList.map(eachMessage => {
			const messageKey = eachMessage._id || eachMessage.id;
			const className = `message__${eachMessage.type} message__kit__background`;

			let messageStyle = {};
			if (props.messageAlignment === messageAlignment.standard && loggedInUser?.uid === eachMessage?.sender?.uid) {

				messageStyle = {
					backgroundColor: "#39f",
					textColor: "#fff",
					textFont: "14px Inter, sans-serif",
					subTitleColor: "rgb(20,20,20)",
					subTitleFont: "14px Inter, sans-serif",
					cornerRadius: "12px",
					iconTint: "#fff",
					usernameFont: "11px Inter sans-serif",
					usernameColor: "rgba(20, 20, 20, 0.4)",
					pollStyle: {
						voteCountColor: "#fff",
						voteCountFont: "400 13px Inter,sans-serif",
						pollOptionsFont: "400 15px Inter,sans-serif",
						pollOptionsColor: "#fff",
						pollOptionsBackgroundColor: "#fff",
					},
					documentStyle: {
						title: localize("SHARED_COLLABORATIVE_DOCUMENT"),
						titleFont: "14px Inter, sans-serif",
						titleColor: "#fff",
						buttonText: localize("LAUNCH"),
						buttonTextColor: "#39f",
						buttonTextFont: "600 14px Inter,sans-serif",
						buttonBackgroundColor: "#fff",
						iconColor: "#fff",
					},
					whiteboardStyle: {
						title: localize("CREATED_WHITEBOARD"),
						titleFont: "14px Inter, sans-serif",
						titleColor: "#fff",
						buttonText: localize("LAUNCH"),
						buttonTextColor: "#39f",
						buttonTextFont: "600 14px Inter,sans-serif",
						buttonBackgroundColor: "#fff",
						iconColor: "#fff",
					},
				};
			} else {
				messageStyle = {
					backgroundColor: "rgb(246, 246, 246)",
					textColor: "rgb(20, 20, 20)",
					textFont: "14px Inter, sans-serif",
					subTitleColor: "rgb(20,20,20)",
					subTitleFont: "14px Inter, sans-serif",
					cornerRadius: "12px",
					iconTint: "#39f",
					usernameFont: "11px Inter,sans-serif",
					usernameColor: "rgba(20, 20, 20, 0.4)",
					pollStyle: {
						voteCountColor: "rgb(20, 20, 20)",
						voteCountFont: "400 13px Inter,sans-serif",
						pollOptionsFont: "400 15px Inter,sans-serif",
						pollOptionsColor: "rgb(20, 20, 20)",
						pollOptionsBackgroundColor: "#fff",
					},
					documentStyle: {
						title: localize("SHARED_COLLABORATIVE_DOCUMENT"),
						titleFont: "14px Inter, sans-serif",
						titleColor: "rgb(20, 20, 20)",
						buttonText: localize("JOIN"),
						buttonTextColor: "#39f",
						buttonTextFont: "600 14px Inter,sans-serif",
						buttonBackgroundColor: "#fff",
						iconColor: "#39f",
					},
					whiteboardStyle: {
						title: localize("SHARED_COLLABORATIVE_WHITEBOARD"),
						titleFont: "14px Inter, sans-serif",
						titleColor: "rgb(20, 20, 20)",
						buttonText: localize("JOIN"),
						buttonTextColor: "#39f",
						buttonTextFont: "600 14px Inter,sans-serif",
						buttonBackgroundColor: "#fff",
						iconColor: "#39f",
					},
				};
			}

			return (
				<div key={messageKey} className={className} style={messageBubbleStyle(props, loggedInUser, eachMessage)}>
					<CometChatMessageBubble
						key={messageKey}
						messageKey={messageKey}
						messageObject={eachMessage}
						messageAlignment={props.messageAlignment}
						messageTimeAlignment={props.messageTimeAlignment}
						loggedInUser={loggedInUser}
						messageFilterList={props.messageFilterList}
						messageStyle={messageStyle}
						onMessageOptionClick={handleMessageOptionClick}
					/>
				</div>
			);
		});
	};

	return (
		<div className="chat__list" style={chatListStyle(props)}>
			{decoratorMessageContainer}
			<div className="list__wrapper" style={listWrapperStyle(props)} ref={messageListEndRef} onScroll={handleScroll}>
				{renderItems()}
			</div>
		</div>
	);
});

CometChatMessageList.propTypes = {
	width: PropTypes.string,
	height: PropTypes.string,
	user: PropTypes.object,
	group: PropTypes.object,
	parentMessage: PropTypes.object,
	messageAlignment: PropTypes.oneOf(["leftAligned", "standard"]),
	messageTimeAlignment: PropTypes.oneOf(["top", "bottom"]),
	hideDeletedMessage: PropTypes.bool,
	hideGroupActionMessage: PropTypes.bool,
	hideCallActionMessage: PropTypes.bool,
	messageFilterList: PropTypes.array,
	background: PropTypes.string,
};

CometChatMessageList.defaultProps = {
	width: "100%",
	height: "100%",
	user: null,
	group: null,
	parentMessage: null,
	messageAlignment: "leftAligned",
	messageTimeAlignment: "bottom",
	hideDeletedMessage: false,
	hideGroupActionMessage: false,
	hideCallActionMessage: false,
	messageFilterList: [],
	background: "white",
};

export { CometChatMessageList };