import type { ReactNode, RefObject } from 'react';

/** A single emoji entry. */
export interface CometChatEmojiKeyboardEmojiData {
  /** The emoji character (e.g., "😀"). */
  char: string;
  /** Search keywords for this emoji. */
  keywords: string[];
}

/** A category of emojis. */
export interface CometChatEmojiKeyboardCategoryData {
  /** Unique category identifier. */
  id: string;
  /** Localization key or display name for the category. */
  name: string;
  /** URL for the category icon (SVG mask). */
  symbolURL?: string;
  /** Map of emoji name → emoji data. */
  emojis: Record<string, CometChatEmojiKeyboardEmojiData>;
}

/** Props for CometChatEmojiKeyboard.Root */
export interface CometChatEmojiKeyboardRootProps {
  /** Custom emoji data. If omitted, built-in emoji dataset is used. */
  emojiData?: CometChatEmojiKeyboardCategoryData[];
  /** Callback when an emoji is selected. */
  onEmojiClick?: (emoji: string) => void;
  /** Callback when Escape is pressed to signal close to parent. */
  onClose?: () => void;
  /** Optional custom className. */
  className?: string;
  /** Children (sub-components). When omitted, renders default layout. */
  children?: ReactNode;
}

/** Props for CometChatEmojiKeyboard.CategoryTabs */
export interface CometChatEmojiKeyboardCategoryTabsProps {
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatEmojiKeyboard.SearchBar */
export interface CometChatEmojiKeyboardSearchBarProps {
  /** Placeholder text for the search input. */
  placeholder?: string;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatEmojiKeyboard.EmojiGrid */
export interface CometChatEmojiKeyboardEmojiGridProps {
  /** Emojis to render in the grid. */
  emojis: Record<string, CometChatEmojiKeyboardEmojiData>;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatEmojiKeyboard.CategorySection */
export interface CometChatEmojiKeyboardCategorySectionProps {
  /** The category to render. */
  category: CometChatEmojiKeyboardCategoryData;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatEmojiKeyboard.EmptyState */
export interface CometChatEmojiKeyboardEmptyStateProps {
  /** Custom empty state content. */
  children?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Context value shared across emoji keyboard sub-components. */
export interface CometChatEmojiKeyboardContextValue {
  /** All emoji categories (original data). */
  categories: CometChatEmojiKeyboardCategoryData[];
  /** Currently active category ID. */
  activeCategoryId: string;
  /** Set the active category and scroll to it. */
  setActiveCategory: (categoryId: string) => void;
  /** Current search query string. */
  searchQuery: string;
  /** Update the search query. */
  setSearchQuery: (query: string) => void;
  /** Filtered emojis from search (empty record when not searching). */
  searchResults: Record<string, CometChatEmojiKeyboardEmojiData>;
  /** Whether a search is active. */
  isSearching: boolean;
  /** Callback when an emoji is clicked. */
  onEmojiClick: (emoji: string) => void;
  /** Ref for the scrollable emoji list container (for scroll-to-category). */
  listRef: RefObject<HTMLDivElement | null>;
  /** Callback when Escape is pressed. */
  onClose?: (() => void) | undefined;
}
