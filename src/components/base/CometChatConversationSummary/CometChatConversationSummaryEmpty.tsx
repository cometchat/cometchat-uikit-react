import React from 'react';
import type { CometChatConversationSummaryEmptyProps } from './CometChatConversationSummary.types';
import { useCometChatConversationSummaryContext } from './CometChatConversationSummary.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatConversationSummary.css';

/**
 * Empty state view for conversation summary.
 * Only renders when context state is 'empty'.
 */
export const CometChatConversationSummaryEmpty: React.FC<
  CometChatConversationSummaryEmptyProps
> = ({ message, className, children }) => {
  const { state } = useCometChatConversationSummaryContext();
  const { getLocalizedString } = useLocale();

  if (state !== 'empty') return null;

  if (children) {
    return <>{children}</>;
  }

  const emptyBase = 'cometchat-conversation-summary__empty-view';
  const emptyClass = className ? `${emptyBase} ${className}` : emptyBase;

  return (
    <div className={emptyClass}>
      <span>{message ?? getLocalizedString('conversation_summary_empty')}</span>
    </div>
  );
};
