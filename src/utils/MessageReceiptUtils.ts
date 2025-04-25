import { Receipts } from "../Enums/Enums";

/**
 * Utility class for handling message receipt statuses.
 * It is used in CometChatConversations and CometChatMessageList components.
 */
export class MessageReceiptUtils {

  /**
   * Gets the receipt status icon for a given message.
   *
   * Determines the receipt status based on the message's properties and returns
   * the corresponding receipt icon.
   *
   * @param {CometChat.BaseMessage} messageObject - The message object for which to get the receipt status.
   * @returns {Receipts} - The receipt status icon.
   */
  static getReceiptStatus = (messageObject: CometChat.BaseMessage) => {
    let icon = Receipts.wait;
    if ((messageObject as any)?.error || (messageObject as any)?.metadata?.error) {
      icon = Receipts.error;
    }
    else if (messageObject?.getReadAt()) {
      icon = Receipts.read;
    } else if (!messageObject?.getReadAt() && messageObject?.getDeliveredAt()) {
      icon = Receipts.delivered;
    } else if (messageObject?.getSentAt() && messageObject?.getId()) {
      icon = Receipts.sent;
    } else {
      icon = Receipts.wait;
    }
    return icon
  }
}