import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKitConstants } from '../constants/CometChatUIKitConstants';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

/**
 * Options for creating a streaming message placeholder.
 */
export interface CreateStreamingMessageOptions {
  /** The original message ID (used to derive the streaming bubble ID). */
  originalMessageId: number;
  /** The AI agent user (rendered as the sender on the incoming side). */
  sender: CometChat.User;
  /** The logged-in user (rendered as the receiver). */
  receiver: CometChat.User;
  /** The conversation/chat ID. */
  chatId: string;
}

/**
 *
 * The returned object mimics a `CometChat.BaseMessage` with:
 * - A negative ID derived from the original message ID (so it can be found & replaced)
 * - The AI agent user as the sender (renders on the left/incoming side)
 * - Type `run_started` and category `custom`
 *
 * This is used by the MessageList to show a "Thinking..." bubble while
 * the AI generates a response.
 */
export function createStreamingMessage(
  options: CreateStreamingMessageOptions
): CometChat.BaseMessage {
  const { originalMessageId, sender, receiver, chatId } = options;
  const streamingBubbleId = -originalMessageId;

  return {
    getId: () => streamingBubbleId,
    getMessageId: () => streamingBubbleId,
    getSender: () => sender,
    getReceiverType: () => CometChatUIKitConstants.MessageReceiverType.user,
    getReceiver: () => receiver,
    getCategory: () => CometChatUIKitConstants.MessageCategory.custom,
    getType: () => CometChatUIKitConstants.streamMessageTypes.run_started,
    getText: () => '',
    getParentMessageId: () => 0,
    getSentAt: () => 0,
    getReactions: () => [],
    getMentions: () => [],
    getMuid: () => String(Date.now()),
    getConversationId: () => '',
    getUnreadRepliesCount: () => 0,
    getStatus: () => '',
    getDeliveredAt: () => 0,
    getDeliveredToMeAt: () => 0,
    getReadAt: () => 0,
    getReadByMeAt: () => 0,
    getEditedAt: () => 0,
    getEditedBy: () => '',
    getDeletedAt: () => 0,
    getDeletedBy: () => '',
    getReplyCount: () => 0,
    getRawMessage: () => ({}),
    hasMentionedMe: () => false,
    getReceiverId: () => chatId,
    getData: () => ({ runId: originalMessageId, threadId: '' }),
    getCustomData: () => ({}),
    setId: noop,
    setSender: noop,
    setReceiverType: noop,
    setReceiver: noop,
    setCategory: noop,
    setType: noop,
    setText: noop,
    setParentMessageId: noop,
    setSentAt: noop,
    setReactions: noop,
    setMentionedUsers: noop,
    setMuid: noop,
    setConversationId: noop,
    setUnreadRepliesCount: noop,
    setStatus: noop,
    setDeliveredAt: noop,
    setDeliveredToMeAt: noop,
    setReadAt: noop,
    setReadByMeAt: noop,
    setEditedAt: noop,
    setEditedBy: noop,
    setDeletedAt: noop,
    setDeletedBy: noop,
    setReplyCount: noop,
    setRawMessage: noop,
    setHasMentionedMe: noop,
    setData: noop,
  } as unknown as CometChat.BaseMessage;
}
