import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../../plugin.types';
import type { CometChatImagesBubbleProps } from '../../../components/CometChatImagesBubble/CometChatImagesBubble.types';
import { CometChatImagesBubble } from '../../../components/CometChatImagesBubble/CometChatImagesBubble';
import { getMediaMessageOptions } from '../shared/CometChatMessageOptions';
import { formatCaptionForPreview } from '../shared/formatCaptionForPreview';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';

/**
 * Core plugin for image messages.
 *
 * Handles message type 'image' in category 'message'.
 *
 * Renders CometChatImagesBubble (batch-aware grid, +N overflow, fullscreen
 * gallery, batch position awareness). The bubble is self-extracting: it derives
 * attachments, caption, sender and alignment from the SDK message itself.
 *
 * The legacy single-attachment CometChatImageBubble remains available as a
 * deprecated standalone component for consumers who want it.
 */
export const CometChatImagePlugin: CometChatMessagePlugin = {
  id: 'image',
  messageTypes: [CometChatUIKitConstants.MessageTypes.image],
  messageCategories: [CometChatUIKitConstants.MessageCategory.message],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    // Plugin alignment may be 'center'; the bubble only distinguishes left/right.
    const alignment = context.alignment === 'right' ? 'right' : 'left';
    const textFormatters = context.getTextFormatters?.() ?? [];

    const props: CometChatImagesBubbleProps = {
      message: message as CometChat.MediaMessage,
      alignment,
      textFormatters,
    };
    return React.createElement(CometChatImagesBubble, props);
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
      label = t?.('conversation_subtitle_image') ?? 'Photo';
    } else {
      const pluralKey = 'media_edit_preview_image_plural';
      const plural = t?.(pluralKey) ?? 'Images';
      label = plural !== pluralKey ? `${String(count)} ${plural}` : `${String(count)} Images`;
    }

    if (caption.trim()) {
      const formatted = formatCaptionForPreview(caption, message, loggedInUser);
      return formatted ? `${label} · ${formatted}` : label;
    }
    return label;
  },
};
