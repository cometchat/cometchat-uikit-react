import React from "react";
import { CometChat } from "@cometchat-pro/chat";
import PropTypes from "prop-types";

import { CometChatSoundManager, CometChatConversationListItem, localize } from "../../";

import { conversationType, CometChatConversationEvents } from "../";
import { CometChatBackdrop, CometChatConfirmDialog, CometChatMessageReceiverType } from "../../";
import { ConversationListManager } from "./controller";
import { getConversations, Hooks } from "./hooks";

import {
	chatsListStyle,
	messageContainerStyle,
	messageTextStyle
} from "./style";

/**
 * 
 * CometChatConversationList component retrieves the latest conversations that a CometChat logged-in user has been a part of. 
 * The state of the component is communicated via 3 states i.e empty, loading and error
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
const CometChatConversationList = React.forwardRef((props, ref) => {
	const incrementUnreadCount = true;

	const [conversationListManager] = React.useState(new ConversationListManager(props));
	const [conversationList, setConversationList] = React.useState([]);
	const [callbackData, setCallbackData] = React.useState(null);
	const [message, setMessage] = React.useState(localize("LOADING"));
	const [background, setBackground] = React.useState(props.background);

	const [isDelete, setIsDelete] = React.useState(false);
	const [conversationToBeDeleted, setConversationToBeDeleted] = React.useState(null);
	
	const conversationCallback = (listenerName, ...args) => {
		setCallbackData({ name: listenerName, args: [...args] });
	};

	// /**
	//  * Remove conversation from the conversationlist upon delete
	//  */
	// React.useImperativeHandle(ref, () => ({
	// 	removeConversation: removeConversation,
	// }));

	/**
	 *
	 * Mark the incoming message as delivered
	 */
	const markMessageAsDelivered = message => {
		if (message.hasOwnProperty("deliveredAt") === false) {
			CometChat.markAsDelivered(message);
		}
	};

	/**
	 *
	 * If the incoming message is 1-1 conversation, and the conversation type filter is set to groups return false
	 * If the incoming message is group conversation, and the conversation type filter is set to users return false
	 * else return true
	 *
	 */
	const filterByConversationType = message => {
		if (props.conversationType !== conversationType["both"]) {
			if ((props.conversationType === conversationType["users"] && message.receiverType === CometChat.RECEIVER_TYPE.GROUP) 
			|| (props.conversationType === conversationType["groups"] && message.receiverType === CometChat.RECEIVER_TYPE.USER)) {
				return false;
			}
		}

		return true;
	};

	/**
	 *
	 * Converting message object received in the listener callback to conversation object
	 */
	const getConversationFromMessage = message => {
		return new Promise((resolve, reject) => {
			CometChat.CometChatHelper.getConversationFromMessage(message)
				.then(conversation => {
					let conversationKey = conversationList.findIndex(c => c.conversationId === conversation.conversationId);
					if (conversationKey > -1) {
						resolve({
							conversationKey: conversationKey,
							conversationId: conversation.conversationId,
							conversationType: conversation.conversationType,
							conversationWith: conversation.conversationWith,
							conversation: conversationList[conversationKey],
							conversations: [...conversationList],
						});
					}

					resolve({
						conversationKey: conversationKey,
						conversationId: conversation.conversationId,
						conversationType: conversation.conversationType,
						conversationWith: conversation.conversationWith,
						conversation: conversation,
						conversations: [...conversationList],
					});
				})
				.catch(error => reject(error));
		});
	};

	const getUnreadMessageCount = (message, conversation = {}) => {
		// need to discuss w mayur
		let unreadMessageCount = conversation.unreadMessageCount ? Number(conversation.unreadMessageCount) : 0;

		if (incrementUnreadCount === true) {
			unreadMessageCount = shouldIncrementCount(message) ? ++unreadMessageCount : unreadMessageCount;
		} else {
			unreadMessageCount = 0;
		}

		return unreadMessageCount;
	};

	/**
	 *
	 * If the message is sent by the logged in user, return false
	 * If the message has category message or has incrementUnreadCount key in the metadata with value set to true, return true else return false
	 *
	 */
	const shouldIncrementCount = message => {
		if (message?.sender?.uid === props.loggedInUser?.uid) {
			return false;
		}

		if (message.category === CometChat.CATEGORY_MESSAGE || (message.metadata && message.metadata.incrementUnreadCount && message.metadata.incrementUnreadCount) === true) {
			return true;
		}

		return false;
	};

	/**
	 * play notification sound for incoming messages
	 */
	const playNotificationSound = message => {
		/**
		 * If unreadcount is not incremented, don't play notification sound
		 */
		if (!shouldIncrementCount(message)) {
			return false;
		}

		/**
		 * If group action messages are hidden, and the incoming message is of category `action` and type `groupMember`, don't play notification sound
		 */
		const hideGroupActionMessages = props.configurations?.ConversationListItemConfiguration?.hideGroupActionMessages;
		if (hideGroupActionMessages === true && message.category === CometChat.CATEGORY_ACTION && message.type === CometChat.ACTION_TYPE.TYPE_GROUP_MEMBER) {
			return false;
		}

		if (props.activeConversation && props.activeConversation.conversationType && props.activeConversation.conversationWith) {
			const receiverType = message.getReceiverType();
			const receiverId = receiverType === CometChat.RECEIVER_TYPE.USER ? message.getSender().getUid() : message.getReceiverId();

			if (receiverId !== props.activeConversation.conversationWith?.uid && receiverId !== props.activeConversation.conversationWith?.guid) {
				CometChatSoundManager.play(CometChatSoundManager.Sound.incomingMessageFromOther);
			}
		} else {
			CometChatSoundManager.play(CometChatSoundManager.Sound.incomingMessageFromOther);
		}

		// CometChatSoundManager.play(CometChatSoundManager.Sound["incomingmessage"],
		// "https://proxy.notificationsounds.com/message-tones/pristine-609/download/file-sounds-1150-pristine.mp3");
	};

	/**
	 *
	 * When a user goes online/ offline
	 */
	const handleUsers = user => {
		const conversationKey = conversationList.findIndex(
			eachConversation =>
				eachConversation.conversationType && eachConversation.conversationType === CometChat.RECEIVER_TYPE.USER && eachConversation.conversationWith && eachConversation.conversationWith.uid && eachConversation.conversationWith.uid === user.uid,
		);

		if (conversationKey > -1) {

			let conversations = [...conversationList];
			let conversation = conversations[conversationKey];
			let conversationWith = { ...conversation.conversationWith, status: user.getStatus() };

			let newConversation = { ...conversation, conversationWith: conversationWith };
			conversations.splice(conversationKey, 1, newConversation);
			setConversationList(conversations);
		}
	};

	/**
	 *
	 * When a text message / media message / custom message is received
	 */
	const handleMessages = (...options) => {
		const message = options[0];
		/**
		 * marking the incoming messages as read
		 */
		markMessageAsDelivered(message);

		/**
		 * If the incoming message is 1-1 and the conversation type filter is set to group, return false
		 * OR
		 * If the incoming message is group and the conversation type filter is set to "users", return false
		 * ELSE
		 * return true
		 */
		if (filterByConversationType() === false) {
			return false;
		}

		getConversationFromMessage(message).then(response => {
			const { conversationKey, conversationId, conversationType, conversationWith, conversation, conversations } = response;

			const lastMessage = { ...conversation.lastMessage, ...message };

			if (conversationKey > -1) {
				const unreadMessageCount = getUnreadMessageCount(message, conversation);

				const newConversation = new CometChat.Conversation(conversationId, conversationType, lastMessage, conversationWith, unreadMessageCount);
				conversations.splice(conversationKey, 1);
				conversations.unshift(newConversation);
				setConversationList(conversations);

				//play notification sound
				playNotificationSound(message);
			} else {
				const unreadMessageCount = getUnreadMessageCount(message);
				const newConversation = new CometChat.Conversation(conversationId, conversationType, lastMessage, conversationWith, unreadMessageCount);
				conversations.unshift(newConversation);
				setConversationList(conversations);

				//play notification sound
				playNotificationSound(message);
			}
		});
	};

	/**
	 * Listener callback when a message is edited, deleted or updated
	 */
	const handleMessageActions = (...options) => {
		const message = options[0];

		getConversationFromMessage(message).then(response => {
			const { conversationKey, conversationId, conversationType, conversationWith, conversation, conversations } = response;

			if (conversationKey > -1 && conversation.lastMessage.id === message.id) {
				const lastMessage = { ...conversation.lastMessage, ...message };
				const unreadMessageCount = getUnreadMessageCount(message, conversation);

				const newConversation = new CometChat.Conversation(conversationId, conversationType, lastMessage, conversationWith, unreadMessageCount);
				conversations.splice(conversationKey, 1, newConversation);
				setConversationList(conversations);
			}
		});
	};

	/**
	 *
	 * Listener callback when a message is read
	 */
	const handleMessageReadActions = (...options) => {
		const messageReceipt = options[0];

		let conversationKey = conversationList.findIndex(
			conversation => messageReceipt?.receiverType === conversation?.conversationType && (messageReceipt?.receiver === conversation?.conversationWith?.uid || messageReceipt?.receiver === conversation?.conversationWith?.guid),
		);

		if (conversationKey > -1) {
			const conversations = { ...conversationList };
			const conversation = conversations[conversationKey];
			let unreadMessageCount = conversation.unreadMessageCount;

			/**
			 * If the message id in the read receipt is greater than or equal to the lastmessage id, set unreadmessagecount to 0
			 */
			if (messageReceipt?.messageId >= conversation?.lastMessage?.id) {
				unreadMessageCount = 0;
			}

			const newConversation = new CometChat.Conversation(conversation.conversationId, conversation.conversationType, conversation.lastMessage, conversation.conversationWith, unreadMessageCount);

			conversations.splice(conversationKey, 1, newConversation);
			setConversationList(conversations);
		}
	};

	/**
	 *
	 * Listener callback when a user joins/added to the group
	 */
	const handleGroupMemberAddition = (...options) => {
		const message = options[0];
		const newUser = options[1];
		const group = options[3];

		getConversationFromMessage(message).then(response => {
			const { conversationKey, conversationId, conversationType, conversationWith, conversation, conversations } = response;

			if (conversationKey > -1) {
				const lastMessage = { ...conversation.lastMessage, ...message };
				const newConversationWith = { ...conversationWith, ...group };
				const unreadMessageCount = conversation.unreadMessageCount;

				const newConversation = new CometChat.Conversation(conversationId, conversationType, lastMessage, newConversationWith, unreadMessageCount);
				conversations.splice(conversationKey, 1, newConversation);
				setConversationList(conversations);
			} else if (props.loggedInUser?.uid === newUser.uid) {
				/**
				 * If the loggedin user is added to the group, add the conversation to the chats list
				 */
				const lastMessage = { ...message };
				const newConversationWith = { ...conversationWith, ...group, hasJoined: true };
				const unreadMessageCount = conversation.unreadMessageCount;

				const newConversation = new CometChat.Conversation(conversationId, conversationType, lastMessage, newConversationWith, unreadMessageCount);

				conversations.unshift(newConversation);
				setConversationList(conversations);
			}
		});
	};

	/**
	 *
	 * Listener callback when a member is kicked from / has left the group
	 */
	const handleGroupMemberRemoval = (...options) => {
		const message = options[0];
		const removedUser = options[1];
		const group = options[3];

		getConversationFromMessage(message).then(response => {
			const { conversationKey, conversationId, conversationType, conversationWith, conversation, conversations } = response;

			if (conversationKey > -1) {
				/**
				 * If the loggedin user is removed from the group, remove the conversation from the chats list
				 */
				if (props.loggedInUser?.uid === removedUser.uid) {
					conversations.splice(conversationKey, 1);
					setConversationList(conversations);
				} else {
					const lastMessage = { ...conversation.lastMessage, ...message };
					const newConversationWith = { ...conversationWith, ...group };
					const unreadMessageCount = conversation.unreadMessageCount;

					const newConversation = new CometChat.Conversation(conversationId, conversationType, lastMessage, newConversationWith, unreadMessageCount);

					conversations.splice(conversationKey, 1, newConversation);
					setConversationList(conversations);
				}
			}
		});
	};

	/**
	 *
	 * Listener callback when a member is banned from the group
	 */
	const handleGroupMemberBan = (...options) => {
		const message = options[0];
		const removedUser = options[1];
		const group = options[3];

		getConversationFromMessage(message).then(response => {
			const { conversationKey, conversationId, conversationType, conversationWith, conversation, conversations } = response;

			if (conversationKey > -1) {
				/**
				 * If the loggedin user is banned from the group, remove the conversation from the chats list
				 */
				if (props.loggedInUser?.uid === removedUser.uid) {
					conversations.splice(conversationKey, 1);
					setConversationList(conversations);
				} else {
					const lastMessage = { ...conversation.lastMessage, ...message };
					const newConversationWith = { ...conversationWith, ...group };
					const unreadMessageCount = conversation.unreadMessageCount;

					const newConversation = new CometChat.Conversation(conversationId, conversationType, lastMessage, newConversationWith, unreadMessageCount);

					conversations.splice(conversationKey, 1, newConversation);
					setConversationList(conversations);
				}
			}
		});
	};

	/**
	 *
	 * Listener callback when a group member scope is updated
	 */
	const handleGroupMemberScopeChange = (...options) => {
		const message = options[0];
		const user = options[1];
		const newScope = options[2];
		const group = options[4];

		getConversationFromMessage(message).then(response => {
			const { conversationKey, conversationId, conversationType, conversationWith, conversation, conversations } = response;

			if (conversationKey > -1) {
				const lastMessage = { ...conversation.lastMessage, ...message };
				const unreadMessageCount = conversation.unreadMessageCount;

				if (props.loggedInUser?.uid === user.uid) {
					const newConversationWith = { ...conversationWith, ...group, scope: newScope };

					const newConversation = new CometChat.Conversation(conversationId, conversationType, lastMessage, newConversationWith, unreadMessageCount);

					conversations.splice(conversationKey, 1);
					conversations.unshift(newConversation);
					setConversationList(conversations);
				} else {
					let newConversationWith = { ...conversationWith, ...group };

					const newConversation = new CometChat.Conversation(conversationId, conversationType, lastMessage, newConversationWith, unreadMessageCount);

					conversations.splice(conversationKey, 1, newConversation);
					setConversationList(conversations);
				}
			}
		});
	};

	/**
	 *
	 * Listener callback for typing events
	 */
	const handleTyping = (...options) => {
		const typingData = options[0];
		const typingStarted = options[1];
		const conversations = [...conversationList];

		let conversationKey = conversations.findIndex(
			conversation =>
				conversation?.conversationType === typingData?.receiverType &&
				((conversation?.conversationType === CometChat.RECEIVER_TYPE.USER && conversation.conversationWith?.uid === typingData?.sender?.uid) ||
					(conversation.conversationType === CometChat.RECEIVER_TYPE.GROUP && conversation.conversationWith?.guid === typingData?.receiverId)),
		);

		if (conversationKey > -1) {
			let typingIndicatorText = "";
			if (typingStarted) {
				typingIndicatorText = typingData?.receiverType === CometChat.RECEIVER_TYPE.GROUP ? `${typingData?.sender?.name} ${localize("IS_TYPING")}` : localize("IS_TYPING");
			}

			const conversation = conversationList[conversationKey];
			const newConversation = { ...conversation, showTypingIndicator: typingStarted, typingIndicatorText };

			conversations.splice(conversationKey, 1, newConversation);
			setConversationList(conversations);
		}
	};

	const handlers = {
		onUserOnline: handleUsers,
		onUserOffline: handleUsers,
		onTextMessageReceived: handleMessages,
		onMediaMessageReceived: handleMessages,
		onCustomMessageReceived: handleMessages,
		onIncomingCallReceived: handleMessages,
		onIncomingCallCancelled: handleMessages,
		messageEdited: handleMessageActions,
		onMessageDeleted: handleMessageActions,
		messageRead: handleMessageReadActions,
		onMemberAddedToGroup: handleGroupMemberAddition,
		onGroupMemberJoined: handleGroupMemberAddition,
		onGroupMemberKicked: handleGroupMemberRemoval,
		onGroupMemberLeft: handleGroupMemberRemoval,
		onGroupMemberBanned: handleGroupMemberBan,
		onGroupMemberScopeChanged: handleGroupMemberScopeChange,
		onTypingStarted: handleTyping,
		onTypingEnded: handleTyping,
	};

	Hooks(props, setBackground, setMessage, conversationList, setConversationList, conversationCallback, conversationListManager, handlers, callbackData);

	const handleScroll = event => {
		const bottom = Math.round(event.currentTarget.scrollHeight - event.currentTarget.scrollTop) === Math.round(event.currentTarget.clientHeight);
		if (bottom) {
			getConversations(conversationListManager).then(conversations => {

				setConversationList([...conversations, ...conversationList]);
			});
		}
	};

	const clickHandler = () => {
		// CometChatConversationList.listeners.(element => {
		// });;
	};

	/**
	 * Remove conversation from the conversationlist upon delete
	 */
	const removeConversation = conversation => {
		const conversationKey = conversationList.findIndex(c => c.conversationId === conversation.conversationId);

		if (conversationKey > -1) {
			const newConversationList = [...conversationList];
			newConversationList.splice(conversationKey, 1);
			setConversationList(newConversationList);
		}
	};

	const getMessage = () => {
		if (message.trim().length !== 0) {
			return (
				<div style={messageContainerStyle()} className="chats__message">
					<p style={messageTextStyle()} className="message">
						{message}
					</p>
				</div>
			);
		}

		return null;
	};

	const deleteConversation = () => {
		
		return new Promise((resolve, reject) => {

			const conversationWith = conversationToBeDeleted.conversationType === CometChatMessageReceiverType.group ? 
			conversationToBeDeleted?.conversationWith?.guid : conversationToBeDeleted?.conversationWith?.uid;
			CometChat.deleteConversation(conversationWith, conversationToBeDeleted.conversationType)
				.then(deletedConversation => {

					CometChatConversationEvents.emit("onDeleteConversationSuccess", conversationToBeDeleted);
					removeConversation(conversationToBeDeleted);
					resolve(deletedConversation);
				})
				.catch(error => {

					CometChatConversationEvents.emit("onError", conversationToBeDeleted);
					reject(error);
				});
		});
	};

	const confirmDelete = conversation => {
		setConversationToBeDeleted(conversation);
		setIsDelete(true);
	};

	const cancelDelete = () => setIsDelete(false);

	CometChatConversationEvents.addListener(CometChatConversationEvents.onDeleteConversation, "deletelistener1", confirmDelete);

	const renderItems = conversationList.map(conversation => {
		const typingIndicatorText = conversation.typingIndicatorText ? conversation.typingIndicatorText : "";

		const background = props.configurations?.ConversationListItemConfiguration?.background || "transparent";
		const hideStatusIndicator = props.configurations?.ConversationListItemConfiguration?.hideStatusIndicator || false;
		const hideAvatar = props.configurations?.ConversationListItemConfiguration?.hideAvatar || false;
		const hideUnreadCount = props.configurations?.ConversationListItemConfiguration?.hideUnreadCount || false;

		let hideReceipt = false;
		if (props.configurations?.ConversationListItemConfiguration?.hideReceipt !== undefined) {
			hideReceipt = props.configurations?.ConversationListItemConfiguration?.hideReceipt;
		} else if (conversation.showTypingIndicator) {
			hideReceipt = true;
		}

		let showTypingIndicator;
		if (props.configurations?.ConversationListItemConfiguration?.showTypingIndicator !== true) {
			showTypingIndicator = false;
		} else {
			if (conversation.showTypingIndicator === undefined) {
				showTypingIndicator = false;
			} else {
				showTypingIndicator = conversation.showTypingIndicator;
			}
		}

		const hideThreadIndicator = props.configurations?.ConversationListItemConfiguration?.hideThreadIndicator || false;
		const hideGroupActionMessages = props.configurations?.ConversationListItemConfiguration?.hideGroupActionMessages || false;
		const hideDeletedMessages = props.configurations?.ConversationListItemConfiguration?.hideDeletedMessages || false;
		const showDeleteConversation = props.configurations?.ConversationListItemConfiguration?.showDeleteConversation || true;

		let border = "1px solid rgba(20, 20, 20, 10%)";
		if (props.configurations?.ConversationListItemConfiguration?.borderWidth !== undefined && props.configurations?.ConversationListItemConfiguration?.borderStyle !== undefined) {
			const borderWidth = props.configurations?.ConversationListItemConfiguration?.borderWidth;
			const borderStyle = props.configurations?.ConversationListItemConfiguration?.borderStyle;

			border = `${borderWidth} ${borderStyle} rgba(20, 20, 20, 10%)`;
		}

		let isActive = conversation?.conversationId === props?.activeConversation?.conversationId ? true : false;

		return (
			<CometChatConversationListItem
				border={border}
				conversation={conversation}
				isActive={isActive}
				background={background}
				hideAvatar={hideAvatar}
				hideStatusIndicator={hideStatusIndicator}
				hideUnreadCount={hideUnreadCount}
				hideReceipt={hideReceipt}
				showTypingIndicator={showTypingIndicator}
				typingIndicatorText={typingIndicatorText}
				hideThreadIndicator={hideThreadIndicator}
				threadIndicatorText={localize("IN_A_THREAD")}
				hideGroupActionMessages={hideGroupActionMessages}
				hideDeletedMessages={hideDeletedMessages}
				showDeleteConversation={showDeleteConversation}
				key={conversation.conversationId}
				configurations={props.configurations?.ConversationListItemConfiguration}
			/>
		);
	});

	return (
		<React.Fragment>
			<div className="conversationlist" style={{ width: "100%", height: "100%" }}>
				{getMessage()}
				<div style={chatsListStyle(background)} className="chats__list" onScroll={handleScroll} onClick={clickHandler}>
					{renderItems}
				</div>
				<CometChatBackdrop isOpen={isDelete} onClick={cancelDelete}>
					<CometChatConfirmDialog isOpen={isDelete} onConfirm={deleteConversation} onCancel={cancelDelete} width="50%" />
				</CometChatBackdrop>
			</div>
		</React.Fragment>
	);
});

CometChatConversationList.propTypes = {
	/** Background of the list, sets all background style properties at once, such as color, image, origin and size, or repeat method  */
	background: PropTypes.string,
	/** Active conversation object */
	activeConversation: PropTypes.object,
	/** CometChat loggedin user object */
	loggedInUser: PropTypes.object,
	/** Filter conversation list, fetch only user/group conversations */
	conversationType: PropTypes.oneOf(["users", "groups", "both"]),
	/** Configurable options of child component */
	configurations: PropTypes.object,
};

CometChatConversationList.defaultProps = {
	background: "transparent",
	loggedInUser: null,
	conversationType: "both",
	activeConversation: null,
	configurations: null,
};

export { CometChatConversationList };