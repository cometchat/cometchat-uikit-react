import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../../plugin.types';
import type {
  CometChatImageBubbleAttachment,
  CometChatImageBubbleProps,
} from './CometChatImageBubble.types';
import { CometChatImageBubble } from './CometChatImageBubble';
import { getMediaMessageOptions } from '../shared/CometChatMessageOptions';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';

// --- Attachment extraction helpers ---

/**
 * Extract image attachments from a MediaMessage.
 * Filters out attachments without a valid URL.
 * For optimistic (pending) messages, returns a placeholder attachment with empty URL.
 */
function extractAttachments(message: CometChat.BaseMessage): CometChatImageBubbleAttachment[] {
  try {
    const mediaMessage = message as CometChat.MediaMessage;
    // Runtime: getAttachments() may return null despite SDK types saying Attachment[]
    const attachments = mediaMessage.getAttachments() as unknown as
      | CometChat.Attachment[]
      | null
      | undefined;

    if (attachments && attachments.length > 0) {
      const result: CometChatImageBubbleAttachment[] = [];
      for (const att of attachments) {
        const url = att.getUrl();
        if (url.length > 0) {
          const entry: CometChatImageBubbleAttachment = { url };
          const size = att.getSize();
          if (size) entry.size = size;
          result.push(entry);
        }
      }
      return result;
    }

    // Pending (optimistic) message — no attachments yet, show placeholder
    const metadata = mediaMessage.getMetadata() as Record<string, unknown> | null;
    if (metadata && metadata.file instanceof File) {
      return [{ url: '' }];
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Extract caption text from a MediaMessage.
 * Tries getText() first, then getData()?.text as fallback.
 */
function extractCaption(message: CometChat.BaseMessage): string {
  try {
    const mediaMessage = message as CometChat.MediaMessage;

    // Try getCaption() — the SDK method for media message captions
    const text = mediaMessage.getCaption();
    if (text.trim().length > 0) {
      return text;
    }

    // Fallback to getData()?.text
    const data: unknown = mediaMessage.getData();
    if (
      data != null &&
      typeof data === 'object' &&
      typeof (data as Record<string, unknown>).text === 'string'
    ) {
      const dataText = (data as Record<string, unknown>).text as string;
      if (dataText.trim().length > 0) {
        return dataText;
      }
    }

    return '';
  } catch {
    return '';
  }
}

/**
 * Core plugin for image messages.
 *
 * Handles message type 'image' in category 'message'.
 * Renders CometChatImageBubble with multi-image grid layout, captions,
 * and click-to-fullscreen gallery viewer.
 */
export const CometChatImagePlugin: CometChatMessagePlugin = {
  id: 'image',
  messageTypes: [CometChatUIKitConstants.MessageTypes.image],
  messageCategories: [CometChatUIKitConstants.MessageCategory.message],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    const attachments = extractAttachments(message);
    const caption = extractCaption(message);
    const variant = context.alignment === 'right' ? 'outgoing' : 'incoming';
    const sender = message.getSender();
    const senderName = sender.getName();

    const props: CometChatImageBubbleProps = {
      attachments,
      variant,
      message: message as CometChat.MediaMessage,
      senderName,
    };
    if (caption) {
      props.caption = caption;
      props.textFormatters = context.getTextFormatters?.() ?? [];
    }

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
