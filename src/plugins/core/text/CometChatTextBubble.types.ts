import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';

/** Link preview data extracted from message metadata. */
export interface CometChatLinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
}

/** Props for CometChatTextBubble. */
export interface CometChatTextBubbleProps {
  /** The text content to display. */
  text: string;
  /** Whether the message was sent by the logged-in user. Default: true. */
  isSentByMe?: boolean;
  /** Text formatters to apply (mentions, URLs, etc.). */
  textFormatters?: CometChatTextFormatter[];
  /** The full message object for metadata extraction (link previews, translations). */
  message?: CometChat.TextMessage;
  /** Disable text truncation (read more / show less). Default: false. */
  disableTruncation?: boolean;
  /** Optional custom className. */
  className?: string;
}
