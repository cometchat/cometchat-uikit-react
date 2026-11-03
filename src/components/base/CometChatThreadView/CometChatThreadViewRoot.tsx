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
import { fillTemplate } from '../../../utils/fillTemplate';

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
  let label = fillTemplate(getLocalizedString(
    replyCount === 1 ? 'accessibility_thread_reply_count' : 'accessibility_thread_replies_count'
  ), { count: countDisplay });
  if (unreadReplyCount > 0) {
    label = fillTemplate(getLocalizedString('accessibility_thread_unread_replies'), { label, count: String(unreadReplyCount) });
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
