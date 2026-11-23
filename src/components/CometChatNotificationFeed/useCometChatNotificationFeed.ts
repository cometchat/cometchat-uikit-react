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
import { isOfflineOn } from '../../utils/offline/gate';
import { useOfflineListLifecycle } from '../../utils/offline/useOfflineListLifecycle';
import { useReloadOnReconnect } from '../../utils/offline/useReloadOnReconnect';
import { useDeferredLoadMore } from '../../utils/offline/useDeferredLoadMore';
import { nextOfflineOpId, readEntityPage, reportsReadError } from '../../utils/offline/entityList';

const feedIdOf = (item: NotificationFeedItem): string => item.getId();

/** How an offline-path read relates to the items on screen. */
type OfflineReadMode = 'first' | 'next' | 'refresh';

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

  // --- Offline support (ON path only; inert with offline off) ---
  const itemsRef = useRef(state.items);
  itemsRef.current = state.items;
  const categoriesRef = useRef(state.categories);
  categoriesRef.current = state.categories;
  /** The offline state on screen: the next reconnect reads the feed again (D84). */
  const reloadOnConnectRef = useRef(false);
  const errorViewRef = useRef(false);
  errorViewRef.current = state.screenState === 'error' && state.items.length === 0;
  /** The current offline read; a category switch, refresh or re-init supersedes it. */
  const offlineOpRef = useRef('');
  /** The offline read whose server phase is still pending (one at a time per request). */
  const offlineInFlightRef = useRef<string | null>(null);
  const latestFetchNextRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const deferFetchNext = useDeferredLoadMore(
    () => latestFetchNextRef.current(),
    offlineInFlightRef
  );
  const lifecycleReloadRef = useRef<() => void>(() => undefined);
  const offlineUsedRef = useOfflineListLifecycle({
    onSessionEnd: () => {
      offlineOpRef.current = nextOfflineOpId('session');
      offlineInFlightRef.current = null;
      managerRef.current = null;
      deliveredItemIds.current.clear();
      dispatch({ type: 'RESET' });
    },
    onCacheReset: () => {
      lifecycleReloadRef.current();
    },
    // A user switch, or a login after the logout that cleared this list:
    // read it for whoever is signed in now, instead of staying on the blank
    // frame `onSessionEnd` left until this list is remounted (F1).
    onLogin: () => {
      lifecycleReloadRef.current();
    },
  });

  /**
   * Offline path: one two-phase page read. Cached items paint first; the
   * server page replaces the same slice in place, deduped by item id; only
   * server items are reported delivered. D84: a failed read with nothing on screen is the
   * error screen (offline: "Connect to load notifications") and reports to `onError`; items
   * on screen stay, and only a real error reports (offline is silent).
   */
  const readOffline = useCallback(
    (manager: CometChatNotificationFeedManager, mode: OfflineReadMode) => {
      offlineUsedRef.current = true;
      const opId = nextOfflineOpId('feed');
      offlineOpRef.current = opId;
      // One read at a time per request: a second concurrent read supersedes
      // this one's op id, so its server page would be dropped, and the SDK
      // answers the second one empty (BEH-SNAP-14), ending the feed early.
      offlineInFlightRef.current = opId;
      const settle = () => {
        if (offlineInFlightRef.current === opId) offlineInFlightRef.current = null;
      };
      if (mode !== 'next') reloadOnConnectRef.current = false;
      const request = manager.getRequest();
      if (!request) {
        settle();
        dispatch({
          type: 'OFFLINE_PAGE',
          page: { phase: 'server', rows: [], refresh: false, hasMore: false },
        });
        return Promise.resolve();
      }
      const shownBefore = new Set(itemsRef.current.map(feedIdOf));
      return readEntityPage<NotificationFeedItem>(
        {
          request,
          kind: 'notificationFeed',
          refresh: mode === 'refresh',
          idOf: feedIdOf,
          isStale: () => offlineOpRef.current !== opId,
          shown: () => itemsRef.current,
          // As today: a later page that brings nothing new ends the feed.
          hasMoreOf: page =>
            mode === 'next' ? page.some(item => !shownBefore.has(feedIdOf(item))) : page.length > 0,
        },
        {
          onPage: page => {
            if (page.phase === 'server') settle();
            dispatch({ type: 'OFFLINE_PAGE', page });
            if (page.phase === 'server') reportDeliveredBatch([...page.rows]);
          },
          onError: (error, notConnected, hasMore) => {
            settle();
            if (mode !== 'next') {
              // D84: nothing on screen reports every error, "not connected" included; over
              // items only a real error does (offline is silent).
              if (reportsReadError(notConnected, itemsRef.current.length > 0, false, false)) {
                handleError(error);
              }
              reloadOnConnectRef.current = notConnected && itemsRef.current.length === 0;
            } else if (!notConnected) {
              console.warn('[NotificationFeed] Pagination error:', error);
            }
            dispatch({
              type: 'OFFLINE_PAGE_ERROR',
              notConnected,
              hasMore,
              paginating: mode === 'next',
            });
          },
        }
      ).finally(settle);
    },
    [handleError, reportDeliveredBatch, offlineUsedRef]
  );

  // --- Initialize & fetch ---
  const initializeAndFetch = useCallback(
    async (category: string | null, offline?: { on: boolean; refresh: boolean }) => {
      if (offline?.on ?? isOfflineOn()) {
        // Offline path: a refresh keeps the items on screen through the re-read.
        const refreshing = offline?.refresh === true && itemsRef.current.length > 0;
        offlineOpRef.current = nextOfflineOpId('feed');
        dispatch({ type: 'SET_LOADING_MORE', isLoadingMore: false });
        if (!refreshing) dispatch({ type: 'SET_SCREEN_STATE', screenState: 'loading' });
        const offlineManager = new CometChatNotificationFeedManager();
        offlineManager.initFeedRequestBuilder(
          category,
          notificationFeedRequestBuilder ?? undefined
        );
        managerRef.current = offlineManager;
        // The chips load beside the feed, never ahead of it (a feed read waiting on
        // them would sit on the shimmer offline). A read that comes back empty, as
        // every offline failure does, leaves the chips already on screen alone.
        void CometChatNotificationFeedManager.fetchCategories(
          notificationCategoriesRequestBuilder
        ).then(offlineCategories => {
          // Gone (logout, unmount) before the categories came back: nothing to fill.
          if (managerRef.current === null) return;
          if (offlineCategories.length === 0 && categoriesRef.current.length > 0) return;
          dispatch({ type: 'SET_CATEGORIES', categories: offlineCategories });
        });
        await readOffline(offlineManager, refreshing ? 'refresh' : 'first');
        const offlineCount = await CometChatNotificationFeedManager.fetchUnreadCount();
        if (offlineCount !== null) dispatch({ type: 'SET_UNREAD_COUNT', count: offlineCount });
        return;
      }

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
      if (count !== null) dispatch({ type: 'SET_UNREAD_COUNT', count });
    },
    [
      notificationFeedRequestBuilder,
      notificationCategoriesRequestBuilder,
      handleError,
      reportDeliveredBatch,
      readOffline,
    ]
  );

  lifecycleReloadRef.current = () => {
    void initializeAndFetch(activeCategoryRef.current);
  };

  // D84: an offline state reads again once on reconnect.
  useReloadOnReconnect(
    () => errorViewRef.current && reloadOnConnectRef.current,
    () => {
      reloadOnConnectRef.current = false;
      lifecycleReloadRef.current();
    }
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
      // A failed poll keeps the count on screen.
      if (count !== null) dispatch({ type: 'SET_UNREAD_COUNT', count });
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

    if (isOfflineOn()) {
      // `isLoadingMore` is false through the first read (its shimmer is the
      // screen state), so a sentinel crossed while that read's cached page was
      // on screen used to start a second read on the same request: the first
      // read's server page was then dropped, its items never reported
      // delivered, and the feed could stop paging. The ask is kept and runs
      // once the pending read lands (never dropped).
      if (offlineInFlightRef.current) {
        deferFetchNext();
        return;
      }
      dispatch({ type: 'SET_LOADING_MORE', isLoadingMore: true });
      dispatch({ type: 'SET_PAGINATION_ERROR', paginationError: false });
      await readOffline(managerRef.current, 'next');
      return;
    }

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
  }, [state.isLoadingMore, state.hasMorePages, reportDeliveredBatch, readOffline, deferFetchNext]);
  latestFetchNextRef.current = fetchNextPage;

  // --- Refresh ---
  const refresh = useCallback(async () => {
    if (state.isRefreshing) return;
    dispatch({ type: 'SET_REFRESHING', isRefreshing: true });
    deliveredItemIds.current.clear();
    if (isOfflineOn()) {
      // Offline path: re-read two-phase into the items on screen, no blank.
      await initializeAndFetch(activeCategoryRef.current, { on: true, refresh: true });
      dispatch({ type: 'SET_REFRESHING', isRefreshing: false });
      return;
    }
    await initializeAndFetch(activeCategoryRef.current, { on: false, refresh: false });
    dispatch({ type: 'SET_REFRESHING', isRefreshing: false });
  }, [state.isRefreshing, initializeAndFetch]);

  // --- Switch category ---
  const switchCategory = useCallback(
    (category: string | null) => {
      if (isOfflineOn()) {
        // Offline path: as today, plus the previous category's late callbacks
        // are dropped (a new read supersedes them).
        activeCategoryRef.current = category;
        dispatch({ type: 'SET_ACTIVE_CATEGORY', category });
        dispatch({ type: 'SET_ITEMS', items: [] });
        dispatch({ type: 'SET_HAS_MORE_PAGES', hasMorePages: true });
        dispatch({ type: 'SET_LOADING_MORE', isLoadingMore: false });
        deliveredItemIds.current.clear();
        const offlineManager = new CometChatNotificationFeedManager();
        offlineManager.initFeedRequestBuilder(
          category,
          notificationFeedRequestBuilder ?? undefined
        );
        managerRef.current = offlineManager;
        dispatch({ type: 'SET_SCREEN_STATE', screenState: 'loading' });
        void readOffline(offlineManager, 'first');
        return;
      }
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
    [notificationFeedRequestBuilder, handleError, reportDeliveredBatch, readOffline]
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
    ...(state.connectToLoad !== undefined && { connectToLoad: state.connectToLoad }),
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
