import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../../plugin.types';
import type { CometChatFileBubbleProps } from '../../../components/CometChatFileBubble/CometChatFileBubble.types';
import { CometChatFileBubble } from '../../../components/CometChatFileBubble/CometChatFileBubble';
import { getMediaMessageOptions } from '../shared/CometChatMessageOptions';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';

/**
 * Core plugin for file messages.
 *
 * Handles message type 'file' in category 'message'.
 * Renders CometChatFileBubble with file icon, name, size, download,
 * multi-file expand/collapse, and caption support.
 */
export const CometChatFilePlugin: CometChatMessagePlugin = {
  id: 'file',
  messageTypes: [CometChatUIKitConstants.MessageTypes.file],
  messageCategories: [CometChatUIKitConstants.MessageCategory.message],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    const props: CometChatFileBubbleProps = {
      message: message as CometChat.MediaMessage,
      alignment: context.alignment === 'right' ? 'right' : 'left',
      textFormatters: context.getTextFormatters?.() ?? [],
    };

    return React.createElement(CometChatFileBubble, props);
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
    return t?.('conversation_subtitle_file') ?? 'File';
  },
};
