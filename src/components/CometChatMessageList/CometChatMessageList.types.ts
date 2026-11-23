import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { ReactNode, RefObject } from 'react';
import type { CometChatFetchState } from '../../types';
import type { CometChatDateFormatConfig } from '../base/CometChatDate/CometChatDate.types';
import type { CometChatTextFormatter } from '../../formatters/CometChatTextFormatter';

// ---------------------------------------------------------------------------
// Message List Alignment
// ---------------------------------------------------------------------------

/** How messages are aligned in the list. */
export enum CometChatMessageListAlignment {
  /** All messages left-aligned (like Slack). */
  left = 0,
  /** Incoming left, outgoing right (standard chat). */
  standard = 1,
}

// ---------------------------------------------------------------------------
// Manager Options
// ---------------------------------------------------------------------------

/**
 * Options for constructing a CometChatMessageListManager.
 * The Manager is a stateless SDK wrapper — no React imports, no listeners.
 */
export interface CometChatMessageListManagerOptions {
  /** User for 1:1 chat. Mutually exclusive with group. */
  user?: CometChat.User;
  /** Group for group chat. Mutually exclusive with user. */
  group?: CometChat.Group;
  /** Optional custom MessagesRequestBuilder (overrides default builder). */
  builder?: CometChat.MessagesRequestBuilder;
  /** Parent message ID for thread mode (the derived id the manager scopes to). */
  parentMessageId?: number;
  /** Message types to include in the request. */
  messageTypes?: string[];
  /** Message categories to include in the request. */
  messageCategories?: string[];
  /** Page size for fetch requests. Defaults to 30. */
  limit?: number;
  /**
   * Agent chat renders its cards as thread replies and needs the parent message
   * returned alongside them. Ordinary threads must not include it — the parent
   * is already rendered by the thread header.
   */
  isAgentChat?: boolean;
}

// ---------------------------------------------------------------------------
// Message List State
// ---------------------------------------------------------------------------

export interface CometChatMessageListState {
  /**
   * All messages in the conversation, ordered by sentAt ascending.
   *
   * Each entry is a real SDK message object —
   * pending (just-sent), confirmed (server-acknowledged), edited, moderated,
   * errored, or deleted. The lifecycle is expressed by the message's own
   * fields (muid, id, sentAt, deliveredAt, readAt, moderationStatus,
   * metadata.error), not by a separate state container.
   *
   * Pending messages (before the SDK resolves sendMessage) carry a muid but
   * no server-assigned id yet. They are replaced in place by muid when the
   * SDK confirms (MESSAGE_SEND_SUCCESS) or fails (MESSAGE_SEND_ERROR).
   */
  messages: CometChat.BaseMessage[];
  /** Fetch lifecycle state for the initial load. */
  fetchState: CometChatFetchState;
  hasMore: boolean;
  hasMoreNewer: boolean;
  /**
   * Whether the list has fetched all the way to the most recent message.
   *
   * - `true` after a normal latest-message init or when fetchNext exhausts newer messages.
   * - `false` after goToMessageId / startFromUnreadMessages when newer messages exist beyond the window.
   *
   * When false, real-time received messages are NOT appended to the list —
   * they only increment newMessageCount. This prevents messages from appearing
   * out of order when the user is viewing historical messages.
   *
   */
  hasReachedLatest: boolean;
  isFetchingMore: boolean;
  error: string | null;
  /** Message ID to scroll to (for goToMessageId / startFromUnread / reply-preview). */
  scrollToMessageId: number | null;
  scrollToMessageHighlight: boolean;
  isAtBottom: boolean;
  newMessageCount: number;
  lastReadMessageId: number | null;
  unreadCount: number;
  isConversationRead: boolean;
  /** Whether the user manually marked a message as unread in this session.
   *  When true, auto-read (markConversationAsRead, markAsRead) is suppressed.
   *  Cleared only on RESET (new chat). */
  markedUnreadByUser: boolean;
  /** Whether to show the "New" unread separator banner.
   *  True only when: init goes to lastRead, scroll-to-bottom goes to lastRead, or mark-as-unread.
   *  Cleared on RESET (new chat). */
  showUnreadBanner: boolean;
  /**
   * Offline support only: `'connect_to_load_more'` when an offline read could
   * not go past the device cache (the list shows a "Connect to load older
   * messages" footer). Absent with offline off.
   */
  offlineFooter?: 'none' | 'connect_to_load_more';
  /**
   * Offline support only: `'connect_to_load_more'` when an offline read of
   * newer messages (a jumped window) could not go past the device cache; the
   * list stops paging newer and offers a "Connect to load newer messages"
   * button. Absent with offline off.
   */
  offlineNewerFooter?: 'none' | 'connect_to_load_more';
  /**
   * Offline support only: a sweep missed more than one page while the user was
   * reading older messages; the list keeps what is shown and offers "Jump to
   * latest". Absent with offline off.
   */
  offlineJumpToLatest?: boolean;
  /**
   * Offline support only: a jump or start-from-unread read is filling the
   * window around this message, page by page (cached first). Until it is
   * positioned there (`scrollToMessageId` set), the list neither scrolls to
   * the bottom nor loads newer messages. Absent with offline off.
   */
  offlineScrollAnchor?: number | null;
  /**
   * Offline support only: the connection came back while a "Connect to load"
   * footer is shown, so scrolling to that end loads again, as tapping it
   * does (UIK-READ-03). Absent with offline off.
   */
  offlineFooterRetryable?: boolean;
  /**
   * Offline support only: the list could not load because the SDK is not connected and
   * nothing is saved, so its error state reads "Connect to load messages" with no Retry (D84).
   * Absent with offline off.
   */
  connectToLoad?: boolean;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

export const initialMessageListState: CometChatMessageListState = {
  messages: [],
  fetchState: 'idle',
  hasMore: true,
  hasMoreNewer: false,
  hasReachedLatest: true,
  isFetchingMore: false,
  error: null,
  scrollToMessageId: null,
  scrollToMessageHighlight: false,
  isAtBottom: true,
  newMessageCount: 0,
  lastReadMessageId: null,
  unreadCount: 0,
  isConversationRead: false,
  markedUnreadByUser: false,
  showUnreadBanner: false,
};

// ---------------------------------------------------------------------------
// Message List Actions (Discriminated Union)
// ---------------------------------------------------------------------------

export type CometChatMessageListAction =
  // --- Fetch previous (older) ---
  | { type: 'FETCH_PREVIOUS_START' }
  | {
      type: 'FETCH_PREVIOUS_SUCCESS';
      messages: CometChat.BaseMessage[];
      hasMore: boolean;
    }
  | { type: 'FETCH_PREVIOUS_ERROR'; error: string }

  // --- Fetch next (newer) ---
  | { type: 'FETCH_NEXT_START' }
  | {
      type: 'FETCH_NEXT_SUCCESS';
      messages: CometChat.BaseMessage[];
      hasMoreNewer: boolean;
    }
  | { type: 'FETCH_NEXT_ERROR'; error: string }

  // --- Fetch around a messageId (bidirectional) ---
  | {
      type: 'FETCH_AROUND_SUCCESS';
      messages: CometChat.BaseMessage[];
      targetMessageId: number;
      hasMore: boolean;
      hasMoreNewer: boolean;
      /**
       * Whether the view should flash a highlight on the target message.
       * `true` for explicit goToMessage / reply-preview jumps; `false` when
       * scrolling is a side effect of startFromUnread (lastRead anchor).
       * Defaults to `false` if omitted.
       */
      highlight?: boolean;
    }

  // --- Send lifecycle ---
  // A send goes through START → (SUCCESS | ERROR). The pending message lives
  // directly in `state.messages` from START onwards; SUCCESS replaces it by
  // muid with the server-returned object, ERROR stamps an error onto it.
  | { type: 'MESSAGE_SEND_START'; muid: string; message: CometChat.BaseMessage }
  | {
      type: 'MESSAGE_SEND_SUCCESS';
      muid: string;
      confirmedMessage: CometChat.BaseMessage;
    }
  | { type: 'MESSAGE_SEND_ERROR'; muid: string; message: CometChat.BaseMessage; error: string }

  // --- Real-time updates ---
  | {
      type: 'MESSAGE_RECEIVED';
      message: CometChat.BaseMessage;
      fromLoggedInUser?: boolean;
      isLocalGroupAction?: boolean;
      /**
       * Offline support only: insert in sorted place by identity; `swept` = the
       * SDK's catch-up sweep delivered it (no unread or new-message count).
       */
      offline?: { swept: boolean };
    }
  | { type: 'MESSAGE_EDITED'; message: CometChat.BaseMessage }
  | { type: 'MESSAGE_DELETED'; message: CometChat.BaseMessage }
  /**
   * Pin/save state changed for a message already in the list.
   *
   * Deliberately field-scoped rather than a wholesale replace. `pinnedAt`/`pinnedBy`
   * are global and broadcast to every member, while `savedAt` is per-viewer — so a
   * pin broadcast frame is not expected to carry the receiving user's own save
   * state. Replacing wholesale would silently wipe their saved indicator.
   */
  | {
      type: 'MESSAGE_PIN_SAVE_UPDATE';
      message: CometChat.BaseMessage;
      scope: 'pin' | 'save';
    }
  // Remove the streaming bubble placeholder (run_started fake message) when AI response arrives
  | { type: 'REMOVE_STREAMING_BUBBLE' }
  | { type: 'ADD_STREAMING_BUBBLE'; message: CometChat.BaseMessage }
  // Process pending AI messages: find run_started bubble by runId and replace with pending messages.
  | {
      type: 'PROCESS_PENDING_MESSAGES';
      pendingMessagesMap: Record<string, CometChat.BaseMessage[]>;
    }

  // --- Receipts ---
  // Batch-updates deliveredAt/readAt on outgoing messages up to the receipt's messageId.
  | {
      type: 'RECEIPT_UPDATE';
      receiptType: 'delivered' | 'read';
      messageId: number;
      timestamp: number;
      loggedInUserId: string;
      /** Offline support only: never mark a row without a server id. */
      offline?: boolean;
    }

  // --- Reactions ---
  // The hook extracts reactions from the updated message and the reducer
  // applies them to the existing message in state (preserving quotedMessage, metadata, etc.).
  | {
      type: 'REACTION_UPDATE';
      messageId: number;
      reactions: CometChat.ReactionCount[];
    }

  // --- Scroll state ---
  | { type: 'SET_AT_BOTTOM'; isAtBottom: boolean }
  | {
      type: 'SET_SCROLL_TO_MESSAGE';
      messageId: number | null;
      /**
       * Whether to flash the highlight animation once the view scrolls
       * into position. Defaults to `false`.
       */
      highlight?: boolean;
    }
  | { type: 'CLEAR_NEW_MESSAGE_COUNT' }

  // --- Unread tracking ---
  | { type: 'SET_LAST_READ_MESSAGE_ID'; messageId: number | null }
  | { type: 'SET_UNREAD_COUNT'; count: number }
  | { type: 'SET_CONVERSATION_READ' }

  // --- Mark as unread by user ---
  | { type: 'SET_MARKED_UNREAD_BY_USER'; value: boolean }

  // --- Unread banner ---
  | { type: 'SET_SHOW_UNREAD_BANNER'; value: boolean }

  // --- Reply count ---
  // Increments replyCount on the parent message by 1.
  | { type: 'UPDATE_REPLY_COUNT'; parentMessageId: number }

  // --- Moderation ---
  // Replaces a moderated message in-place (same logic as MESSAGE_EDITED).
  | { type: 'MESSAGE_MODERATED'; message: CometChat.BaseMessage }

  // --- Historical view gap tracking ---
  | { type: 'SET_HAS_REACHED_LATEST'; hasReachedLatest: boolean }

  // --- Group reference sync ---
  // Updates the local group reference when group membership/ownership changes.
  | { type: 'UPDATE_GROUP_REFERENCE'; group: CometChat.Group }

  // --- Offline support (dispatched only with the SDK's offline support on) ---
  // Upsert rows by identity into their sorted place (cached page, own sends, sweep).
  | { type: 'OFFLINE_UPSERT'; messages: CometChat.BaseMessage[]; updateOnly?: boolean }
  // Apply a server page over the slice its cached page showed (windowed reconcile).
  | {
      type: 'OFFLINE_SERVER_PAGE';
      direction: 'previous' | 'next';
      cachedKeys: string[];
      messages: CometChat.BaseMessage[];
      /** The page before the kit's client filter, when it applied one. */
      rawMessages?: CometChat.BaseMessage[];
      /** The read goes on: this page left the list short, with history left. */
      continuing?: boolean;
      /** Rows this read's cached page added to the list, and every row of that page (D13-R2). */
      paintedKeys?: string[];
      rawCachedKeys?: string[];
    }
  // An offline read ended without a server page.
  | {
      type: 'OFFLINE_PAGE_ERROR';
      direction: 'previous' | 'next';
      notConnected: boolean;
      error: string;
      /** The connection was already back when the read gave up (it loads on scroll). */
      retryable?: boolean;
    }
  | { type: 'OFFLINE_REMOVE'; message: CometChat.BaseMessage }
  // Re-render the rows given (their send state changed outside the reducer).
  | { type: 'OFFLINE_TOUCH'; messages: CometChat.BaseMessage[] }
  // Reset to the newest window (a sweep missed more than one page).
  | { type: 'OFFLINE_REPLACE_ALL'; messages: CometChat.BaseMessage[] }
  // The newest window is ready but the user is reading older messages.
  | { type: 'OFFLINE_SET_JUMP_TO_LATEST'; value: boolean }
  // A jump / start-from-unread read around this message has started.
  | { type: 'OFFLINE_AROUND_START'; messageId: number }
  // The realtime connection is back: a "Connect to load" footer may load on scroll.
  | { type: 'OFFLINE_CONNECTED' }

  // --- Reset ---
  | { type: 'RESET' };

// ---------------------------------------------------------------------------
// Hook Options
// ---------------------------------------------------------------------------

export interface CometChatUseMessageListOptions {
  /** User for 1:1 chat. Mutually exclusive with group. */
  user?: CometChat.User;
  /** Group for group chat. Mutually exclusive with user. */
  group?: CometChat.Group;
  /**
   * The logged-in user. Optional — when omitted, falls back to
   * `CometChatUIKit.getLoggedInUser()`. Used for alignment, receipt logic,
   * and the conversation filter.
   */
  loggedInUser?: CometChat.User;
  /** Optional custom MessagesRequestBuilder. */
  messagesRequestBuilder?: CometChat.MessagesRequestBuilder;
  /**
   * Optional custom ReactionsRequestBuilder.
   */
  reactionsRequestBuilder?: CometChat.ReactionsRequestBuilder;
  /**
   * The thread's parent message, for thread mode. Preferred over
   * {@link parentMessageId}; the id is derived from it.
   */
  parentMessage?: CometChat.BaseMessage;
  /**
   * Parent message ID for thread mode.
   * @deprecated Pass {@link parentMessage} instead — the id is derived from it.
   * Still honoured when `parentMessage` is absent, for backward compatibility.
   */
  parentMessageId?: number;
  /** Scroll to last read message instead of bottom on open. */
  startFromUnreadMessages?: boolean;
  /** Jump to a specific message by ID (e.g., from search or deep link). */
  goToMessageId?: number;
  /** Message types to fetch. Defaults to plugin registry types. */
  messageTypes?: string[];
  /** Message categories to fetch. Defaults to plugin registry categories. */
  messageCategories?: string[];
  /** Disable incoming message sound. */
  disableSoundForMessages?: boolean;
  /** Custom sound URL for incoming messages. */
  customSoundForMessages?: string;
  /**
   * Force-scroll to bottom on every new message regardless of scroll position.
   */
  scrollToBottomOnNewMessages?: boolean;
  /**
   * Skip processing delivery/read receipt events entirely.
   * When true, both 1:1 and group receipts are ignored.
   */
  hideReceipts?: boolean;
  /** Error callback. */
  onError?: ((error: CometChat.CometChatException) => void) | null;

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // These flow straight through to the View via `CometChatMessageListOptions`
  // on the hook return. They are not consumed by the hook itself.

  /** Hide the sticky date header that floats at the top of the scroll area. */
  hideStickyDate?: boolean;
  /** Hide the avatar on incoming group messages. */
  hideAvatar?: boolean;
  /** Filter out messages in the `action` category (group join/leave/etc.). */
  hideGroupActionMessages?: boolean;
  /**
   * Number of quick-action options shown inline next to the bubble
   * before overflowing into the "More" menu. Default: 3.
   */
  quickOptionsCount?: number;

  // --- Message context-menu option toggles (per-instance) ---
  hideReplyOption?: boolean;
  hideReplyInThreadOption?: boolean;
  /**
   * Hide the thread-subscription option ("Notify me about replies" /
   * "Stop reply notifications") in the message context menu.
   *
   * The option is shown on every message type in **group** chats only — it
   * never appears in a 1:1 chat, whatever this flag says. Invoked on a thread
   * reply it acts on that reply's parent, since a subscription is always
   * rooted at the thread's parent message.
   *
   * @default false
   */
  hideThreadSubscriptionOption?: boolean;
  hideEditMessageOption?: boolean;
  hideDeleteMessageOption?: boolean;
  hideCopyMessageOption?: boolean;
  hideReactionOption?: boolean;
  hideMessageInfoOption?: boolean;
  hideFlagMessageOption?: boolean;
  hideMessagePrivatelyOption?: boolean;
  hideTranslateMessageOption?: boolean;
  /** Show the "Mark as Unread" option. Defaults to false (opt-in). */
  showMarkAsUnreadOption?: boolean;
  /** Hide the "Pin message" option. */
  hidePinMessageOption?: boolean;
  /** Hide the "Unpin message" option. */
  hideUnpinMessageOption?: boolean;
  /** Hide the "Save message" option. */
  hideSaveMessageOption?: boolean;
  /** Hide the "Unsave message" option. */
  hideUnsaveMessageOption?: boolean;

  // --- Date formatting (CalendarObject-shaped) ---
  /** Date format for in-list day separators ("Today", "Yesterday", etc.). */
  separatorDateTimeFormat?: CometChatDateFormatConfig;
  /** Date format for the sticky date header floating above messages. */
  stickyDateTimeFormat?: CometChatDateFormatConfig;
  /** Date format for the timestamp shown beside the message bubble. */
  messageSentAtDateTimeFormat?: CometChatDateFormatConfig;
  /** Date format for timestamps in the MessageInformation sheet. */
  messageInfoDateTimeFormat?: CometChatDateFormatConfig;

  // --- Reaction callbacks (declared; wired when reactions are integrated) ---
  /** Invoked when a reaction count pill is clicked on a message. */
  onReactionClick?: (reaction: CometChat.ReactionCount, message: CometChat.BaseMessage) => void;
  /** Invoked when an individual reactor in the reaction list is clicked. */
  onReactionListItemClick?: (reaction: CometChat.Reaction, message: CometChat.BaseMessage) => void;

  // ---------------------------------------------------------------------------
  // View-level visual / slot / callback props (flow through context so View
  // doesn't need them drilled). View still accepts them as local overrides.
  // ---------------------------------------------------------------------------

  /** Message list alignment. 0 = all left, 1 = standard. */
  messageAlignment?: CometChatMessageListAlignment;
  /** Show the native scrollbar. Default: false (scrollbar hidden).. */
  showScrollbar?: boolean;
  /** Hide date separators between calendar days. */
  hideDateSeparator?: boolean;
  /** Callback when the thread-reply indicator is clicked. */
  onThreadRepliesClick?: (message: CometChat.BaseMessage) => void;
  /** Callback when an incoming message avatar is clicked. */
  onAvatarClick?: (user: CometChat.User) => void;
  /** Callback when the "Edit" context menu option is clicked. Sets message in edit mode in composer. */
  onEditMessage?: (message: CometChat.BaseMessage) => void;
  /** Callback when the "Reply" context menu option is clicked. Sets message as reply-to in composer. */
  onReplyMessage?: (message: CometChat.BaseMessage) => void;
  /** Hide the remark textarea in the flag message dialog. */
  hideFlagRemarkField?: boolean;
  /** Disable text truncation (read more / show less) in text bubbles. */
  disableTruncation?: boolean;
  /** Hide the moderation footer beneath disapproved messages. */
  hideModerationView?: boolean;
  /**
   * Offline support only: hide the notices about unsent messages (removed,
   * not sent, lost in a cache reset). Default `false`.
   */
  hideOfflineNotices?: boolean;
  /** Whether this is an AI agent chat (suppresses moderation UI). */
  isAgentChat?: boolean;
  /** Custom display formatters merged into text/caption bubbles. */
  textFormatters?: CometChatTextFormatter[];
  /**
   * Replace the entire bubble rendering for each message.
   * When provided, the default BubbleRenderer is skipped entirely.
   */
  bubbleView?: (message: CometChat.BaseMessage, loggedInUser: CometChat.User) => ReactNode;

  // ---------------------------------------------------------------------------
  // AI Features (Smart Replies, Conversation Starters)
  // ---------------------------------------------------------------------------

  /**
   * Show AI-generated smart reply suggestions in the footer when the last
   * received message matches keyword criteria. Default: false.
   */
  showSmartReplies?: boolean;
  /**
   * Keywords that trigger smart replies when found in a received text message.
   * If empty array, smart replies show for every received text message.
   * Default: ['what', 'when', 'why', 'who', 'where', 'how', '?']
   */
  smartRepliesKeywords?: string[];
  /**
   * Delay in milliseconds before showing smart replies after a qualifying
   * message is received. Acts as a debounce — if another message arrives
   * within this window, the timer resets. Default: 10000 (10 seconds).
   */
  smartRepliesDelayDuration?: number;
  /**
   * Show AI-generated conversation starters in the footer when the message
   * list is empty (no messages in this conversation). Default: false.
   */
  showConversationStarters?: boolean;

  /**
   * When true, loads the last agent conversation on initial render.
   * Used for AI agent chat — shows a loading state while fetching the last
   * agent conversation. Default: false.
   */
  loadLastAgentConversation?: boolean;

  // ---------------------------------------------------------------------------
  // Cross-component notification callbacks
  // ---------------------------------------------------------------------------

  /** Invoked on first load with the active chat context. */
  onActiveChatChanged?: (data: {
    user?: CometChat.User;
    group?: CometChat.Group;
    message?: CometChat.BaseMessage;
    unreadMessageCount?: number;
  }) => void;
  /** Invoked when a message is marked as read. */
  onMessageRead?: (message: CometChat.BaseMessage) => void;
  /** Invoked when a message is deleted. */
  onMessageDeleted?: (message: CometChat.BaseMessage) => void;
  /** Invoked when the conversation is marked as read. */
  onConversationMarkedAsRead?: (conversation: CometChat.Conversation) => void;
  /** Invoked when mark-as-unread succeeds (conversation updated). */
  onConversationUpdated?: (conversation: CometChat.Conversation) => void;
}

/**
 * Aggregated visual / option / date-format knobs surfaced by the hook so the
 * View can read them from context instead of taking them as props.
 *
 * Separated from the hook return so it can be imported cleanly by View /
 * Bubble / DateSeparator / StickyDate without dragging in the full state and
 * action surface.
 */
export interface CometChatMessageListOptions {
  // --- Structural toggles ---
  hideStickyDate: boolean;
  hideAvatar: boolean;
  hideGroupActionMessages: boolean;
  hideReceipts: boolean;
  quickOptionsCount: number;

  // --- Message context-menu option toggles ---
  hideReplyOption: boolean;
  hideReplyInThreadOption: boolean;
  hideThreadSubscriptionOption: boolean;
  hideEditMessageOption: boolean;
  hideDeleteMessageOption: boolean;
  hideCopyMessageOption: boolean;
  hideReactionOption: boolean;
  hideMessageInfoOption: boolean;
  hideFlagMessageOption: boolean;
  hideMessagePrivatelyOption: boolean;
  hideTranslateMessageOption: boolean;
  showMarkAsUnreadOption: boolean;
  hidePinMessageOption: boolean;
  hideUnpinMessageOption: boolean;
  hideSaveMessageOption: boolean;
  hideUnsaveMessageOption: boolean;

  // --- Date formatting (optional — bubble / separator / sticky / info fall back to sensible defaults) ---
  separatorDateTimeFormat: CometChatDateFormatConfig | undefined;
  stickyDateTimeFormat: CometChatDateFormatConfig | undefined;
  messageSentAtDateTimeFormat: CometChatDateFormatConfig | undefined;
  messageInfoDateTimeFormat: CometChatDateFormatConfig | undefined;

  // --- Reactions (declared; wired when reactions are integrated) ---
  reactionsRequestBuilder: CometChat.ReactionsRequestBuilder | undefined;
  onReactionClick:
    | ((reaction: CometChat.ReactionCount, message: CometChat.BaseMessage) => void)
    | undefined;
  onReactionListItemClick:
    | ((reaction: CometChat.Reaction, message: CometChat.BaseMessage) => void)
    | undefined;

  // --- View-level visual / slot / callback props ---
  messageAlignment: CometChatMessageListAlignment;
  showScrollbar: boolean;
  hideDateSeparator: boolean;
  onThreadRepliesClick: ((message: CometChat.BaseMessage) => void) | undefined;
  onAvatarClick: ((user: CometChat.User) => void) | undefined;
  onEditMessage: ((message: CometChat.BaseMessage) => void) | undefined;
  onReplyMessage: ((message: CometChat.BaseMessage) => void) | undefined;
  hideFlagRemarkField: boolean;
  disableTruncation: boolean;
  hideModerationView: boolean;
  hideOfflineNotices?: boolean;
  isAgentChat: boolean;
  textFormatters?: CometChatTextFormatter[];

  // --- Bubble customization ---
  bubbleView:
    | ((message: CometChat.BaseMessage, loggedInUser: CometChat.User) => ReactNode)
    | undefined;

  // --- AI Features ---
  showSmartReplies: boolean;
  smartRepliesKeywords: string[];
  smartRepliesDelayDuration: number;
  showConversationStarters: boolean;
  loadLastAgentConversation: boolean;
}

// ---------------------------------------------------------------------------
// Hook Return
// ---------------------------------------------------------------------------

export interface CometChatUseMessageListReturn {
  state: CometChatMessageListState;
  /**
   * All messages in display order. Currently an alias for `state.messages` —
   * kept for API continuity and to express the "what you render" intent.
   */
  allMessages: CometChat.BaseMessage[];
  loggedInUser: CometChat.User;
  user: CometChat.User | undefined;
  group: CometChat.Group | undefined;
  /** The thread's parent message id in thread mode, else undefined. */
  parentMessageId?: number | undefined;
  isLoading: boolean;
  isEmpty: boolean;
  isError: boolean;
  fetchPrevious: () => Promise<void>;
  fetchNext: () => Promise<void>;
  /**
   * Deletes a message. Resolves `false` when the delete did not happen - offline, or with no
   * permission - so a caller does not report a delete that was refused. No SDK queues a delete
   * of an already-sent message. An implementation that resolves nothing is read as done.
   */
  deleteMessage: (messageId: number) => Promise<unknown>;
  scrollToMessage: (messageId: number) => void;
  /**
   * Jump to a specific message — re-fetches around it if not loaded.
   * Used for reply-preview clicks and deep links.
   */
  goToMessage: (messageId: number) => Promise<void>;
  setAtBottom: (isAtBottom: boolean) => void;
  clearNewMessageCount: () => void;
  /**
   * Mark the conversation as read if the last message is unread.
   * Called when reaching the bottom via any method (scroll, button, auto-scroll).
   */
  markConversationAsReadIfUnread: () => void;
  markMessageAsUnread: (message: CometChat.BaseMessage) => Promise<void>;
  reactToMessage: (messageId: number, emoji: string) => Promise<void>;
  /**
   * Scroll to the bottom of the conversation.
   * If hasReachedLatest is true, returns 'scroll-dom' — caller should scroll the container.
   * If hasReachedLatest is false, returns 'refetching' — data will re-fetch, View handles scroll.
   * If unread messages exist, first click goes to last-read message, second click goes to actual bottom.
   */
  scrollToBottom: () => 'scroll-dom' | 'refetching';
  /**
   * Offline support only: show the newest messages a catch-up sweep found
   * while the user was reading older ones (`state.offlineJumpToLatest`).
   */
  offlineJumpToLatest?: () => void;
  /**
   * @internal The view's prepend bookkeeping, held here so the data hook can run it
   * before an older page it reads itself lands (the reconnect edge load). The view's
   * scroll hook fills it in; nothing outside the kit should call or set it.
   */
  markOlderPrependRef?: RefObject<(() => void) | null>;
  hasMore: boolean;
  hasMoreNewer: boolean;
  /**
   * Whether the list has fetched to the latest message.
   * When false, real-time messages are not appended (only counted).
   */
  hasReachedLatest: boolean;
  isFetchingMore: boolean;
  newMessageCount: number;
  unreadCount: number;
  isConversationRead: boolean;
  lastReadMessageId: number | null;
  error: string | null;
  isAtBottom: boolean;
  /**
   * Aggregated visual / option / date-format knobs.
   * Consumed by the View, DateSeparator, StickyDate, and BubbleRenderer.
   */
  options: CometChatMessageListOptions;
}

// ---------------------------------------------------------------------------
// Root Props
// ---------------------------------------------------------------------------

/**
 * Props for CometChatMessageList.Root.
 *
 * Accepts all hook options (data, behavior, visibility, option toggles,
 * date formats, view slots, callbacks) plus optional children for compound
 * composition. When children are omitted, Root renders the default layout.
 */
export interface CometChatMessageListRootProps extends CometChatUseMessageListOptions {
  /** Children for compound composition. When omitted, renders default layout. */
  children?: ReactNode;
  /** Optional custom className appended to the root container. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Convenience Props (flat API additions beyond Root)
// ---------------------------------------------------------------------------

/**
 * Convenience view props for the flat `<CometChatMessageList />` API.
 * These allow customizing the loading, empty, error, header, and footer views
 * without needing compound composition.
 */
export interface CometChatMessageListConvenienceProps {
  /** Custom loading view (replaces default shimmer). */
  loadingView?: ReactNode;
  /** Custom empty view (replaces default empty state). */
  emptyView?: ReactNode;
  /** Custom error view (replaces default error state). */
  errorView?: ReactNode;
  /** Custom header view (above the scroll container). */
  headerView?: ReactNode;
  /** Custom footer view (below the scroll container). */
  footerView?: ReactNode;
}

/**
 * Props for the flat `<CometChatMessageList />` component.
 * Combines Root props + convenience props.
 */
export type CometChatMessageListProps = CometChatMessageListRootProps &
  CometChatMessageListConvenienceProps;
