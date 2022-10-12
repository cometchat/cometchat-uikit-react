import { CometChat } from "@cometchat-pro/chat";

export const CometChatMessageTypes = Object.freeze({
	text: CometChat.MESSAGE_TYPE.TEXT,
	file: CometChat.MESSAGE_TYPE.FILE,
	image: CometChat.MESSAGE_TYPE.IMAGE,
	audio: CometChat.MESSAGE_TYPE.AUDIO,
	video: CometChat.MESSAGE_TYPE.VIDEO,
});
