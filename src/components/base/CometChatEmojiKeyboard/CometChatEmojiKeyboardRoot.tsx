import React, { useCallback, useMemo } from 'react';
import type {
  CometChatEmojiKeyboardRootProps,
  CometChatEmojiKeyboardContextValue,
} from './CometChatEmojiKeyboard.types';
import { CometChatEmojiKeyboardContext } from './CometChatEmojiKeyboard.context';
import { useCometChatEmojiKeyboard } from './useCometChatEmojiKeyboard';
import { CometChatEmojiKeyboardSearchBar } from './CometChatEmojiKeyboardSearchBar';
import { CometChatEmojiKeyboardCategoryTabs } from './CometChatEmojiKeyboardCategoryTabs';
import { CometChatEmojiKeyboardCategorySection } from './CometChatEmojiKeyboardCategorySection';
import { CometChatEmojiKeyboardEmojiGrid } from './CometChatEmojiKeyboardEmojiGrid';
import { CometChatEmojiKeyboardEmptyState } from './CometChatEmojiKeyboardEmptyState';
import './CometChatEmojiKeyboard.css';
import { useLocale } from '../../../context/locale/LocaleContext';

/**
 * Root container for the emoji keyboard.
 * Provides context, manages state, and renders default layout when no children are provided.
 */
export const CometChatEmojiKeyboardRoot: React.FC<CometChatEmojiKeyboardRootProps> = ({
  emojiData,
  onEmojiClick,
  onClose,
  className,
  children,
}) => {
  const {
    categories,
    activeCategoryId,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    listRef,
    handleListScroll,
  } = useCometChatEmojiKeyboard({ emojiData });

  const { getLocalizedString } = useLocale();
  const handleEmojiClick = useCallback(
    (emoji: string) => {
      onEmojiClick?.(emoji);
    },
    [onEmojiClick]
  );

  const ctxValue = useMemo<CometChatEmojiKeyboardContextValue>(
    () => ({
      categories,
      activeCategoryId,
      setActiveCategory,
      searchQuery,
      setSearchQuery,
      searchResults,
      isSearching,
      onEmojiClick: handleEmojiClick,
      listRef,
      onClose,
    }),
    [
      categories,
      activeCategoryId,
      setActiveCategory,
      searchQuery,
      setSearchQuery,
      searchResults,
      isSearching,
      handleEmojiClick,
      listRef,
      onClose,
    ]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (searchQuery) {
          setSearchQuery('');
        } else if (onClose) {
          onClose();
        }
      }
      if (e.key === '/') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT') {
          e.preventDefault();
          const input = (e.currentTarget as HTMLElement).querySelector<HTMLElement>(
            'input[type="text"], input[role="searchbox"]'
          );
          if (input) {
            input.focus();
          }
        }
      }
    },
    [searchQuery, setSearchQuery, onClose]
  );

  const rootClass = ['cometchat-emoji-keyboard', className].filter(Boolean).join(' ');

  const hasChildren = React.Children.count(children) > 0;

  return (
    <CometChatEmojiKeyboardContext.Provider value={ctxValue}>
      <div
        className={rootClass}
        role="dialog"
        aria-label={getLocalizedString('accessibility_emoji_keyboard')}
        aria-modal="true"
        onKeyDown={handleKeyDown}
      >
        {hasChildren ? (
          children
        ) : (
          <>
            <CometChatEmojiKeyboardSearchBar />
            <CometChatEmojiKeyboardCategoryTabs />
            <div
              className={'cometchat-emoji-keyboard__list'}
              ref={listRef}
              onScroll={handleListScroll}
            >
              {isSearching ? (
                Object.keys(searchResults).length > 0 ? (
                  <CometChatEmojiKeyboardEmojiGrid emojis={searchResults} />
                ) : (
                  <CometChatEmojiKeyboardEmptyState />
                )
              ) : (
                categories.map(category => (
                  <CometChatEmojiKeyboardCategorySection key={category.id} category={category} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </CometChatEmojiKeyboardContext.Provider>
  );
};
