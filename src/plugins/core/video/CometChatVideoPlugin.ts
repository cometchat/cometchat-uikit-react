import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../../plugin.types';
import type { CometChatVideoBubbleProps } from '../../../components/CometChatVideoBubble/CometChatVideoBubble.types';
import { CometChatVideoBubble } from '../../../components/CometChatVideoBubble/CometChatVideoBubble';
import { getMediaMessageOptions } from '../shared/CometChatMessageOptions';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';

/**
 * Core plugin for video messages.
 *
 * Handles message type 'video' in category 'message'.
 * The bubble is self-extracting: it derives attachments, thumbnail, caption, sender
 * name and alignment from the SDK message itself, so the plugin only forwards the
 * message, alignment and (non-message) text formatters.
 */
export const CometChatVideoPlugin: CometChatMessagePlugin = {
  id: 'video',
  messageTypes: [CometChatUIKitConstants.MessageTypes.video],
  messageCategories: [CometChatUIKitConstants.MessageCategory.message],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    const props: CometChatVideoBubbleProps = {
      message: message as CometChat.MediaMessage,
      // Narrow 'center' to 'left' (incoming) to match prior plugin behavior.
      alignment: context.alignment === 'right' ? 'right' : 'left',
      textFormatters: context.getTextFormatters?.() ?? [],
    };

    return React.createElement(CometChatVideoBubble, props);
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
    return t?.('conversation_subtitle_video') ?? 'Video';
  },
};
