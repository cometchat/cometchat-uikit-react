import React from 'react';
import { useCometChatNotificationFeedContext } from './CometChatNotificationFeed.context';
import type {
  CometChatNotificationFeedFilterChipsProps,
  NotificationCategory,
} from './CometChatNotificationFeed.types';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatNotificationFeed.css';

/**
 * CometChatNotificationFeedFilterChips — Category filter chips with unread badges.
 */
export const CometChatNotificationFeedFilterChips: React.FC<
  CometChatNotificationFeedFilterChipsProps
> = ({ children }) => {
  const ctx = useCometChatNotificationFeedContext();
  const { getLocalizedString } = useLocale();

  if (!ctx.showFilterChips) return null;

  const isAllActive = ctx.activeCategory === null;
  const allChipHasBadge = ctx.totalUnreadCount > 0;

  return (
    <div
      className="cometchat-notification-feed__chips"
      role="tablist"
      aria-label="Filter notifications by category"
    >
      {children ?? (
        <>
          {/* "All" chip */}
          <button
            className={`cometchat-notification-feed__chip ${
              isAllActive
                ? 'cometchat-notification-feed__chip--active'
                : allChipHasBadge
                  ? 'cometchat-notification-feed__chip--inactive-with-badge'
                  : 'cometchat-notification-feed__chip--inactive'
            }`}
            onClick={() => {
              ctx.switchCategory(null);
            }}
            role="tab"
            aria-selected={isAllActive}
          >
            <span className="cometchat-notification-feed__chip-text">
              {getLocalizedString('notifications_filter_all')}
            </span>
            {ctx.totalUnreadCount > 0 && (
              <span
                className={`cometchat-notification-feed__chip-badge ${
                  isAllActive
                    ? 'cometchat-notification-feed__chip-badge--active'
                    : 'cometchat-notification-feed__chip-badge--inactive'
                }`}
              >
                {ctx.totalUnreadCount > 99 ? '99+' : ctx.totalUnreadCount}
              </span>
            )}
          </button>

          {/* Category chips */}
          {ctx.categories.map((cat: NotificationCategory) => {
            const isActive = ctx.activeCategory === cat.label;
            const catCount = ctx.categoryUnreadCounts.get(cat.id) ?? 0;
            const hasBadge = catCount > 0;

            return (
              <button
                key={cat.id}
                className={`cometchat-notification-feed__chip ${
                  isActive
                    ? 'cometchat-notification-feed__chip--active'
                    : hasBadge
                      ? 'cometchat-notification-feed__chip--inactive-with-badge'
                      : 'cometchat-notification-feed__chip--inactive'
                }`}
                onClick={() => {
                  ctx.switchCategory(cat.label);
                }}
                role="tab"
                aria-selected={isActive}
              >
                <span className="cometchat-notification-feed__chip-text">{cat.label}</span>
                {hasBadge && (
                  <span
                    className={`cometchat-notification-feed__chip-badge ${
                      isActive
                        ? 'cometchat-notification-feed__chip-badge--active'
                        : 'cometchat-notification-feed__chip-badge--inactive'
                    }`}
                  >
                    {catCount > 99 ? '99+' : catCount}
                  </span>
                )}
              </button>
            );
          })}
        </>
      )}
    </div>
  );
};

CometChatNotificationFeedFilterChips.displayName = 'CometChatNotificationFeed.FilterChips';
