import { CometChat } from "@cometchat-pro/chat";

export class MessagesManager {

	msgListenerId = "messages_" + new Date().getTime();

	attachListeners(callback) {
		CometChat.addMessageListener(
			this.msgListenerId,
			new CometChat.MessageListener({
				onTransientMessageReceived: transientMessage => {
					callback("onTransientMessageReceived", transientMessage);
				},
			}),
		);
	}

	removeListeners() {
		CometChat.removeMessageListener(this.msgListenerId);
	}
}