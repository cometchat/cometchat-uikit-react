import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatTextFormatter } from '../../formatters/CometChatTextFormatter';
import type { CometChatBubbleAlignment } from '../../utils/getBubbleAlignment';

/** A single video attachment extracted from a MediaMessage. */
export interface CometChatVideosBubbleAttachment {
  /** Video URL. */
  url: string;
  /** Thumbnail URL from thumbnail-generation extension. */
  thumbnail?: string;
  /** Duration in seconds. */
  duration?: number;
  /** File size in bytes. */
  size?: number;
  /** Original file name including extension (used for downloads). */
  name?: string;
}

/** Visual variant for the videos bubble. */
export type CometChatVideosBubbleVariant = 'incoming' | 'outgoing';

/** Layout type determined by attachment count. */
export type CometChatVideosBubbleLayoutType = 'single' | 'grid' | 'grid-2x2' | 'overflow';

/** Props for the self-extracting CometChatVideosBubble. */
export interface CometChatVideosBubbleProps {
  /**
   * The video message. The bubble extracts its attachments and caption itself,
   * so it can be used directly (no plugin).
   */
  message: CometChat.MediaMessage;
  /** Override incoming/outgoing alignment. Defaults to sender-vs-logged-in-user. */
  alignment?: CometChatBubbleAlignment;
  /** Text formatters for caption rendering (mentions, URLs). */
  textFormatters?: CometChatTextFormatter[];
  /** Optional custom className. */
  className?: string;
  /** Callback fired when a video tile is clicked. */
  onVideoClicked?: (attachment: CometChatVideosBubbleAttachment, index: number) => void;
}
