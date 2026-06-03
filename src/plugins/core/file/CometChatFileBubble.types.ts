import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';

/** A single file attachment extracted from a MediaMessage. */
export interface CometChatFileBubbleAttachment {
  /** Display name of the file. */
  name: string;
  /** Download URL. */
  url: string;
  /** File extension (e.g., 'pdf', 'docx'). */
  extension: string;
  /** MIME type (e.g., 'application/pdf'). */
  mimeType: string;
  /** File size in bytes. */
  size: number;
}

/** Visual variant for the file bubble. */
export type CometChatFileBubbleVariant = 'incoming' | 'outgoing';

/** Props for CometChatFileBubble. */
export interface CometChatFileBubbleProps {
  /** Array of file attachments extracted from the message. */
  attachments: CometChatFileBubbleAttachment[];
  /** Visual variant based on alignment. */
  variant: CometChatFileBubbleVariant;
  /** Caption text (rendered via CometChatTextBubble when present). */
  caption?: string;
  /** The full message object for CometChatTextBubble caption rendering. */
  message?: CometChat.MediaMessage;
  /** Sender name for aria-labels. */
  senderName?: string;
  /** Text formatters for caption rendering. */
  textFormatters?: CometChatTextFormatter[];
  /** Optional custom className. */
  className?: string;
}
