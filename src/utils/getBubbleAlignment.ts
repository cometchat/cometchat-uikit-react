import type { CometChat } from '@cometchat/chat-sdk-javascript';

/** Incoming/outgoing alignment for a message bubble. */
export type CometChatBubbleAlignment = 'left' | 'right';

/**
 * Derive bubble alignment from the message sender vs the logged-in user.
 * Self-extracting bubbles use this when no explicit `alignment` prop is passed,
 * so they render correctly when used standalone (outside the message list).
 */
export function getBubbleAlignment(
  message: CometChat.BaseMessage,
  loggedInUser: CometChat.User | null | undefined
): CometChatBubbleAlignment {
  try {
    const senderUid = message.getSender().getUid();
    return senderUid && loggedInUser?.getUid() === senderUid ? 'right' : 'left';
  } catch {
    return 'left';
  }
}
