import React, { useCallback, useEffect, useRef, useState } from "react";
import { NotificationFeedViewModel } from "./CometChatNotificationFeedViewModel";
import { VisibilityTracker } from "./utils";
import { CometChatDate } from "../BaseComponents/CometChatDate/CometChatDate";
import { CometChatCardView } from "@cometchat/cards-react";
import {
  CometChatNotificationFeedProps,
  NotificationFeedItem,
  NotificationFeedState,
  NotificationCategory,
  TimestampGroup,
  CardAction,
} from "./types";
import emptyInboxIcon from "./assets/empty-inbox.svg";
import errorStateIcon from "../../assets/list_error_state_icon.svg";

/**
 * CometChatNotificationFeed — Main notification feed component.
 * Displays campaign/promotional notifications in a scrollable list with
 * card rendering, real-time updates, and engagement reporting.
 */
export function CometChatNotificationFeed(props: CometChatNotificationFeedProps) {
  const {
    title = "Notifications",
    showHeader = true,
    showBackButton = false,
    showFilterChips = true,
    headerView,
    scrollToItemId,
    notificationFeedRequestBuilder,
    notificationCategoriesRequestBuilder,
    onItemClick,
    onActionClick,
    onError,
    onBackPress,
    emptyStateView,
    errorStateView,
    loadingStateView,
    style,
    cardThemeMode = "auto",
    cardThemeOverride,
  } = props;

  const [state, setState] = useState<NotificationFeedState>({
    items: [],
    groupedItems: [],
    categories: [],
    activeCategory: null,
    totalUnreadCount: 0,
    categoryUnreadCounts: new Map(),
    screenState: "loading",
    isLoadingMore: false,
    isRefreshing: false,
    isOffline: false,
    error: null,
    hasMorePages: true,
    paginationError: false,
  });

  const viewModelRef = useRef<NotificationFeedViewModel | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const visibilityTrackerRef = useRef<VisibilityTracker | null>(null);
  const itemRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());

  // Initialize ViewModel
  useEffect(() => {
    const vm = new NotificationFeedViewModel(
      (newState) => setState({ ...newState }),
      notificationFeedRequestBuilder,
      notificationCategoriesRequestBuilder
    );
    viewModelRef.current = vm;
    vm.init();

    return () => {
      vm.dispose();
    };
  }, []);

  // Initialize Visibility Tracker
  useEffect(() => {
    const tracker = new VisibilityTracker(
      (item) => viewModelRef.current?.reportViewed(item),
      (item) => viewModelRef.current?.reportRead(item)
    );
    tracker.init(contentRef.current);
    visibilityTrackerRef.current = tracker;

    return () => {
      tracker.dispose();
    };
  }, []);

  // Report errors to parent
  useEffect(() => {
    if (state.error && onError) {
      onError(state.error);
    }
  }, [state.error, onError]);

  // Handle infinite scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const threshold = 100;
    const isNearBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < threshold;

    if (isNearBottom && !state.isLoadingMore && state.hasMorePages) {
      viewModelRef.current?.fetchNextPage();
    }
  }, [state.isLoadingMore, state.hasMorePages]);

  // Handle item click
  const handleItemClick = useCallback(
    (item: NotificationFeedItem) => {
      viewModelRef.current?.reportClicked(item);
      onItemClick?.(item);
    },
    [onItemClick]
  );

  // Handle card action
  const handleCardAction = useCallback(
    (item: NotificationFeedItem, action: CardAction) => {
      viewModelRef.current?.reportClicked(item);
      onActionClick?.(item, action);
    },
    [onActionClick]
  );

  // Observe item for visibility tracking
  const observeItem = useCallback(
    (element: HTMLDivElement | null, item: NotificationFeedItem) => {
      if (element && visibilityTrackerRef.current) {
        itemRefsMap.current.set(item.getId(), element);
        visibilityTrackerRef.current.observe(element, item);
      }
    },
    []
  );

  // Handle retry
  const handleRetry = useCallback(() => {
    viewModelRef.current?.refresh();
  }, []);

  // Handle mark all as read
  const handleMarkAllRead = useCallback(() => {
    viewModelRef.current?.markAllAsRead();
  }, []);

  // --- Render Functions ---

  // Handle chip click
  const handleChipClick = useCallback(
    (categoryId: string | null) => {
      viewModelRef.current?.switchCategory(categoryId);
    },
    []
  );

  const renderHeader = () => {
    if (!showHeader) return null;
    if (headerView) return headerView;

    return (
      <div className="cometchat-notification-feed__header">
        <div className="cometchat-notification-feed__header-left">
          {showBackButton && (
            <div
              className="cometchat-notification-feed__header-back"
              onClick={onBackPress}
              role="button"
              aria-label="Go back"
            />
          )}
          <h2
            className="cometchat-notification-feed__header-title"
            style={{
              color: style?.headerTitleColor,
              font: style?.headerTitleFont,
            }}
          >
            {title}
          </h2>
        </div>
        {state.totalUnreadCount > 0 && (
          <button
            className="cometchat-notification-feed__mark-all-read"
            onClick={handleMarkAllRead}
            aria-label="Mark all notifications as read"
          >
            Mark all read
          </button>
        )}
      </div>
    );
  };

  const renderFilterChips = () => {
    if (!showFilterChips) return null;
    const isAllActive = state.activeCategory === null;
    const allChipHasBadge = state.totalUnreadCount > 0;

    return (
      <div
        className="cometchat-notification-feed__chips"
        role="tablist"
        aria-label="Filter notifications by category"
      >
        {/* "All" chip — always present */}
        <button
          className={`cometchat-notification-feed__chip ${
            isAllActive
              ? "cometchat-notification-feed__chip--active"
              : allChipHasBadge
              ? "cometchat-notification-feed__chip--inactive-with-badge"
              : "cometchat-notification-feed__chip--inactive"
          }`}
          onClick={() => handleChipClick(null)}
          role="tab"
          aria-selected={isAllActive}
          style={{
            backgroundColor: isAllActive
              ? style?.chipActiveBackgroundColor
              : undefined,
            color: isAllActive ? style?.chipActiveTextColor : undefined,
            borderColor: !isAllActive ? style?.chipBorderColor : undefined,
          }}
        >
          <span className="cometchat-notification-feed__chip-text">All</span>
          {state.totalUnreadCount > 0 && (
            <span
              className={`cometchat-notification-feed__chip-badge ${
                isAllActive
                  ? "cometchat-notification-feed__chip-badge--active"
                  : "cometchat-notification-feed__chip-badge--inactive"
              }`}
            >
              {state.totalUnreadCount > 99 ? "99+" : state.totalUnreadCount}
            </span>
          )}
        </button>

        {/* Category chips */}
        {state.categories.map((cat: NotificationCategory) => {
          const isActive = state.activeCategory === cat.label;
          const catCount = state.categoryUnreadCounts.get(cat.id) || 0;
          const hasBadge = catCount > 0;

          return (
            <button
              key={cat.id}
              className={`cometchat-notification-feed__chip ${
                isActive
                  ? "cometchat-notification-feed__chip--active"
                  : hasBadge
                  ? "cometchat-notification-feed__chip--inactive-with-badge"
                  : "cometchat-notification-feed__chip--inactive"
              }`}
              onClick={() => handleChipClick(cat.label)}
              role="tab"
              aria-selected={isActive}
              style={{
                backgroundColor: isActive
                  ? style?.chipActiveBackgroundColor
                  : undefined,
                color: isActive ? style?.chipActiveTextColor : undefined,
                borderColor: !isActive ? style?.chipBorderColor : undefined,
              }}
            >
              <span className="cometchat-notification-feed__chip-text">
                {cat.label}
              </span>
              {hasBadge && (
                <span
                  className={`cometchat-notification-feed__chip-badge ${
                    isActive
                      ? "cometchat-notification-feed__chip-badge--active"
                      : "cometchat-notification-feed__chip-badge--inactive"
                  }`}
                >
                  {catCount > 99 ? "99+" : catCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderLoading = () => {
    if (loadingStateView) return loadingStateView;

    return (
      <div className="cometchat-notification-feed__loading" aria-busy="true" aria-label="Loading notifications">
        <div className="cometchat-notification-feed__loading-spinner" />
        <p className="cometchat-notification-feed__loading-text">Loading...</p>
      </div>
    );
  };

  const renderEmpty = () => {
    if (emptyStateView) return emptyStateView;

    return (
      <div className="cometchat-notification-feed__empty">
        <div className="cometchat-notification-feed__empty-illustration">
          <img
            src={emptyInboxIcon}
            alt=""
            className="cometchat-notification-feed__empty-illustration-img"
          />
        </div>
        <div className="cometchat-notification-feed__empty-text-container">
          <p className="cometchat-notification-feed__empty-title">
            Nothing here yet
          </p>
          <p className="cometchat-notification-feed__empty-subtitle">
            New activity will appear here when available.
          </p>
        </div>
      </div>
    );
  };

  const renderError = () => {
    if (errorStateView) return errorStateView;

    return (
      <div className="cometchat-notification-feed__error">
        <div className="cometchat-notification-feed__error-illustration">
          <img
            src={errorStateIcon}
            alt=""
            className="cometchat-notification-feed__error-illustration-img"
          />
        </div>
        <div className="cometchat-notification-feed__error-text-container">
          <p className="cometchat-notification-feed__error-title">
            Oops!
          </p>
          <p className="cometchat-notification-feed__error-subtitle">
            Looks like something went wrong. Please try again.
          </p>
        </div>
        <button
          className="cometchat-notification-feed__error-retry-button"
          onClick={handleRetry}
          aria-label="Retry loading notifications"
        >
          Retry
        </button>
      </div>
    );
  };

  const renderFeedItem = (item: NotificationFeedItem) => {
    let cardContent: React.ReactNode = null;

    try {
      const content = item.getContent();
      const cardJson = typeof content === "string"
        ? content
        : JSON.stringify(content);
      cardContent = (
        <CometChatCardView
          cardJson={cardJson}
          themeMode={cardThemeMode}
          onAction={(event: any) => {
            if (event && event.action) {
              handleCardAction(item, event.action);
            }
          }}
          themeOverride={cardThemeOverride}
        />
      );
    } catch (error) {
      // Fallback if @cometchat/cards-react is not available or card is malformed
      const content = item.getContent() as any;
      const fallbackText = content?.fallbackText || "Unable to display notification";
      cardContent = (
        <div className="cometchat-notification-feed__card-fallback">
          {fallbackText}
        </div>
      );
    }

    return (
      <div
        key={item.getId()}
        className={`cometchat-notification-feed__item ${
          item.getReadAt() === null ? "cometchat-notification-feed__item--unread" : ""
        }`}
        data-feed-item-id={item.getId()}
        ref={(el) => el && observeItem(el, item)}
        onClick={() => handleItemClick(item)}
        role="article"
        aria-label={`Notification from ${item.getCategory()}`}
      >
        {item.getReadAt() === null && (
          <div
            className="cometchat-notification-feed__unread-indicator"
            style={{ background: style?.unreadIndicatorColor }}
          />
        )}
        <div className="cometchat-notification-feed__item-meta">
          <span className="cometchat-notification-feed__item-category">
            {item.getCategory()}
          </span>
          <span className="cometchat-notification-feed__item-time">
            <CometChatDate
              timestamp={item.getSentAt()}
              calendarObject={{
                today: "hh:mm A",
                yesterday: "Yesterday",
                otherDays: "DD/MM/YYYY",
              }}
            />
          </span>
        </div>
        <div
          className="cometchat-notification-feed__card-container"
          onClick={(e) => {
            // Only stop propagation if the click was on an interactive element (button, a, etc.)
            const target = e.target as HTMLElement;
            if (target.closest('button, a, [role="button"], input, select')) {
              e.stopPropagation();
            }
          }}
          style={{
            backgroundColor: style?.cardBackgroundColor,
            borderColor: style?.cardBorderColor,
            borderRadius: style?.cardBorderRadius,
            borderWidth: style?.cardBorderWidth,
            borderStyle: style?.cardBorderWidth ? "solid" : undefined,
          }}
        >
          {cardContent}
        </div>
      </div>
    );
  };

  const renderFeedList = () => {
    return (
      <div role="feed" aria-label="Notification feed" aria-busy={state.isLoadingMore}>
        {state.groupedItems.map((group: TimestampGroup) => (
          <div key={group.label}>
            {group.items.map((item) => renderFeedItem(item))}
          </div>
        ))}
        {state.isLoadingMore && (
          <div className="cometchat-notification-feed__loading-more" aria-busy="true">
            <div className="cometchat-notification-feed__loading-more-spinner" />
            <span className="cometchat-notification-feed__loading-more-text">Loading...</span>
          </div>
        )}
        {state.paginationError && !state.isLoadingMore && (
          <div
            className="cometchat-notification-feed__pagination-error"
            onClick={() => {
              viewModelRef.current?.retryPagination();
            }}
            role="button"
            aria-label="Tap to retry loading more"
          >
            <div className="cometchat-notification-feed__pagination-error-icon" />
            <div className="cometchat-notification-feed__pagination-error-text">
              <p className="cometchat-notification-feed__pagination-error-message">Couldn't load more</p>
              <p className="cometchat-notification-feed__pagination-error-retry">Tap to retry</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (state.screenState) {
      case "loading":
        return renderLoading();
      case "empty":
        return renderEmpty();
      case "error":
        return renderError();
      case "loaded":
        return renderFeedList();
      default:
        return null;
    }
  };

  // Scroll to specific item if scrollToItemId is provided
  useEffect(() => {
    if (scrollToItemId && state.screenState === "loaded") {
      const element = contentRef.current?.querySelector(
        `[data-feed-item-id="${scrollToItemId}"]`
      );
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [scrollToItemId, state.screenState]);

  return (
    <div
      className="cometchat-notification-feed"
      style={{
        backgroundColor: style?.backgroundColor,
        width: style?.width,
        height: style?.height,
      }}
    >
      {renderHeader()}
      {renderFilterChips()}
      {state.isOffline && (
        <div
          className="cometchat-notification-feed__connectivity-banner"
          role="alert"
          aria-live="polite"
        >
          You are offline. Showing cached notifications.
        </div>
      )}
      <div
        className="cometchat-notification-feed__content"
        ref={contentRef}
        onScroll={handleScroll}
        aria-busy={state.screenState === "loading"}
      >
        {renderContent()}
      </div>
    </div>
  );
}
