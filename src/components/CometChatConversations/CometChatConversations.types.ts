import type { ReactNode } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatFetchState } from '../../types';
import type { CometChatDateFormatConfig } from '../base/CometChatDate/CometChatDate.types';

// ==================== Selection Mode ====================

/** Selection mode for the conversation list. */
export type CometChatConversationsSelectionMode = 'none' | 'single' | 'multiple';

// Re-export for convenience
export type { CometChatFetchState } from '../../types';

// ==================== Conversation Option ====================

/** A single option in the conversation context menu (hover/swipe menu). */
export interface CometChatConversationOption {
  /** Unique identifier. */
  id: string;
  /** Display title (localized). */
  title: string;
  /** Icon URL or inline SVG string. */
  iconURL?: string;
  /** Callback when the option is selected. */
  onClick: (conversation: CometChat.Conversation) => void;
}

// ==================== Root Props ====================

/** Props for CometChatConversations.Root (Provider + default layout). */
export interface CometChatConversationsRootProps {
  /** Custom request builder for fetching conversations. Defaults to limit 30. */
  conversationsRequestBuilder?: CometChat.ConversationsRequestBuilder;
  /** Custom request builder specifically for search queries. */
  searchRequestBuilder?: CometChat.ConversationsRequestBuilder;
  /** Initial search keyword to filter conversations. */
  searchKeyword?: string;
  /** Whether to hide user online/offline status indicator on conversation items. */
  hideUserStatus?: boolean;
  /** Whether to hide the unread count badge. */
  hideUnreadCount?: boolean;
  /** Whether to hide message receipts (sent/delivered/read). */
  hideReceipts?: boolean;
  /** Whether to hide the group type indicator. */
  hideGroupType?: boolean;
  /** Custom date/time format configuration for the last message timestamp. */
  lastMessageDateTimeFormat?: CometChatDateFormatConfig;
  /** Whether to disable sound notifications for incoming messages. */
  disableSoundForMessages?: boolean;
  /** Custom sound URL for incoming message notifications. */
  customSoundForMessages?: string;
  /** Selection mode: 'none' | 'single' | 'multiple'. */
  selectionMode?: CometChatConversationsSelectionMode;
  /** Currently active/highlighted conversation. */
  activeConversation?: CometChat.Conversation;
  /** Function that returns context menu options for a conversation. */
  options?: (conversation: CometChat.Conversation) => CometChatConversationOption[];
  /** Callback when a conversation item is clicked. */
  onItemClick?: (conversation: CometChat.Conversation) => void;
  /** Callback when a conversation is selected or deselected. */
  onSelect?: (conversation: CometChat.Conversation, selected: boolean) => void;
  /** Callback when an error occurs. */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /** Callback when the conversation list is empty after initial fetch. */
  onEmpty?: () => void;
  /**
   * Callback when the search bar is clicked (click, Enter, or Space).
   * When provided, the search bar input becomes read-only (acts as a trigger to open global search).
   */
  onSearchBarClicked?: () => void;
  /** Custom search view that replaces the default search bar when provided. */
  searchView?: ReactNode;
  /** Show the native scrollbar on the list. Default: false (scrollbar hidden). */
  showScrollbar?: boolean;
  /** Whether to hide the delete conversation option on conversation items. Default: false. */
  hideDeleteConversation?: boolean;
  /** Whether to show the search bar. Default: true. */
  showSearchBar?: boolean;
  /** Children (compound sub-components). If omitted, renders default layout. */
  children?: ReactNode;
}

// ==================== List Props ====================

/** Props for CometChatConversations.List. */
export interface CometChatConversationsListProps {
  /** Optional custom render function for each conversation item. */
  itemView?: (conversation: CometChat.Conversation) => ReactNode;
}

// ==================== Item Props ====================

/** Props for CometChatConversations.Item. */
export interface CometChatConversationsItemProps {
  /** The conversation to render. */
  conversation: CometChat.Conversation;
  /** Whether to hide the user status indicator. */
  hideUserStatus?: boolean;
  /** Whether to hide the unread count badge. */
  hideUnreadCount?: boolean;
  /** Whether to hide message receipts. */
  hideReceipts?: boolean;
  /** Whether to hide the delete button on hover/swipe. */
  hideDeleteButton?: boolean;
  /** Whether this item is active/highlighted. */
  isActive?: boolean;
  /** Function that returns context menu options for this conversation. */
  options?: (conversation: CometChat.Conversation) => CometChatConversationOption[];
  /** Custom leading view (replaces avatar). */
  leadingView?: ReactNode;
  /** Custom title view. */
  titleView?: ReactNode;
  /** Custom subtitle view (replaces last message preview). */
  subtitleView?: ReactNode;
  /** Custom trailing view (replaces timestamp + unread badge). */
  trailingView?: ReactNode;
}

// ==================== Header Props ====================

/** Props for CometChatConversations.Header. */
export interface CometChatConversationsHeaderProps {
  /** Custom title text. Defaults to "Chats". */
  title?: string;
  /** Custom header content (replaces default). */
  children?: ReactNode;
}

// ==================== SearchBar Props ====================

/** Props for CometChatConversations.SearchBar. */
export interface CometChatConversationsSearchBarProps {
  /** Placeholder text. Defaults to "Search conversations". */
  placeholder?: string;
  /**
   * Callback when the search bar is clicked (click, Enter, or Space).
   * When provided, the input becomes read-only (acts as a trigger).
   */
  onClick?: () => void;
}

// ==================== Empty State Props ====================

/** Props for CometChatConversations.EmptyState. */
export interface CometChatConversationsEmptyStateProps {
  /** Custom empty state content (replaces default). */
  children?: ReactNode;
}

// ==================== Error State Props ====================

/** Props for CometChatConversations.ErrorState. */
export interface CometChatConversationsErrorStateProps {
  /** Custom error state content (replaces default). */
  children?: ReactNode;
}

// ==================== Loading State Props ====================

/** Props for CometChatConversations.LoadingState. */
export interface CometChatConversationsLoadingStateProps {
  /** Custom loading state content (replaces default shimmer). */
  children?: ReactNode;
}

// ==================== Context Value ====================

/** Context value provided by CometChatConversations.Root. */
export interface CometChatConversationsContextValue {
  // --- State ---
  /** List of fetched conversations. */
  conversations: CometChat.Conversation[];
  /** Current fetch lifecycle state. */
  fetchState: CometChatFetchState;
  /** Whether more pages are available. */
  hasMore: boolean;
  /** Error message (if fetchState is 'error'). */
  error: string | null;
  /** Conversation IDs of selected conversations. */
  selectedConversationIds: string[];
  /** Full conversation objects for selected conversations (persists across search). */
  selectedConversationsMap: Map<string, CometChat.Conversation>;
  /** Currently active/highlighted conversation ID. */
  activeConversationId: string | null;
  /** Current search text. */
  searchText: string;
  /** Typing indicators keyed by user UID or group GUID. */
  typingIndicatorMap: Map<string, CometChat.TypingIndicator>;

  // --- Configuration ---
  /** Selection mode. */
  selectionMode: CometChatConversationsSelectionMode;
  /** Whether to hide user status. */
  hideUserStatus: boolean;
  /** Whether to hide unread count badge. */
  hideUnreadCount: boolean;
  /** Whether to hide message receipts. */
  hideReceipts: boolean;
  /** Whether to hide the group type indicator. */
  hideGroupType: boolean;
  /** Custom date/time format configuration for the last message timestamp. */
  lastMessageDateTimeFormat?: CometChatDateFormatConfig | undefined;
  /** Logged-in user UID (for receipt display). */
  loggedInUserId: string | null;
  /** Context menu options function. */
  options?: ((conversation: CometChat.Conversation) => CometChatConversationOption[]) | undefined;

  // --- Actions ---
  /** Fetch next page of conversations. */
  fetchNext: () => Promise<void>;
  /** Set search text (triggers re-fetch). */
  setSearchText: (text: string) => void;
  /** Select a conversation. */
  selectConversation: (conversation: CometChat.Conversation) => void;
  /** Deselect a conversation by ID. */
  deselectConversation: (conversationId: string) => void;
  /** Select a range of conversations (shift-click). */
  selectRange: (conversations: CometChat.Conversation[]) => void;
  /** Deselect a range of conversations. */
  deselectRange: (conversationIds: string[]) => void;
  /** Clear all selections. */
  clearSelection: () => void;
  /** Set active conversation ID. */
  setActiveConversation: (conversationId: string | null) => void;
  /** Handle item click (selection + callback). */
  handleItemClick: (conversation: CometChat.Conversation, event?: { shiftKey?: boolean }) => void;
  /** Delete a conversation. */
  deleteConversation: (conversationId: string) => Promise<void>;
  /** Set conversation to be deleted (shows confirm dialog). */
  setConversationToBeDeleted: (conversation: CometChat.Conversation | null) => void;
  /** Conversation pending deletion (for confirm dialog). */
  conversationToBeDeleted: CometChat.Conversation | null;
  /** Callback when the search bar is clicked (acts as trigger for global search). */
  onSearchBarClicked?: (() => void) | undefined;
  /** Whether to hide the delete conversation option on conversation items. */
  hideDeleteConversation: boolean;
  /** Whether to show the search bar. */
  showSearchBar: boolean;
}

// ==================== Convenience Props (Flat API) ====================

/** Convenience view props for the direct `<CometChatConversations />` flat API. */
export interface CometChatConversationsConvenienceProps {
  /** Custom search view that replaces the default search bar when provided. */
  searchView?: ReactNode;
  /** Custom leading view per conversation item (replaces avatar). */
  leadingView?: (conversation: CometChat.Conversation) => ReactNode;
  /** Custom title view per conversation item. */
  titleView?: (conversation: CometChat.Conversation) => ReactNode;
  /** Custom subtitle view per conversation item (replaces last message preview). */
  subtitleView?: (conversation: CometChat.Conversation) => ReactNode;
  /** Custom trailing view per conversation item (replaces timestamp + badge). */
  trailingView?: (conversation: CometChat.Conversation) => ReactNode;
  /** Fully custom item view (overrides leadingView, titleView, subtitleView, trailingView). */
  itemView?: (conversation: CometChat.Conversation) => ReactNode;
  /** Custom header content (replaces default header). */
  headerView?: ReactNode;
  /** Custom loading state content (replaces default shimmer). */
  loadingView?: ReactNode;
  /** Custom error state content (replaces default error view). */
  errorView?: ReactNode;
  /** Custom empty state content (replaces default empty view). */
  emptyView?: ReactNode;
}

/**
 * Props for the direct `<CometChatConversations />` flat API.
 * Combines all Root props with convenience view props.
 */
export type CometChatConversationsProps = Omit<CometChatConversationsRootProps, 'children'> &
  CometChatConversationsConvenienceProps;

// ==================== Hook Options & Return ====================

/** Options for the useCometChatConversations hook. */
export interface CometChatUseCometChatConversationsOptions {
  conversationsRequestBuilder?: CometChat.ConversationsRequestBuilder | undefined;
  searchRequestBuilder?: CometChat.ConversationsRequestBuilder | undefined;
  searchKeyword?: string | undefined;
  hideUserStatus?: boolean | undefined;
  hideUnreadCount?: boolean | undefined;
  hideReceipts?: boolean | undefined;
  disableSoundForMessages?: boolean | undefined;
  customSoundForMessages?: string | undefined;
  selectionMode?: CometChatConversationsSelectionMode | undefined;
  activeConversation?: CometChat.Conversation | undefined;
  onError?: ((error: CometChat.CometChatException) => void) | null | undefined;
  onEmpty?: (() => void) | undefined;
  onSelect?: ((conversation: CometChat.Conversation, selected: boolean) => void) | undefined;
  onItemClick?: ((conversation: CometChat.Conversation) => void) | undefined;
}

/** Return type of the useCometChatConversations hook. */
export interface CometChatUseCometChatConversationsReturn {
  // State
  conversations: CometChat.Conversation[];
  fetchState: CometChatFetchState;
  hasMore: boolean;
  error: string | null;
  selectedConversationIds: string[];
  selectedConversationsMap: Map<string, CometChat.Conversation>;
  activeConversationId: string | null;
  searchText: string;
  typingIndicatorMap: Map<string, CometChat.TypingIndicator>;
  loggedInUserId: string | null;
  // Actions
  fetchNext: () => Promise<void>;
  setSearchText: (text: string) => void;
  selectConversation: (conversation: CometChat.Conversation) => void;
  deselectConversation: (conversationId: string) => void;
  selectRange: (conversations: CometChat.Conversation[]) => void;
  deselectRange: (conversationIds: string[]) => void;
  clearSelection: () => void;
  setActiveConversation: (conversationId: string | null) => void;
  handleItemClick: (conversation: CometChat.Conversation, event?: { shiftKey?: boolean }) => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  setConversationToBeDeleted: (conversation: CometChat.Conversation | null) => void;
  conversationToBeDeleted: CometChat.Conversation | null;
}
