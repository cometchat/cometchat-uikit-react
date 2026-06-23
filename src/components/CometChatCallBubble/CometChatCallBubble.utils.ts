import type { CometChat } from '@cometchat/chat-sdk-javascript';

/** Call type for a meeting/direct-call message. */
export type CometChatCallBubbleType = 'audio' | 'video';

/**
 * Extract the session ID from a meeting custom message.
 * Path: data.customData.sessionID
 */
export function getCallSessionId(message: CometChat.CustomMessage): string {
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
 * Path: data.customData.callType — "audio" or "video".
 * Defaults to "video" if not specified.
 */
export function getCallType(message: CometChat.CustomMessage): CometChatCallBubbleType {
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
 * Get the icon CSS class for the call bubble based on call type and direction.
 */
export function getCallIconClass(callType: CometChatCallBubbleType, isSentByMe: boolean): string {
  if (callType === 'audio') {
    return isSentByMe
      ? 'cometchat-call-bubble__icon--outgoing-audio'
      : 'cometchat-call-bubble__icon--incoming-audio';
  }
  return isSentByMe
    ? 'cometchat-call-bubble__icon--outgoing-video'
    : 'cometchat-call-bubble__icon--incoming-video';
}

/**
 * Get the localized title for the call bubble based on call type.
 */
export function getCallTitle(
  callType: CometChatCallBubbleType,
  t?: (key: string) => string
): string {
  return callType === 'audio'
    ? (t?.('message_list_voice_call') ?? 'Voice Call')
    : (t?.('message_list_video_call') ?? 'Video Call');
}

/**
 * Format a Unix timestamp (seconds) into a readable date string using the given locale.
 */
export function formatCallDate(timestamp: number, locale = 'en-US'): string {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
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
