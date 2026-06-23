import type { ReactNode } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatTextFormatter } from '../../formatters/CometChatTextFormatter';
import type { CometChatFetchState } from '../../types';
import type { CometChatDateFormatConfig } from '../base/CometChatDate/CometChatDate.types';

// ==================== Option Types ====================

/** A single option in the conversation context menu within search results. */
export interface CometChatSearchConversationOption {
  /** Unique identifier. */
  id: string;
  /** Display title (localized). */
  title: string;
  /** Icon URL or inline SVG string. */
  iconURL?: string;
  /** Callback when the option is selected. */
  onClick: (conversation: CometChat.Conversation) => void;
}

// ==================== Enums ====================

/** Scope of the search — which result sections to show. */
export type CometChatSearchScope = 'conversations' | 'messages';

/** Filter chips available in the search filter bar. */
export type CometChatSearchFilter =
  | 'messages'
  | 'conversations'
  | 'unread'
  | 'groups'
  | 'photos'
  | 'videos'
  | 'links'
  | 'files'
  | 'audio';

// ==================== Event Payloads ====================

/** Payload emitted when a conversation result is clicked. */
export interface CometChatSearchConversationClickEvent {
  conversation: CometChat.Conversation;
  searchKeyword: string;
}

/** Payload emitted when a message result is clicked. */
export interface CometChatSearchMessageClickEvent {
  message: CometChat.BaseMessage;
  searchKeyword: string;
}

// ==================== Root Props ====================

/** Props for CometChatSearch.Root (and the flat API). */
export interface CometChatSearchRootProps {
  /**
   * Which result sections to show.
   * Empty array (default) = both conversations and messages.
   */
  searchIn?: CometChatSearchScope[];

  /**
   * Filter chips to display in the filter bar.
   * Defaults to all available filters.
   */
  searchFilters?: CometChatSearchFilter[];

  /**
   * Pre-select a filter on mount.
   */
  initialSearchFilter?: CometChatSearchFilter;

  /**
   * Pre-populate the search input with this text.
   */
  defaultSearchText?: string;

  /**
   * Scope search to a specific user's conversation.
   * When set, conversation filters are hidden.
   */
  uid?: string;

  /**
   * Scope search to a specific group's conversation.
   * When set, conversation filters are hidden.
   */
  guid?: string;

  /** Hide the back button in the header. */
  hideBackButton?: boolean;

  /** Hide user online/offline status indicators. */
  hideUserStatus?: boolean;

  /** Hide group type badge. */
  hideGroupType?: boolean;

  /** Hide message receipts. */
  hideReceipts?: boolean;

  /** Text formatters applied to conversation subtitles. */
  textFormatters?: CometChatTextFormatter[];

  /**
   * Custom date/time format for the last message timestamp in conversation results.
   * Defaults to DD/MM/YYYY for all date ranges in search context.
   */
  lastMessageDateTimeFormat?: CometChatDateFormatConfig;

  /**
   * Custom date/time format for the sent-at timestamp in message results.
   */
  messageSentAtDateTimeFormat?: CometChatDateFormatConfig;

  /** Custom request builder for conversation search. */
  conversationsRequestBuilder?: CometChat.ConversationsRequestBuilder;

  /** Custom request builder for message search. */
  messagesRequestBuilder?: CometChat.MessagesRequestBuilder;

  /**
   * Function that returns context menu options for a conversation result item.
   * Passed through to each conversation item rendered in search results.
   */
  conversationOptions?: (
    conversation: CometChat.Conversation
  ) => CometChatSearchConversationOption[];

  // ── Callbacks ──

  /** Fired when the back button is clicked. */
  onBack?: () => void;

  /** Fired when a conversation result item is clicked. */
  onConversationClicked?: (event: CometChatSearchConversationClickEvent) => void;

  /** Fired when a message result item is clicked. */
  onMessageClicked?: (event: CometChatSearchMessageClickEvent) => void;

  /** Fired when a search error occurs. */
  onError?: ((error: CometChat.CometChatException) => void) | null;

  // ── View Slots ──

  /** Custom render for the initial (pre-search) state. */
  initialView?: ReactNode;

  /** Custom render for the loading state. */
  loadingView?: ReactNode;

  /** Custom render for the empty state (no results). */
  emptyView?: ReactNode;

  /** Custom render for the error state. */
  errorView?: ReactNode;

  /** Custom render for a conversation result item. */
  conversationItemView?: (conversation: CometChat.Conversation) => ReactNode;

  /** Custom leading view for a conversation result item. */
  conversationLeadingView?: (conversation: CometChat.Conversation) => ReactNode;

  /** Custom title view for a conversation result item. */
  conversationTitleView?: (conversation: CometChat.Conversation) => ReactNode;

  /** Custom subtitle view for a conversation result item. */
  conversationSubtitleView?: (conversation: CometChat.Conversation) => ReactNode;

  /** Custom trailing view for a conversation result item. */
  conversationTrailingView?: (conversation: CometChat.Conversation) => ReactNode;

  /** Custom render for a message result item. */
  messageItemView?: (message: CometChat.BaseMessage) => ReactNode;

  /** Custom leading view for a message result item. */
  messageLeadingView?: (message: CometChat.BaseMessage) => ReactNode;

  /** Custom title view for a message result item. */
  messageTitleView?: (message: CometChat.BaseMessage) => ReactNode;

  /** Custom subtitle view for a message result item. */
  messageSubtitleView?: (message: CometChat.BaseMessage) => ReactNode;

  /** Custom trailing view for a message result item. */
  messageTrailingView?: (message: CometChat.BaseMessage) => ReactNode;

  /** Children (compound sub-components). If omitted, renders default layout. */
  children?: ReactNode;
}

/** Props for the flat `<CometChatSearch />` API. */
export type CometChatSearchProps = Omit<CometChatSearchRootProps, 'children'>;

// ==================== Context Value ====================

/** Context value provided by CometChatSearch.Root. */
export interface CometChatSearchContextValue {
  // ── Search state ──
  /** Current raw input value (unDebounced). */
  searchValue: string;
  /** Debounced search text used for SDK queries. */
  searchText: string;
  /** Currently active filter chips. */
  activeFilters: CometChatSearchFilter[];
  /** Visible filter chips (computed from scope + active filters). */
  visibleFilters: CometChatSearchFilter[];

  // ── Derived visibility ──
  /** Whether to show the initial (pre-search) view. */
  showInitialView: boolean;
  /** Whether to render the conversations result section. */
  showConversations: boolean;
  /** Whether to render the messages result section. */
  showMessages: boolean;
  /** Whether both scopes are active simultaneously. */
  bothScopesActive: boolean;
  /** Whether to hide the conversations section (unified state coordination). */
  hideConversationsSection: boolean;
  /** Whether to hide the messages section (unified state coordination). */
  hideMessagesSection: boolean;
  /** Whether to show a unified empty view (both lists empty). */
  showUnifiedEmpty: boolean;
  /** Whether to show a unified error view (both lists errored). */
  showUnifiedError: boolean;

  // ── Child state reporting ──
  conversationsState: CometChatFetchState;
  messagesState: CometChatFetchState;

  // ── Configuration ──
  searchIn: CometChatSearchScope[];
  searchFilters: CometChatSearchFilter[];
  uid?: string;
  guid?: string;
  hideBackButton: boolean;
  hideUserStatus: boolean;
  hideGroupType: boolean;
  hideReceipts: boolean;
  textFormatters: CometChatTextFormatter[];
  lastMessageDateTimeFormat?: CometChatDateFormatConfig;
  messageSentAtDateTimeFormat?: CometChatDateFormatConfig;
  conversationsRequestBuilder?: CometChat.ConversationsRequestBuilder;
  messagesRequestBuilder?: CometChat.MessagesRequestBuilder;
  conversationOptions?: (
    conversation: CometChat.Conversation
  ) => CometChatSearchConversationOption[];

  // ── View slots ──
  initialView?: ReactNode;
  loadingView?: ReactNode;
  emptyView?: ReactNode;
  errorView?: ReactNode;
  conversationItemView?: (conversation: CometChat.Conversation) => ReactNode;
  conversationLeadingView?: (conversation: CometChat.Conversation) => ReactNode;
  conversationTitleView?: (conversation: CometChat.Conversation) => ReactNode;
  conversationSubtitleView?: (conversation: CometChat.Conversation) => ReactNode;
  conversationTrailingView?: (conversation: CometChat.Conversation) => ReactNode;
  messageItemView?: (message: CometChat.BaseMessage) => ReactNode;
  messageLeadingView?: (message: CometChat.BaseMessage) => ReactNode;
  messageTitleView?: (message: CometChat.BaseMessage) => ReactNode;
  messageSubtitleView?: (message: CometChat.BaseMessage) => ReactNode;
  messageTrailingView?: (message: CometChat.BaseMessage) => ReactNode;

  // ── Actions ──
  setSearchValue: (value: string) => void;
  clearSearch: () => void;
  toggleFilter: (filterId: CometChatSearchFilter) => void;
  isFilterActive: (filterId: CometChatSearchFilter) => boolean;
  getFilterLabel: (filterId: CometChatSearchFilter) => string;
  handleBackClick: () => void;
  handleConversationClick: (event: CometChatSearchConversationClickEvent) => void;
  handleMessageClick: (event: CometChatSearchMessageClickEvent) => void;
  handleConversationsStateChange: (state: CometChatFetchState) => void;
  handleMessagesStateChange: (state: CometChatFetchState) => void;
  handleError: (error: unknown) => void;
}

// ==================== Sub-component Props ====================

/** Props for CometChatSearchConversationsList. */
export interface CometChatSearchConversationsListProps {
  /** Override search keyword (reads from context by default). */
  searchKeyword?: string;
  /** Override active filters (reads from context by default). */
  activeFilters?: CometChatSearchFilter[];
  /** Whether to hide this section entirely. */
  hideSection?: boolean;
  /** Whether to suppress own empty/error views (parent handles them). */
  suppressEmptyErrorView?: boolean;
  /**
   * Force scroll-based infinite pagination instead of the "See More" button.
   * By default, derived from uid/guid/activeFilters presence.
   */
  useScrollPagination?: boolean;
}

/** Props for CometChatSearchMessagesList. */
export interface CometChatSearchMessagesListProps {
  /** Override search keyword (reads from context by default). */
  searchKeyword?: string;
  /** Override active filters (reads from context by default). */
  activeFilters?: CometChatSearchFilter[];
  /** Whether to hide this section entirely. */
  hideSection?: boolean;
  /** Whether to suppress own empty/error views (parent handles them). */
  suppressEmptyErrorView?: boolean;
  /**
   * When true, always show the "See More" button instead of scroll-based pagination.
   * By default, derived from uid/guid/activeFilters presence.
   */
  alwaysShowSeeMore?: boolean;
}

// ==================== Manager / Hook Types ====================

/** State managed by the conversations search manager. */
export interface CometChatSearchConversationsState {
  conversations: CometChat.Conversation[];
  fetchState: CometChatFetchState;
  hasMore: boolean;
  typingIndicators: Map<string, CometChat.TypingIndicator>;
}

/** State managed by the messages search manager. */
export interface CometChatSearchMessagesState {
  messages: CometChat.BaseMessage[];
  fetchState: CometChatFetchState;
  hasMore: boolean;
}

/** Options for useCometChatSearchConversations hook. */
export interface CometChatUseCometChatSearchConversationsOptions {
  searchKeyword: string;
  activeFilters: CometChatSearchFilter[];
  conversationsRequestBuilder?: CometChat.ConversationsRequestBuilder;
  lastMessageDateTimeFormat?: CometChatDateFormatConfig;
  onError?: ((error: CometChat.CometChatException) => void) | null;
  onStateChange?: (state: CometChatFetchState) => void;
}

/** Options for useCometChatSearchMessages hook. */
export interface CometChatUseCometChatSearchMessagesOptions {
  searchKeyword: string;
  activeFilters: CometChatSearchFilter[];
  uid?: string;
  guid?: string;
  alwaysShowSeeMore?: boolean;
  messagesRequestBuilder?: CometChat.MessagesRequestBuilder;
  messageSentAtDateTimeFormat?: CometChatDateFormatConfig;
  onError?: ((error: CometChat.CometChatException) => void) | null;
  onStateChange?: (state: CometChatFetchState) => void;
}
