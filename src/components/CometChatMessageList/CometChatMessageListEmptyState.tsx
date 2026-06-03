import React from 'react';
import type { ReactNode } from 'react';
import { useCometChatMessageListContext } from './CometChatMessageList.context';
import './CometChatMessageList.css';

export interface CometChatMessageListEmptyStateProps {
  children?: ReactNode;
}

/**
 * CometChatMessageListEmptyState — shown when the conversation has no messages.
 *
 * Context-aware: reads `isEmpty` from the MessageList context and renders
 * nothing when the list is not in the empty state.
 */
export const CometChatMessageListEmptyState: React.FC<CometChatMessageListEmptyStateProps> = ({
  children,
}) => {
  const { isEmpty } = useCometChatMessageListContext();

  if (!isEmpty) return null;

  return (
    <div className={'cometchat-message-list__empty-state'} role="status">
      {children}
    </div>
  );
};

CometChatMessageListEmptyState.displayName = 'CometChatMessageListEmptyState';
