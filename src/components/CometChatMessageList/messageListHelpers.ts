import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatSDKEvent } from '../../context/CometChatEvents.types';

// ---------------------------------------------------------------------------
// Helpers shared across message list sub-hooks
// ---------------------------------------------------------------------------

/** No-op function for silent catch handlers (avoids ESLint empty-arrow-function). */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function noop() {}

// ---------------------------------------------------------------------------
// Group event helper
// ---------------------------------------------------------------------------

/**
 * Extract the group object from different group event shapes.
 * Each group event type stores the group under a different property name.
 */
export function extractGroupFromEvent(event: CometChatSDKEvent): CometChat.Group | undefined {
  switch (event.type) {
    case 'group/member-joined':
      return event.joinedGroup;
    case 'group/member-left':
      return event.leftGroup;
    case 'group/member-kicked':
      return event.kickedFrom;
    case 'group/member-banned':
      return event.bannedFrom;
    case 'group/member-unbanned':
      return event.unbannedFrom;
    case 'group/member-added':
      return event.addedTo;
    case 'group/member-scope-changed':
      return event.changedGroup;
    default:
      return undefined;
  }
}
