import React from 'react';
import type { CometChatConversationSummaryHeaderProps } from './CometChatConversationSummary.types';
import { useCometChatConversationSummaryContext } from './CometChatConversationSummary.context';
import './CometChatConversationSummary.css';
import { useLocale } from '../../../context/locale/LocaleContext';

const DEFAULT_TITLE = 'Conversation summary';

/**
 * Header sub-component with title and close button.
 */
export const CometChatConversationSummaryHeader: React.FC<
  CometChatConversationSummaryHeaderProps
> = ({ title, showCloseButton = true, className, children }) => {
  const { getLocalizedString } = useLocale();
  const { onClose } = useCometChatConversationSummaryContext();

  if (children) {
    const headerBase = 'cometchat-conversation-summary__header';
    const headerClass = className ? `${headerBase} ${className}` : headerBase;
    return <div className={headerClass}>{children}</div>;
  }

  const headerBase = 'cometchat-conversation-summary__header';
  const headerClass = className ? `${headerBase} ${className}` : headerBase;

  return (
    <div className={headerClass}>
      <h2 className={'cometchat-conversation-summary__header-title'}>{title ?? DEFAULT_TITLE}</h2>
      {showCloseButton && (
        <button
          type="button"
          className={'cometchat-conversation-summary__header-close-button'}
          aria-label={getLocalizedString('ai_conversation_summary_close')}
          onClick={() => onClose?.()}
        />
      )}
    </div>
  );
};
