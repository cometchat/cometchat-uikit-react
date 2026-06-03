import React, { useMemo } from 'react';
import type {
  CometChatThreadViewRootProps,
  CometChatThreadViewContextValue,
} from './CometChatThreadView.types';
import { CometChatThreadViewContext } from './CometChatThreadView.context';
import { CometChatThreadViewReplyCount } from './CometChatThreadViewReplyCount';
import { CometChatThreadViewIcon } from './CometChatThreadViewIcon';
import { CometChatThreadViewUnreadIndicator } from './CometChatThreadViewUnreadIndicator';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatThreadView.css';

/**
 * Formats the display count: caps at "999+" for values over 999.
 */
function formatCount(count: number): string {
  return count > 999 ? '999+' : String(count);
}

/**
 * Root container for the thread view indicator.
 * Renders as a `<button>` with an accessible label.
 * Renders nothing when `replyCount` is 0.
 */
export const CometChatThreadViewRoot: React.FC<CometChatThreadViewRootProps> = ({
  replyCount,
  unreadReplyCount = 0,
  onClick,
  alignment = 'right',
  className,
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const ctxValue = useMemo<CometChatThreadViewContextValue>(
    () => ({ replyCount, unreadReplyCount, onClick, alignment }),
    [replyCount, unreadReplyCount, onClick, alignment]
  );

  if (replyCount <= 0) {
    return null;
  }

  const countDisplay = formatCount(replyCount);
  const replyWord =
    replyCount === 1
      ? getLocalizedString('thread_view_reply')
      : getLocalizedString('thread_view_replies');
  let label = `${countDisplay} ${replyWord}, view thread`;
  if (unreadReplyCount > 0) {
    label = `${label}, ${String(unreadReplyCount)} unread`;
  }

  const rootBase = 'cometchat-thread-view';
  const modifierClass =
    alignment === 'left' ? 'cometchat-thread-view--left' : 'cometchat-thread-view--right';
  const unreadClass = unreadReplyCount > 0 ? 'cometchat-thread-view--unread' : '';
  const rootClass = [rootBase, modifierClass, unreadClass, className].filter(Boolean).join(' ');

  const hasChildren = React.Children.count(children) > 0;

  return (
    <CometChatThreadViewContext.Provider value={ctxValue}>
      <button type="button" className={rootClass} aria-label={label} onClick={onClick}>
        {hasChildren ? (
          children
        ) : (
          <>
            <CometChatThreadViewIcon />
            <CometChatThreadViewReplyCount />
            {unreadReplyCount > 0 && <CometChatThreadViewUnreadIndicator />}
          </>
        )}
      </button>
    </CometChatThreadViewContext.Provider>
  );
};
