import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';

/** Determine if the call was sent by the logged-in user. */
export function isSentByMe(call: CometChat.Call, loggedInUser: CometChat.User): boolean {
  const initiatorUid = call.getCallInitiator().getUid();
  return initiatorUid === loggedInUser.getUid();
}

/** Determine if the call is a missed call for the logged-in user. */
export function isMissedCall(call: CometChat.Call, loggedInUser: CometChat.User): boolean {
  const initiatorUid = call.getCallInitiator().getUid();
  const callStatus = call.getStatus();
  if (!initiatorUid || initiatorUid === loggedInUser.getUid()) {
    return false;
  }
  const missedStatuses = [
    CometChatUIKitConstants.calls.busy,
    CometChatUIKitConstants.calls.unanswered,
    CometChatUIKitConstants.calls.cancelled,
  ];
  return missedStatuses.includes(callStatus);
}

/** Get the localized call status text. */
export function getCallStatusText(
  call: CometChat.Call,
  loggedInUser: CometChat.User,
  t?: (key: string) => string
): string {
  const callStatus = call.getStatus();
  const sentByMe = isSentByMe(call, loggedInUser);

  if (sentByMe) {
    switch (callStatus) {
      case CometChatUIKitConstants.calls.initiated:
        return t?.('call_action_outgoing') ?? 'Outgoing Call';
      case CometChatUIKitConstants.calls.cancelled:
        return t?.('call_action_cancelled') ?? 'Cancelled Call';
      case CometChatUIKitConstants.calls.rejected:
        return t?.('call_action_rejected') ?? 'Rejected Call';
      case CometChatUIKitConstants.calls.busy:
        return t?.('call_action_missed') ?? 'Missed Call';
      case CometChatUIKitConstants.calls.ended:
        return t?.('call_action_ended') ?? 'Call Ended';
      case CometChatUIKitConstants.calls.ongoing:
        return t?.('call_action_answered') ?? 'Answered Call';
      case CometChatUIKitConstants.calls.unanswered:
        return t?.('call_action_unanswered') ?? 'Unanswered Call';
      default:
        return t?.('call_action_outgoing') ?? 'Outgoing Call';
    }
  } else {
    switch (callStatus) {
      case CometChatUIKitConstants.calls.initiated:
        return t?.('call_action_incoming') ?? 'Incoming Call';
      case CometChatUIKitConstants.calls.ongoing:
        return t?.('call_action_answered') ?? 'Answered Call';
      case CometChatUIKitConstants.calls.ended:
        return t?.('call_action_ended') ?? 'Call Ended';
      case CometChatUIKitConstants.calls.unanswered:
      case CometChatUIKitConstants.calls.cancelled:
        return t?.('call_action_missed') ?? 'Missed Call';
      case CometChatUIKitConstants.calls.busy:
        return t?.('call_action_busy') ?? 'Busy Call';
      case CometChatUIKitConstants.calls.rejected:
        return t?.('call_action_rejected') ?? 'Rejected Call';
      default:
        return t?.('call_action_outgoing') ?? 'Outgoing Call';
    }
  }
}

/** Get the appropriate icon CSS class for the call status. */
export function getCallIconClass(call: CometChat.Call, loggedInUser: CometChat.User): string {
  const callStatus = call.getStatus();
  const isVideo = call.getType() === CometChatUIKitConstants.MessageTypes.video;
  const sentByMe = isSentByMe(call, loggedInUser);
  const missed = isMissedCall(call, loggedInUser);

  if (missed) {
    return isVideo
      ? 'cometchat-action-bubble__icon--missed-video'
      : 'cometchat-action-bubble__icon--missed-audio';
  }

  if (callStatus === CometChatUIKitConstants.calls.ended) {
    return 'cometchat-action-bubble__icon--call-ended';
  }

  if (sentByMe) {
    return isVideo
      ? 'cometchat-action-bubble__icon--outgoing-video'
      : 'cometchat-action-bubble__icon--outgoing-audio';
  }

  return isVideo
    ? 'cometchat-action-bubble__icon--incoming-video'
    : 'cometchat-action-bubble__icon--incoming-audio';
}
