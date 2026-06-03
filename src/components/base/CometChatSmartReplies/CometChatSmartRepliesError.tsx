import React from 'react';
import type { CometChatSmartRepliesErrorProps } from './CometChatSmartReplies.types';
import { useCometChatSmartRepliesContext } from './CometChatSmartReplies.context';
import './CometChatSmartReplies.css';
import { useLocale } from '../../../context/locale/LocaleContext';

const DEFAULT_ERROR_MESSAGE = 'Looks like something went wrong';

/**
 * Error state view for smart replies.
 * Only renders when context state is 'error'.
 */
export const CometChatSmartRepliesError: React.FC<CometChatSmartRepliesErrorProps> = ({
  message,
  onRetry,
  className,
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const { state, retry } = useCometChatSmartRepliesContext();

  if (state !== 'error') return null;

  const errorBase = 'cometchat-smart-replies__error-view';
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
        className={'cometchat-smart-replies__error-retry'}
        aria-label={getLocalizedString('ai_smart_replies_error')}
        onClick={handleRetry}
      >
        Retry
      </button>
    </div>
  );
};
