import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';

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
}

/** Visual variant for the video bubble. */
export type CometChatVideoBubbleVariant = 'incoming' | 'outgoing';

/** Layout type determined by attachment count. */
export type CometChatVideoBubbleLayoutType = 'single' | 'grid' | 'grid-2x2' | 'overflow';

/** Props for CometChatVideoBubble. */
export interface CometChatVideoBubbleProps {
  /** Array of video attachments extracted from the message. */
  attachments: CometChatVideoBubbleAttachment[];
  /** Visual variant based on alignment. */
  variant: CometChatVideoBubbleVariant;
  /** Caption text (rendered via CometChatTextBubble when present). */
  caption?: string;
  /** The full message object for CometChatTextBubble caption rendering (metadata, mentions). */
  message?: CometChat.MediaMessage;
  /** Sender name for aria-labels. */
  senderName?: string;
  /** Text formatters for caption rendering (mentions, URLs). */
  textFormatters?: CometChatTextFormatter[];
  /** Optional custom className. */
  className?: string;
}
