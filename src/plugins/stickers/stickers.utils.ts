/**
 * Sticker utility functions.
 * URL extraction uses Angular fallback chain.
 */

import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { STICKERS_CONSTANTS } from '../../constants/CometChatExtensionConstants';

/**
 * Extract sticker image URL from a CustomMessage using a priority-based fallback chain.
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
 * Extract sticker name from a CustomMessage.
 */
export function extractStickerName(message: CometChat.CustomMessage | null | undefined): string {
  if (!message) return 'Sticker';

  try {
    const customData = message.getCustomData() as Record<string, unknown> | undefined;
    const name = customData?.[STICKERS_CONSTANTS.stickerNameKey];
    return typeof name === 'string' ? name : 'Sticker';
  } catch {
    return 'Sticker';
  }
}
