import React, { useEffect, useRef } from 'react';
import { useCometChatSavedMessagesContext } from './CometChatSavedMessages.context';
import { CometChatSavedMessagesItem } from './CometChatSavedMessagesItem';
import type { CometChatSavedMessagesListProps } from './CometChatSavedMessages.types';

/**
 * CometChatSavedMessages.List — the scrollable list of saved-message rows with
 * infinite scroll. Renders `itemView` (prop or context) when provided, else the
 * default row. Self-gates: renders nothing until there is at least one message.
 */
export const CometChatSavedMessagesList: React.FC<CometChatSavedMessagesListProps> = ({
  itemView: itemViewProp,
}) => {
  const {
    messages,
    fetchState,
    hasMore,
    loadMore,
    onItemClick,
    onUnsave,
    hideUnsaveMessageOption,
    textFormatters,
    itemView: itemViewCtx,
  } = useCometChatSavedMessagesContext();
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
    <div className={'cometchat-saved-messages__list'} role="list" ref={listRef}>
      {messages.map(message =>
        itemView ? (
          <React.Fragment key={String(message.getId())}>{itemView(message)}</React.Fragment>
        ) : (
          <div key={String(message.getId())} role="listitem">
            <CometChatSavedMessagesItem
              message={message}
              onClick={m => onItemClick?.(m)}
              onUnsave={onUnsave}
              hideUnsaveOption={hideUnsaveMessageOption}
              {...(textFormatters !== undefined && { textFormatters })}
            />
          </div>
        )
      )}

      {hasMore && <div ref={sentinelRef} className={'cometchat-saved-messages__sentinel'} />}
    </div>
  );
};

CometChatSavedMessagesList.displayName = 'CometChatSavedMessages.List';
