import React from 'react';
import type { CometChatMessageHeaderTitleProps } from './CometChatMessageHeader.types';
import { useCometChatMessageHeaderContext } from './CometChatMessageHeader.context';
import './CometChatMessageHeader.css';

/**
 * CometChatMessageHeaderTitle — displays the user or group name.
 *
 * Text is truncated with ellipsis when it overflows.
 */
export const CometChatMessageHeaderTitle: React.FC<CometChatMessageHeaderTitleProps> = ({
  className,
}) => {
  const { displayName } = useCometChatMessageHeaderContext();

  const rootClasses = ['cometchat-message-header__title-wrapper', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
      <span className={'cometchat-message-header__title'} title={displayName}>
        {displayName}
      </span>
    </div>
  );
};

CometChatMessageHeaderTitle.displayName = 'CometChatMessageHeaderTitle';
