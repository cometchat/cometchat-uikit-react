import type { CometChat } from '@cometchat/chat-sdk-javascript';

/** Props for the self-extracting group action bubble. */
export interface CometChatGroupActionBubbleProps {
  /** The group-action message (member joined/left/added/kicked/banned/scope change). */
  message: CometChat.BaseMessage;
  /** Optional custom className. */
  className?: string;
}
