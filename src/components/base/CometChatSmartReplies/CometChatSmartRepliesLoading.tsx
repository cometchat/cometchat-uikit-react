import React from 'react';
import type { CometChatSmartRepliesLoadingProps } from './CometChatSmartReplies.types';
import { useCometChatSmartRepliesContext } from './CometChatSmartReplies.context';
import './CometChatSmartReplies.css';

/**
 * Shimmer loading state for smart replies.
 * Only renders when context state is 'loading'.
 */
export const CometChatSmartRepliesLoading: React.FC<CometChatSmartRepliesLoadingProps> = ({
  count = 3,
  className,
  children,
}) => {
  const { state } = useCometChatSmartRepliesContext();

  if (state !== 'loading') return null;

  if (children) {
    return <>{children}</>;
  }

  const containerBase = 'cometchat-smart-replies__shimmer-container';
  const containerClass = className ? `${containerBase} ${className}` : containerBase;

  return (
    <div className={containerClass}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={'cometchat-smart-replies__shimmer-item'} aria-hidden="true" />
      ))}
    </div>
  );
};
