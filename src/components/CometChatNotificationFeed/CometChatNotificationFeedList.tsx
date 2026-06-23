import React, { useCallback, useRef } from 'react';
import { useCometChatNotificationFeedContext } from './CometChatNotificationFeed.context';
import { CometChatNotificationFeedItem } from './CometChatNotificationFeedItem';
import type {
  CometChatNotificationFeedListProps,
  TimestampGroup,
} from './CometChatNotificationFeed.types';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatNotificationFeed.css';

/**
 * CometChatNotificationFeedList — Feed list with infinite scroll.
 *
 * Renders the scrollable content area with the feed items inside.
 * Visibility tracking is handled by each Item registering itself via context.
 */
export const CometChatNotificationFeedList: React.FC<CometChatNotificationFeedListProps> = ({
  itemView,
}) => {
  const ctx = useCometChatNotificationFeedContext();
  const { getLocalizedString } = useLocale();
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle infinite scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const threshold = 100;
      const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold;

      if (isNearBottom && !ctx.isLoadingMore && ctx.hasMorePages) {
        void ctx.fetchNextPage();
      }
    },
    [ctx]
  );

  // Don't render list if no items to show
  if (ctx.screenState !== 'loaded' && ctx.items.length === 0) return null;

  return (
    <div
      ref={contentRef}
      className="cometchat-notification-feed__content"
      onScroll={handleScroll}
      aria-busy={ctx.screenState === 'loading'}
    >
      <div role="feed" aria-label="Notification feed" aria-busy={ctx.isLoadingMore}>
        {ctx.groupedItems.map((group: TimestampGroup) => (
          <div key={group.label}>
            {group.items.map(item =>
              itemView ? (
                <React.Fragment key={item.getId()}>{itemView(item)}</React.Fragment>
              ) : (
                <CometChatNotificationFeedItem key={item.getId()} item={item} />
              )
            )}
          </div>
        ))}

        {/* Loading more indicator */}
        {ctx.isLoadingMore && (
          <div className="cometchat-notification-feed__loading-more" aria-busy="true">
            <div className="cometchat-notification-feed__loading-more-spinner" />
            <span className="cometchat-notification-feed__loading-more-text">
              {getLocalizedString('loading')}
            </span>
          </div>
        )}

        {/* Pagination error */}
        {ctx.paginationError && !ctx.isLoadingMore && (
          <div
            className="cometchat-notification-feed__pagination-error"
            onClick={() => {
              ctx.retryPagination();
            }}
            role="button"
            tabIndex={0}
            aria-label="Tap to retry loading more"
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') ctx.retryPagination();
            }}
          >
            <div className="cometchat-notification-feed__pagination-error-icon" />
            <div className="cometchat-notification-feed__pagination-error-text">
              <p className="cometchat-notification-feed__pagination-error-message">
                {getLocalizedString('notifications_pagination_error')}
              </p>
              <p className="cometchat-notification-feed__pagination-error-retry">
                {getLocalizedString('notifications_tap_to_retry')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

CometChatNotificationFeedList.displayName = 'CometChatNotificationFeed.List';
