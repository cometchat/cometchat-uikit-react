import React from 'react';
import type { CometChatConversationSummaryLoadingProps } from './CometChatConversationSummary.types';
import { useCometChatConversationSummaryContext } from './CometChatConversationSummary.context';
import './CometChatConversationSummary.css';

/**
 * Shimmer loading state for conversation summary.
 * Only renders when context state is 'loading'.
 */
export const CometChatConversationSummaryLoading: React.FC<
  CometChatConversationSummaryLoadingProps
> = ({ count = 3, className, children }) => {
  const { state } = useCometChatConversationSummaryContext();

  if (state !== 'loading') return null;

  if (children) {
    return <>{children}</>;
  }

  const containerBase = 'cometchat-conversation-summary__shimmer-container';
  const containerClass = className ? `${containerBase} ${className}` : containerBase;

  return (
    <div className={containerClass}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={'cometchat-conversation-summary__shimmer-item'}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};
