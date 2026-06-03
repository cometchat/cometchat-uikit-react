/**
 * CometChatCollaborativeDocumentPlugin
 *
 * Extension plugin for collaborative document messages.
 * Handles message type 'extension_document' in category 'custom'.
 * Renders CometChatCollaborativeBubble with document-specific config.
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
import bannerLight from '../../assets/Collaborative_Document_Light.png';
import bannerDark from '../../assets/Collaborative_Document_Dark.png';

// Lazy-load the bubble component — keeps it out of the initial bundle
const LazyCometChatCollaborativeBubble = lazy(() =>
  import('../shared/CometChatCollaborativeBubble').then(m => ({
    default: m.CometChatCollaborativeBubble,
  }))
);

const EXTENSION_KEY = 'document';
const URL_KEY = 'document_url';
const MESSAGE_TYPE = 'extension_document';

export const CometChatCollaborativeDocumentPlugin: CometChatMessagePlugin = {
  id: 'collaborative-document',
  messageTypes: [MESSAGE_TYPE],
  messageCategories: ['custom'],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    const url = extractExtensionUrl(message, EXTENSION_KEY, URL_KEY);
    const variant = context.alignment === 'right' ? 'outgoing' : 'incoming';
    const t = context.getLocalizedString ?? ((key: string) => key);

    return React.createElement(
      Suspense,
      { fallback: null },
      React.createElement(LazyCometChatCollaborativeBubble, {
        url,
        variant,
        title: t('message_list_collaborative_document_title'),
        subtitle: t('message_list_collaborative_document_subtitile'),
        buttonText: t('message_list_collaborative_document_open'),
        bannerImageUrl: context.theme === 'dark' ? bannerDark : bannerLight,
        iconType: 'document' as const,
        onButtonClick: (docUrl: string) => {
          window.open(docUrl, '', 'fullscreen=yes, scrollbars=auto');
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
    return t?.('conversation_subtitle_collaborative_document') ?? 'Collaborative Document';
  },
};
