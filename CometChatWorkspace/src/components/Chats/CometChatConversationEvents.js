class CometChatConversationEvents {
	static onItemClick = "onItemClick";
	static onStartConversation = "onStartConversation";
	static onSearch = "onSearch";
	static onDeleteConversation = "onDeleteConversation";
	static onDeleteConversationSuccess = "onDeleteConversationSuccess";
	static onError = "onError";

	static _triggers = {};

	static emit = (...args) => {
		let event, params;
		if (args.length === 2) {
			[event, params] = args;
		} else if (args.length === 1 && typeof args[0] === "object") {
			event = args[0].event;
			params = args[0].params;
		} else {
			throw new Error("Invalid arguments");
		}

		if (CometChatConversationEvents._triggers[event]) {
			for (const i in CometChatConversationEvents._triggers[event]) {
				CometChatConversationEvents._triggers[event][i](params);
			}
		}
	};

	static removeListener = (...args) => {
		let event, id;
		if (args.length === 2) {
			[event, id] = args;
		} else if (args.length === 1 && typeof args[0] === "object") {
			event = args[0].event;
			id = args[0].id;
		} else {
			throw new Error("Invalid arguments");
		}

		if (CometChatConversationEvents._triggers[event]) {
			delete CometChatConversationEvents._triggers[event][id];
		}
	};

	static addListener = (...args) => {
		let event, id, callback;
		if (args.length === 3) {
			[event, id, callback] = args;
		} else if (args.length === 1 && typeof args[0] === "object") {
			event = args[0].event;
			id = args[0].id;
			callback = args[0].callback;
		} else {
			throw new Error("Invalid arguments");
		}

		if (!CometChatConversationEvents._triggers[event]) {
			CometChatConversationEvents._triggers[event] = {};
		}

		CometChatConversationEvents._triggers[event][id] = callback;
	};
}

export { CometChatConversationEvents };