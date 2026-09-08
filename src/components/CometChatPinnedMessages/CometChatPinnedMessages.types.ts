import type { ReactNode } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatFetchState } from '../../types';
import type { CometChatTextFormatter } from '../../formatters/CometChatTextFormatter';

/** Props for CometChatPinnedMessages. */
export interface CometChatPinnedMessagesProps {
  /** The 1-1 conversation to list pins for. Mutually exclusive with `group`. */
  user?: CometChat.User;
  /** Custom display formatters merged into the pinned message bubbles. */
  textFormatters?: CometChatTextFormatter[];
  /** The group conversation to list pins for. Mutually exclusive with `user`. */
  group?: CometChat.Group;
  /** Called when a row (pinned message) is clicked — the app jumps the main list to that message. */
  onItemClick?: (message: CometChat.BaseMessage) => void;
  /** Called when the close button is pressed. */
  onClose?: () => void;
  /** Hide the close button. @default false */
  hideCloseButton?: boolean;
  /**
   * Custom per-row renderer, replacing the default message bubble for each pinned
   * message. When provided, the consumer owns the row's content and interaction
   * (matching the `itemView` convention on the other list components).
   */
  itemView?: (message: CometChat.BaseMessage) => ReactNode;
  /** Custom header, replacing the default "Pinned Messages" row. */
  headerView?: ReactNode;
  /** Custom empty state. */
  emptyView?: ReactNode;
  /** Custom error state. */
  errorView?: ReactNode;
  /** Custom loading state. */
  loadingView?: ReactNode;
  /**
   * Custom request builder, for page size and any other supported filter.
   */
  messagesRequestBuilder?: CometChat.MessagesRequestBuilder;
  /**
   * How many options sit outside the overflow menu as standalone icons.
   *
   * @default PINNED_DEFAULT_QUICK_OPTIONS_COUNT
   */
  quickOptionsCount?: number;
  /** Optional custom className for the root. */
  className?: string;

  // --- Message option toggles ---

  /** Hide Copy. @default false */
  hideCopyMessageOption?: boolean;
  /** Hide Message Information. @default false */
  hideMessageInfoOption?: boolean;
  /** Hide Unpin. @default false */
  hideUnpinMessageOption?: boolean;
  /** Hide Save. @default false */
  hideSaveMessageOption?: boolean;
  /** Hide Unsave. @default false */
  hideUnsaveMessageOption?: boolean;
  /** Hide Report/Flag. @default false */
  hideFlagMessageOption?: boolean;
  /** Hide Message Privately. @default false */
  hideMessagePrivatelyOption?: boolean;
  /** Hide Translate. @default false */
  hideTranslateMessageOption?: boolean;
}

/** Props for CometChatPinnedMessages.Root (Provider + default layout). Same shape as the flat API. */
export type CometChatPinnedMessagesRootProps = CometChatPinnedMessagesProps & {
  /** Compound children. When provided, the default layout is not rendered. */
  children?: ReactNode;
};

/** Props for CometChatPinnedMessages.List. */
export interface CometChatPinnedMessagesListProps {
  /** Per-row override; when provided the consumer owns the row. Falls back to the context value. */
  itemView?: (message: CometChat.BaseMessage) => ReactNode;
}

/** Props for CometChatPinnedMessages.Item (the default row). */
export interface CometChatPinnedMessagesItemProps {
  /** The pinned message to render. */
  message: CometChat.BaseMessage;
  /** Position in the list (for the bubble's aria-posinset). */
  index?: number;
}

/** Props for the state/header subcomponents — optional children replace the default content. */
export interface CometChatPinnedMessagesSlotProps {
  children?: ReactNode;
}

/** Context value provided by CometChatPinnedMessages.Root and consumed by its subcomponents. */
export interface CometChatPinnedMessagesContextValue {
  /** Fetched pinned messages. */
  messages: CometChat.BaseMessage[];
  /** Current fetch lifecycle state. */
  fetchState: CometChatFetchState;
  /** Whether more pages are available. */
  hasMore: boolean;
  /** Load the next page. */
  loadMore: () => void;
  /** Row click handler (from the `onItemClick` prop). */
  onItemClick?: (message: CometChat.BaseMessage) => void;
  /** Group context (enables mentions/avatars in the bubble). */
  group?: CometChat.Group;
  /** Per-row override renderer. */
  itemView?: (message: CometChat.BaseMessage) => ReactNode;
  /** Custom display formatters merged into each bubble. */
  textFormatters?: CometChatTextFormatter[];
  /** Whether the header close button is hidden. */
  hideCloseButton: boolean;
  /** Close-button handler. */
  onClose?: () => void;
  /** How many quick options sit outside the overflow menu. */
  quickOptionsCount: number;
  // Message option toggles (undefined = default/false).
  hideCopyMessageOption: boolean | undefined;
  hideMessageInfoOption: boolean | undefined;
  hideUnpinMessageOption: boolean | undefined;
  hideSaveMessageOption: boolean | undefined;
  hideUnsaveMessageOption: boolean | undefined;
  hideFlagMessageOption: boolean | undefined;
  hideMessagePrivatelyOption: boolean | undefined;
  hideTranslateMessageOption: boolean | undefined;
  // Row actions.
  onPinMessage: (message: CometChat.BaseMessage) => void;
  onUnpinMessage: (message: CometChat.BaseMessage) => void;
  onSaveMessage: (message: CometChat.BaseMessage) => void;
  onUnsaveMessage: (message: CometChat.BaseMessage) => void;
  onMessageInfo: (message: CometChat.BaseMessage) => void;
  showToast: (text: string, variant?: 'default' | 'error') => void;
}

/** Reducer state for the pinned messages list. */
export interface CometChatPinnedMessagesState {
  messages: CometChat.BaseMessage[];
  fetchState: CometChatFetchState;
  hasMore: boolean;
  error: string | null;
}

export type CometChatPinnedMessagesAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; messages: CometChat.BaseMessage[]; hasMore: boolean }
  | { type: 'FETCH_ERROR'; error: string }
  /** A pin placed by anyone in this conversation — insert at the top. */
  | { type: 'MESSAGE_PINNED'; message: CometChat.BaseMessage }
  /** Unpinned, deleted, or orphaned by its thread parent being deleted. */
  | { type: 'REMOVE_MESSAGE'; messageId: string }
  /**
   * Replace a row in place, keeping position.
   *
   * `pinSaveAuthoritative` says whether the payload is the truth about pin/save.
   * A content update (edit, moderation, reaction) is NOT — it carries no promise
   * of including those attributes, so the current values are kept. A pin/save
   * event IS, and must be allowed to clear them.
   */
  | {
      type: 'MESSAGE_UPDATED';
      message: CometChat.BaseMessage;
      pinSaveAuthoritative?: boolean;
    }
  | { type: 'RESET' };
