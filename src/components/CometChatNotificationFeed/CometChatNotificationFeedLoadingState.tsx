import React from 'react';
import { useCometChatNotificationFeedContext } from './CometChatNotificationFeed.context';
import type { CometChatNotificationFeedLoadingStateProps } from './CometChatNotificationFeed.types';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatNotificationFeed.css';

/**
 * CometChatNotificationFeedLoadingState — Loading state with spinner.
 *
 * Reads screenState from context and only renders when screenState === 'loading'.
 */
export const CometChatNotificationFeedLoadingState: React.FC<
  CometChatNotificationFeedLoadingStateProps
> = ({ children }) => {
  const { screenState } = useCometChatNotificationFeedContext();
  const { getLocalizedString } = useLocale();

  if (screenState !== 'loading') return null;

  return (
    <div
      className="cometchat-notification-feed__loading"
      role="status"
      aria-busy="true"
      aria-label="Loading notifications"
    >
      {children ?? (
        <>
          <div className="cometchat-notification-feed__loading-spinner" />
          <p className="cometchat-notification-feed__loading-text">
            {getLocalizedString('loading')}
          </p>
        </>
      )}
    </div>
  );
};

CometChatNotificationFeedLoadingState.displayName = 'CometChatNotificationFeed.LoadingState';
