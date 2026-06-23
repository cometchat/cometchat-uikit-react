import React, { useCallback, useMemo } from 'react';
import { useCometChatNotificationFeedContext } from './CometChatNotificationFeed.context';
import { CometChatDate } from '../base/CometChatDate';
import { CometChatCardView } from '@cometchat/cards-react';
import type { CometChatNotificationFeedItemProps } from './CometChatNotificationFeed.types';
import './CometChatNotificationFeed.css';

/**
 * CometChatNotificationFeedItem — Individual feed item with card rendering.
 *
 * Uses CometChatCardView from @cometchat/cards-react to render notification
 * card JSON into HTML — same approach as v6.
 */
export const CometChatNotificationFeedItem: React.FC<CometChatNotificationFeedItemProps> = ({
  item,
  cardThemeMode: cardThemeModeProp,
  cardThemeOverride: cardThemeOverrideProp,
}) => {
  const ctx = useCometChatNotificationFeedContext();
  const themeMode = cardThemeModeProp ?? ctx.cardThemeMode;
  const themeOverride = cardThemeOverrideProp ?? ctx.cardThemeOverride;

  const handleClick = useCallback(() => {
    ctx.reportClicked(item);
    ctx.onItemClick?.(item);
  }, [ctx, item]);

  // Register with visibility tracker for viewed/read engagement
  const observeRef = useCallback(
    (el: HTMLDivElement | null) => {
      ctx.observeItem(el, item);
    },
    [ctx, item]
  );

  // Prepare card JSON string
  const cardJson = useMemo(() => {
    try {
      const content = item.getContent();
      return typeof content === 'string' ? content : JSON.stringify(content);
    } catch {
      return '';
    }
  }, [item]);

  // Handle card action
  const handleCardAction = useCallback(
    (event: unknown) => {
      const evt = event as { action?: unknown };
      if (evt.action) {
        ctx.reportClicked(item);
        ctx.onActionClick?.(
          item,
          evt.action as Parameters<NonNullable<typeof ctx.onActionClick>>[1]
        );
      }
    },
    [ctx, item]
  );

  // Render card content
  let cardContent: React.ReactNode = null;
  try {
    if (cardJson) {
      cardContent = (
        <CometChatCardView
          cardJson={cardJson}
          themeMode={themeMode}
          onAction={handleCardAction}
          themeOverride={themeOverride}
        />
      );
    }
  } catch {
    // Fallback if card rendering fails
    const content = item.getContent() as Record<string, unknown> | undefined;
    const fallbackText = (content?.fallbackText as string) || 'Unable to display notification';
    cardContent = <div className="cometchat-notification-feed__card-fallback">{fallbackText}</div>;
  }

  return (
    <div
      ref={observeRef}
      className={`cometchat-notification-feed__item ${
        item.getReadAt() === null ? 'cometchat-notification-feed__item--unread' : ''
      }`}
      data-feed-item-id={item.getId()}
      onClick={handleClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
      role="article"
      tabIndex={0}
      aria-label={`Notification from ${item.getCategory()}`}
    >
      {item.getReadAt() === null && (
        <div className="cometchat-notification-feed__unread-indicator" />
      )}
      <div className="cometchat-notification-feed__item-meta">
        <span className="cometchat-notification-feed__item-category">{item.getCategory()}</span>
        <span className="cometchat-notification-feed__item-time">
          <CometChatDate
            timestamp={item.getSentAt()}
            variant="caption2"
            formatConfig={{
              today: 'hh:mm A',
              yesterday: 'Yesterday',
              lastWeek: 'DD/MM/YYYY',
              otherDays: 'DD/MM/YYYY',
            }}
          />
        </span>
      </div>
      <div
        className="cometchat-notification-feed__card-container"
        onClick={e => {
          const target = e.target as HTMLElement;
          if (target.closest('button, a, [role="button"], input, select')) {
            e.stopPropagation();
          }
        }}
        role="presentation"
      >
        {cardContent}
      </div>
    </div>
  );
};

CometChatNotificationFeedItem.displayName = 'CometChatNotificationFeed.Item';
