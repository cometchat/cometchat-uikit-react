import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../../plugin.types';
import type { CometChatImageBubbleProps } from '../../../components/CometChatImageBubble/CometChatImageBubble.types';
import { CometChatImageBubble } from '../../../components/CometChatImageBubble/CometChatImageBubble';
import { getMediaMessageOptions } from '../shared/CometChatMessageOptions';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';

/**
 * Core plugin for image messages.
 *
 * Handles message type 'image' in category 'message'.
 * Renders CometChatImageBubble with multi-image grid layout, captions,
 * and click-to-fullscreen gallery viewer. The bubble extracts all
 * message-derived data (attachments, caption, sender) itself.
 */
export const CometChatImagePlugin: CometChatMessagePlugin = {
  id: 'image',
  messageTypes: [CometChatUIKitConstants.MessageTypes.image],
  messageCategories: [CometChatUIKitConstants.MessageCategory.message],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    const props: CometChatImageBubbleProps = {
      message: message as CometChat.MediaMessage,
      // Plugin alignment may be 'center'; the bubble only distinguishes left/right.
      alignment: context.alignment === 'right' ? 'right' : 'left',
      textFormatters: context.getTextFormatters?.() ?? [],
    };

    return React.createElement(CometChatImageBubble, props);
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
    return t?.('conversation_subtitle_image') ?? 'Photo';
  },
};
