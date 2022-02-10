import React from "react";
import { CometChat } from "@cometchat-pro/chat";

import { ConversationListConfiguration } from "../../";

export const Hooks = (props, setLoggedInUser, listConfig) => {

	React.useEffect(() => {

		//fetch loggedin user
		CometChat.getLoggedinUser().then(user => setLoggedInUser(user));

		const conversationListConfig = new ConversationListConfiguration();
		listConfig.current.background = props.configurations?.conversationListConfiguration?.background || conversationListConfig.background;

	}, []);
};