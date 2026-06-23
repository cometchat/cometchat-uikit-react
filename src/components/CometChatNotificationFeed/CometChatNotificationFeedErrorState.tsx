import React from 'react';
import { useCometChatNotificationFeedContext } from './CometChatNotificationFeed.context';
import type { CometChatNotificationFeedErrorStateProps } from './CometChatNotificationFeed.types';
import errorStateIcon from '../../assets/list_error_state_icon.svg';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatNotificationFeed.css';

/**
 * CometChatNotificationFeedErrorState — Error state view.
 */
export const CometChatNotificationFeedErrorState: React.FC<
  CometChatNotificationFeedErrorStateProps
> = ({ children }) => {
  const { screenState, refresh } = useCometChatNotificationFeedContext();
  const { getLocalizedString } = useLocale();

  if (screenState !== 'error') return null;

  return (
    <div className="cometchat-notification-feed__error" role="alert">
      {children ?? (
        <>
          <div className="cometchat-notification-feed__error-illustration" aria-hidden="true">
            <img
              src={errorStateIcon}
              alt=""
              className="cometchat-notification-feed__error-illustration-img"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="cometchat-notification-feed__error-text-container">
            <p className="cometchat-notification-feed__error-title">
              {getLocalizedString('notifications_error_title')}
            </p>
            <p className="cometchat-notification-feed__error-subtitle">
              {getLocalizedString('notifications_error_subtitle')}
            </p>
          </div>
          <button
            className="cometchat-notification-feed__error-retry-button"
            onClick={() => void refresh()}
            aria-label="Retry loading notifications"
          >
            {getLocalizedString('retry')}
          </button>
        </>
      )}
    </div>
  );
};

CometChatNotificationFeedErrorState.displayName = 'CometChatNotificationFeed.ErrorState';
