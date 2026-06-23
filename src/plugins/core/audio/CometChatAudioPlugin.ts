import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../../plugin.types';
import type { CometChatAudioBubbleProps } from '../../../components/CometChatAudioBubble/CometChatAudioBubble.types';
import { CometChatAudioBubble } from '../../../components/CometChatAudioBubble/CometChatAudioBubble';
import { getMediaMessageOptions } from '../shared/CometChatMessageOptions';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';

/**
 * Core plugin for audio messages.
 *
 * Handles message type 'audio' in category 'message'.
 * Renders CometChatAudioBubble, which self-extracts the audio attachments and
 * caption from the message. The plugin only forwards the message, alignment, and
 * the text formatters used for caption rendering.
 */
export const CometChatAudioPlugin: CometChatMessagePlugin = {
  id: 'audio',
  messageTypes: [CometChatUIKitConstants.MessageTypes.audio],
  messageCategories: [CometChatUIKitConstants.MessageCategory.message],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    const props: CometChatAudioBubbleProps = {
      message: message as CometChat.MediaMessage,
      alignment: context.alignment === 'right' ? 'right' : 'left',
      textFormatters: context.getTextFormatters?.() ?? [],
    };

    return React.createElement(CometChatAudioBubble, props);
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
    return t?.('conversation_subtitle_audio') ?? 'Audio';
  },
};
