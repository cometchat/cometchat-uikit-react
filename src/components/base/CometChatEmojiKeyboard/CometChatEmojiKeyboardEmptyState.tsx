import React from 'react';
import type { CometChatEmojiKeyboardEmptyStateProps } from './CometChatEmojiKeyboard.types';
import { useCometChatEmojiKeyboardContext } from './CometChatEmojiKeyboard.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatEmojiKeyboard.css';

/**
 * Empty state shown when search yields no results.
 */
export const CometChatEmojiKeyboardEmptyState: React.FC<CometChatEmojiKeyboardEmptyStateProps> = ({
  children,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const { isSearching, searchResults } = useCometChatEmojiKeyboardContext();

  // Shown only when a search finds nothing, wherever it is placed.
  if (!isSearching || Object.keys(searchResults).length > 0) return null;

  const emptyClass = ['cometchat-emoji-keyboard__empty-state', className].filter(Boolean).join(' ');

  return (
    <div className={emptyClass} role="status" aria-live="polite">
      {children ?? getLocalizedString('emoji_keyboard_empty')}
    </div>
  );
};
