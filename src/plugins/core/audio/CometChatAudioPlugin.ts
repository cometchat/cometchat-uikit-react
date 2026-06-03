import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../../plugin.types';
import type {
  CometChatAudioBubbleAttachment,
  CometChatAudioBubbleProps,
} from './CometChatAudioBubble.types';
import { CometChatAudioBubble } from './CometChatAudioBubble';
import { getMediaMessageOptions } from '../shared/CometChatMessageOptions';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';

// --- Attachment extraction ---

function extractAttachments(message: CometChat.BaseMessage): CometChatAudioBubbleAttachment[] {
  try {
    const mediaMessage = message as CometChat.MediaMessage;
    const rawAttachments: unknown = mediaMessage.getAttachments();

    // If getAttachments() returns data, use it (confirmed messages)
    if (Array.isArray(rawAttachments) && rawAttachments.length > 0) {
      return (rawAttachments as unknown[])
        .filter(
          (att): att is Record<string, unknown> =>
            att != null &&
            typeof att === 'object' &&
            typeof (
              (att as Record<string, unknown>).url ?? (att as Record<string, unknown>).getUrl
            ) !== 'undefined'
        )
        .map(att => {
          const url =
            (typeof att.url === 'string' ? att.url : '') ||
            (typeof att.getUrl === 'function' ? String((att.getUrl as () => unknown)()) : '');
          if (!url) return null;

          const name =
            (typeof att.name === 'string' ? att.name : '') ||
            (typeof att.getName === 'function'
              ? String((att.getName as () => unknown)())
              : 'Audio');
          const mimeType =
            (typeof att.mimeType === 'string' ? att.mimeType : '') ||
            (typeof att.getMimeType === 'function'
              ? String((att.getMimeType as () => unknown)())
              : 'audio/mpeg');
          const extension =
            (typeof att.extension === 'string' ? att.extension : '') ||
            (typeof att.getExtension === 'function'
              ? String((att.getExtension as () => unknown)())
              : 'mp3');
          const rawSize =
            att.size ?? (typeof att.getSize === 'function' ? (att.getSize as () => unknown)() : 0);
          const size = typeof rawSize === 'number' ? rawSize : 0;

          return { name, url, mimeType, extension, size } satisfies CometChatAudioBubbleAttachment;
        })
        .filter((att): att is CometChatAudioBubbleAttachment => att != null);
    }

    // Fallback for optimistic (in-progress) messages: extract file from metadata
    const metadata = mediaMessage.getMetadata() as Record<string, unknown> | undefined;
    if (metadata?.file && metadata.file instanceof File) {
      const file = metadata.file;
      const url = URL.createObjectURL(file);
      return [
        {
          name: (metadata.fileName as string | undefined) ?? file.name,
          url,
          mimeType: (metadata.fileType as string | undefined) ?? (file.type || 'audio/webm'),
          extension: file.name.split('.').pop() ?? 'webm',
          size: typeof metadata.fileSize === 'number' ? metadata.fileSize : file.size,
        },
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
 * Core plugin for audio messages.
 *
 * Handles message type 'audio' in category 'message'.
 * Renders CometChatAudioBubble with WaveSurfer waveform, play/pause,
 * download with progress, multi-audio expand/collapse, and caption.
 */
export const CometChatAudioPlugin: CometChatMessagePlugin = {
  id: 'audio',
  messageTypes: [CometChatUIKitConstants.MessageTypes.audio],
  messageCategories: [CometChatUIKitConstants.MessageCategory.message],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    const attachments = extractAttachments(message);
    const caption = extractCaption(message);
    const variant = context.alignment === 'right' ? 'outgoing' : 'incoming';
    const sender = message.getSender();
    const senderName = sender.getName();

    const props: CometChatAudioBubbleProps = {
      attachments,
      variant,
      message: message as CometChat.MediaMessage,
      senderName,
    };
    if (caption) {
      props.caption = caption;
      props.textFormatters = context.getTextFormatters?.() ?? [];
    }

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
