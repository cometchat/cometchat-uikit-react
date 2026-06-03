/** Props for the CometChatStickerBubble component. */
export interface CometChatStickerBubbleProps {
  /** Sticker image URL (pre-extracted by the plugin). */
  stickerUrl: string;
  /** Sticker set name (for alt text / aria-label). */
  stickerName?: string;
  /** Visual variant based on sender/receiver. */
  variant: 'incoming' | 'outgoing';
  /** Optional custom className. */
  className?: string;
}
