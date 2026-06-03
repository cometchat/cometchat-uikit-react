import React from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessagePlugin,
  CometChatMessageOption,
  CometChatMessagePluginContext,
} from '../../plugin.types';
import { CometChatCallBubble } from './CometChatCallBubble';
import { CometChatUIKitConstants } from '../../../constants/CometChatUIKitConstants';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/CometChatLocalize';

/**
 * Extract the session ID from a meeting custom message.
 * Path: data.customData.sessionID
 */
function getSessionId(message: CometChat.CustomMessage): string {
  try {
    const data = message.getData() as Record<string, unknown> | undefined;
    const customData = data?.customData as Record<string, unknown> | undefined;
    const sessionID = customData?.sessionID;
    return typeof sessionID === 'string' ? sessionID : '';
  } catch {
    return '';
  }
}

/**
 * Extract the call type from a meeting custom message.
 * Path: data.customData.callType — "audio" or "video"
 * Defaults to "video" if not specified.
 */
function getCallType(message: CometChat.CustomMessage): 'audio' | 'video' {
  try {
    const data = message.getData() as Record<string, unknown> | undefined;
    const customData = data?.customData as Record<string, unknown> | undefined;
    const callType = customData?.callType as string | undefined;
    return callType === 'audio' ? 'audio' : 'video';
  } catch {
    return 'video';
  }
}

/**
 * Format a Unix timestamp (seconds) to a readable date string using the current locale.
 */
function formatDate(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  const locale = CometChatLocalize.getSharedInstance()?.getDateLocaleLanguage() ?? 'en-US';
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

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
    const customMsg = message as CometChat.CustomMessage;
    const isSentByMe = context.alignment === 'right';
    const sessionId = getSessionId(customMsg);
    const callType = getCallType(customMsg);

    // Determine icon class based on call type and direction
    let iconClassName: string;
    if (callType === 'audio') {
      iconClassName = isSentByMe
        ? 'cometchat-call-bubble__icon--outgoing-audio'
        : 'cometchat-call-bubble__icon--incoming-audio';
    } else {
      iconClassName = isSentByMe
        ? 'cometchat-call-bubble__icon--outgoing-video'
        : 'cometchat-call-bubble__icon--incoming-video';
    }

    // Title based on call type
    const title =
      callType === 'audio'
        ? (context.getLocalizedString?.('message_list_voice_call') ?? 'Voice Call')
        : (context.getLocalizedString?.('message_list_video_call') ?? 'Video Call');

    // Subtitle: formatted date from sentAt
    const sentAt = message.getSentAt();
    const subtitle = formatDate(sentAt);

    return React.createElement(CometChatCallBubble, {
      title,
      subtitle,
      buttonText: context.getLocalizedString?.('meeting_join') ?? 'Join',
      iconClassName,
      sessionId,
      isSentByMe,
      onClicked: (sid: string) => {
        // Publish a UI event so the calling integration can handle it
        context.publish?.({ type: 'ui:call/join', sessionId: sid, message });
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
