import React from "react";
import { CometChat } from "@cometchat-pro/chat";

import { MessageHeaderConfiguration, MessageListConfiguration, MessageComposerConfiguration } from "../../";


export const Hooks = (
	props,
	setLoggedInUser, 
	messagesManager, 
	messagesCallback,
	headerConfig,
	listConfig,
	composerConfig
	) => {
	
	React.useEffect(() => {
		//fetching logged in user
		CometChat.getLoggedinUser().then(user => setLoggedInUser(user));

		//attaching listeners for transient message
		messagesManager.attachListeners(messagesCallback);

		//applying configurations
		const messageHeaderConfig = new MessageHeaderConfiguration();
		headerConfig.current.background = props.configurations?.messageHeaderConfiguration?.background || messageHeaderConfig.background;

		const messageListConfig = new MessageListConfiguration();
		listConfig.current.background = props.configurations?.messageListConfiguration?.background || new messageListConfig().background;

		const messageComposerConfig = new MessageComposerConfiguration();
		composerConfig.current.background = props.configurations?.messageComposerConfiguration?.background || messageComposerConfig.background;
		composerConfig.current.placeholder = props.configurations?.messageComposerConfiguration?.placeholder || messageComposerConfig.placeholder;
		composerConfig.current.sendButtonIconURL = props.configurations?.messageComposerConfiguration?.sendButtonIconURL || messageComposerConfig.sendButtonIconURL;

	}, []);
	
};
