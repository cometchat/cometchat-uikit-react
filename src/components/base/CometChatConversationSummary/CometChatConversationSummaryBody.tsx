import React from 'react';
import type { CometChatConversationSummaryBodyProps } from './CometChatConversationSummary.types';
import { useCometChatConversationSummaryContext } from './CometChatConversationSummary.context';
import './CometChatConversationSummary.css';

/**
 * Body sub-component — renders the summary text when state is 'loaded'.
 */
export const CometChatConversationSummaryBody: React.FC<CometChatConversationSummaryBodyProps> = ({
  className,
  children,
}) => {
  const { state, summary } = useCometChatConversationSummaryContext();

  if (state !== 'loaded') return null;

  const bodyBase = 'cometchat-conversation-summary__body';
  const bodyClass = className ? `${bodyBase} ${className}` : bodyBase;

  if (children) {
    return <div className={bodyClass}>{children}</div>;
  }

  return (
    <div className={bodyClass}>
      <p>{summary}</p>
    </div>
  );
};
