import type { ReactNode, Ref } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatMessageBubbleAlignment,
  CometChatMessageOption,
} from '../../plugins/plugin.types';
import type { CometChatTextFormatter } from '../../formatters/CometChatTextFormatter';
import { CometChatDateFormatConfig } from '../base/CometChatDate';

/** Props for CometChatMessageBubble. */
export interface CometChatMessageBubbleProps {
  // --- Primary inputs ---
  /** The SDK message object. Required. */
  message: CometChat.BaseMessage;
  /** Bubble alignment: 'left' (incoming), 'right' (outgoing), 'center' (action). */
  alignment: CometChatMessageBubbleAlignment;
  /**
   * Force the bubble's colour scheme independently of `alignment`.
   */
  bubbleVariant?: 'incoming' | 'outgoing';
  /** The inner content rendered by the plugin's renderBubble(). Required. */
  contentView: ReactNode;
  /** Group context — enables avatar and sender name for group conversations. */
  group?: CometChat.Group;
  /** Context menu options for this message. */
  options?: CometChatMessageOption[];
  /** Number of quick options shown directly (rest go to overflow). Default: 2. */
  quickOptionsCount?: number;

  // --- Display controls (bubble-only) ---
  /** Hide the avatar. Default: false. */
  hideAvatar?: boolean;
  /** Force show avatar for incoming messages even in 1:1 chats (used in agent chat). Default: false. */
  forceShowAvatar?: boolean;
  /** Hide the sender name. Default: false. */
  hideSenderName?: boolean;
  /** Hide the timestamp. Default: false. */
  hideTimestamp?: boolean;
  /** Hide thread reply indicator. Default: false. */
  hideThreadView?: boolean;
  /** Show error state instead of normal receipts. Default: false. */
  showError?: boolean;
  /** Disable all interactive elements. Default: false. */
  disableInteraction?: boolean;

  // --- Display controls (reads from GlobalConfig, prop overrides) ---
  /** Hide read receipt indicators. Reads from GlobalConfig if not set. */
  hideReceipts?: boolean;

  /** Override the date format for the sent-at timestamp shown beside the bubble. */
  messageSentAtDateTimeFormat?: CometChatDateFormatConfig;

  // --- View overrides (render props) ---
  // Semantics for all view props:
  //   undefined (not passed) → use built-in default
  //   null → render nothing (suppress)
  //   ReactNode / function → render it (override)

  /** Override the leading view (avatar area). Pass null to suppress. */
  leadingView?: ((message: CometChat.BaseMessage) => ReactNode) | null;
  /** Override the header view (sender name area). Pass null to suppress. */
  headerView?: ((message: CometChat.BaseMessage) => ReactNode) | null;
  /** Override the status info (timestamp + receipts). Pass null to suppress. */
  statusInfoView?: ((message: CometChat.BaseMessage) => ReactNode) | null;
  /** Override the footer (reactions area). Pass null to suppress. */
  footerView?: ((message: CometChat.BaseMessage) => ReactNode) | null;
  /** Override the thread view. Pass null to suppress. */
  threadView?: ((message: CometChat.BaseMessage) => ReactNode) | null;
  /** Reply preview (quoted message) rendered above content. Pass null to suppress. */
  replyView?: ReactNode | null;
  /**
   * Render a view below the bubble (e.g., the moderation "blocked" footer).
   * Shown after the body and before reactions/thread view. Pass null to suppress.
   */
  bottomView?: ((message: CometChat.BaseMessage) => ReactNode) | null;

  // --- Callbacks ---
  /** Called when the avatar is clicked. */
  onAvatarClick?: (user: CometChat.User) => void;
  /** Called when the thread view is clicked. */
  onThreadRepliesClick?: (message: CometChat.BaseMessage) => void;
  /** Called when a context menu option is clicked. */
  onOptionClick?: (option: CometChatMessageOption, message: CometChat.BaseMessage) => void;
  /** Called when a reaction chip is clicked (toggle add/remove). Used by the default footer reactions. */
  onReactionChipClick?: (messageId: number, emoji: string) => void;
  /** Called when a reactor in the reaction list is clicked. */
  onReactorClick?: (reaction: CometChat.Reaction, message: CometChat.BaseMessage) => void;

  // --- Accessibility ---
  /** Whether this message is selected. */
  isSelected?: boolean;
  /** Position in the message list (1-indexed). */
  ariaPosinset?: number;
  /** Total messages in the list. */
  ariaSetsize?: number;

  /** Optional custom className. */
  className?: string;

  /** Ref to the outermost wrapper div (role="article"). */
  setRef?: Ref<HTMLDivElement>;
  /**
   * When true, the options toolbar uses `fit-content` height instead of the
   * fixed body height. Useful when a bottomView is present.
   * Default: false.
   */
  includeBottomViewHeight?: boolean;
  /**
   * Explicitly control options toolbar visibility.
   * - `true` → always visible
   * - `false` → always hidden
   * - `undefined` → default hover-based behavior
   */
  toggleOptionsVisibility?: boolean;
}

// --- Renderer Props ---

/** Props for CometChatMessageBubbleRenderer — the bridge between MessageList and MessageBubble. */
export interface CometChatMessageBubbleRendererProps {
  /** The message to render. */
  message: CometChat.BaseMessage;
  /** The group (if group conversation). */
  group?: CometChat.Group;
  /** List alignment mode. 0 = all left, 1 = standard (incoming left, outgoing right). */
  messageAlignment?: number;
  /** Position in the list (for aria-posinset). */
  index: number;
  /** Total messages (for aria-setsize). */
  total: number;
  /** Batch position within a multi-attachment batch group. */
  batchPosition?: 'first' | 'middle' | 'last' | 'single';

  // --- Display controls (passed through to CometChatMessageBubble) ---
  hideAvatar?: boolean;
  hideTimestamp?: boolean;
  hideThreadView?: boolean;
  hideReceipts?: boolean;
  disableInteraction?: boolean;
  quickOptionsCount?: number;

  /** Hide the "Reply" option in the message context menu. */
  hideReplyOption?: boolean;
  /** Hide the "Reply in Thread" option in the message context menu. */
  hideReplyInThreadOption?: boolean;
  /**
   * Hide the thread-subscription option ("Notify me about replies" /
   * "Stop reply notifications") in the message context menu.
   * The option is group-chat only regardless of this flag.
   */
  hideThreadSubscriptionOption?: boolean;
  /** Hide the "Edit" option in the message context menu. */
  hideEditMessageOption?: boolean;
  /** Hide the "Delete" option in the message context menu. */
  hideDeleteMessageOption?: boolean;
  /** Hide the "Copy" option in the message context menu. */
  hideCopyMessageOption?: boolean;
  /** Hide the "React" option in the message context menu. */
  hideReactionOption?: boolean;
  /** Hide the "Message Info" option in the message context menu. */
  hideMessageInfoOption?: boolean;
  /** Hide the "Report / Flag" option in the message context menu. */
  hideFlagMessageOption?: boolean;
  /** Hide the "Message Privately" option in the message context menu. */
  hideMessagePrivatelyOption?: boolean;
  /** Hide the "Translate" option in the message context menu. */
  hideTranslateMessageOption?: boolean;
  /**
   * Show the "Mark as Unread" option. Defaults to false (opt-in).
   * Mirrors prop.
   */
  showMarkAsUnreadOption?: boolean;
  /** Hide the "Pin message" option. */
  hidePinMessageOption?: boolean;
  /** Hide the "Unpin message" option. */
  hideUnpinMessageOption?: boolean;
  /** Hide the "Save message" option. */
  hideSaveMessageOption?: boolean;
  /** Hide the "Unsave message" option. */
  hideUnsaveMessageOption?: boolean;
  /**
   * How pin/save options are presented. `'nested'` groups them under an
   * "Organize ▸" fly-out (main message list); `'flat'` surfaces them top-level
   * (thread column and the Pinned/Saved panels, which are too narrow to fly out).
   * Defaults to `'nested'`.
   */
  optionsLayout?: 'nested' | 'flat';
  /** Force show the avatar even for outgoing / 1-1 messages. */
  forceShowAvatar?: boolean;
  /** Override the header (sender name) slot. Pass null to suppress. */
  headerView?: ((message: CometChat.BaseMessage) => ReactNode) | null;

  /**
   * Force the bubble's colour scheme independently of `alignment`.
   *
   * Normally the two move together — right-aligned means outgoing means brand
   * colour. Surfaces that align every row the same way (the Pinned panel) still
   * need a sender-derived colour, so this splits layout from palette. Omit to
   * derive from alignment, which is the behaviour everywhere else.
   */
  bubbleVariant?: 'incoming' | 'outgoing';

  /** Override the date format for the timestamp shown beside the bubble. */
  messageSentAtDateTimeFormat?: import('../base/CometChatDate/CometChatDate.types').CometChatDateFormatConfig;
  /**
   * Hide the moderation footer under disapproved messages.
   * When true, a disapproved message still gets the red outline and reduced
   * option set, but no "blocked" footer is shown.
   * Mirrors prop. Default: false.
   */
  hideModerationView?: boolean;
  /**
   * Whether this conversation is an AI agent chat.
   */
  isAgentChat?: boolean;
  /** Custom display formatters merged into text/caption bubbles. */
  textFormatters?: CometChatTextFormatter[];

  // --- Callbacks ---
  onAvatarClick?: (user: CometChat.User) => void;
  onThreadRepliesClick?: (message: CometChat.BaseMessage) => void;
  /** Called when the delete option is selected. Shows confirm dialog, then deletes. */
  onDeleteMessage?: (message: CometChat.BaseMessage) => void;
  /** Called when the flag option is selected. Opens the flag dialog. */
  onFlagMessage?: (message: CometChat.BaseMessage) => void;
  /** Called when the mark-as-unread option is selected. */
  onMarkAsUnread?: (message: CometChat.BaseMessage) => void;
  /** Called when the pin option is selected. Confirms, then pins conversation-wide. */
  onPinMessage?: (message: CometChat.BaseMessage) => void;
  /** Called when the unpin option is selected. */
  onUnpinMessage?: (message: CometChat.BaseMessage) => void;
  /** Called when the save option is selected. Private to the logged-in user. */
  onSaveMessage?: (message: CometChat.BaseMessage) => void;
  /** Called when the unsave option is selected. */
  onUnsaveMessage?: (message: CometChat.BaseMessage) => void;
  /** Called when the edit option is selected. Sets message in edit mode in composer. */
  onEditMessage?: (message: CometChat.BaseMessage) => void;
  /** Called when the reply option is selected. Sets message as reply-to in composer. */
  onReplyMessage?: (message: CometChat.BaseMessage) => void;
  /** Called when the "React" option is selected. Opens the emoji picker. */
  onReactToMessage?: (message: CometChat.BaseMessage) => void;
  /** Called when a reaction chip is clicked (toggle add/remove). */
  onReactionChipClick?: (messageId: number, emoji: string) => void;
  /** Called when a reactor in the reaction list is clicked. */
  onReactorClick?: (reaction: CometChat.Reaction, message: CometChat.BaseMessage) => void;
  /** Called when the "Info" option is selected. Opens the message info panel. */
  onMessageInfo?: (message: CometChat.BaseMessage) => void;
  /** Called when the reply preview is clicked. Scrolls to the quoted message. */
  onReplyPreviewClick?: (message: CometChat.BaseMessage) => void;
  /** Show a toast notification. */
  showToast?: (text: string) => void;
  /** Disable text truncation in text bubbles. */
  disableTruncation?: boolean;
}

// --- Wrapper Props ---

/** Props for CometChatMessageBubbleWrapper — alignment and spacing. */
export interface CometChatMessageBubbleWrapperProps {
  /** Bubble alignment: 'left', 'right', or 'center'. */
  alignment: CometChatMessageBubbleAlignment;
  /** Children (the rendered bubble). */
  children: ReactNode;
  /** Optional className. */
  className?: string;
}
