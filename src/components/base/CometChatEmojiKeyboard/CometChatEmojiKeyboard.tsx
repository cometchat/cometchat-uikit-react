import React from 'react';
import { CometChatEmojiKeyboardRoot } from './CometChatEmojiKeyboardRoot';
import { CometChatEmojiKeyboardCategoryTabs } from './CometChatEmojiKeyboardCategoryTabs';
import { CometChatEmojiKeyboardSearchBar } from './CometChatEmojiKeyboardSearchBar';
import { CometChatEmojiKeyboardEmojiGrid } from './CometChatEmojiKeyboardEmojiGrid';
import { CometChatEmojiKeyboardCategorySection } from './CometChatEmojiKeyboardCategorySection';
import { CometChatEmojiKeyboardEmptyState } from './CometChatEmojiKeyboardEmptyState';
import type { CometChatEmojiKeyboardRootProps } from './CometChatEmojiKeyboard.types';

export type CometChatEmojiKeyboardProps = Omit<CometChatEmojiKeyboardRootProps, 'children'>;

const CometChatEmojiKeyboardComponent: React.FC<CometChatEmojiKeyboardProps> = props => {
  return <CometChatEmojiKeyboardRoot {...props} />;
};

CometChatEmojiKeyboardComponent.displayName = 'CometChatEmojiKeyboard';

export const CometChatEmojiKeyboard = Object.assign(CometChatEmojiKeyboardComponent, {
  Root: CometChatEmojiKeyboardRoot,
  CategoryTabs: CometChatEmojiKeyboardCategoryTabs,
  SearchBar: CometChatEmojiKeyboardSearchBar,
  EmojiGrid: CometChatEmojiKeyboardEmojiGrid,
  CategorySection: CometChatEmojiKeyboardCategorySection,
  EmptyState: CometChatEmojiKeyboardEmptyState,
});
