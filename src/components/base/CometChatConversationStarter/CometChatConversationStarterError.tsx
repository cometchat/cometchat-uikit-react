import React from 'react';
import type { CometChatConversationStarterErrorProps } from './CometChatConversationStarter.types';
import { useCometChatConversationStarterContext } from './CometChatConversationStarter.context';
import './CometChatConversationStarter.css';

const DEFAULT_ERROR_MESSAGE = 'Failed to load conversation starters.';

/**
 * Error state view for conversation starters.
 * Only renders when context state is 'error'.
 */
export const CometChatConversationStarterError: React.FC<
  CometChatConversationStarterErrorProps
> = ({ message, onRetry, className, children }) => {
  const { state, retry } = useCometChatConversationStarterContext();

  if (state !== 'error') return null;

  const errorBase = 'cometchat-conversation-starter__error-view';
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
        className={'cometchat-conversation-starter__error-retry'}
        onClick={handleRetry}
      >
        Retry
      </button>
    </div>
  );
};
