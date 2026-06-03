import React from 'react';
import type { CometChatEmojiKeyboardCategorySectionProps } from './CometChatEmojiKeyboard.types';
import { CometChatEmojiKeyboardEmojiGrid } from './CometChatEmojiKeyboardEmojiGrid';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatEmojiKeyboard.css';

/**
 * A single category section: title + emoji grid.
 */
export const CometChatEmojiKeyboardCategorySection: React.FC<
  CometChatEmojiKeyboardCategorySectionProps
> = ({ category, className }) => {
  const { getLocalizedString } = useLocale();
  const label = getLocalizedString(category.name);

  const sectionClass = ['cometchat-emoji-keyboard__category-section', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={sectionClass} id={`emoji-panel-${category.id}`}>
      <div
        className={'cometchat-emoji-keyboard__category-title'}
        id={`emoji-cat-${category.id}`}
        title={label}
      >
        {label}
      </div>
      <CometChatEmojiKeyboardEmojiGrid emojis={category.emojis} />
    </div>
  );
};
