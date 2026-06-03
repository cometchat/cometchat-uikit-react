import React from 'react';
import { CometChatSearchBar } from '../base/CometChatSearchBar/CometChatSearchBar';
import { useCometChatGroupsContext } from './CometChatGroups.context';
import type { CometChatGroupsSearchBarProps } from './CometChatGroups.types';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatGroups.css';

/**
 * CometChatGroupsSearchBar — Search input using the CometChatSearchBar base component.
 *
 * Delegates debouncing to the base component (300ms default).
 */
export const CometChatGroupsSearchBar: React.FC<CometChatGroupsSearchBarProps> = ({
  placeholder,
}) => {
  const { setSearchText } = useCometChatGroupsContext();
  const { getLocalizedString } = useLocale();
  const effectivePlaceholder = placeholder ?? getLocalizedString('group_search_placeholder');

  return (
    <div className={'cometchat-groups__search-bar'}>
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

CometChatGroupsSearchBar.displayName = 'CometChatGroups.SearchBar';
