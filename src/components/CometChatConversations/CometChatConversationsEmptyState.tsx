import React from 'react';
import { useCometChatConversationsContext } from './CometChatConversations.context';
import type { CometChatConversationsEmptyStateProps } from './CometChatConversations.types';
import conversationsEmptyIcon from '../../assets/conversations_empty_state.svg';
import './CometChatConversations.css';

/**
 * CometChatConversationsEmptyState — Empty state view when no conversations are available.
 *
 * Reads fetchState from context and only renders when fetchState === 'empty'.
 */
export const CometChatConversationsEmptyState: React.FC<CometChatConversationsEmptyStateProps> = ({
  children,
}) => {
  const { fetchState } = useCometChatConversationsContext();

  if (fetchState !== 'empty') return null;

  return (
    <div className={'cometchat-conversations__empty-state'} role="status">
      {children ?? (
        <>
          <div className={'cometchat-conversations__empty-state-icon'} aria-hidden="true">
            <img
              src={conversationsEmptyIcon}
              alt=""
              width={100}
              height={68}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className={'cometchat-conversations__empty-state-title'}>No Conversations</div>
          <div className={'cometchat-conversations__empty-state-subtitle'}>
            There are no conversations available at the moment.
          </div>
        </>
      )}
    </div>
  );
};

CometChatConversationsEmptyState.displayName = 'CometChatConversations.EmptyState';
