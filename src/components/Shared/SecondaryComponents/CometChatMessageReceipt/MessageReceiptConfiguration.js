import { MessageReceiptStyle } from "../../../Shared";
import waitIcon from "./resources/wait.svg";
import sentIcon from "./resources/message-sent.svg";
import deliveredIcon from "./resources/message-delivered.svg";
import readIcon from "./resources/message-read.svg";
import errorIcon from "./resources/warning-small.svg";

/**
 * @class MessageReceiptConfiguration
 * @param {Object} style
 * @param {String} messageWaitIcon
 * @param {String} messageSentIcon
 * @param {String} messageDeliveredIcon
 * @param {String} messageReadIcon
 * @param {String} messageErrorIcon
 */
class MessageReceiptConfiguration {
  constructor({
    style = new MessageReceiptStyle({}),
    messageWaitIcon = waitIcon,
    messageSentIcon = sentIcon,
    messageDeliveredIcon = deliveredIcon,
    messageReadIcon = readIcon,
    messageErrorIcon = errorIcon,
  }) {
    this.style = new MessageReceiptStyle(style ?? {});
    this.messageWaitIcon = messageWaitIcon;
    this.messageSentIcon = messageSentIcon;
    this.messageDeliveredIcon = messageDeliveredIcon;
    this.messageReadIcon = messageReadIcon;
    this.messageErrorIcon = messageErrorIcon;
  }
}

export { MessageReceiptConfiguration };
