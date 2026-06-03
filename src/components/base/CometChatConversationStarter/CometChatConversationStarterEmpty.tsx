import React from 'react';
import type { CometChatConversationStarterEmptyProps } from './CometChatConversationStarter.types';
import { useCometChatConversationStarterContext } from './CometChatConversationStarter.context';
import './CometChatConversationStarter.css';

/**
 * Empty state view for conversation starters.
 * Only renders when context state is 'empty'.
 */
export const CometChatConversationStarterEmpty: React.FC<
  CometChatConversationStarterEmptyProps
> = ({ message, className, children }) => {
  const { state } = useCometChatConversationStarterContext();

  if (state !== 'empty') return null;

  if (children) {
    return <>{children}</>;
  }

  if (!message) return null;

  const emptyBase = 'cometchat-conversation-starter__empty-view';
  const emptyClass = className ? `${emptyBase} ${className}` : emptyBase;

  return (
    <div className={emptyClass}>
      <span>{message}</span>
    </div>
  );
};
