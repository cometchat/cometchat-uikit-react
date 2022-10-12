class CometChatGroupEvents {
	static onItemClick = Symbol("onItemClick");
	static onSearch = Symbol("onSearch");
	static onCreateGroupIconClick = Symbol("onCreateGroupIconClick");
	static onGroupCreate = Symbol("onGroupCreate");
	static onGroupError = Symbol("onGroupError");
	static onGroupDelete = Symbol("onGroupDelete");
	static onGroupLeave = Symbol("onGroupLeave");
	static onGroupMemberLeave = Symbol("onGroupMemberLeave");
	static onGroupMemberScopeChange = Symbol("onGroupMemberScopeChange");
	static onGroupMemberBan = Symbol("onGroupMemberBan");
	static onGroupMemberKick = Symbol("onGroupMemberKick");
	static onGroupMemberUnban = Symbol("onGroupMemberUnban");
	static onGroupMemberJoin = Symbol("onGroupMemberJoin");
	static onGroupMemberAdd = Symbol("onGroupMemberAdd");
	static onOwnershipChange = Symbol("onOwnershipChange");

	static _triggers = {};

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

		if (CometChatGroupEvents._triggers[event]) {
			for (const i in CometChatGroupEvents._triggers[event]) {
				CometChatGroupEvents._triggers[event][i](params);
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

		if (CometChatGroupEvents._triggers[event]) {
			delete CometChatGroupEvents._triggers[event][id];
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

		if (!CometChatGroupEvents._triggers[event]) {
			CometChatGroupEvents._triggers[event] = {};
		}

		CometChatGroupEvents._triggers[event][id] = callback;
	};
}

export { CometChatGroupEvents };
