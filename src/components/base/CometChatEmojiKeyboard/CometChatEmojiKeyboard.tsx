import { CometChatEmojiKeyboardRoot } from './CometChatEmojiKeyboardRoot';
import { CometChatEmojiKeyboardCategoryTabs } from './CometChatEmojiKeyboardCategoryTabs';
import { CometChatEmojiKeyboardSearchBar } from './CometChatEmojiKeyboardSearchBar';
import { CometChatEmojiKeyboardEmojiGrid } from './CometChatEmojiKeyboardEmojiGrid';
import { CometChatEmojiKeyboardCategorySection } from './CometChatEmojiKeyboardCategorySection';
import { CometChatEmojiKeyboardEmptyState } from './CometChatEmojiKeyboardEmptyState';

/**
 * CometChatEmojiKeyboard — compound component.
 *
 * Usage:
 * ```tsx
 * <CometChatEmojiKeyboard.Root onEmojiClick={handleEmoji}>
 *   <CometChatEmojiKeyboard.SearchBar />
 *   <CometChatEmojiKeyboard.CategoryTabs />
 * </CometChatEmojiKeyboard.Root>
 * ```
 *
 * When no children are provided, Root renders the default layout automatically.
 */
export const CometChatEmojiKeyboard = {
  Root: CometChatEmojiKeyboardRoot,
  CategoryTabs: CometChatEmojiKeyboardCategoryTabs,
  SearchBar: CometChatEmojiKeyboardSearchBar,
  EmojiGrid: CometChatEmojiKeyboardEmojiGrid,
  CategorySection: CometChatEmojiKeyboardCategorySection,
  EmptyState: CometChatEmojiKeyboardEmptyState,
} as const;
