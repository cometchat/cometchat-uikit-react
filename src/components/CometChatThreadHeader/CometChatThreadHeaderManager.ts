import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * CometChatThreadHeaderManager — SDK listener management for thread header.
 *
 * Attaches a message listener that fires when a new reply arrives in the thread.
 * Filters by parentMessageId and excludes messages from the logged-in user
 * (those are handled via SDK bridge events for immediate feedback).
 *
 * No React imports. Pure SDK orchestration.
 */

/**
 * Attach a message listener that fires when a new reply arrives in the thread.
 * Filters by parentMessageId and excludes messages from the logged-in user.
 * Returns a cleanup function.
 *
 * @param listenerId - Unique listener ID for this instance
 * @param parentMessageId - The ID of the parent message
 * @param loggedInUserId - The UID of the logged-in user (to exclude own messages)
 * @param onNewReply - Callback fired when a new reply from another user arrives
 * @returns Cleanup function that removes the listener
 */
export function attachThreadHeaderMessageListener(
  listenerId: string,
  parentMessageId: number,
  loggedInUserId: string,
  onNewReply: (message: CometChat.BaseMessage) => void
): () => void {
  const handleMessage = (message: CometChat.BaseMessage): void => {
    if (
      message.getParentMessageId() === parentMessageId &&
      message.getSender().getUid() !== loggedInUserId
    ) {
      onNewReply(message);
    }
  };

  CometChat.addMessageListener(
    listenerId,
    new CometChat.MessageListener({
      onTextMessageReceived: handleMessage,
      onMediaMessageReceived: handleMessage,
      onCustomMessageReceived: handleMessage,
      onInteractiveMessageReceived: handleMessage,
    })
  );

  return () => {
    CometChat.removeMessageListener(listenerId);
  };
}
