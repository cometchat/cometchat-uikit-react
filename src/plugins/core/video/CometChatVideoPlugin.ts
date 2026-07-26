import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../../plugin.types';
import type { CometChatVideosBubbleProps } from '../../../components/CometChatVideosBubble/CometChatVideosBubble.types';
import { CometChatVideosBubble } from '../../../components/CometChatVideosBubble/CometChatVideosBubble';
import { getMediaMessageOptions } from '../shared/CometChatMessageOptions';
import { formatCaptionForPreview } from '../shared/formatCaptionForPreview';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';

/**
 * Core plugin for video messages.
 *
 * Handles message type 'video' in category 'message'.
 *
 * Renders CometChatVideosBubble (batch-aware grid, thumbnail posters,
 * play-over-black fallback, fullscreen video pager, batch position awareness).
 * The bubble is self-extracting: it derives attachments, thumbnail, caption,
 * sender name and alignment from the SDK message itself.
 *
 * The legacy single-attachment CometChatVideoBubble remains available as a
 * deprecated standalone component for consumers who want it.
 */
export const CometChatVideoPlugin: CometChatMessagePlugin = {
  id: 'video',
  messageTypes: [CometChatUIKitConstants.MessageTypes.video],
  messageCategories: [CometChatUIKitConstants.MessageCategory.message],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    // Narrow 'center' to 'left' (incoming) to match prior plugin behavior.
    const alignment = context.alignment === 'right' ? 'right' : 'left';
    const textFormatters = context.getTextFormatters?.() ?? [];

    const props: CometChatVideosBubbleProps = {
      message: message as CometChat.MediaMessage,
      alignment,
      textFormatters,
    };
    return React.createElement(CometChatVideosBubble, props);
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
      label = t?.('conversation_subtitle_video') ?? 'Video';
    } else {
      const pluralKey = 'media_edit_preview_video_plural';
      const plural = t?.(pluralKey) ?? 'Videos';
      label = plural !== pluralKey ? `${String(count)} ${plural}` : `${String(count)} Videos`;
    }

    if (caption.trim()) {
      const formatted = formatCaptionForPreview(caption, message, loggedInUser);
      return formatted ? `${label} · ${formatted}` : label;
    }
    return label;
  },
};
