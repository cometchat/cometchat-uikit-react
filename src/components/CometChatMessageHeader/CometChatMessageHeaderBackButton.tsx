import React, { useCallback } from 'react';
import type { CometChatMessageHeaderBackButtonProps } from './CometChatMessageHeader.types';
import { useCometChatMessageHeaderContext } from './CometChatMessageHeader.context';
import './CometChatMessageHeader.css';
import { useLocale } from '../../context/locale/LocaleContext';

/**
 * CometChatMessageHeaderBackButton — back navigation button.
 *
 * Renders a back arrow button that calls `onBack` from context.
 * Supports keyboard activation via Enter and Space.
 */
export const CometChatMessageHeaderBackButton: React.FC<CometChatMessageHeaderBackButtonProps> = ({
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const { onBack } = useCometChatMessageHeaderContext();

  const handleClick = useCallback(() => {
    onBack?.();
  }, [onBack]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onBack?.();
      }
    },
    [onBack]
  );

  const rootClasses = ['cometchat-message-header__back-button-wrapper', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
      <button
        type="button"
        className={'cometchat-message-header__back-button'}
        aria-label={getLocalizedString('accessibility_back')}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <span className={'cometchat-message-header__back-button-icon'} aria-hidden="true" />
      </button>
    </div>
  );
};

CometChatMessageHeaderBackButton.displayName = 'CometChatMessageHeaderBackButton';
