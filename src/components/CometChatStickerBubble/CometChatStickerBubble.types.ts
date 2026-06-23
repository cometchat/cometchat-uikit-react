import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatBubbleAlignment } from '../../utils/getBubbleAlignment';

/** Props for the self-extracting CometChatStickerBubble component. */
export interface CometChatStickerBubbleProps {
  /** The sticker custom message. The bubble extracts the image URL and name from its metadata. */
  message: CometChat.CustomMessage;
  /** Override incoming/outgoing alignment. Defaults to sender-vs-logged-in-user. */
  alignment?: CometChatBubbleAlignment;
  /** Optional custom className. */
  className?: string;
}
