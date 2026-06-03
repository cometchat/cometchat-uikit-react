import React from 'react';
import type { CometChatConversationStarterLoadingProps } from './CometChatConversationStarter.types';
import { useCometChatConversationStarterContext } from './CometChatConversationStarter.context';
import './CometChatConversationStarter.css';

/**
 * Shimmer loading state for conversation starters.
 * Only renders when context state is 'loading'.
 */
export const CometChatConversationStarterLoading: React.FC<
  CometChatConversationStarterLoadingProps
> = ({ count = 3, className, children }) => {
  const { state } = useCometChatConversationStarterContext();

  if (state !== 'loading') return null;

  if (children) {
    return <>{children}</>;
  }

  const containerBase = 'cometchat-conversation-starter__shimmer-container';
  const containerClass = className ? `${containerBase} ${className}` : containerBase;

  return (
    <div className={containerClass}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={'cometchat-conversation-starter__shimmer-item'}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};
