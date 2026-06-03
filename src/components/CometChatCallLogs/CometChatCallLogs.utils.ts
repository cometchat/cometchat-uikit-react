import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';

/**
 * Determine the "other" user in a call log (the person who isn't the logged-in user).
 * If the logged-in user initiated the call, returns the receiver. Otherwise returns the initiator.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function verifyCallUser(call: any, loggedInUser: CometChat.User): any {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  if (call.getInitiator().getUid() === loggedInUser.getUid()) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return call.getReceiver();
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  return call.getInitiator();
}

/**
 * Determine if the call was sent by the logged-in user.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isSentByMe(call: any, loggedInUser: CometChat.User): boolean {
  let senderUid = '';
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    senderUid = call.getCallInitiator?.()?.getUid?.() ?? call.getInitiator?.()?.getUid?.() ?? '';
  } catch {
    // ignore
  }
  return !senderUid || senderUid === loggedInUser.getUid();
}

/**
 * Determine if the call is a missed call for the logged-in user.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isMissedCall(call: any, loggedInUser: CometChat.User): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const callStatus: string = (call.getStatus?.() as string | undefined) ?? '';
  const sentByMe = isSentByMe(call, loggedInUser);

  if (sentByMe) {
    return false;
  }

  const missedStatuses = [
    CometChatUIKitConstants.calls.unanswered,
    CometChatUIKitConstants.calls.cancelled,
    CometChatUIKitConstants.calls.busy,
    CometChatUIKitConstants.calls.rejected,
  ];

  return missedStatuses.includes(callStatus);
}
