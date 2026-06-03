import React from 'react';
import type { CometChatMessageInformationLoadingStateProps } from './CometChatMessageInformation.types';
import './CometChatMessageInformation.css';

/**
 * CometChatMessageInformation.LoadingState — spinner loading indicator.
 */
export const CometChatMessageInformationLoadingState: React.FC<
  CometChatMessageInformationLoadingStateProps
> = ({ className }) => {
  const loadingClass = ['cometchat-message-information__loading', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={loadingClass} role="status" aria-live="polite">
      <div className={'cometchat-message-information__spinner'} />
    </div>
  );
};
