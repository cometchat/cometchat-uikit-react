import React, { useCallback } from 'react';
import type { CometChatThreadHeaderCloseButtonProps } from './CometChatThreadHeader.types';
import { useCometChatThreadHeaderContext } from './CometChatThreadHeader.context';
import { useLocale } from '../../hooks/useLocale';
import './CometChatThreadHeader.css';

/**
 * CometChatThreadHeaderCloseButton — close button to return to the main chat.
 *
 * Accessible: native <button> with aria-label, keyboard support (Enter/Space).
 * Escape key is handled at the Root level.
 */
export const CometChatThreadHeaderCloseButton: React.FC<CometChatThreadHeaderCloseButtonProps> = ({
  className,
}) => {
  const { onClose } = useCometChatThreadHeaderContext();
  const { getLocalizedString } = useLocale();

  const handleClick = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClose?.();
      }
    },
    [onClose]
  );

  const wrapperClasses = ['cometchat-thread-header__close-button-wrapper', className]
    .filter(Boolean)
    .join(' ');

  const ariaLabel = getLocalizedString('thread_close_hover') || 'Close thread';

  return (
    <div className={wrapperClasses}>
      <button
        type="button"
        className={'cometchat-thread-header__close-button'}
        aria-label={ariaLabel}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <span className={'cometchat-thread-header__close-button-icon'} aria-hidden="true" />
      </button>
    </div>
  );
};

CometChatThreadHeaderCloseButton.displayName = 'CometChatThreadHeaderCloseButton';
