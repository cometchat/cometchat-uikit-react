import type { ReactNode } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatFetchState } from '../../types';
import type { CometChatTextFormatter } from '../../formatters/CometChatTextFormatter';

/** Props for CometChatSavedMessages. */
export interface CometChatSavedMessagesProps {
  /**
   * Custom display formatters applied to each row's message preview. Saved
   * messages span many conversations, so this single set applies to every row
   * (like Search), not per-conversation.
   */
  textFormatters?: CometChatTextFormatter[];
  /**
   * Called when a row (saved message) is clicked. The app navigates to that
   * message in its own conversation — the kit owns the list, the app owns
   * placement and routing.
   */
  onItemClick?: (message: CometChat.BaseMessage) => void;
  /** Called when the close button is pressed. */
  onClose?: () => void;
  /** Hide the close button (e.g. when the host provides its own chrome). @default false */
  hideCloseButton?: boolean;
  /**
   * Custom per-row renderer, replacing the default saved-message row. When
   * provided, the consumer owns the row's content and interaction (matching the
   * `itemView` convention on the other list components).
   */
  itemView?: (message: CometChat.BaseMessage) => ReactNode;
  /** Custom header, replacing the default "Saved Messages" row. */
  headerView?: ReactNode;
  /** Custom empty state. */
  emptyView?: ReactNode;
  /** Custom error state. */
  errorView?: ReactNode;
  /** Custom loading state. */
  loadingView?: ReactNode;
  /**
   * Custom request builder, for page size and any other supported filter.
   *
   * Used as supplied apart from `setSaved`, which is re-asserted — without it the
   * read is ordinary history. Do not scope it to a uid/guid: saves span
   * conversations.
   */
  messagesRequestBuilder?: CometChat.MessagesRequestBuilder;
  /** Optional custom className for the root. */
  className?: string;
  /**
   * Hide the Unsave action on each row.
   *
   * The only option this surface offers — rows are conversation-style list items,
   * not bubbles, so there is no message menu to configure. With this set the list
   * becomes read-only.
   *
   * @default false
   */
  hideUnsaveMessageOption?: boolean;
}

/** Props for CometChatSavedMessages.Root (Provider + default layout). Same shape as the flat API. */
export type CometChatSavedMessagesRootProps = CometChatSavedMessagesProps & {
  /** Compound children. When provided, the default layout is not rendered. */
  children?: ReactNode;
};

/** Props for CometChatSavedMessages.List. */
export interface CometChatSavedMessagesListProps {
  /** Per-row override; when provided the consumer owns the row. Falls back to the context value. */
  itemView?: (message: CometChat.BaseMessage) => ReactNode;
}

/** Props for the state/header subcomponents — optional children replace the default content. */
export interface CometChatSavedMessagesSlotProps {
  children?: ReactNode;
}

/** Context value provided by CometChatSavedMessages.Root and consumed by its subcomponents. */
export interface CometChatSavedMessagesContextValue {
  /** Fetched saved messages. */
  messages: CometChat.BaseMessage[];
  /** Current fetch lifecycle state. */
  fetchState: CometChatFetchState;
  /** Whether more pages are available. */
  hasMore: boolean;
  /** Load the next page. */
  loadMore: () => void;
  /** Row click handler (from the `onItemClick` prop). */
  onItemClick?: (message: CometChat.BaseMessage) => void;
  /** Remove a saved message. */
  onUnsave: (message: CometChat.BaseMessage) => void;
  /** Per-row override renderer. */
  itemView?: (message: CometChat.BaseMessage) => ReactNode;
  /** Custom display formatters for each row's preview. */
  textFormatters?: CometChatTextFormatter[];
  /** Whether the per-row Unsave action is hidden. */
  hideUnsaveMessageOption: boolean;
  /** Whether the header close button is hidden. */
  hideCloseButton: boolean;
  /** Close-button handler. */
  onClose?: () => void;
}

/** Reducer state for the saved messages list. */
export interface CometChatSavedMessagesState {
  messages: CometChat.BaseMessage[];
  fetchState: CometChatFetchState;
  hasMore: boolean;
  error: string | null;
}

export type CometChatSavedMessagesAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; messages: CometChat.BaseMessage[]; hasMore: boolean }
  | { type: 'FETCH_ERROR'; error: string }
  /** A save made elsewhere (or on another device) — insert at the top. */
  | { type: 'MESSAGE_SAVED'; message: CometChat.BaseMessage }
  /**
   * Remove a row. Covers unsave, the message being deleted, and the message's
   * thread parent being deleted — an orphaned reply is dropped from the list.
   */
  | { type: 'REMOVE_MESSAGE'; messageId: string }
  /**
   * Replace a row in place, keeping position.
   *
   * `pinSaveAuthoritative` says whether the payload is the truth about pin/save.
   * A content update (edit, moderation) is NOT — it carries no promise of
   * including those attributes, so the current values are kept.
   */
  | {
      type: 'MESSAGE_UPDATED';
      message: CometChat.BaseMessage;
      pinSaveAuthoritative?: boolean;
    }
  | { type: 'RESET' };
