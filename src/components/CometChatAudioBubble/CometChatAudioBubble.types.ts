import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatTextFormatter } from '../../formatters/CometChatTextFormatter';
import type { CometChatBubbleAlignment } from '../../utils/getBubbleAlignment';

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

/**
 * Props for the self-extracting audio bubble.
 *
 * The bubble takes the SDK message and extracts the audio attachments and caption
 * itself; alignment and localization come from hooks, so it can be used directly
 * (no plugin) by passing only `message`.
 */
export interface CometChatAudioBubbleProps {
  /** The audio message. The bubble extracts attachments and caption from it. */
  message: CometChat.MediaMessage;
  /** Override incoming/outgoing alignment. Defaults to sender-vs-logged-in-user. */
  alignment?: CometChatBubbleAlignment;
  /** Text formatters applied to the caption (mentions, URLs, etc.). */
  textFormatters?: CometChatTextFormatter[];
  /** Optional custom className. */
  className?: string;
}
