import React, { useCallback } from 'react';
import type { CometChatSearchBarClearButtonProps } from './CometChatSearchBar.types';
import { useCometChatSearchBarContext } from './CometChatSearchBar.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatSearchBar.css';

/**
 * Clear/reset button. Only visible and focusable when the input has a value.
 * When the input is empty, the button is hidden from the tab order.
 */
export const CometChatSearchBarClearButton: React.FC<CometChatSearchBarClearButtonProps> = ({
  icon,
  className,
  'aria-label': ariaLabel,
}) => {
  const { getLocalizedString } = useLocale();
  const effectiveAriaLabel = ariaLabel ?? getLocalizedString('accessibility_clear_search');
  const { searchText, clear, disabled } = useCometChatSearchBarContext();

  const handleClick = useCallback(() => {
    if (!disabled) {
      clear();
    }
  }, [clear, disabled]);

  const isEmpty = searchText.length === 0;

  const baseClass = 'cometchat-search-bar__clear-button';
  const cls = className ? `${baseClass} ${className}` : baseClass;

  return (
    <button
      type="button"
      className={cls}
      aria-label={effectiveAriaLabel}
      onClick={handleClick}
      disabled={disabled}
      tabIndex={isEmpty ? -1 : 0}
      style={isEmpty ? { visibility: 'hidden', pointerEvents: 'none' } : undefined}
    >
      {icon ?? <span className={'cometchat-search-bar__clear-button-icon'} aria-hidden="true" />}
    </button>
  );
};
