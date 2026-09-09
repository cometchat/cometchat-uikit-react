import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatTextFormatter } from '../../formatters/CometChatTextFormatter';
import type { CometChatBubbleAlignment } from '../../utils/getBubbleAlignment';

/** A single file attachment extracted from a MediaMessage. */
export interface CometChatFilesBubbleAttachment {
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

/** Visual variant for the files bubble. */
export type CometChatFilesBubbleVariant = 'incoming' | 'outgoing';

/** Props for the self-extracting CometChatFilesBubble. */
export interface CometChatFilesBubbleProps {
  /**
   * The file message. The bubble extracts the attachments (url, name, size,
   * extension) and caption from it itself.
   */
  message: CometChat.MediaMessage;
  /** Override incoming/outgoing alignment. Defaults to sender-vs-logged-in-user. */
  alignment?: CometChatBubbleAlignment;
  /** Text formatters applied to the extracted caption. */
  textFormatters?: CometChatTextFormatter[];
  /** Optional custom className. */
  className?: string;
}
