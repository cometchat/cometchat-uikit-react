import React from "react";
import { CometChat } from "@cometchat-pro/chat";

import { localize } from "../../";
import { CometChatMessageReceiverType } from "../";

export const fetchMessages = MessageListManager => {

	const promise = new Promise((resolve, reject) => {
		MessageListManager.fetchPreviousMessages()
			.then(messageList => {
				resolve(messageList);
			})
			.catch(error => reject(error));
	});

	return promise;
};

export const usePrevious = value => {

    const ref = React.useRef();
    React.useEffect(() => {
        ref.current = value;
    });

    return ref.current;
}

export const Hooks = (
    props,
	setLoggedInUser,
	messageList,
	setMessageList,
	prevChatWithIdRef, 
	chatWithId,
    setDecoratorMessage, 
    setChatWith, 
	setChatWithType,
    setChatWithId, 
    messageHandler, 
    messageListManager, 
	messageListCallback,
	handlers,
    callbackData
    ) => {

	React.useEffect(() => {

		//fetching logged in user
		CometChat.getLoggedinUser().then(user => setLoggedInUser(user));		
	}, []);

	//set receiver and receiver type
	React.useEffect(() => {

		//set receiver and receiver type
		if (props.user && props.user.uid) {
			setChatWithType(CometChatMessageReceiverType.user);
			setChatWith(props.user);
		} else if (props.group && props.group.guid) {
			setChatWithType(CometChatMessageReceiverType.group);
			setChatWith(props.group);
		}

	}, []);

	//fetch messages
	React.useEffect(() => {

		messageListManager.attachListeners(messageListCallback);
		fetchMessages(messageListManager)
			.then(messages => {

				if (messageList.length === 0 && messages.length === 0) {
					setDecoratorMessage(localize("NO_MESSAGES_FOUND"));
				} else {
					setDecoratorMessage("");
				}

				messageHandler(messages, true);
				
			})
			.catch(error => {
				setDecoratorMessage(localize("SOMETHING_WRONG"));
			});

	}, []);

	//update receiver and receiver type
	React.useEffect(() => {
		if (props.user && props.user.uid) {
			setChatWithType(CometChatMessageReceiverType.user);
			setChatWith(props.user);
		} else if (props.group && props.group.guid) {
			setChatWithType(CometChatMessageReceiverType.group);
			setChatWith(props.group);
		}
	}, [props.user, props.group, setChatWithType, setChatWith]);

	React.useEffect(() => {
		const handler = handlers[callbackData?.name];

		if (!handler) {
			return false;
		}

		return handler(...callbackData?.args);
	}, [callbackData]);
};