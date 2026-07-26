import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessagePluginContext,
  CometChatMessageOption,
} from '../../plugin.types';
import type { CometChatAudiosBubbleProps } from '../../../components/CometChatAudiosBubble/CometChatAudiosBubble.types';
import type { CometChatVoiceNoteBubbleProps } from '../../../components/CometChatVoiceNoteBubble/CometChatVoiceNoteBubble.types';
import { CometChatAudiosBubble } from '../../../components/CometChatAudiosBubble/CometChatAudiosBubble';
import { CometChatVoiceNoteBubble } from '../../../components/CometChatVoiceNoteBubble/CometChatVoiceNoteBubble';
import { isVoiceNote } from '../../../utils/CometChatMetadataUtils';
import { getMediaMessageOptions } from '../shared/CometChatMessageOptions';
import { formatCaptionForPreview } from '../shared/formatCaptionForPreview';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';

/**
 * Core plugin for audio messages.
 *
 * Handles message type 'audio' in category 'message'.
 *
 * Routes by `audioType` metadata:
 * - voice note (explicitly tagged `audioType === "voice_note"`) → CometChatVoiceNoteBubble.
 * - everything else (attached audio file, or no `audioType`) → CometChatAudiosBubble.
 *
 * Both bubbles self-extract the audio attachments and caption from the message.
 *
 * The legacy single-attachment CometChatAudioBubble remains available as a
 * deprecated standalone component for consumers who want it. (CometChatVoiceNoteBubble
 * itself is a thin wrapper around that waveform renderer.)
 */
export const CometChatAudioPlugin: CometChatMessagePlugin = {
  id: 'audio',
  messageTypes: [CometChatUIKitConstants.MessageTypes.audio],
  messageCategories: [CometChatUIKitConstants.MessageCategory.message],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    const alignment = context.alignment === 'right' ? 'right' : 'left';
    const textFormatters = context.getTextFormatters?.() ?? [];

    // Voice note vs attached audio file.
    if (isVoiceNote(message)) {
      const props: CometChatVoiceNoteBubbleProps = {
        message: message as CometChat.MediaMessage,
        alignment,
        textFormatters,
      };
      return React.createElement(CometChatVoiceNoteBubble, props);
    }

    const props: CometChatAudiosBubbleProps = {
      message: message as CometChat.MediaMessage,
      alignment,
      textFormatters,
    };
    return React.createElement(CometChatAudiosBubble, props);
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
    if (isVoiceNote(message)) {
      return t?.('conversation_subtitle_voice_note') ?? 'Voice Note';
    }

    const mediaMsg = message as CometChat.MediaMessage;
    const attachments =
      typeof mediaMsg.getAttachments === 'function' ? mediaMsg.getAttachments() : [];
    const count = Math.max(attachments.length, 1);
    const caption = typeof mediaMsg.getCaption === 'function' ? mediaMsg.getCaption() || '' : '';

    let label: string;
    if (count === 1) {
      label = t?.('conversation_subtitle_audio') ?? 'Audio';
    } else {
      const pluralKey = 'media_edit_preview_audio_plural';
      const plural = t?.(pluralKey) ?? 'Audio Files';
      label = plural !== pluralKey ? `${String(count)} ${plural}` : `${String(count)} Audio Files`;
    }

    if (caption.trim()) {
      const formatted = formatCaptionForPreview(caption, message, loggedInUser);
      return formatted ? `${label} · ${formatted}` : label;
    }
    return label;
  },
};
