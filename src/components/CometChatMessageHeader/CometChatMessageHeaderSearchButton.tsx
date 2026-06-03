import React, { useCallback } from 'react';
import type { CometChatMessageHeaderSearchButtonProps } from './CometChatMessageHeader.types';
import { useCometChatMessageHeaderContext } from './CometChatMessageHeader.context';
import './CometChatMessageHeader.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatMessageHeaderSearchButton — search action button.
 */
export const CometChatMessageHeaderSearchButton: React.FC<
  CometChatMessageHeaderSearchButtonProps
> = ({ onClick: onClickProp, className }) => {
  const { getLocalizedString } = useLocale();
  const { onSearchOptionClicked } = useCometChatMessageHeaderContext();

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      const handler = onClickProp ?? onSearchOptionClicked;
      handler?.();
    },
    [onClickProp, onSearchOptionClicked]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        const handler = onClickProp ?? onSearchOptionClicked;
        handler?.();
      }
    },
    [onClickProp, onSearchOptionClicked]
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
          'cometchat-message-header__menu-button--search',
        ].join(' ')}
        aria-label={getLocalizedString('accessibility_search')}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <span
          className={[
            'cometchat-message-header__menu-button-icon',
            'cometchat-message-header__menu-button-icon--search',
          ].join(' ')}
          aria-hidden="true"
        />
      </button>
    </div>
  );
};

CometChatMessageHeaderSearchButton.displayName = 'CometChatMessageHeaderSearchButton';
