import React from 'react';
import type { CometChatThreadViewUnreadIndicatorProps } from './CometChatThreadView.types';
import { useCometChatThreadViewContext } from './CometChatThreadView.context';
import './CometChatThreadView.css';

/**
 * Unread indicator dot. Only renders when `unreadReplyCount > 0` in context.
 */
export const CometChatThreadViewUnreadIndicator: React.FC<
  CometChatThreadViewUnreadIndicatorProps
> = ({ className }) => {
  const { unreadReplyCount } = useCometChatThreadViewContext();

  if (unreadReplyCount <= 0) {
    return null;
  }

  const baseClass = 'cometchat-thread-view__unread-indicator';
  const cls = className ? `${baseClass} ${className}` : baseClass;

  return <span className={cls} aria-hidden="true" />;
};
