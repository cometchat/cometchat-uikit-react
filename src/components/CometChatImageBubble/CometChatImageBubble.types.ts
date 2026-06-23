import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatTextFormatter } from '../../formatters/CometChatTextFormatter';
import type { CometChatBubbleAlignment } from '../../utils/getBubbleAlignment';

/** A single image attachment extracted from a MediaMessage. */
export interface CometChatImageBubbleAttachment {
  /** Full-resolution image URL. Empty string for pending/optimistic messages. */
  url: string;
  /** File size in bytes (used by fullscreen viewer). */
  size?: number;
}

/** Visual variant for the image bubble. */
export type CometChatImageBubbleVariant = 'incoming' | 'outgoing';

/** Layout type determined by attachment count. */
export type CometChatImageBubbleLayoutType = 'single' | 'grid' | 'grid-2x2' | 'overflow';

/** Props for the self-extracting CometChatImageBubble. */
export interface CometChatImageBubbleProps {
  /**
   * The image message. The bubble extracts its attachments and caption itself,
   * so it can be used directly (no plugin).
   */
  message: CometChat.MediaMessage;
  /** Override incoming/outgoing alignment. Defaults to sender-vs-logged-in-user. */
  alignment?: CometChatBubbleAlignment;
  /** Text formatters for caption rendering (mentions, URLs). */
  textFormatters?: CometChatTextFormatter[];
  /** Optional custom className. */
  className?: string;
  /** Custom placeholder image URL shown while the image is loading. Falls back to default photo icon. */
  placeholderImage?: string;
  /** Callback fired when an image is clicked (in addition to opening the fullscreen viewer). */
  onImageClicked?: (attachment: CometChatImageBubbleAttachment, index: number) => void;
}
