import React from 'react';
import type { CometChatMessageInformationLoadingStateProps } from './CometChatMessageInformation.types';
import { useCometChatMessageInformationContext } from './CometChatMessageInformation.context';
import './CometChatMessageInformation.css';

/**
 * CometChatMessageInformation.LoadingState — spinner loading indicator.
 */
export const CometChatMessageInformationLoadingState: React.FC<
  CometChatMessageInformationLoadingStateProps
> = ({ className, children }) => {
  const { fetchState, userReceipts, oneOnOneReadAt, oneOnOneDeliveredAt } =
    useCometChatMessageInformationContext();

  // Shown only while the first load has nothing to show yet, wherever it is placed.
  const nothingYet = userReceipts.length === 0 && !oneOnOneReadAt && !oneOnOneDeliveredAt;
  if (fetchState !== 'loading' || !nothingYet) return null;

  const loadingClass = ['cometchat-message-information__loading', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={loadingClass} role="status" aria-live="polite">
      {children ?? <div className={'cometchat-message-information__spinner'} />}
    </div>
  );
};
