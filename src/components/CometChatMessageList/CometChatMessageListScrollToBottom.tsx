import React, { useCallback } from 'react';
import { useCometChatMessageListContext } from './CometChatMessageList.context';
import './CometChatMessageList.css';

export interface CometChatMessageListScrollToBottomProps {
  /** Reference to the scroll container for scrollToBottom. */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * CometChatMessageListScrollToBottom — scroll-to-bottom button with new message count badge.
 */
export const CometChatMessageListScrollToBottom: React.FC<
  CometChatMessageListScrollToBottomProps
> = ({ scrollContainerRef }) => {
  const { isAtBottom, newMessageCount, unreadCount, isLoading, hasReachedLatest, scrollToBottom } =
    useCometChatMessageListContext();

  // Show the higher of newMessageCount (real-time) or unreadCount (from conversation/mark-as-unread)
  const badgeCount = Math.max(newMessageCount, unreadCount);

  const handleScrollToBottom = useCallback(() => {
    const result = scrollToBottom();

    if (result === 'scroll-dom' && scrollContainerRef?.current) {
      const container = scrollContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [scrollContainerRef, scrollToBottom]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleScrollToBottom();
      }
    },
    [handleScrollToBottom]
  );

  const showButton = (!isAtBottom || !hasReachedLatest) && !isLoading;

  if (!showButton) return null;

  return (
    <div
      className={'cometchat-message-list__scroll-to-bottom'}
      role="button"
      tabIndex={0}
      aria-label={
        badgeCount > 0 ? `Scroll to bottom, ${String(badgeCount)} new messages` : 'Scroll to bottom'
      }
      onClick={handleScrollToBottom}
      onKeyDown={handleKeyDown}
    >
      <div className={'cometchat-message-list__scroll-to-bottom-icon'} />
      {badgeCount > 0 && (
        <span className={'cometchat-message-list__scroll-to-bottom-badge'}>
          {badgeCount > 999 ? '999+' : String(badgeCount)}
        </span>
      )}
    </div>
  );
};

CometChatMessageListScrollToBottom.displayName = 'CometChatMessageListScrollToBottom';
