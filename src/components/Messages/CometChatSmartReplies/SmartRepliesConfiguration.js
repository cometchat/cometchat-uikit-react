import closeIcon from "../../Messages/CometChatSmartReplies/resources/close.svg";
import { SmartReplyStyle } from "../";
/**
 * @class SmartRepliesConfiguration
 * @description SmartRepliesConfiguration class is used for defining the smart Replies Template
 * @param {String} customOutgoingMessageSound
 * @param {String} enableSoundForMessages
 * @param {Function} onClick
 * @param {Function} onClose
 * @param {String} closeIconURL
 * @param {object} style
 */
class SmartRepliesConfiguration {
  constructor({
    customOutgoingMessageSound = null,
    enableSoundForMessages = true,
    onClick = null,
    onClose = null,
    closeIconURL = closeIcon,
    style = new SmartReplyStyle({}),
  }) {
    this.customOutgoingMessageSound = customOutgoingMessageSound;
    this.enableSoundForMessages = enableSoundForMessages;
    this.onClick = onClick;
    this.onClose = onClose;
    this.closeIconURL = closeIconURL;
    this.style = new SmartReplyStyle(style || {});
  }
}

export { SmartRepliesConfiguration };
