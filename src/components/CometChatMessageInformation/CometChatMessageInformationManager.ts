import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * CometChatMessageInformationManager — SDK functions for message receipt operations.
 *
 * Encapsulates all SDK interactions for fetching message receipts and
 * listening for real-time receipt updates. No React imports — pure
 * TypeScript functions, testable independently.
 */

/**
 * Fetch message receipts for a given message ID.
 * Returns an array of MessageReceipt objects.
 * For group messages, this returns all receipts at once (SDK does not paginate).
 */
export async function fetchReceipts(messageId: number): Promise<CometChat.MessageReceipt[]> {
  return CometChat.getMessageReceipts(messageId) as Promise<CometChat.MessageReceipt[]>;
}

/**
 * Attach a message listener for real-time receipt updates.
 * Listens for delivery and read receipt events.
 * Returns a cleanup function.
 */
export function attachReceiptListener(
  listenerId: string,
  callbacks: {
    onMessagesDelivered: (receipt: CometChat.MessageReceipt) => void;
    onMessagesRead: (receipt: CometChat.MessageReceipt) => void;
  }
): () => void {
  CometChat.addMessageListener(
    listenerId,
    new CometChat.MessageListener({
      onMessagesDelivered: callbacks.onMessagesDelivered,
      onMessagesRead: callbacks.onMessagesRead,
    })
  );
  return () => {
    CometChat.removeMessageListener(listenerId);
  };
}

/**
 * Attach a connection listener for reconnect recovery.
 * Returns a cleanup function.
 */
export function attachConnectionListener(listenerId: string, onConnected: () => void): () => void {
  CometChat.addConnectionListener(
    listenerId,
    new CometChat.ConnectionListener({
      onConnected,
      onDisconnected: () => {
        /* no-op */
      },
    })
  );
  return () => {
    CometChat.removeConnectionListener(listenerId);
  };
}
