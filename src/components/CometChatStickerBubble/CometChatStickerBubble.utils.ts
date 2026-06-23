/**
 * Sticker utility functions.
 *
 * Extract the sticker image URL and name from a CustomMessage. Co-located with
 * the bubble so CometChatStickerBubble is fully self-extracting (no plugin needed).
 */

import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { STICKERS_CONSTANTS } from '../../constants/CometChatExtensionConstants';

/** Default sticker name used when none can be extracted. */
export const DEFAULT_STICKER_NAME = 'Sticker';

/**
 * Extract the sticker image URL from a CustomMessage using a priority-based fallback chain:
 *   1. metadata.data.sticker_url
 *   2. metadata.sticker_url
 *   3. customData.sticker_url
 */
export function extractStickerUrl(message: CometChat.CustomMessage | null | undefined): string {
  if (!message) return '';

  try {
    const metadata = message.getMetadata() as Record<string, unknown> | null;
    if (metadata) {
      // Priority 1: metadata.data.sticker_url
      const data = metadata.data as Record<string, unknown> | undefined;
      const urlFromData = data?.[STICKERS_CONSTANTS.stickerUrlKey];
      if (typeof urlFromData === 'string') return urlFromData;

      // Priority 2: metadata.sticker_url
      const urlFromMeta = metadata[STICKERS_CONSTANTS.stickerUrlKey];
      if (typeof urlFromMeta === 'string') return urlFromMeta;
    }

    // Priority 3: customData.sticker_url
    const customData = message.getCustomData() as Record<string, unknown> | undefined;
    const urlFromCustom = customData?.[STICKERS_CONSTANTS.stickerUrlKey];
    if (typeof urlFromCustom === 'string') return urlFromCustom;

    return '';
  } catch {
    return '';
  }
}

/**
 * Extract the sticker name from a CustomMessage's customData.
 * Falls back to {@link DEFAULT_STICKER_NAME} when unavailable.
 */
export function extractStickerName(message: CometChat.CustomMessage | null | undefined): string {
  if (!message) return DEFAULT_STICKER_NAME;

  try {
    const customData = message.getCustomData() as Record<string, unknown> | undefined;
    const name = customData?.[STICKERS_CONSTANTS.stickerNameKey];
    return typeof name === 'string' ? name : DEFAULT_STICKER_NAME;
  } catch {
    return DEFAULT_STICKER_NAME;
  }
}
