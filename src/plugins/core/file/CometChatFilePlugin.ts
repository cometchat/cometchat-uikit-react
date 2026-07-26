import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../../plugin.types';
import type { CometChatFilesBubbleProps } from '../../../components/CometChatFilesBubble/CometChatFilesBubble.types';
import { CometChatFilesBubble } from '../../../components/CometChatFilesBubble/CometChatFilesBubble';
import { getMediaMessageOptions } from '../shared/CometChatMessageOptions';
import { formatCaptionForPreview } from '../shared/formatCaptionForPreview';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';

/**
 * Core plugin for file messages.
 *
 * Handles message type 'file' in category 'message'.
 *
 * Renders CometChatFilesBubble (file list, >3 expand/collapse, download on click,
 * batch position awareness). The bubble is self-extracting: it derives
 * attachments, caption, sender and alignment from the SDK message itself.
 *
 * The legacy single-attachment CometChatFileBubble remains available as a
 * deprecated standalone component for consumers who want it.
 */
export const CometChatFilePlugin: CometChatMessagePlugin = {
  id: 'file',
  messageTypes: [CometChatUIKitConstants.MessageTypes.file],
  messageCategories: [CometChatUIKitConstants.MessageCategory.message],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    const alignment = context.alignment === 'right' ? 'right' : 'left';
    const textFormatters = context.getTextFormatters?.() ?? [];

    const props: CometChatFilesBubbleProps = {
      message: message as CometChat.MediaMessage,
      alignment,
      textFormatters,
    };
    return React.createElement(CometChatFilesBubble, props);
  },

  getOptions(
    message: CometChat.BaseMessage,
    context: CometChatMessagePluginContext
  ): CometChatMessageOption[] {
    return getMediaMessageOptions(message, context);
  },

  getLastMessagePreview(
    message: CometChat.BaseMessage,
    loggedInUser: CometChat.User,
    t?: (key: string) => string
  ): string {
    const mediaMsg = message as CometChat.MediaMessage;
    const attachments =
      typeof mediaMsg.getAttachments === 'function' ? mediaMsg.getAttachments() : [];
    const count = Math.max(attachments.length, 1);
    const caption = typeof mediaMsg.getCaption === 'function' ? mediaMsg.getCaption() || '' : '';

    let label: string;
    if (count === 1) {
      label = t?.('conversation_subtitle_file') ?? 'File';
    } else {
      const pluralKey = 'media_edit_preview_file_plural';
      const plural = t?.(pluralKey) ?? 'Files';
      label = plural !== pluralKey ? `${String(count)} ${plural}` : `${String(count)} Files`;
    }

    if (caption.trim()) {
      const formatted = formatCaptionForPreview(caption, message, loggedInUser);
      return formatted ? `${label} · ${formatted}` : label;
    }
    return label;
  },
};
