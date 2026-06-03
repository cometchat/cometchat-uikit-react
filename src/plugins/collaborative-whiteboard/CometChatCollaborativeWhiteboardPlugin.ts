/**
 * CometChatCollaborativeWhiteboardPlugin
 *
 * Extension plugin for collaborative whiteboard messages.
 * Handles message type 'extension_whiteboard' in category 'custom'.
 * Renders CometChatCollaborativeBubble with whiteboard-specific config.
 */

import React, { lazy, Suspense } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../plugin.types';
import { extractExtensionUrl } from '../shared/extractExtensionUrl';
import { getMediaMessageOptions } from '../core/shared/CometChatMessageOptions';
import bannerLight from '../../assets/Collaborative_Whiteboard_Light.png';
import bannerDark from '../../assets/Collaborative_Whiteboard_Dark.png';

// Lazy-load the bubble component — keeps it out of the initial bundle
const LazyCometChatCollaborativeBubble = lazy(() =>
  import('../shared/CometChatCollaborativeBubble').then(m => ({
    default: m.CometChatCollaborativeBubble,
  }))
);

const EXTENSION_KEY = 'whiteboard';
const URL_KEY = 'board_url';
const MESSAGE_TYPE = 'extension_whiteboard';

export const CometChatCollaborativeWhiteboardPlugin: CometChatMessagePlugin = {
  id: 'collaborative-whiteboard',
  messageTypes: [MESSAGE_TYPE],
  messageCategories: ['custom'],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    const url = extractExtensionUrl(message, EXTENSION_KEY, URL_KEY);
    const variant = context.alignment === 'right' ? 'outgoing' : 'incoming';
    const t = context.getLocalizedString ?? ((key: string) => key);
    console.log(context.getLocalizedString?.('message_list_collaborative_whiteboard_open'));

    return React.createElement(
      Suspense,
      { fallback: null },
      React.createElement(LazyCometChatCollaborativeBubble, {
        url,
        variant,
        title: t('message_list_collaborative_whiteboard_title'),
        subtitle: t('message_collaborative_whiteboard_subtitile'),
        buttonText: t('message_list_collaborative_whiteboard_open'),
        bannerImageUrl: context.theme === 'dark' ? bannerDark : bannerLight,
        iconType: 'whiteboard' as const,
        onButtonClick: (boardUrl: string) => {
          window.open(boardUrl, '', 'fullscreen=yes, scrollbars=auto');
        },
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
    return t?.('conversation_subtitle_collaborative_whiteboard') ?? 'Collaborative Whiteboard';
  },
};
