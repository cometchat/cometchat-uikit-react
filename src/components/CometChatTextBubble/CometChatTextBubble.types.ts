import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatTextFormatter } from '../../formatters/CometChatTextFormatter';

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
  /**
   * The message to render. When `text` is omitted, the bubble extracts content itself
   * via `message.getText()` and configures mention formatting from the message.
   * Provide `message` for plugin/standalone usage.
   */
  message?: CometChat.BaseMessage;
  /**
   * Explicit text to display. Overrides `message.getText()` when provided
   * (used for media captions). At least one of `text` / `message` should be set.
   */
  text?: string;
  /** Whether the message was sent by the logged-in user. Default: true. */
  isSentByMe?: boolean;
  /** Text formatters to apply (mentions, URLs, etc.). */
  textFormatters?: CometChatTextFormatter[];
  /** Disable text truncation (read more / show less). Default: false. */
  disableTruncation?: boolean;
  /** Optional custom className. */
  className?: string;
}
