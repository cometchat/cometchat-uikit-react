import React from 'react';
import type { ReactNode } from 'react';
import { useCometChatMessageListContext } from './CometChatMessageList.context';
import { useLocale } from '../../hooks/useLocale';
import { CometChatButton } from '../base/CometChatButton/CometChatButton';
import './CometChatMessageList.css';

export interface CometChatMessageListErrorStateProps {
  children?: ReactNode;
  onRetry?: () => void;
}

/**
 * CometChatMessageListErrorState — shown when message fetching fails.
 *
 * Context-aware: reads `isError` from the MessageList context and renders
 * nothing when the list is not in the error state.
 */
export const CometChatMessageListErrorState: React.FC<CometChatMessageListErrorStateProps> = ({
  children,
  onRetry,
}) => {
  const { isError, fetchPrevious } = useCometChatMessageListContext();
  const { getLocalizedString } = useLocale();

  if (!isError) return null;

  const handleRetry = onRetry ?? (() => void fetchPrevious());

  if (children) {
    return <div className={'cometchat-message-list__error-state'}>{children}</div>;
  }

  return (
    <div className={'cometchat-message-list__error-state'} role="alert">
      <div className={'cometchat-message-list__error-state-content'}>
        <div className={'cometchat-message-list__error-state-icon'} aria-hidden="true" />
        <p className={'cometchat-message-list__error-state-text'}>
          {getLocalizedString('component_error_retry')}
        </p>
        <CometChatButton.Root
          variant="primary"
          size="md"
          onClick={handleRetry}
          aria-label={getLocalizedString('error_boundary_retry')}
        >
          <CometChatButton.Text>{getLocalizedString('error_boundary_retry')}</CometChatButton.Text>
        </CometChatButton.Root>
      </div>
    </div>
  );
};

CometChatMessageListErrorState.displayName = 'CometChatMessageListErrorState';
