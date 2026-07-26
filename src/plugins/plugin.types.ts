import type { ReactNode } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatTextFormatter } from '../formatters/CometChatTextFormatter';
import type { CometChatUIEvent } from '../context/CometChatEvents.types';

// --- Alignment ---

/** Alignment of a message bubble in the message list. */
export type CometChatMessageBubbleAlignment = 'left' | 'right' | 'center';

// --- Message Options (context menu) ---

/** A single option in the message context menu (long-press / hover menu). */
export interface CometChatMessageOption {
  /** Unique identifier (e.g., 'react', 'reply', 'copy', 'edit', 'delete'). */
  id: string;
  /** Display title (localized). */
  title: string;
  /** Icon URL or inline SVG string. */
  iconURL?: string;
  /** Callback when the option is selected. */
  onClick: (message: CometChat.BaseMessage) => void;
  /** Show only for messages sent by the logged-in user. */
  senderOnly?: boolean;
  /** Show only for messages NOT sent by the logged-in user. */
  receiverOnly?: boolean;
  /** Show only in group conversations. */
  groupOnly?: boolean;
}

// --- Plugin Context ---

/** Context passed to every plugin method. Contains the current user, conversation, and UI state. */
export interface CometChatMessagePluginContext {
  /** The currently logged-in user. */
  loggedInUser: CometChat.User;
  /** The group (if the conversation is a group chat). Undefined for 1:1 chats. */
  group?: CometChat.Group;
  /** Bubble alignment for the current message. */
  alignment: CometChatMessageBubbleAlignment;
  /** Batch position within a multi-attachment batch group ('first'|'middle'|'last'|'single'). */
  batchPosition?: 'first' | 'middle' | 'last' | 'single';
  /** Current theme. */
  theme: 'light' | 'dark';
  /** Localization function. Returns the translated string for a given key. */
  getLocalizedString?: (key: string) => string;

  // --- Action callbacks (optional, provided by the message list) ---
  /** Delete a message. Shows confirm dialog, then calls SDK. */
  onDeleteMessage?: (message: CometChat.BaseMessage) => void;
  /** Open the flag/report dialog for a message. */
  onFlagMessage?: (message: CometChat.BaseMessage) => void;
  /** Open thread view for a message. */
  onThreadClick?: (message: CometChat.BaseMessage) => void;
  /** Mark a message as unread. Updates conversation unread count and last read ID. */
  onMarkAsUnread?: (message: CometChat.BaseMessage) => void;
  /** Show a toast notification with the given text. */
  showToast?: (text: string) => void;
  /** Disable text truncation (read more / show less) in text bubbles. */
  disableTruncation?: boolean;
  /** Disable interaction (click handlers, options) on the bubble. Used in thread header parent bubble. */
  disableInteraction?: boolean;
  /** Set a message into edit mode in the composer. */
  onEditMessage?: (message: CometChat.BaseMessage) => void;
  /** Set a message as the reply-to target in the composer. */
  onReplyMessage?: (message: CometChat.BaseMessage) => void;
  // Future: onSendPrivately, onReactToMessage, onMessageInfo
  /** Open the emoji picker to react to a message. */
  onReactToMessage?: (message: CometChat.BaseMessage) => void;
  /** Open the message information panel for a message. */
  onMessageInfo?: (message: CometChat.BaseMessage) => void;
  /** Publish a UI event for cross-component communication. */
  publish?: (event: CometChatUIEvent) => void;
  /** Get text formatters from the plugin registry (for caption rendering in media bubbles). */
  getTextFormatters?: () => CometChatTextFormatter[];

  // --- Option visibility toggles (from MessageList props) ---
  hideReplyOption?: boolean;
  hideReplyInThreadOption?: boolean;
  hideEditMessageOption?: boolean;
  hideDeleteMessageOption?: boolean;
  hideCopyMessageOption?: boolean;
  hideReactionOption?: boolean;
  hideMessageInfoOption?: boolean;
  hideFlagMessageOption?: boolean;
  hideMessagePrivatelyOption?: boolean;
  hideTranslateMessageOption?: boolean;
  showMarkAsUnreadOption?: boolean;
}

// --- Core Plugin Interface ---

/**
 * The core plugin interface. Every message type plugin implements this.
 *
 * A plugin owns one or more message types within one or more categories.
 * It provides bubble rendering, context menu options, conversation list preview,
 * text formatters, and composer attachment options.
 */
export interface CometChatMessagePlugin {
  /** Unique plugin identifier (e.g., 'text', 'image', 'polls'). */
  id: string;

  /** SDK message types this plugin handles (e.g., ['text'], ['image'], ['groupMember']). */
  messageTypes: string[];

  /** SDK message categories this plugin handles (e.g., ['message'], ['action']). */
  messageCategories: string[];

  /**
   * Render the bubble content for a message.
   * Returns only the inner content — the outer bubble wrapper is handled by CometChatMessageBubble.
   */
  renderBubble(message: CometChat.BaseMessage, context: CometChatMessagePluginContext): ReactNode;

  /**
   * Return context menu options for a message.
   * Return an empty array for messages that have no options (e.g., group actions, deleted).
   */
  getOptions?(
    message: CometChat.BaseMessage,
    context: CometChatMessagePluginContext
  ): CometChatMessageOption[];

  /**
   * Return a plain-text preview for the conversation list subtitle.
   * Must return plain text — no HTML, no markdown. Truncate to ~100 chars.
   * @param t - Optional localization function. Use it to translate preview strings.
   */
  getLastMessagePreview?(
    message: CometChat.BaseMessage,
    loggedInUser: CometChat.User,
    t?: (key: string) => string
  ): string;

  /**
   * Return text formatters this plugin provides.
   * Only relevant for the text plugin. Other plugins return undefined or [].
   */
  getTextFormatters?(): CometChatTextFormatter[];

  // --- View Slot Methods (optional) ---
  // These allow plugins to provide custom rendering for bubble regions beyond content.
  // Return ReactNode to render custom view, null to suppress the slot, or undefined to use built-in default.

  /**
   * Render the leading view (avatar area) for a message bubble.
   * Default: avatar for incoming messages in group chats.
   */
  renderLeadingView?(
    message: CometChat.BaseMessage,
    context: CometChatMessagePluginContext
  ): ReactNode;

  /**
   * Render the header view (sender name area) for a message bubble.
   * Default: sender name for incoming messages in group chats.
   */
  renderHeaderView?(
    message: CometChat.BaseMessage,
    context: CometChatMessagePluginContext
  ): ReactNode;

  /**
   * Render the footer view (below content, e.g., reactions) for a message bubble.
   * Default: CometChatReactions when the message has reactions.
   */
  renderFooterView?(
    message: CometChat.BaseMessage,
    context: CometChatMessagePluginContext
  ): ReactNode;

  /**
   * Render the bottom view (moderation/error footer) for a message bubble.
   * Default: CometChatModerationView for disapproved or permission-denied messages.
   */
  renderBottomView?(
    message: CometChat.BaseMessage,
    context: CometChatMessagePluginContext
  ): ReactNode;

  /**
   * Render the status info view (timestamp, receipts, "edited") for a message bubble.
   * Default: timestamp + delivery/read receipts + "edited" indicator.
   */
  renderStatusInfoView?(
    message: CometChat.BaseMessage,
    context: CometChatMessagePluginContext
  ): ReactNode;

  /**
   * Render the reply view (quoted message preview) for a message bubble.
   * Default: CometChatMessageReplyPreview when the message has a quoted message.
   */
  renderReplyView?(
    message: CometChat.BaseMessage,
    context: CometChatMessagePluginContext
  ): ReactNode;

  /**
   * Render the thread view (reply count indicator) for a message bubble.
   * Default: CometChatThreadView with reply count.
   */
  renderThreadView?(
    message: CometChat.BaseMessage,
    context: CometChatMessagePluginContext
  ): ReactNode;
}
