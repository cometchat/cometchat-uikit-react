/**
 * CometChatStickersPlugin
 *
 * Extension plugin for sticker messages.
 * Handles message type 'extension_sticker' in category 'custom'.
 * Renders CometChatStickerBubble with extracted sticker URL.
 *
 * Note: Stickers use a separate keyboard button in the composer,
 * not the "+" attachment menu.
 */

import React, { lazy, Suspense } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../plugin.types';
import { extractStickerUrl, extractStickerName } from './stickers.utils';
import { getMediaMessageOptions } from '../core/shared/CometChatMessageOptions';
import { STICKERS_CONSTANTS } from './stickers.constants';

// Lazy-load the bubble component — keeps it out of the initial bundle
const LazyCometChatStickerBubble = lazy(() => import('./CometChatStickerBubble'));

export const CometChatStickersPlugin: CometChatMessagePlugin = {
  id: 'stickers',
  messageTypes: [STICKERS_CONSTANTS.messageType],
  messageCategories: ['custom'],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    const customMessage = message as CometChat.CustomMessage;
    const stickerUrl = extractStickerUrl(customMessage);
    const stickerName = extractStickerName(customMessage);
    const variant = context.alignment === 'right' ? 'outgoing' : 'incoming';

    return React.createElement(
      Suspense,
      { fallback: null },
      React.createElement(LazyCometChatStickerBubble, {
        stickerUrl,
        stickerName,
        variant,
      })
    );
  },

  getOptions(
    message: CometChat.BaseMessage,
    context: CometChatMessagePluginContext
  ): CometChatMessageOption[] {
    return getMediaMessageOptions(message, context);
  },

  getLastMessagePreview(
    _message: CometChat.BaseMessage,
    _loggedInUser: CometChat.User,
    t?: (key: string) => string
  ): string {
    return t?.('conversation_subtitle_sticker') ?? 'Sticker';
  },
};
