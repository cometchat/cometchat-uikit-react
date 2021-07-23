class CometChatEvent {
	static _triggers = {};

	static on(event, callback) {
		if (!CometChatEvent._triggers[event]) CometChatEvent._triggers[event] = [];
		CometChatEvent._triggers[event].push(callback);
	}

	static triggerHandler(event, params) {
		if (CometChatEvent._triggers[event]) {
			for (const i in CometChatEvent._triggers[event]) CometChatEvent._triggers[event][i](params);
		}
	}
}

export { CometChatEvent };