import React, { useEffect, useRef } from 'react';
import { useCometChatPinnedMessagesContext } from './CometChatPinnedMessages.context';
import { CometChatPinnedMessagesItem } from './CometChatPinnedMessagesItem';
import type { CometChatPinnedMessagesListProps } from './CometChatPinnedMessages.types';

/**
 * CometChatPinnedMessages.List — the scrollable list of pinned-message rows with
 * infinite scroll. Renders `itemView` (prop or context) when provided, else the
 * default row. Self-gates: renders nothing until there is at least one message.
 */
export const CometChatPinnedMessagesList: React.FC<CometChatPinnedMessagesListProps> = ({
  itemView: itemViewProp,
}) => {
  const {
    messages,
    fetchState,
    hasMore,
    loadMore,
    itemView: itemViewCtx,
  } = useCometChatPinnedMessagesContext();
  const itemView = itemViewProp ?? itemViewCtx;

  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Auto-load on scroll, like every other list in the kit. `rootMargin` starts the
  // next read before the sentinel is actually visible, so the list rarely stalls.
  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && fetchState !== 'loading') loadMore();
      },
      { root: listRef.current, rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, fetchState, loadMore]);

  if (messages.length === 0) return null;

  return (
    <div className={'cometchat-pinned-messages__list'} role="list" ref={listRef}>
      {messages.map((message, index) =>
        itemView ? (
          <React.Fragment key={String(message.getId())}>{itemView(message)}</React.Fragment>
        ) : (
          <CometChatPinnedMessagesItem
            key={String(message.getId())}
            message={message}
            index={index}
          />
        )
      )}

      {hasMore && <div ref={sentinelRef} className={'cometchat-pinned-messages__sentinel'} />}
    </div>
  );
};

CometChatPinnedMessagesList.displayName = 'CometChatPinnedMessages.List';
