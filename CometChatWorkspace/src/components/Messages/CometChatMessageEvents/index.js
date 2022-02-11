class CometChatMessageEvents {
	static messageReceived = Symbol("messageReceived");
	static customMessageReceived = Symbol("customMessageReceived");
	static groupActionMessageReceived = Symbol("groupActionMessageReceived");
	static callActionMessageReceived = Symbol("callActionMessageReceived");
	static messageRead = Symbol("messageRead");
	static messageDelivered = Symbol("messageDelivered");
	static messageEdited = Symbol("messageEdited");
	static messageDeleted = Symbol("messageDeleted");

	static messagesFetched = Symbol("messagesFetched");
	static previousMessagesFetched = Symbol("previousMessagesFetched");
	static refreshingMessages = Symbol("refreshingMessages");
	static messagesRefreshed = Symbol("messagesRefreshed");
	static storeMessage = Symbol("storeMessage");
	static scrolledUp = Symbol("scrolledUp");
	static scrolledToBottom = Symbol("scrolledToBottom");

	static markMessageAsRead = Symbol("markMessageAsRead");
	static onMessageSent = Symbol("messageSent");
	static onLiveReaction = Symbol("onLiveReaction");
	static onMessageError = Symbol("messageError");

	static onMessageReaction = Symbol("onMessageReaction");
	static onMessageReactionError = Symbol("onMessageReactionError");
	static previewMessageForEdit = Symbol("previewMessageForEdit");

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

		if (CometChatMessageEvents._triggers[event]) {
			for (const i in CometChatMessageEvents._triggers[event]) {
				CometChatMessageEvents._triggers[event][i](params);
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

		if (CometChatMessageEvents._triggers[event]) {
			delete CometChatMessageEvents._triggers[event][id];
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

		if (!CometChatMessageEvents._triggers[event]) {
			CometChatMessageEvents._triggers[event] = {};
		}

		CometChatMessageEvents._triggers[event][id] = callback;
	};
}

export { CometChatMessageEvents };