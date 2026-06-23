import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessagePlugin, CometChatMessageOption } from '../../plugin.types';
import { CometChatCallActionBubble } from '../../../components/CometChatCallActionBubble';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';

/**
 * Core plugin for call action messages (missed call, ended call, etc.).
 *
 * System messages rendered as centered, pill-shaped bubbles with an icon.
 * CometChatCallActionBubble derives the status text/icon from the message
 * itself (using the logged-in user + localization). No context menu options.
 *
 * Handles both audio and video call types in the 'call' category.
 */
export const CometChatCallActionPlugin: CometChatMessagePlugin = {
  id: 'call-action',
  messageTypes: [
    CometChatUIKitConstants.MessageTypes.audio,
    CometChatUIKitConstants.MessageTypes.video,
  ],
  messageCategories: [CometChatUIKitConstants.MessageCategory.call],

  renderBubble(message: CometChat.BaseMessage) {
    return React.createElement(CometChatCallActionBubble, { message });
  },

  getOptions(): CometChatMessageOption[] {
    return [];
  },

  getLastMessagePreview(
    message: CometChat.BaseMessage,
    _loggedInUser: CometChat.User,
    t?: (key: string) => string
  ): string {
    const call = message as CometChat.Call;
    const isVideo = call.getType() === CometChatUIKitConstants.MessageTypes.video;
    return isVideo
      ? (t?.('conversation_subtitle_video_call') ?? 'Video call')
      : (t?.('conversation_subtitle_voice_call') ?? 'Voice call');
  },
};
