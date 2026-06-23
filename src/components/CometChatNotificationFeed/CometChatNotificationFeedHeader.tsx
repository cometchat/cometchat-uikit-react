import React from 'react';
import { useCometChatNotificationFeedContext } from './CometChatNotificationFeed.context';
import type { CometChatNotificationFeedHeaderProps } from './CometChatNotificationFeed.types';
import './CometChatNotificationFeed.css';

/**
 * CometChatNotificationFeedHeader — Header with title, back button, and mark-all-read.
 */
export const CometChatNotificationFeedHeader: React.FC<CometChatNotificationFeedHeaderProps> = ({
  title: titleProp,
  showBackButton: showBackButtonProp,
  onBackPress: onBackPressProp,
  children,
}) => {
  const ctx = useCometChatNotificationFeedContext();
  const displayTitle = titleProp ?? ctx.title;
  const showBack = showBackButtonProp ?? ctx.showBackButton;
  const handleBackPress = onBackPressProp ?? ctx.onBackPress;

  if (!ctx.showHeader) return null;

  return (
    <div className="cometchat-notification-feed__header">
      {children ?? (
        <>
          <div className="cometchat-notification-feed__header-left">
            {showBack && (
              <div
                className="cometchat-notification-feed__header-back"
                onClick={handleBackPress}
                role="button"
                tabIndex={0}
                aria-label="Go back"
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') handleBackPress?.();
                }}
              />
            )}
            <h2 className="cometchat-notification-feed__header-title">{displayTitle}</h2>
          </div>
        </>
      )}
    </div>
  );
};

CometChatNotificationFeedHeader.displayName = 'CometChatNotificationFeed.Header';
