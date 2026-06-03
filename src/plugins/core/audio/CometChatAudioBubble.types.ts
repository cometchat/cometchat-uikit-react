import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';

/** A single audio attachment extracted from a MediaMessage. */
export interface CometChatAudioBubbleAttachment {
  /** Display name of the audio file. */
  name: string;
  /** Audio URL. */
  url: string;
  /** MIME type (e.g., 'audio/mpeg'). */
  mimeType: string;
  /** File extension (e.g., 'mp3'). */
  extension: string;
  /** File size in bytes. */
  size: number;
}

/** Visual variant for the audio bubble. */
export type CometChatAudioBubbleVariant = 'incoming' | 'outgoing';

/** Props for CometChatAudioBubble. */
export interface CometChatAudioBubbleProps {
  /** Array of audio attachments extracted from the message. */
  attachments: CometChatAudioBubbleAttachment[];
  /** Visual variant based on alignment. */
  variant: CometChatAudioBubbleVariant;
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
