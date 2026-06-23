import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Message Status Enum
// ---------------------------------------------------------------------------

/**
 * Status values for message lifecycle UI events.
 * Matches Angular's MessageStatus enum.
 */
export enum CometChatMessageStatus {
  /** Message is being sent (optimistic, before SDK confirmation). */
  inprogress = 'inprogress',
  /** Message was sent and confirmed by the SDK. */
  success = 'success',
  /** Message send/edit failed. */
  error = 'error',
  /** Operation was cancelled by the user (e.g., closed edit/reply preview). */
  cancelled = 'cancelled',
}

// ---------------------------------------------------------------------------
// SDK Events (from network — existing, unchanged)
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all SDK events emitted by the CometChat SDK listeners.
 * These events originate from the network (other users, other tabs/devices).
 */
export type CometChatSDKEvent =
  // --- Messages ---
  | { type: 'message/text-received'; message: CometChat.TextMessage }
  | { type: 'message/media-received'; message: CometChat.MediaMessage }
  | { type: 'message/custom-received'; message: CometChat.CustomMessage }
  | { type: 'message/interactive-received'; message: CometChat.InteractiveMessage }
  | { type: 'message/edited'; message: CometChat.BaseMessage }
  | { type: 'message/deleted'; message: CometChat.BaseMessage }
  | { type: 'message/moderated'; message: CometChat.BaseMessage }
  // --- Receipts ---
  | { type: 'receipt/delivered'; receipt: CometChat.MessageReceipt }
  | { type: 'receipt/read'; receipt: CometChat.MessageReceipt }
  | { type: 'receipt/delivered-to-all'; receipt: CometChat.MessageReceipt }
  | { type: 'receipt/read-by-all'; receipt: CometChat.MessageReceipt }
  // --- Reactions ---
  | { type: 'reaction/added'; event: CometChat.ReactionEvent }
  | { type: 'reaction/removed'; event: CometChat.ReactionEvent }
  // --- Typing ---
  | { type: 'typing/started'; indicator: CometChat.TypingIndicator }
  | { type: 'typing/ended'; indicator: CometChat.TypingIndicator }
  // --- User presence ---
  | { type: 'user/online'; user: CometChat.User }
  | { type: 'user/offline'; user: CometChat.User }
  // --- Group events ---
  | {
      type: 'group/member-joined';
      action: CometChat.Action;
      joinedUser: CometChat.User;
      joinedGroup: CometChat.Group;
    }
  | {
      type: 'group/member-left';
      action: CometChat.Action;
      leftUser: CometChat.User;
      leftGroup: CometChat.Group;
    }
  | {
      type: 'group/member-kicked';
      action: CometChat.Action;
      kickedUser: CometChat.User;
      kickedBy: CometChat.User;
      kickedFrom: CometChat.Group;
    }
  | {
      type: 'group/member-banned';
      action: CometChat.Action;
      bannedUser: CometChat.User;
      bannedBy: CometChat.User;
      bannedFrom: CometChat.Group;
    }
  | {
      type: 'group/member-unbanned';
      action: CometChat.Action;
      unbannedUser: CometChat.User;
      unbannedBy: CometChat.User;
      unbannedFrom: CometChat.Group;
    }
  | {
      type: 'group/member-added';
      action: CometChat.Action;
      addedBy: CometChat.User;
      addedUser: CometChat.User;
      addedTo: CometChat.Group;
    }
  | {
      type: 'group/member-scope-changed';
      action: CometChat.Action;
      changedUser: CometChat.User;
      newScope: string;
      oldScope: string;
      changedGroup: CometChat.Group;
    }
  // --- Call events ---
  | { type: 'call/incoming'; call: CometChat.Call }
  | { type: 'call/accepted'; call: CometChat.Call }
  | { type: 'call/rejected'; call: CometChat.Call }
  | { type: 'call/cancelled'; call: CometChat.Call }
  | { type: 'call/ended'; call: CometChat.Call }
  // --- Connection ---
  | { type: 'connection/connected' }
  | { type: 'connection/disconnected' };

// ---------------------------------------------------------------------------
// UI Events (local actions from this tab's components)
// ---------------------------------------------------------------------------

/**
 * Discriminated union of UI events published by components for local
 * cross-component communication. Prefixed with `ui:` to distinguish
 * from SDK events.
 *
 */
export type CometChatUIEvent =
  // --- Message lifecycle (from composer / message list) ---
  | {
      type: 'ui:message/sent';
      message: CometChat.BaseMessage;
      status:
        | CometChatMessageStatus.inprogress
        | CometChatMessageStatus.success
        | CometChatMessageStatus.error;
    }
  | { type: 'ui:message/deleted'; message: CometChat.BaseMessage }
  | { type: 'ui:message/read'; message: CometChat.BaseMessage }
  // --- Conversation state (from message list) ---
  | { type: 'ui:conversation/read'; conversationId: string }
  | { type: 'ui:conversation/updated'; conversation: CometChat.Conversation }
  // --- Active chat (from message list on first load) ---
  | {
      type: 'ui:active-chat/changed';
      user?: CometChat.User;
      group?: CometChat.Group;
      message?: CometChat.BaseMessage;
      unreadMessageCount?: number;
    }
  // --- Composer commands (bidirectional: list ↔ composer) ---
  | {
      type: 'ui:compose/edit';
      message: CometChat.BaseMessage;
      status: CometChatMessageStatus;
      parentMessageId?: number | null | undefined;
    }
  | {
      type: 'ui:compose/reply';
      message: CometChat.BaseMessage;
      status:
        | CometChatMessageStatus.inprogress
        | CometChatMessageStatus.success
        | CometChatMessageStatus.cancelled;
      parentMessageId?: number | null | undefined;
    }
  | { type: 'ui:compose/text'; text: string }
  // --- Composer recording exclusivity ---
  | { type: 'ui:compose/recording-started'; composerInstanceId: string }
  // --- User actions ---
  | { type: 'ui:user/blocked'; user: CometChat.User }
  | { type: 'ui:user/unblocked'; user: CometChat.User }
  // --- Group actions (from group members / groups component) ---
  | { type: 'ui:group/created'; group: CometChat.Group }
  | { type: 'ui:group/left'; group: CometChat.Group }
  | { type: 'ui:group/deleted'; group: CometChat.Group }
  | { type: 'ui:group/member-joined'; joinedUser: CometChat.User; joinedGroup: CometChat.Group }
  | { type: 'ui:group/member-added'; messages: CometChat.Action[]; group: CometChat.Group }
  | {
      type: 'ui:group/member-kicked';
      message: CometChat.Action;
      user: CometChat.User;
      group: CometChat.Group;
    }
  | {
      type: 'ui:group/member-banned';
      message: CometChat.Action;
      user: CometChat.User;
      group: CometChat.Group;
    }
  | {
      type: 'ui:group/member-unbanned';
      message?: CometChat.Action;
      user: CometChat.User;
      group: CometChat.Group;
    }
  | {
      type: 'ui:group/member-scope-changed';
      message: CometChat.Action;
      user: CometChat.User;
      group: CometChat.Group;
      newScope: string;
    }
  | {
      type: 'ui:group/ownership-changed';
      group: CometChat.Group;
      newOwner: CometChat.User;
      previousOwnerUid: string;
    }
  // --- Thread (from message list / thread panel) ---
  | { type: 'ui:thread/opened'; parentMessage: CometChat.BaseMessage }
  | { type: 'ui:thread/closed' }
  // --- Call actions (from incoming/outgoing call components) ---
  | { type: 'ui:call/outgoing'; call: CometChat.Call }
  | { type: 'ui:call/rejected'; call: CometChat.Call }
  | { type: 'ui:call/ended'; call?: CometChat.Call }
  | { type: 'ui:call/accepted'; call: CometChat.Call }
  | { type: 'ui:call/join'; sessionId: string; message: CometChat.BaseMessage }
  // --- Conversation actions ---
  | { type: 'ui:conversation/deleted'; conversation: CometChat.Conversation }
  // --- Open chat (message privately) ---
  | { type: 'ui:open-chat'; user?: CometChat.User; group?: CometChat.Group }
  | {
      type: 'ui:panel/show';
      position: 'messageListFooter' | 'messageListHeader';
      panel: 'smartReplies' | 'conversationSummary' | 'conversationStarters';
    }
  | {
      type: 'ui:panel/hide';
      position: 'messageListFooter' | 'messageListHeader';
    };

// ---------------------------------------------------------------------------
// Combined Event Type
// ---------------------------------------------------------------------------

/** All CometChat events — SDK (from network) + UI (from local actions). */
export type CometChatEvent = CometChatSDKEvent | CometChatUIEvent;

// ---------------------------------------------------------------------------
// Context Value
// ---------------------------------------------------------------------------

/** Context value for the unified CometChatEventsProvider. */
export interface CometChatEventsContextValue {
  /** Subscribe to all events (SDK + UI). Returns an unsubscribe function. */
  subscribe: (handler: (event: CometChatEvent) => void) => () => void;
  /** Publish a UI event. Only `ui:*` prefixed events can be published by components. */
  publish: (event: CometChatUIEvent) => void;
}

/** Props for CometChatEventsProvider. */
export interface CometChatEventsProviderProps {
  children: ReactNode;
}
