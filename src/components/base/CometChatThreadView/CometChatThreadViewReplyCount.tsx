import React from 'react';
import type { CometChatThreadViewReplyCountProps } from './CometChatThreadView.types';
import { useCometChatThreadViewContext } from './CometChatThreadView.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatThreadView.css';

/**
 * Formats the display count: caps at "999+" for values over 999.
 */
function formatCount(count: number): string {
  return count > 999 ? '999+' : String(count);
}

/**
 * Displays the formatted reply count text (e.g., "3 Replies", "1 Reply").
 * Reads `replyCount` from context unless a `text` override is provided.
 * Counts over 999 display as "999+".
 */
export const CometChatThreadViewReplyCount: React.FC<CometChatThreadViewReplyCountProps> = ({
  text,
  className,
}) => {
  const { replyCount } = useCometChatThreadViewContext();
  const { getLocalizedString } = useLocale();

  const replyWord =
    replyCount === 1
      ? getLocalizedString('thread_view_reply')
      : getLocalizedString('thread_view_replies');
  const displayText = text ?? `${formatCount(replyCount)} ${replyWord}`;

  const baseClass = 'cometchat-thread-view__count';
  const cls = className ? `${baseClass} ${className}` : baseClass;

  return <span className={cls}>{displayText}</span>;
};
