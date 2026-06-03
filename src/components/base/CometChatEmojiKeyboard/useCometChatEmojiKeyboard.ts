import { useCallback, useMemo, useRef, useState } from 'react';
import type {
  CometChatEmojiKeyboardCategoryData,
  CometChatEmojiKeyboardEmojiData,
} from './CometChatEmojiKeyboard.types';
import { getDefaultEmojiCategories } from './CometChatEmojiData';

interface UseCometChatEmojiKeyboardOptions {
  emojiData?: CometChatEmojiKeyboardCategoryData[] | undefined;
}

export function useCometChatEmojiKeyboard({ emojiData }: UseCometChatEmojiKeyboardOptions) {
  const categories = useMemo<CometChatEmojiKeyboardCategoryData[]>(
    () => (emojiData && emojiData.length > 0 ? emojiData : getDefaultEmojiCategories()),
    [emojiData]
  );

  const [activeCategoryId, setActiveCategoryId] = useState<string>(() => categories[0]?.id ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);
  /** Flag to suppress scroll-based category tracking during programmatic scrolls. */
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchResults = useMemo<Record<string, CometChatEmojiKeyboardEmojiData>>(() => {
    if (!searchQuery) return {};
    const lower = searchQuery.toLowerCase();
    const results: Record<string, CometChatEmojiKeyboardEmojiData> = {};
    for (const category of categories) {
      for (const [name, emoji] of Object.entries(category.emojis)) {
        if (emoji.keywords.some(kw => kw.toLowerCase().includes(lower))) {
          results[name] = emoji;
        }
      }
    }
    return results;
  }, [searchQuery, categories]);

  const isSearching = searchQuery.length > 0;

  const setActiveCategory = useCallback((categoryId: string) => {
    setActiveCategoryId(categoryId);
    setSearchQuery('');

    const listEl = listRef.current;
    if (!listEl) return;

    const escapedId = CSS.escape(categoryId);
    const headerEl = listEl.querySelector<HTMLElement>(`#emoji-cat-${escapedId}`);
    if (!headerEl) return;

    isProgrammaticScrollRef.current = true;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    listEl.scrollTo({
      top: headerEl.offsetTop - listEl.offsetTop,
      behavior: prefersReducedMotion ? 'instant' : 'smooth',
    });

    // Re-enable scroll tracking after animation completes.
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 500);
  }, []);

  /** Handle scroll events on the emoji list to track the active category. */
  const handleListScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current || searchQuery) return;

    const listEl = listRef.current;
    if (!listEl || categories.length === 0) return;

    const containerTop = listEl.getBoundingClientRect().top;
    let newActiveId = categories[0]?.id ?? '';

    for (const category of categories) {
      const escapedId = CSS.escape(category.id);
      const headerEl = listEl.querySelector<HTMLElement>(`#emoji-cat-${escapedId}`);
      if (!headerEl) continue;

      const headerTop = headerEl.getBoundingClientRect().top;
      if (headerTop - containerTop <= 10) {
        newActiveId = category.id;
      }
    }

    setActiveCategoryId(prev => (prev !== newActiveId ? newActiveId : prev));
  }, [categories, searchQuery]);

  return {
    categories,
    activeCategoryId,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    listRef,
    handleListScroll,
  };
}
