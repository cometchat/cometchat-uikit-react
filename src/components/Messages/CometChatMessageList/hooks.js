import React from "react";
import { CometChat } from "@cometchat-pro/chat";
import { ReceiverTypeConstants, localize } from "../..";
import { MessageListManager } from "./controller";
import { getDefaultTypes } from "../CometChatMessageTemplate";

export const fetchMessages = (MessageListManager) => {
	return new Promise((resolve, reject) => {
		MessageListManager.fetchPreviousMessages()
			.then((messageList) => resolve(messageList))
			.catch((error) => reject(error));
	});
};

export const Hooks = (
	limit,
	user,
	group,
	excludeMessageTypes,
	onlyUnread,
	hideDeletedMessages,
	hideMessagesFromBlockedUsers,
	tags,
	messageTypes,
	loggedInUserRef,
	messageList,
	setMessageList,
	setDecoratorMessage,
	setChatWith,
	setChatWithType,
	messageHandler,
	messageListCallback,
	handlers,
	callbackData,
	messageTypesRef,
	messageCategoryRef,
	messageListManagerRef,
	localize,
	errorHandler,
	chatWith,
	chatWithType,
	setMessageCount,
	setnewMessage
) => {
	React.useEffect(() => {
		//fetching logged in user

		CometChat.getLoggedinUser()
			.then((user) => {
				loggedInUserRef.current = { ...user };

				// 	// Setting MessageList ManagerRef if messageTypes is supplied by the user
				if (messageTypes) {
					if (messageTypes.length === 0) {
						return (
							(messageCategoryRef.current = []),
							(messageTypesRef.current = []),
							setDecoratorMessage(localize("NO_MESSAGE_TYPE_SET"))
						);
					} else {
						messageTypesRef.current = messageTypes.map((value) => {
							return value.type;
						});
						messageCategoryRef.current = [
							...new Set(
								messageTypes.map((value) => {
									return value.category;
								})
							),
						];
						if (excludeMessageTypes && excludeMessageTypes.length) {
							messageTypesRef.current.filter(
								(val) => !excludeMessageTypes?.includes(val)
							);
						}
					}
				}
				// Setting MessageList ManagerRef by default
				else {
					const messageTemplateObject = getDefaultTypes();
					messageTypesRef.current = messageTemplateObject.map((value) => {
						return value.type;
					});
					messageCategoryRef.current = [
						...new Set(
							messageTemplateObject.map((value) => {
								return value.category;
							})
						),
					];
					if (excludeMessageTypes && excludeMessageTypes.length) {
						messageTypesRef.current.filter(
							(val) => !excludeMessageTypes?.includes(val)
						);
					}
				}
				messageListManagerRef.current = new MessageListManager(
					limit,
					user,
					group,
					onlyUnread,
					hideDeletedMessages,
					hideMessagesFromBlockedUsers,
					tags,
					messageTypesRef.current,
					messageCategoryRef.current
				);

				messageListManagerRef?.current?.attachListeners(messageListCallback);
				setMessageList([]);

				// Fetch MessageList
				fetchMessages(messageListManagerRef?.current)
					.then((messages) => {
						if (messageList.length === 0 && messages.length === 0) {
							setDecoratorMessage(localize("NO_MESSAGES_FOUND"));
						} else {
							setMessageCount(messages.length);
							setMessageList(messages);
							setDecoratorMessage("");
							messageHandler(messages, true);
						}
					})
					.catch((error) => {
						errorHandler(error);
						setDecoratorMessage(localize("SOMETHING_WRONG"));
					});
			})
			.catch((error) => {
				errorHandler(error);

				setDecoratorMessage(localize("SOMETHING_WRONG"));
			});
	}, []);

	// Update MessageList on change of props
	React.useEffect(() => {
		setnewMessage([]);
		if (messageTypes) {
			if (messageTypes.length === 0) {
				return (
					(messageCategoryRef.current = []),
					(messageTypesRef.current = []),
					setDecoratorMessage(localize("NO_MESSAGE_TYPE_SET"))
				);
			} else {
				messageTypesRef.current = messageTypes.map((value) => {
					return value.type;
				});
				messageCategoryRef.current = [
					...new Set(
						messageTypes.map((value) => {
							return value.category;
						})
					),
				];
				if (excludeMessageTypes && excludeMessageTypes.length) {
					messageTypesRef.current.filter(
						(val) => !excludeMessageTypes?.includes(val)
					);
				}
			}
		}

		messageListManagerRef.current = new MessageListManager(
			limit,
			user,
			group,
			onlyUnread,
			hideDeletedMessages,
			hideMessagesFromBlockedUsers,
			tags,
			messageTypesRef.current,
			messageCategoryRef.current
		);

		setMessageList([]);

		fetchMessages(messageListManagerRef?.current)
			.then((messages) => {
				if (messageList.length === 0 && messages.length === 0) {
					setDecoratorMessage(localize("NO_MESSAGES_FOUND"));
				} else {
					setMessageCount(messages.length);
					setMessageList(messages);
					setDecoratorMessage("");
				}
				messageHandler(messages, true);
			})
			.catch((error) => {
				errorHandler(error);

				setDecoratorMessage(localize("SOMETHING_WRONG"));
			});

		return () => {
			if (
				messageListManagerRef &&
				messageListManagerRef.current &&
				typeof messageListManagerRef.current.removeListeners === "function"
			) {
				messageListManagerRef.current?.removeListeners();
			}
		};
	}, [
		limit,
		tags,
		onlyUnread,
		user,
		group,
		messageTypes,
		hideDeletedMessages,
		hideMessagesFromBlockedUsers,
	]);

	//set receiver and receiver type
	React.useEffect(() => {
		//set receiver and receiver type
		if (user && user.uid) {
			setChatWithType(ReceiverTypeConstants.user);
			setChatWith(user);
		} else if (group && group.guid) {
			setChatWithType(ReceiverTypeConstants.group);
			setChatWith(group);
		}
	}, []);

	//update receiver and receiver type
	React.useEffect(() => {
		if (user && user.uid) {
			setChatWithType(ReceiverTypeConstants.user);
			setChatWith(user);
		} else if (group && group.guid) {
			setChatWithType(ReceiverTypeConstants.group);
			setChatWith(group);
		}
	}, [user, group, setChatWithType, setChatWith]);

	React.useEffect(() => {
		const handler = handlers[callbackData?.name];
		if (handler) return handler(...callbackData?.args);
	}, [callbackData]);
};
