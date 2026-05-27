import { CometChat } from "@cometchat/chat-sdk-javascript";

/**
 * Type alias for the SDK's NotificationFeedItem class.
 */
export type NotificationFeedItem = CometChat.NotificationFeedItem;

/**
 * Represents a notification category for filter chips.
 */
export interface NotificationCategory {
  id: string;
  label: string;
}

/**
 * Engagement type for feed interactions.
 */
export type FeedEngagementType = "viewed" | "clicked" | "interacted";

/**
 * Read state filter for feed requests.
 */
export type FeedReadState = "read" | "unread" | "all";

/**
 * Action triggered from a card element (from @cometchat/cards-react).
 */
export interface CardAction {
  type: string;
  params: Record<string, any>;
  elementId?: string;
  cardJson?: string;
}

/**
 * Timestamp group for feed items grouped by date.
 */
export interface TimestampGroup {
  label: string;
  items: NotificationFeedItem[];
}

/**
 * Style customization for CometChatNotificationFeed.
 */
export interface CometChatNotificationFeedStyle {
  backgroundColor?: string;
  width?: string;
  height?: string;
  headerTitleColor?: string;
  headerTitleFont?: string;
  chipActiveBackgroundColor?: string;
  chipActiveTextColor?: string;
  chipInactiveBackgroundColor?: string;
  chipInactiveTextColor?: string;
  chipBorderColor?: string;
  badgeBackgroundColor?: string;
  badgeTextColor?: string;
  separatorColor?: string;
  timestampTextColor?: string;
  timestampFont?: string;
  cardBackgroundColor?: string;
  cardBorderColor?: string;
  cardBorderRadius?: number;
  cardBorderWidth?: number;
  unreadIndicatorColor?: string;
}

/**
 * Props for the CometChatNotificationFeed component.
 */
export interface CometChatNotificationFeedProps {
  /** Title displayed in the header. Default: "Notifications" */
  title?: string;
  /** Whether to show the header. Default: true */
  showHeader?: boolean;
  /** Whether to show the back button. Default: false */
  showBackButton?: boolean;
  /** Whether to show filter chips. Default: true */
  showFilterChips?: boolean;
  /** Custom header view to replace the default header */
  headerView?: React.ReactNode;
  /** Deep link: scroll to a specific item by ID */
  scrollToItemId?: string;

  /** Custom request builder for fetching feed items */
  notificationFeedRequestBuilder?: any;
  /** Custom request builder for fetching categories */
  notificationCategoriesRequestBuilder?: any;

  /** Callback when a feed item is clicked */
  onItemClick?: (feedItem: NotificationFeedItem) => void;
  /** Callback when a card action button is clicked */
  onActionClick?: (feedItem: NotificationFeedItem, action: CardAction) => void;
  /** Callback when an error occurs */
  onError?: (error: CometChat.CometChatException) => void;
  /** Callback when back button is pressed */
  onBackPress?: () => void;

  /** Custom empty state view */
  emptyStateView?: React.ReactNode;
  /** Custom error state view */
  errorStateView?: React.ReactNode;
  /** Custom loading state view */
  loadingStateView?: React.ReactNode;

  /** Style customization */
  style?: CometChatNotificationFeedStyle;

  /** Card theme mode forwarded to @cometchat/cards-react */
  cardThemeMode?: "auto" | "light" | "dark";
  /** Card theme override forwarded to @cometchat/cards-react */
  cardThemeOverride?: Record<string, any>;
}

/**
 * Internal state for the NotificationFeed ViewModel.
 */
export type ScreenState = "loading" | "loaded" | "empty" | "error";

export interface NotificationFeedState {
  items: NotificationFeedItem[];
  groupedItems: TimestampGroup[];
  categories: NotificationCategory[];
  activeCategory: string | null;
  totalUnreadCount: number;
  categoryUnreadCounts: Map<string, number>;
  screenState: ScreenState;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  isOffline: boolean;
  error: CometChat.CometChatException | null;
  hasMorePages: boolean;
  paginationError: boolean;
}
