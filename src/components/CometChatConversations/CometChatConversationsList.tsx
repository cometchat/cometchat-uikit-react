import React, { useEffect, useRef } from 'react';
import { useCometChatConversationsContext } from './CometChatConversations.context';
import { CometChatConversationsItem } from './CometChatConversationsItem';
import type { CometChatConversationsListProps } from './CometChatConversations.types';
import './CometChatConversations.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatConversationsList — Conversation list with infinite scroll.
 *
 * Uses IntersectionObserver on a sentinel element to trigger pagination.
 */
export const CometChatConversationsList: React.FC<CometChatConversationsListProps> = ({
  itemView,
}) => {
  const { getLocalizedString } = useLocale();
  const { conversations, hasMore, fetchState, fetchNext } = useCometChatConversationsContext();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // --- Infinite scroll via IntersectionObserver ---
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && fetchState !== 'loading') {
          void fetchNext();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinelRef.current);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, fetchState, fetchNext]);

  // Don't render the list container if there are no conversations to show
  if (fetchState !== 'loaded' && conversations.length === 0) return null;

  return (
    <div
      className={'cometchat-conversations__list'}
      role="listbox"
      aria-label={getLocalizedString('accessibility_conversations_list')}
      aria-busy={fetchState === 'loading'}
    >
      {conversations.map(conversation => (
        <React.Fragment key={conversation.getConversationId()}>
          {itemView ? (
            itemView(conversation)
          ) : (
            <CometChatConversationsItem conversation={conversation} />
          )}
        </React.Fragment>
      ))}

      {/* Sentinel for infinite scroll */}
      {hasMore && (
        <div ref={sentinelRef} className={'cometchat-conversations__sentinel'} aria-hidden="true" />
      )}
    </div>
  );
};

CometChatConversationsList.displayName = 'CometChatConversations.List';
