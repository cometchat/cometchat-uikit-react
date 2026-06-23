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
import { getMediaMessageOptions } from '../core/shared/CometChatMessageOptions';

// Lazy-load the bubble component — keeps it out of the initial bundle
const LazyCometChatCollaborativeDocumentBubble = lazy(() =>
  import('../../components/CometChatCollaborativeDocumentBubble/CometChatCollaborativeDocumentBubble').then(
    m => ({
      default: m.CometChatCollaborativeDocumentBubble,
    })
  )
);

const MESSAGE_TYPE = 'extension_document';

export const CometChatCollaborativeDocumentPlugin: CometChatMessagePlugin = {
  id: 'collaborative-document',
  messageTypes: [MESSAGE_TYPE],
  messageCategories: ['custom'],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    const alignment = context.alignment === 'right' ? 'right' : 'left';
    return React.createElement(
      Suspense,
      { fallback: null },
      React.createElement(LazyCometChatCollaborativeDocumentBubble, { message, alignment })
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
