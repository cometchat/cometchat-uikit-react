import type {
  CometChatNotificationFeedState,
  NotificationFeedItem,
  NotificationCategory,
  ScreenState,
} from './CometChatNotificationFeed.types';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { groupByTimestamp } from './utils';

// ==================== Actions ====================

export type CometChatNotificationFeedAction =
  | { type: 'SET_SCREEN_STATE'; screenState: ScreenState }
  | { type: 'SET_ITEMS'; items: NotificationFeedItem[] }
  | { type: 'APPEND_ITEMS'; items: NotificationFeedItem[] }
  | { type: 'PREPEND_ITEM'; item: NotificationFeedItem }
  | { type: 'UPDATE_ITEM'; item: NotificationFeedItem }
  | { type: 'SET_CATEGORIES'; categories: NotificationCategory[] }
  | { type: 'SET_ACTIVE_CATEGORY'; category: string | null }
  | { type: 'SET_UNREAD_COUNT'; count: number }
  | {
      type: 'SET_CATEGORY_UNREAD_COUNTS';
      counts: Map<string, number>;
    }
  | { type: 'DECREMENT_UNREAD'; category?: string }
  | { type: 'INCREMENT_UNREAD'; category?: string }
  | { type: 'MARK_ALL_READ' }
  | { type: 'SET_LOADING_MORE'; isLoadingMore: boolean }
  | { type: 'SET_REFRESHING'; isRefreshing: boolean }
  | { type: 'SET_HAS_MORE_PAGES'; hasMorePages: boolean }
  | { type: 'SET_PAGINATION_ERROR'; paginationError: boolean }
  | { type: 'SET_ERROR'; error: CometChat.CometChatException | null }
  | { type: 'RESET' };

// ==================== Initial State ====================

export const initialNotificationFeedState: CometChatNotificationFeedState = {
  items: [],
  groupedItems: [],
  categories: [],
  activeCategory: null,
  totalUnreadCount: 0,
  categoryUnreadCounts: new Map(),
  screenState: 'loading',
  isLoadingMore: false,
  isRefreshing: false,
  error: null,
  hasMorePages: true,
  paginationError: false,
};

// ==================== Reducer ====================

export function notificationFeedReducer(
  state: CometChatNotificationFeedState,
  action: CometChatNotificationFeedAction
): CometChatNotificationFeedState {
  switch (action.type) {
    case 'SET_SCREEN_STATE': {
      return { ...state, screenState: action.screenState };
    }

    case 'SET_ITEMS': {
      const groupedItems = groupByTimestamp(action.items);
      const screenState: ScreenState = action.items.length === 0 ? 'empty' : 'loaded';
      return { ...state, items: action.items, groupedItems, screenState };
    }

    case 'APPEND_ITEMS': {
      // Deduplicate
      const existingIds = new Set(state.items.map(i => i.getId()));
      const newItems = action.items.filter(item => !existingIds.has(item.getId()));
      if (newItems.length === 0) {
        return { ...state, hasMorePages: false, isLoadingMore: false };
      }
      const allItems = [...state.items, ...newItems];
      const groupedItems = groupByTimestamp(allItems);
      return { ...state, items: allItems, groupedItems, isLoadingMore: false };
    }

    case 'PREPEND_ITEM': {
      const allItems = [action.item, ...state.items];
      const groupedItems = groupByTimestamp(allItems);
      return { ...state, items: allItems, groupedItems, screenState: 'loaded' };
    }

    case 'UPDATE_ITEM': {
      const idx = state.items.findIndex(i => i.getId() === action.item.getId());
      if (idx === -1) return state;
      const updatedItems = [...state.items];
      updatedItems[idx] = action.item;
      const groupedItems = groupByTimestamp(updatedItems);
      return { ...state, items: updatedItems, groupedItems };
    }

    case 'SET_CATEGORIES': {
      return { ...state, categories: action.categories };
    }

    case 'SET_ACTIVE_CATEGORY': {
      return { ...state, activeCategory: action.category };
    }

    case 'SET_UNREAD_COUNT': {
      return { ...state, totalUnreadCount: action.count };
    }

    case 'SET_CATEGORY_UNREAD_COUNTS': {
      return { ...state, categoryUnreadCounts: action.counts };
    }

    case 'DECREMENT_UNREAD': {
      const newCount = Math.max(0, state.totalUnreadCount - 1);
      const categoryUnreadCounts = new Map(state.categoryUnreadCounts);
      if (action.category) {
        const currentCount = categoryUnreadCounts.get(action.category) ?? 0;
        if (currentCount > 0) {
          categoryUnreadCounts.set(action.category, currentCount - 1);
        }
      }
      return { ...state, totalUnreadCount: newCount, categoryUnreadCounts };
    }

    case 'INCREMENT_UNREAD': {
      const newCount = state.totalUnreadCount + 1;
      const categoryUnreadCounts = new Map(state.categoryUnreadCounts);
      if (action.category) {
        const currentCount = categoryUnreadCounts.get(action.category) ?? 0;
        categoryUnreadCounts.set(action.category, currentCount + 1);
      }
      return { ...state, totalUnreadCount: newCount, categoryUnreadCounts };
    }

    case 'MARK_ALL_READ': {
      const updatedItems = state.items.map(item => {
        if (item.getReadAt() === null) {
          item.setReadAt(Math.floor(Date.now() / 1000));
        }
        return item;
      });
      const groupedItems = groupByTimestamp(updatedItems);
      return {
        ...state,
        items: updatedItems,
        groupedItems,
        totalUnreadCount: 0,
        categoryUnreadCounts: new Map(),
      };
    }

    case 'SET_LOADING_MORE': {
      return { ...state, isLoadingMore: action.isLoadingMore };
    }

    case 'SET_REFRESHING': {
      return { ...state, isRefreshing: action.isRefreshing };
    }

    case 'SET_HAS_MORE_PAGES': {
      return { ...state, hasMorePages: action.hasMorePages };
    }

    case 'SET_PAGINATION_ERROR': {
      return { ...state, paginationError: action.paginationError };
    }

    case 'SET_ERROR': {
      return { ...state, error: action.error };
    }

    case 'RESET': {
      return { ...initialNotificationFeedState };
    }

    default:
      return state;
  }
}
