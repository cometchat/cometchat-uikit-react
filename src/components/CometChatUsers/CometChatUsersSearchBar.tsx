import React from 'react';
import { CometChatSearchBar } from '../base/CometChatSearchBar/CometChatSearchBar';
import { useCometChatUsersContext } from './CometChatUsers.context';
import type { CometChatUsersSearchBarProps } from './CometChatUsers.types';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatUsers.css';

/**
 * CometChatUsersSearchBar — Search input using the CometChatSearchBar base component.
 *
 * Delegates debouncing to the base component (300ms default).
 */
export const CometChatUsersSearchBar: React.FC<CometChatUsersSearchBarProps> = ({
  placeholder,
}) => {
  const { setSearchText } = useCometChatUsersContext();
  const { getLocalizedString } = useLocale();
  const effectivePlaceholder = placeholder ?? getLocalizedString('user_search_placeholder');

  return (
    <div className={'cometchat-users__search-bar'}>
      <CometChatSearchBar.Root
        placeholderText={effectivePlaceholder}
        onChange={setSearchText}
        debounceMs={300}
      >
        <CometChatSearchBar.Icon />
        <CometChatSearchBar.Input />
        <CometChatSearchBar.ClearButton />
      </CometChatSearchBar.Root>
    </div>
  );
};

CometChatUsersSearchBar.displayName = 'CometChatUsers.SearchBar';
