import React, { useCallback } from 'react';
import type { CometChatMessageHeaderSummaryButtonProps } from './CometChatMessageHeader.types';
import { useCometChatMessageHeaderContext } from './CometChatMessageHeader.context';
import './CometChatMessageHeader.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatMessageHeaderSummaryButton — AI conversation summary button.
 */
export const CometChatMessageHeaderSummaryButton: React.FC<
  CometChatMessageHeaderSummaryButtonProps
> = ({ onClick: onClickProp, className }) => {
  const { getLocalizedString } = useLocale();
  const { onSummaryClick } = useCometChatMessageHeaderContext();

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      const handler = onClickProp ?? onSummaryClick;
      handler?.();
    },
    [onClickProp, onSummaryClick]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        const handler = onClickProp ?? onSummaryClick;
        handler?.();
      }
    },
    [onClickProp, onSummaryClick]
  );

  const rootClasses = ['cometchat-message-header__menu-buttons', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
      <button
        type="button"
        className={[
          'cometchat-message-header__menu-button',
          'cometchat-message-header__menu-button--summary',
        ].join(' ')}
        aria-label={getLocalizedString('ai_conversation_summary_title')}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <span
          className={[
            'cometchat-message-header__menu-button-icon',
            'cometchat-message-header__menu-button-icon--summary',
          ].join(' ')}
          aria-hidden="true"
        />
      </button>
    </div>
  );
};

CometChatMessageHeaderSummaryButton.displayName = 'CometChatMessageHeaderSummaryButton';
