import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatTextFormatter } from '../../formatters/CometChatTextFormatter';

/** A single video attachment extracted from a MediaMessage. */
export interface CometChatVideoBubbleAttachment {
  /** Video URL. */
  url: string;
  /** Thumbnail URL (used as poster for single video, as img src for grid tiles). */
  thumbnail?: string;
  /** Duration in seconds. */
  duration?: number;
  /** Video width in pixels (from attachment metadata). */
  width?: number;
  /** Video height in pixels (from attachment metadata). */
  height?: number;
  /** File size in bytes. */
  size?: number;
  /** MIME type (e.g., 'video/mp4'). */
  mimeType?: string;
  /** True for optimistic (pending) blob URLs that should render without controls. */
  isPlaceholder?: boolean;
}

/** Visual variant for the video bubble. */
export type CometChatVideoBubbleVariant = 'incoming' | 'outgoing';

/** Layout type determined by attachment count. */
export type CometChatVideoBubbleLayoutType = 'single' | 'grid' | 'grid-2x2' | 'overflow';

/** Props for CometChatVideoBubble. */
export interface CometChatVideoBubbleProps {
  /**
   * The SDK media message. Drives all message-derived data:
   * video attachments, thumbnails, caption, and sender name.
   */
  message: CometChat.MediaMessage;
  /**
   * Bubble alignment. When omitted, it is derived from the message sender vs the
   * logged-in user via `getBubbleAlignment`, so the bubble renders correctly standalone.
   */
  alignment?: 'left' | 'right';
  /** Text formatters for caption rendering (mentions, URLs). */
  textFormatters?: CometChatTextFormatter[];
  /** Optional custom className. */
  className?: string;
}
