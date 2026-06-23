/** Props for CometChatDeleteBubble. */
export interface CometChatDeleteBubbleProps {
  /** Whether the deleted message was sent by the logged-in user. Affects styling. */
  isSentByMe?: boolean;
  /** Optional custom text override. Defaults to localized "This message was deleted". */
  text?: string;
  /** Optional custom className. */
  className?: string;
}
