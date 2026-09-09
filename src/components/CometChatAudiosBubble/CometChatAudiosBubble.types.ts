import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatTextFormatter } from '../../formatters/CometChatTextFormatter';
import type { CometChatBubbleAlignment } from '../../utils/getBubbleAlignment';

/** A single audio attachment extracted from a MediaMessage. */
export interface CometChatAudiosBubbleAttachment {
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
  /** Duration in seconds (from metadata, or computed client-side). */
  duration?: number;
}

/** Visual variant for the audios bubble. */
export type CometChatAudiosBubbleVariant = 'incoming' | 'outgoing';

/** Props for the self-extracting CometChatAudiosBubble. */
export interface CometChatAudiosBubbleProps {
  /**
   * The audio message. The bubble extracts the audio attachments and caption
   * from it itself.
   */
  message: CometChat.MediaMessage;
  /** Override incoming/outgoing alignment. Defaults to sender-vs-logged-in-user. */
  alignment?: CometChatBubbleAlignment;
  /** Text formatters applied to the caption (mentions, URLs, etc.). */
  textFormatters?: CometChatTextFormatter[];
  /** Optional custom className. */
  className?: string;
}
