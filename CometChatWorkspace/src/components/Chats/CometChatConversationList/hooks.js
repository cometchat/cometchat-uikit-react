import React from "react";
import { localize } from "../../";

export const getConversations = conversationListManager => {

	return new Promise((resolve, reject) => {

		conversationListManager
			.fetchNextConversation()
			.then(conversations => resolve(conversations))
			.catch(error => reject(error));
	});
};

export const Hooks = (
	props, 
	setBackground, 
	setMessage, 
	conversationList, 
	setConversationList, 
	conversationCallback, 
	conversationListManager, 
	handlers, 
	callbackData) => {

	React.useEffect(() => {

		if(props.configurations && props.configurations.background) {
			setBackground(props.configurations.background);
		} else if (props.background) {
			setBackground(props.background);
		}

	}, [props])

	React.useEffect(() => {

		const handler = handlers[callbackData?.name];

		if (!handler) {
			return false;
		}

		return handler(...callbackData?.args);

	}, [callbackData]);

	React.useEffect(() => {

		conversationListManager.attachListeners(conversationCallback);

		getConversations(conversationListManager).then(conversations => {

			if (conversationList.length === 0 && conversations.length === 0) {
				setMessage(localize("NO_CHATS_FOUND"));
			} else {
				setMessage("");
			}

			setConversationList(conversationList => {
				return [...conversationList, ...conversations];
			});

		}).catch(error => {
			setMessage(localize("SOMETHING_WRONG"));
		});


	}, []);
};
