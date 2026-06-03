import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';

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

/** Props for CometChatImageBubble. */
export interface CometChatImageBubbleProps {
  /** Array of image attachments extracted from the message. */
  attachments: CometChatImageBubbleAttachment[];
  /** Visual variant based on alignment. */
  variant: CometChatImageBubbleVariant;
  /** Caption text (rendered via CometChatTextBubble when present). */
  caption?: string;
  /** The full message object for CometChatTextBubble caption rendering (metadata, mentions). */
  message?: CometChat.MediaMessage;
  /** Sender name for alt text and aria-labels. */
  senderName?: string;
  /** Text formatters for caption rendering (mentions, URLs). */
  textFormatters?: CometChatTextFormatter[];
  /** Optional custom className. */
  className?: string;
  /** Custom placeholder image URL shown while the image is loading. Falls back to default photo icon. */
  placeholderImage?: string;
  /** Callback fired when an image is clicked (in addition to opening the fullscreen viewer). */
  onImageClicked?: (attachment: CometChatImageBubbleAttachment, index: number) => void;
}
