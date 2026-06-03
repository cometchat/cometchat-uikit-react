import React from 'react';
import { CometChatSearchBar } from '../base/CometChatSearchBar/CometChatSearchBar';
import { useCometChatGroupMembersContext } from './CometChatGroupMembers.context';
import type { CometChatGroupMembersSearchBarProps } from './CometChatGroupMembers.types';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatGroupMembers.css';

/**
 * CometChatGroupMembersSearchBar — Debounced search input for filtering group members.
 *
 * Delegates debouncing to the base component (300ms default).
 */
export const CometChatGroupMembersSearchBar: React.FC<CometChatGroupMembersSearchBarProps> = ({
  placeholder,
}) => {
  const { setSearchText } = useCometChatGroupMembersContext();
  const { getLocalizedString } = useLocale();
  const effectivePlaceholder = placeholder ?? getLocalizedString('member_search_placeholder');

  return (
    <div className={'cometchat-group-members__search-bar'}>
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

CometChatGroupMembersSearchBar.displayName = 'CometChatGroupMembers.SearchBar';
