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
import { getMediaMessageOptions } from '../core/shared/CometChatMessageOptions';

// Lazy-load the bubble component — keeps it out of the initial bundle
const LazyCometChatCollaborativeWhiteboardBubble = lazy(() =>
  import('../../components/CometChatCollaborativeWhiteboardBubble/CometChatCollaborativeWhiteboardBubble').then(
    m => ({
      default: m.CometChatCollaborativeWhiteboardBubble,
    })
  )
);

const MESSAGE_TYPE = 'extension_whiteboard';

export const CometChatCollaborativeWhiteboardPlugin: CometChatMessagePlugin = {
  id: 'collaborative-whiteboard',
  messageTypes: [MESSAGE_TYPE],
  messageCategories: ['custom'],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    const alignment = context.alignment === 'right' ? 'right' : 'left';
    return React.createElement(
      Suspense,
      { fallback: null },
      React.createElement(LazyCometChatCollaborativeWhiteboardBubble, { message, alignment })
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
