import React, { useCallback } from 'react';
import type { CometChatEmojiKeyboardSearchBarProps } from './CometChatEmojiKeyboard.types';
import { useCometChatEmojiKeyboardContext } from './CometChatEmojiKeyboard.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import { CometChatSearchBar } from '../CometChatSearchBar';
import './CometChatEmojiKeyboard.css';

/**
 * Search input for filtering emojis.
 * Wraps CometChatSearchBar and wires it to the emoji keyboard context.
 */
export const CometChatEmojiKeyboardSearchBar: React.FC<CometChatEmojiKeyboardSearchBarProps> = ({
  placeholder,
  className,
}) => {
  const { searchQuery, setSearchQuery } = useCometChatEmojiKeyboardContext();
  const { getLocalizedString } = useLocale();

  const handleChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
    },
    [setSearchQuery]
  );

  const searchClass = ['cometchat-emoji-keyboard__search', className].filter(Boolean).join(' ');

  return (
    <div className={searchClass}>
      <CometChatSearchBar.Root
        searchText={searchQuery}
        onChange={handleChange}
        placeholderText={placeholder ?? getLocalizedString('emoji_search_placeholder')}
      >
        <CometChatSearchBar.Icon />
        <CometChatSearchBar.Input />
        <CometChatSearchBar.ClearButton />
      </CometChatSearchBar.Root>
    </div>
  );
};
