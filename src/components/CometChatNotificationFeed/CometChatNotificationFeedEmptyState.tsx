import React from 'react';
import { useCometChatNotificationFeedContext } from './CometChatNotificationFeed.context';
import type { CometChatNotificationFeedEmptyStateProps } from './CometChatNotificationFeed.types';
import emptyInboxIcon from '../../assets/empty-inbox.svg';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatNotificationFeed.css';

/**
 * CometChatNotificationFeedEmptyState — Empty state when no notifications are available.
 */
export const CometChatNotificationFeedEmptyState: React.FC<
  CometChatNotificationFeedEmptyStateProps
> = ({ children }) => {
  const { screenState } = useCometChatNotificationFeedContext();
  const { getLocalizedString } = useLocale();

  if (screenState !== 'empty') return null;

  return (
    <div className="cometchat-notification-feed__empty" role="status">
      {children ?? (
        <>
          <div className="cometchat-notification-feed__empty-illustration" aria-hidden="true">
            <img
              src={emptyInboxIcon}
              alt=""
              className="cometchat-notification-feed__empty-illustration-img"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="cometchat-notification-feed__empty-text-container">
            <p className="cometchat-notification-feed__empty-title">
              {getLocalizedString('notifications_empty_title')}
            </p>
            <p className="cometchat-notification-feed__empty-subtitle">
              {getLocalizedString('notifications_empty_subtitle')}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

CometChatNotificationFeedEmptyState.displayName = 'CometChatNotificationFeed.EmptyState';
