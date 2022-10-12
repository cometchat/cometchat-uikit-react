import { CometChatMessageEvents } from "../../../Messages/CometChatMessageEvents";

export class CometChatUIKitHelper {
	static onMessageRead = (messageObject) => {
		CometChatMessageEvents.emit(
			CometChatMessageEvents.onMessageRead,
			messageObject
		);
	};

	static onMessageEdit = (messageObject, status) => {
		CometChatMessageEvents.emit(CometChatMessageEvents.onMessageEdit, {
			message: messageObject,
			status: status,
		});
	};

	static onMessageSent = (messageObject, status) => {
		CometChatMessageEvents.emit(CometChatMessageEvents.onMessageSent, {
			message: messageObject,
			status: status,
		});
	};

	static onMessageDelete = (messageObject, status) => {
		CometChatMessageEvents.emit(CometChatMessageEvents.onMessageDelete, {
			message: messageObject,
			status: status,
		});
	};

	static onMessageReact = (messageObject, reaction) => {
		CometChatMessageEvents.emit(CometChatMessageEvents.onMessageReact, {
			message: messageObject,
			reaction: reaction,
		});
	};

	static onMessageError = (messageObject, errorCode) => {
		CometChatMessageEvents.emit(CometChatMessageEvents.onMessageError, {
			message: messageObject,
			error: errorCode,
		});
	};
}
