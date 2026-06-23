import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { CometChatNotificationFeedContext } from './CometChatNotificationFeed.context';
import { useCometChatNotificationFeed } from './useCometChatNotificationFeed';
import { CometChatNotificationFeedHeader } from './CometChatNotificationFeedHeader';
import { CometChatNotificationFeedFilterChips } from './CometChatNotificationFeedFilterChips';
import { CometChatNotificationFeedList } from './CometChatNotificationFeedList';
import { CometChatNotificationFeedEmptyState } from './CometChatNotificationFeedEmptyState';
import { CometChatNotificationFeedErrorState } from './CometChatNotificationFeedErrorState';
import { CometChatNotificationFeedLoadingState } from './CometChatNotificationFeedLoadingState';
import { VisibilityTracker } from './utils';
import type {
  CometChatNotificationFeedRootProps,
  CometChatNotificationFeedContextValue,
  NotificationFeedItem,
} from './CometChatNotificationFeed.types';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatNotificationFeed.css';

/**
 * CometChatNotificationFeedRoot — Provider + default layout.
 *
 * Wraps children with the CometChatNotificationFeed context. If no children are provided,
 * renders the default layout (Header + FilterChips + List + state views).
 */
export const CometChatNotificationFeedRoot: React.FC<CometChatNotificationFeedRootProps> = ({
  title: titleProp,
  showHeader = true,
  showBackButton = false,
  showFilterChips = true,
  notificationFeedRequestBuilder,
  notificationCategoriesRequestBuilder,
  onItemClick,
  onActionClick,
  onError,
  onBackPress,
  cardThemeMode = 'auto',
  cardThemeOverride,
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const title = titleProp ?? getLocalizedString('notifications_title');

  const hookReturn = useCometChatNotificationFeed({
    notificationFeedRequestBuilder,
    notificationCategoriesRequestBuilder,
    onError,
  });

  // Visibility tracker for engagement reporting (viewed/read)
  const visibilityTrackerRef = useRef<VisibilityTracker | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const tracker = new VisibilityTracker(
      (item: NotificationFeedItem) => {
        hookReturn.reportViewed(item);
      },
      (item: NotificationFeedItem) => {
        hookReturn.reportRead(item);
      }
    );
    // We'll init with null root — it observes relative to viewport
    tracker.init(null);
    visibilityTrackerRef.current = tracker;

    return () => {
      tracker.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Observe item — called by each Item component via context
  const observeItem = useCallback((element: HTMLDivElement | null, item: NotificationFeedItem) => {
    if (element && visibilityTrackerRef.current) {
      visibilityTrackerRef.current.observe(element, item);
    }
  }, []);

  const contextValue: CometChatNotificationFeedContextValue = useMemo(
    () => ({
      ...hookReturn,
      title,
      showHeader,
      showBackButton,
      showFilterChips,
      cardThemeMode,
      cardThemeOverride,
      onItemClick,
      onActionClick,
      onBackPress,
      observeItem,
    }),
    [
      hookReturn,
      title,
      showHeader,
      showBackButton,
      showFilterChips,
      cardThemeMode,
      cardThemeOverride,
      onItemClick,
      onActionClick,
      onBackPress,
      observeItem,
    ]
  );

  const hasChildren = React.Children.count(children) > 0;

  return (
    <CometChatNotificationFeedContext.Provider value={contextValue}>
      <div
        ref={contentRef}
        className="cometchat-notification-feed"
        role="region"
        aria-label="Notifications"
      >
        {hasChildren ? (
          children
        ) : (
          <>
            <CometChatNotificationFeedHeader />
            <CometChatNotificationFeedFilterChips />
            <CometChatNotificationFeedLoadingState />
            <CometChatNotificationFeedErrorState />
            <CometChatNotificationFeedEmptyState />
            {(hookReturn.screenState === 'loaded' || hookReturn.items.length > 0) && (
              <CometChatNotificationFeedList />
            )}
          </>
        )}
      </div>
    </CometChatNotificationFeedContext.Provider>
  );
};

CometChatNotificationFeedRoot.displayName = 'CometChatNotificationFeed.Root';
