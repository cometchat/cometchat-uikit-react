import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../../plugin.types';
import type {
  CometChatVideoBubbleAttachment,
  CometChatVideoBubbleProps,
} from './CometChatVideoBubble.types';
import { CometChatVideoBubble } from './CometChatVideoBubble';
import { getMediaMessageOptions } from '../shared/CometChatMessageOptions';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';

// --- Attachment extraction ---

function extractAttachments(message: CometChat.BaseMessage): CometChatVideoBubbleAttachment[] {
  try {
    const mediaMessage = message as CometChat.MediaMessage;
    const rawAttachments: unknown = mediaMessage.getAttachments();

    if (Array.isArray(rawAttachments) && rawAttachments.length > 0) {
      const attachments = (rawAttachments as unknown[])
        .filter(
          (att): att is Record<string, unknown> =>
            att != null &&
            typeof att === 'object' &&
            typeof (att as Record<string, unknown>).url === 'string'
        )
        .map(att => {
          const metadata = (
            typeof att.metadata === 'object' && att.metadata != null ? att.metadata : {}
          ) as Record<string, unknown>;
          const result: CometChatVideoBubbleAttachment = {
            url: att.url as string,
          };
          if (typeof att.thumbnail === 'string') result.thumbnail = att.thumbnail;
          if (typeof metadata.duration === 'number') result.duration = metadata.duration;
          if (typeof metadata.width === 'number') result.width = metadata.width;
          if (typeof metadata.height === 'number') result.height = metadata.height;
          if (typeof metadata.size === 'number') result.size = metadata.size;
          if (typeof metadata.mimeType === 'string') result.mimeType = metadata.mimeType;
          return result;
        })
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        .filter((att): att is CometChatVideoBubbleAttachment => att != null);

      if (attachments.length > 0) {
        // Fallback: check @injected metadata for thumbnail-generation extension
        if (attachments[0].thumbnail === undefined) {
          try {
            const msgMetadata = mediaMessage.getMetadata() as Record<string, unknown> | null;
            if (msgMetadata) {
              const injected = msgMetadata['@injected'] as Record<string, unknown> | undefined;
              const ext = injected?.extensions as Record<string, unknown> | undefined;
              const thumbGen = ext?.['thumbnail-generation'] as Record<string, unknown> | undefined;
              const thumbUrl = thumbGen?.url_medium;
              if (typeof thumbUrl === 'string') {
                attachments[0].thumbnail = thumbUrl;
              }
            }
          } catch {
            // ignore — thumbnail is optional
          }
        }
        return attachments;
      }
    }

    // Fallback for optimistic (pending) messages: use blob URL from File in metadata
    const msgMetadata = mediaMessage.getMetadata() as Record<string, unknown> | null;
    if (msgMetadata && msgMetadata.file instanceof File) {
      const file = msgMetadata.file;
      return [
        {
          url: URL.createObjectURL(file),
          isPlaceholder: true,
        } as CometChatVideoBubbleAttachment,
      ];
    }

    return [];
  } catch {
    return [];
  }
}

function extractCaption(message: CometChat.BaseMessage): string {
  try {
    const mediaMessage = message as CometChat.MediaMessage;
    const text = mediaMessage.getCaption();
    if (text.trim().length > 0) return text;

    const data: unknown = mediaMessage.getData();
    if (
      data != null &&
      typeof data === 'object' &&
      typeof (data as Record<string, unknown>).text === 'string'
    ) {
      const dataText = (data as Record<string, unknown>).text as string;
      if (dataText.trim().length > 0) return dataText;
    }

    return '';
  } catch {
    return '';
  }
}

/**
 * Core plugin for video messages.
 *
 * Handles message type 'video' in category 'message'.
 * Single video: inline <video> with native controls.
 * Multi-video: thumbnail grid with play overlays, click opens fullscreen viewer.
 */
export const CometChatVideoPlugin: CometChatMessagePlugin = {
  id: 'video',
  messageTypes: [CometChatUIKitConstants.MessageTypes.video],
  messageCategories: [CometChatUIKitConstants.MessageCategory.message],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    const attachments = extractAttachments(message);
    const caption = extractCaption(message);
    const variant = context.alignment === 'right' ? 'outgoing' : 'incoming';
    const sender = message.getSender();
    const senderName = sender.getName();

    const props: CometChatVideoBubbleProps = {
      attachments,
      variant,
      message: message as CometChat.MediaMessage,
      senderName,
    };
    if (caption) {
      props.caption = caption;
      props.textFormatters = context.getTextFormatters?.() ?? [];
    }

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
