import { CometChat } from "@cometchat/chat-sdk-javascript";
import { Receipts } from "../Enums/Enums";
import { CometChatUIKitConstants } from "../constants/CometChatUIKitConstants";

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
  static getReceiptStatus = (message: CometChat.BaseMessage) => {
    if (
      message instanceof CometChat.TextMessage ||
      message instanceof CometChat.MediaMessage
    ) {
      const moderationStatus = message.getModerationStatus();
      // Prioritize immediate error/disapproval cases
      if (moderationStatus ===  CometChatUIKitConstants.moderationStatus.disapproved) {
        return Receipts.error;
      }
    }

    const hasError =
      (message as any)?.error || (message as any)?.metadata?.error;
    if (hasError) {
      return Receipts.error;
    }
    // Proceed with normal receipt flow for approved/unmoderated
    else if (message?.getReadAt()) {
      return Receipts.read;
    } else if (!message?.getReadAt() && message?.getDeliveredAt()) {
      return Receipts.delivered;
    } else if (message?.getSentAt() && message?.getId()) {
      return Receipts.sent;
    }
    // Waiting as a fallback
    return Receipts.wait;
  };
}
