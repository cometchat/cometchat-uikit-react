import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessageOption,
  CometChatMessagePluginContext,
} from '../../plugin.types';
import { CometChatCallBubble } from '../../../components/CometChatCallBubble/CometChatCallBubble';
import { getCallType } from '../../../components/CometChatCallBubble/CometChatCallBubble.utils';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/CometChatLocalize';

/**
 * Plugin for group/conference call messages (meeting type).
 *
 * These are custom messages with type "meeting" that show a call bubble
 * with a "Join" button in group chats.
 *
 * Handles 4 combinations:
 * - Video call (incoming/outgoing)
 * - Audio call (incoming/outgoing)
 */
export const CometChatMeetingPlugin: CometChatMessagePlugin = {
  id: 'meeting',
  messageTypes: [CometChatUIKitConstants.calls.meeting],
  messageCategories: [CometChatUIKitConstants.MessageCategory.custom],

  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext) {
    // The bubble self-extracts call type, session id, title, icon and timestamp
    // from the message. We only pass alignment and the join handler.
    return React.createElement(CometChatCallBubble, {
      message,
      alignment: context.alignment === 'right' ? 'right' : 'left',
      onJoinClick: (sessionId: string) => {
        // Publish a UI event so the calling integration can handle it
        context.publish?.({ type: 'ui:call/join', sessionId, message });
      },
    });
  },

  getOptions(): CometChatMessageOption[] {
    return [];
  },

  getLastMessagePreview(
    message: CometChat.BaseMessage,
    loggedInUser: CometChat.User,
    t?: (key: string) => string
  ): string {
    const customMsg = message as CometChat.CustomMessage;
    const callType = getCallType(customMsg);
    const sender = message.getSender();
    const isSentByMe = sender.getUid() === loggedInUser.getUid();

    if (isSentByMe) {
      return callType === 'audio'
        ? (t?.('conversation_subtitle_group_voice_call_initated_self') ??
            CometChatLocalize.getSharedInstance()?.t(
              'conversation_subtitle_group_voice_call_initated_self'
            ) ??
            "You've initiated a voice call")
        : (t?.('conversation_subtitle_group_video_call_initated_self') ??
            CometChatLocalize.getSharedInstance()?.t(
              'conversation_subtitle_group_video_call_initated_self'
            ) ??
            "You've initiated a video call");
    }
    const senderName = sender.getName();
    const suffix =
      callType === 'audio'
        ? (t?.('conversation_subtitle_group_voice_call_initated') ??
          CometChatLocalize.getSharedInstance()?.t(
            'conversation_subtitle_group_voice_call_initated'
          ) ??
          'initiated a voice call')
        : (t?.('conversation_subtitle_group_video_call_initated') ??
          CometChatLocalize.getSharedInstance()?.t(
            'conversation_subtitle_group_video_call_initated'
          ) ??
          'initiated a video call');
    return `${senderName} ${suffix}`;
  },
};
