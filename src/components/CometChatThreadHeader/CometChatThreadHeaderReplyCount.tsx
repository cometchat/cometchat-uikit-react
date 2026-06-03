import React from 'react';
import type { CometChatThreadHeaderReplyCountProps } from './CometChatThreadHeader.types';
import { useCometChatThreadHeaderContext } from './CometChatThreadHeader.context';
import { useLocale } from '../../hooks/useLocale';
import './CometChatThreadHeader.css';

/**
 * CometChatThreadHeaderReplyCount — displays the reply count with a divider line.
 *
 * Shows singular/plural localized text. Caps display at "999+".
 * Has aria-live="polite" to announce count changes to screen readers.
 */
export const CometChatThreadHeaderReplyCount: React.FC<CometChatThreadHeaderReplyCountProps> = ({
  showDivider = true,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const { replyCount, hideReplyCount } = useCometChatThreadHeaderContext();

  // If hideReplyCount is set in context, don't render
  if (hideReplyCount) {
    return null;
  }

  const displayCount = replyCount > 999 ? '999+' : String(replyCount);
  const replyText =
    replyCount === 1 ? getLocalizedString('thread_reply') : getLocalizedString('thread_replies');
  const fullText = `${displayCount} ${replyText}`;

  const replyCountClasses = ['cometchat-thread-header__reply-count', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={replyCountClasses} aria-live="polite" aria-atomic="true">
      <span className={'cometchat-thread-header__reply-count-text'}>{fullText}</span>
      {showDivider && (
        <span className={'cometchat-thread-header__reply-count-divider'} aria-hidden="true" />
      )}
    </div>
  );
};

CometChatThreadHeaderReplyCount.displayName = 'CometChatThreadHeaderReplyCount';
