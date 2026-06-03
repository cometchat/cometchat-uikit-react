import React from 'react';
import type { CometChatConversationSummaryErrorProps } from './CometChatConversationSummary.types';
import { useCometChatConversationSummaryContext } from './CometChatConversationSummary.context';
import './CometChatConversationSummary.css';

const DEFAULT_ERROR_MESSAGE = 'Looks like something went wrong';

/**
 * Error state view for conversation summary.
 * Only renders when context state is 'error'.
 */
export const CometChatConversationSummaryError: React.FC<
  CometChatConversationSummaryErrorProps
> = ({ message, onRetry, className, children }) => {
  const { state, retry } = useCometChatConversationSummaryContext();

  if (state !== 'error') return null;

  const errorBase = 'cometchat-conversation-summary__error-view';
  const errorClass = className ? `${errorBase} ${className}` : errorBase;

  const handleRetry = onRetry ?? retry;

  if (children) {
    return (
      <div className={errorClass} role="alert">
        {children}
      </div>
    );
  }

  return (
    <div className={errorClass} role="alert">
      <span>{message ?? DEFAULT_ERROR_MESSAGE}</span>
      <button
        type="button"
        className={'cometchat-conversation-summary__error-retry'}
        onClick={handleRetry}
      >
        Retry
      </button>
    </div>
  );
};
