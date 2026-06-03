import React, { useCallback } from 'react';
import { CometChatSearchBar } from '../base/CometChatSearchBar/CometChatSearchBar';
import { useCometChatConversationsContext } from './CometChatConversations.context';
import type { CometChatConversationsSearchBarProps } from './CometChatConversations.types';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatConversations.css';

/**
 * CometChatConversationsSearchBar — Search input using the CometChatSearchBar base component.
 *
 * When `onClick` is provided (either via prop or context's `onSearchBarClicked`),
 * the input becomes read-only and acts as a click trigger (e.g., to open global search).
 * Fires on click, Enter, and Space.
 */
export const CometChatConversationsSearchBar: React.FC<CometChatConversationsSearchBarProps> = ({
  placeholder,
  onClick: onClickProp,
}) => {
  const { setSearchText, onSearchBarClicked } = useCometChatConversationsContext();
  const { getLocalizedString } = useLocale();
  const effectivePlaceholder = placeholder ?? getLocalizedString('search_placeholder');

  // Prefer the direct prop, fall back to context value
  const clickHandler = onClickProp ?? onSearchBarClicked;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (clickHandler && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        clickHandler();
      }
    },
    [clickHandler]
  );

  const handleClick = useCallback(() => {
    clickHandler?.();
  }, [clickHandler]);

  return (
    <div className={'cometchat-conversations__search-bar'}>
      <CometChatSearchBar.Root
        placeholderText={effectivePlaceholder}
        {...(!clickHandler && { onChange: setSearchText })}
        debounceMs={300}
      >
        <CometChatSearchBar.Icon />
        <CometChatSearchBar.Input
          readOnly={!!clickHandler}
          onClick={clickHandler ? handleClick : undefined}
          onKeyDown={clickHandler ? handleKeyDown : undefined}
        />
        {!clickHandler && <CometChatSearchBar.ClearButton />}
      </CometChatSearchBar.Root>
    </div>
  );
};

CometChatConversationsSearchBar.displayName = 'CometChatConversations.SearchBar';
