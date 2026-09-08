import React from 'react';
import type { CometChatThreadHeaderTopBarProps } from './CometChatThreadHeader.types';
import { CometChatThreadHeaderTitle } from './CometChatThreadHeaderTitle';
import { CometChatThreadHeaderSenderName } from './CometChatThreadHeaderSenderName';
import { CometChatThreadHeaderCloseButton } from './CometChatThreadHeaderCloseButton';
import { CometChatThreadHeaderSubscriptionToggle } from './CometChatThreadHeaderSubscriptionToggle';
import './CometChatThreadHeader.css';

/**
 * CometChatThreadHeaderTopBar — top bar with title, sender name, subscription
 * bell, and close button.
 *
 * If no children are provided, renders the default layout:
 * Content (Title + SenderName) + SubscriptionToggle + CloseButton.
 */
export const CometChatThreadHeaderTopBar: React.FC<CometChatThreadHeaderTopBarProps> = ({
  className,
  children,
}) => {
  const topBarClasses = ['cometchat-thread-header__top-bar', className].filter(Boolean).join(' ');

  return (
    <div className={topBarClasses}>
      {children ?? (
        <>
          <div className={'cometchat-thread-header__content'}>
            <CometChatThreadHeaderTitle />
            <CometChatThreadHeaderSenderName />
          </div>
          <CometChatThreadHeaderSubscriptionToggle />
          <CometChatThreadHeaderCloseButton />
        </>
      )}
    </div>
  );
};

CometChatThreadHeaderTopBar.displayName = 'CometChatThreadHeaderTopBar';
