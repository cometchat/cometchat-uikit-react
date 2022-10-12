import closeIcon from "../../Messages/CometChatSmartReplies/resources/close.svg";
/**
 * @class SmartRepliesConfiguration
 * @description SmartRepliesConfiguration class is used for defining the smart Replies Template
 * @param {String} customOutgoingMessageSound
 * @param {String} enableSoundForMessages
 * @param {Function} onClick
 * @param {Function} onClose
 * @param {String} closeIconURL
 */
class SmartRepliesConfiguration {
	constructor({
		customOutgoingMessageSound = null,
		enableSoundForMessages = true,
		onClick = null,
		onClose = null,
		closeIconURL = closeIcon,
	}) {
		this.customOutgoingMessageSound = customOutgoingMessageSound;
		this.enableSoundForMessages = enableSoundForMessages;
		this.onClick = onClick;
		this.onClose = onClose;
		this.closeIconURL = closeIconURL;
	}
}

export { SmartRepliesConfiguration };
