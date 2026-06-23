import type { ReactNode } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

// ==================== Core Types ====================

/**
 * Type alias for the SDK's NotificationFeedItem.
 * Uses an interface definition since the SDK type may not be available
 * in all versions. The actual object is provided by the SDK at runtime.
 */
export interface NotificationFeedItem {
  getId(): string;
  getSentAt(): number;
  getReadAt(): number | null;
  setReadAt(timestamp: number): void;
  getContent(): unknown;
  getCategory(): string;
}

/** Represents a notification category for filter chips. */
export interface NotificationCategory {
  id: string;
  label: string;
}

/** Engagement type for feed interactions. */
export type FeedEngagementType = 'viewed' | 'clicked' | 'interacted';

/** Read state filter for feed requests. */
export type FeedReadState = 'read' | 'unread' | 'all';

/** Action triggered from a card element (from @cometchat/cards-react). */
export interface CardAction {
  type: string;
  params: Record<string, unknown>;
  elementId?: string;
  cardJson?: string;
}

/** Timestamp group for feed items grouped by date. */
export interface TimestampGroup {
  label: string;
  items: NotificationFeedItem[];
}

/** Screen state for the notification feed. */
export type ScreenState = 'loading' | 'loaded' | 'empty' | 'error';

// ==================== State ====================

/** Internal state for the NotificationFeed. */
export interface CometChatNotificationFeedState {
  items: NotificationFeedItem[];
  groupedItems: TimestampGroup[];
  categories: NotificationCategory[];
  activeCategory: string | null;
  totalUnreadCount: number;
  categoryUnreadCounts: Map<string, number>;
  screenState: ScreenState;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: CometChat.CometChatException | null;
  hasMorePages: boolean;
  paginationError: boolean;
}

// ==================== Root Props ====================

/** Props for CometChatNotificationFeed.Root (Provider + default layout). */
export interface CometChatNotificationFeedRootProps {
  /** Title displayed in the header. Default: "Notifications" */
  title?: string;
  /** Whether to show the header. Default: true */
  showHeader?: boolean;
  /** Whether to show the back button. Default: false */
  showBackButton?: boolean;
  /** Whether to show filter chips. Default: true */
  showFilterChips?: boolean;
  /** Custom request builder for fetching feed items */
  notificationFeedRequestBuilder?: unknown;
  /** Custom request builder for fetching categories */
  notificationCategoriesRequestBuilder?: unknown;
  /** Callback when a feed item is clicked */
  onItemClick?: (feedItem: NotificationFeedItem) => void;
  /** Callback when a card action button is clicked */
  onActionClick?: (feedItem: NotificationFeedItem, action: CardAction) => void;
  /** Callback when an error occurs */
  onError?: (error: CometChat.CometChatException) => void;
  /** Callback when back button is pressed */
  onBackPress?: () => void;
  /** Card theme mode forwarded to @cometchat/cards-react */
  cardThemeMode?: 'auto' | 'light' | 'dark';
  /** Card theme override forwarded to @cometchat/cards-react */
  cardThemeOverride?: Record<string, unknown>;
  /** Children (compound sub-components). If omitted, renders default layout. */
  children?: ReactNode;
}

// ==================== Sub-Component Props ====================

/** Props for CometChatNotificationFeed.Header. */
export interface CometChatNotificationFeedHeaderProps {
  /** Custom title text. Defaults to "Notifications". */
  title?: string;
  /** Whether to show the back button. */
  showBackButton?: boolean;
  /** Callback when back button is pressed. */
  onBackPress?: () => void;
  /** Custom header content (replaces default). */
  children?: ReactNode;
}

/** Props for CometChatNotificationFeed.List. */
export interface CometChatNotificationFeedListProps {
  /** Optional custom render function for each feed item. */
  itemView?: (item: NotificationFeedItem) => ReactNode;
}

/** Props for CometChatNotificationFeed.Item. */
export interface CometChatNotificationFeedItemProps {
  /** The notification feed item to render. */
  item: NotificationFeedItem;
  /** Card theme mode. */
  cardThemeMode?: 'auto' | 'light' | 'dark';
  /** Card theme override. */
  cardThemeOverride?: Record<string, unknown>;
}

/** Props for CometChatNotificationFeed.FilterChips. */
export interface CometChatNotificationFeedFilterChipsProps {
  /** Custom chip content (replaces default). */
  children?: ReactNode;
}

/** Props for CometChatNotificationFeed.EmptyState. */
export interface CometChatNotificationFeedEmptyStateProps {
  /** Custom empty state content (replaces default). */
  children?: ReactNode;
}

/** Props for CometChatNotificationFeed.ErrorState. */
export interface CometChatNotificationFeedErrorStateProps {
  /** Custom error state content (replaces default). */
  children?: ReactNode;
}

/** Props for CometChatNotificationFeed.LoadingState. */
export interface CometChatNotificationFeedLoadingStateProps {
  /** Custom loading state content (replaces default). */
  children?: ReactNode;
}

// ==================== Context Value ====================

/** Context value provided by CometChatNotificationFeed.Root. */
export interface CometChatNotificationFeedContextValue {
  // --- State ---
  items: NotificationFeedItem[];
  groupedItems: TimestampGroup[];
  categories: NotificationCategory[];
  activeCategory: string | null;
  totalUnreadCount: number;
  categoryUnreadCounts: Map<string, number>;
  screenState: ScreenState;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: CometChat.CometChatException | null;
  hasMorePages: boolean;
  paginationError: boolean;

  // --- Configuration ---
  title: string;
  showHeader: boolean;
  showBackButton: boolean;
  showFilterChips: boolean;
  cardThemeMode: 'auto' | 'light' | 'dark';
  cardThemeOverride?: Record<string, unknown>;

  // --- Actions ---
  fetchNextPage: () => Promise<void>;
  refresh: () => Promise<void>;
  switchCategory: (category: string | null) => void;
  markAllAsRead: () => Promise<void>;
  retryPagination: () => void;
  reportClicked: (item: NotificationFeedItem) => void;
  reportViewed: (item: NotificationFeedItem) => void;
  reportRead: (item: NotificationFeedItem) => void;
  /** Register an item element for visibility tracking (viewed/read engagement). */
  observeItem: (element: HTMLDivElement | null, item: NotificationFeedItem) => void;

  // --- Callbacks ---
  onItemClick?: (feedItem: NotificationFeedItem) => void;
  onActionClick?: (feedItem: NotificationFeedItem, action: CardAction) => void;
  onBackPress?: () => void;
}

// ==================== Convenience Props (Flat API) ====================

/** Convenience view props for the direct flat API. */
export interface CometChatNotificationFeedConvenienceProps {
  /** Custom header view (replaces default header). */
  headerView?: ReactNode;
  /** Custom loading state view. */
  loadingView?: ReactNode;
  /** Custom error state view. */
  errorView?: ReactNode;
  /** Custom empty state view. */
  emptyView?: ReactNode;
  /** Custom item view. */
  itemView?: (item: NotificationFeedItem) => ReactNode;
}

/**
 * Props for the direct `<CometChatNotificationFeed />` flat API.
 */
export type CometChatNotificationFeedProps = Omit<CometChatNotificationFeedRootProps, 'children'> &
  CometChatNotificationFeedConvenienceProps;

// ==================== Hook Options & Return ====================

/** Options for the useCometChatNotificationFeed hook. */
export interface CometChatUseCometChatNotificationFeedOptions {
  notificationFeedRequestBuilder?: unknown;
  notificationCategoriesRequestBuilder?: unknown;
  onError?: (error: CometChat.CometChatException) => void;
}

/** Return type of the useCometChatNotificationFeed hook. */
export interface CometChatUseCometChatNotificationFeedReturn {
  // State
  items: NotificationFeedItem[];
  groupedItems: TimestampGroup[];
  categories: NotificationCategory[];
  activeCategory: string | null;
  totalUnreadCount: number;
  categoryUnreadCounts: Map<string, number>;
  screenState: ScreenState;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: CometChat.CometChatException | null;
  hasMorePages: boolean;
  paginationError: boolean;
  // Actions
  fetchNextPage: () => Promise<void>;
  refresh: () => Promise<void>;
  switchCategory: (category: string | null) => void;
  markAllAsRead: () => Promise<void>;
  retryPagination: () => void;
  reportClicked: (item: NotificationFeedItem) => void;
  reportViewed: (item: NotificationFeedItem) => void;
  reportRead: (item: NotificationFeedItem) => void;
}
