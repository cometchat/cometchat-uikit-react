import { useCallback, useEffect, useId, useReducer, useRef } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatNotificationFeedManager } from './CometChatNotificationFeedManager';
import {
  notificationFeedReducer,
  initialNotificationFeedState,
} from './CometChatNotificationFeed.reducer';
import type {
  CometChatUseCometChatNotificationFeedOptions,
  CometChatUseCometChatNotificationFeedReturn,
  NotificationFeedItem,
} from './CometChatNotificationFeed.types';
import { useCometChatFrameContext } from '../../context/CometChatFrameContext';

/**
 * useCometChatNotificationFeed — orchestration hook for the notification feed data layer.
 *
 * Creates the Manager, attaches SDK listeners, dispatches reducer actions,
 * and exposes a clean API to the Provider.
 */
export function useCometChatNotificationFeed(
  options: CometChatUseCometChatNotificationFeedOptions = {}
): CometChatUseCometChatNotificationFeedReturn {
  const { notificationFeedRequestBuilder, notificationCategoriesRequestBuilder, onError } = options;

  const [state, dispatch] = useReducer(notificationFeedReducer, initialNotificationFeedState);
  const managerRef = useRef<CometChatNotificationFeedManager | null>(null);
  const instanceId = useId();
  const deliveredItemIds = useRef<Set<string>>(new Set());
  const activeCategoryRef = useRef<string | null>(null);
  const IframeContext = useCometChatFrameContext();

  const getCurrentWindow = useCallback(() => {
    return IframeContext.iframeWindow ?? window;
  }, [IframeContext.iframeWindow]);

  // --- Error handler ---
  const handleError = useCallback(
    (error: unknown) => {
      const cometChatError = error as CometChat.CometChatException;
      onError?.(cometChatError);
      dispatch({ type: 'SET_ERROR', error: cometChatError });
    },
    [onError]
  );

  // --- Report delivered for a batch ---
  const reportDeliveredBatch = useCallback((items: NotificationFeedItem[]) => {
    for (const item of items) {
      if (!deliveredItemIds.current.has(item.getId())) {
        deliveredItemIds.current.add(item.getId());
        CometChatNotificationFeedManager.reportDelivered(item);
      }
    }
  }, []);

  // --- Initialize & fetch ---
  const initializeAndFetch = useCallback(
    async (category: string | null) => {
      dispatch({ type: 'SET_SCREEN_STATE', screenState: 'loading' });

      // Fetch categories
      const categories = await CometChatNotificationFeedManager.fetchCategories(
        notificationCategoriesRequestBuilder
      );
      dispatch({ type: 'SET_CATEGORIES', categories });

      // Initialize feed builder
      const manager = new CometChatNotificationFeedManager();
      manager.initFeedRequestBuilder(category, notificationFeedRequestBuilder ?? undefined);
      managerRef.current = manager;

      // Fetch initial items
      try {
        const items = await manager.fetchNext();
        if (items.length === 0) {
          dispatch({ type: 'SET_ITEMS', items: [] });
          dispatch({ type: 'SET_HAS_MORE_PAGES', hasMorePages: false });
        } else {
          dispatch({ type: 'SET_ITEMS', items });
          dispatch({ type: 'SET_HAS_MORE_PAGES', hasMorePages: true });
          reportDeliveredBatch(items);
        }
      } catch (error) {
        dispatch({ type: 'SET_SCREEN_STATE', screenState: 'error' });
        handleError(error);
      }

      // Fetch unread count
      const count = await CometChatNotificationFeedManager.fetchUnreadCount();
      dispatch({ type: 'SET_UNREAD_COUNT', count });
    },
    [
      notificationFeedRequestBuilder,
      notificationCategoriesRequestBuilder,
      handleError,
      reportDeliveredBatch,
    ]
  );

  // --- Initial mount ---
  useEffect(() => {
    void initializeAndFetch(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Unread count polling every 30 seconds ---
  useEffect(() => {
    const pollUnreadCount = async () => {
      const count = await CometChatNotificationFeedManager.fetchUnreadCount();
      dispatch({ type: 'SET_UNREAD_COUNT', count });
    };

    const intervalId = setInterval(() => {
      void pollUnreadCount();
    }, 30000);

    // Also re-fetch on window focus
    const handleFocus = () => {
      void pollUnreadCount();
    };
    const currentWindow = getCurrentWindow();
    currentWindow.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      currentWindow.removeEventListener('focus', handleFocus);
    };
  }, [getCurrentWindow]);

  // --- Real-time listener ---
  useEffect(() => {
    const listenerId = `CometChatNotificationFeed_${instanceId}`;

    const cleanup = CometChatNotificationFeedManager.attachFeedListener(listenerId, {
      onFeedItemReceived: (item: NotificationFeedItem) => {
        dispatch({ type: 'PREPEND_ITEM', item });
        dispatch({ type: 'INCREMENT_UNREAD', category: item.getCategory() });

        // Mark as delivered
        if (!deliveredItemIds.current.has(item.getId())) {
          deliveredItemIds.current.add(item.getId());
          CometChatNotificationFeedManager.reportDelivered(item);
        }
      },
    });

    return cleanup;
  }, [instanceId]);

  // --- Fetch next page (infinite scroll) ---
  const fetchNextPage = useCallback(async () => {
    if (state.isLoadingMore || !state.hasMorePages || !managerRef.current) return;

    dispatch({ type: 'SET_LOADING_MORE', isLoadingMore: true });
    dispatch({ type: 'SET_PAGINATION_ERROR', paginationError: false });

    try {
      const items = await managerRef.current.fetchNext();
      if (items.length === 0) {
        dispatch({ type: 'SET_LOADING_MORE', isLoadingMore: false });
        dispatch({ type: 'SET_HAS_MORE_PAGES', hasMorePages: false });
      } else {
        dispatch({ type: 'APPEND_ITEMS', items });
        reportDeliveredBatch(items);
      }
    } catch (error) {
      console.warn('[NotificationFeed] Pagination error:', error);
      dispatch({ type: 'SET_LOADING_MORE', isLoadingMore: false });
      dispatch({ type: 'SET_PAGINATION_ERROR', paginationError: true });
    }
  }, [state.isLoadingMore, state.hasMorePages, reportDeliveredBatch]);

  // --- Refresh ---
  const refresh = useCallback(async () => {
    if (state.isRefreshing) return;
    dispatch({ type: 'SET_REFRESHING', isRefreshing: true });
    deliveredItemIds.current.clear();
    await initializeAndFetch(activeCategoryRef.current);
    dispatch({ type: 'SET_REFRESHING', isRefreshing: false });
  }, [state.isRefreshing, initializeAndFetch]);

  // --- Switch category ---
  const switchCategory = useCallback(
    (category: string | null) => {
      activeCategoryRef.current = category;
      dispatch({ type: 'SET_ACTIVE_CATEGORY', category });
      // Reset items but keep categories and unread counts
      dispatch({ type: 'SET_ITEMS', items: [] });
      dispatch({ type: 'SET_HAS_MORE_PAGES', hasMorePages: true });
      deliveredItemIds.current.clear();

      // Re-init manager with new category
      const manager = new CometChatNotificationFeedManager();
      manager.initFeedRequestBuilder(category, notificationFeedRequestBuilder ?? undefined);
      managerRef.current = manager;

      dispatch({ type: 'SET_SCREEN_STATE', screenState: 'loading' });

      manager
        .fetchNext()
        .then(items => {
          if (items.length === 0) {
            dispatch({ type: 'SET_ITEMS', items: [] });
            dispatch({ type: 'SET_HAS_MORE_PAGES', hasMorePages: false });
          } else {
            dispatch({ type: 'SET_ITEMS', items });
            dispatch({ type: 'SET_HAS_MORE_PAGES', hasMorePages: true });
            reportDeliveredBatch(items);
          }
        })
        .catch((error: unknown) => {
          dispatch({ type: 'SET_SCREEN_STATE', screenState: 'error' });
          handleError(error);
        });
    },
    [notificationFeedRequestBuilder, handleError, reportDeliveredBatch]
  );

  // --- Mark all as read ---
  const markAllAsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_READ' });
    return Promise.resolve();
  }, []);

  // --- Retry pagination ---
  const retryPagination = useCallback(() => {
    dispatch({ type: 'SET_PAGINATION_ERROR', paginationError: false });
    dispatch({ type: 'SET_HAS_MORE_PAGES', hasMorePages: true });
    void fetchNextPage();
  }, [fetchNextPage]);

  // --- Engagement ---
  const reportClicked = useCallback((item: NotificationFeedItem) => {
    CometChatNotificationFeedManager.reportClicked(item);
  }, []);

  const reportViewed = useCallback((item: NotificationFeedItem) => {
    CometChatNotificationFeedManager.reportViewed(item);
  }, []);

  const reportRead = useCallback((item: NotificationFeedItem) => {
    CometChatNotificationFeedManager.reportRead(item);
    // Update local state
    item.setReadAt(Math.floor(Date.now() / 1000));
    dispatch({ type: 'UPDATE_ITEM', item });
    dispatch({ type: 'DECREMENT_UNREAD', category: item.getCategory() });
  }, []);

  return {
    // State
    items: state.items,
    groupedItems: state.groupedItems,
    categories: state.categories,
    activeCategory: state.activeCategory,
    totalUnreadCount: state.totalUnreadCount,
    categoryUnreadCounts: state.categoryUnreadCounts,
    screenState: state.screenState,
    isLoadingMore: state.isLoadingMore,
    isRefreshing: state.isRefreshing,
    error: state.error,
    hasMorePages: state.hasMorePages,
    paginationError: state.paginationError,
    // Actions
    fetchNextPage,
    refresh,
    switchCategory,
    markAllAsRead,
    retryPagination,
    reportClicked,
    reportViewed,
    reportRead,
  };
}
