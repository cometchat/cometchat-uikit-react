import type { CometChat } from '@cometchat/chat-sdk-javascript';

/** Props for the self-extracting call action bubble. */
export interface CometChatCallActionBubbleProps {
  /** The call message (audio/video) in the 'call' category. */
  message: CometChat.BaseMessage;
  /** Optional custom className. */
  className?: string;
}
