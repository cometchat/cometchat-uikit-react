import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatEmojiKeyboardCategoryTabs } from '../CometChatEmojiKeyboardCategoryTabs';
import type {
  CometChatEmojiKeyboardContextValue,
  CometChatEmojiKeyboardCategoryData,
} from '../CometChatEmojiKeyboard.types';
import { CometChatEmojiKeyboardContext } from '../CometChatEmojiKeyboard.context';

// Mock useLocale
vi.mock('../../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    language: 'en-us',
  }),
}));

const mockCategories: CometChatEmojiKeyboardCategoryData[] = [
  {
    id: 'people',
    name: 'Smileys & People',
    symbolURL: 'https://example.com/smileys.svg',
    emojis: {
      grinning: { char: '😀', keywords: ['face', 'smile'] },
    },
  },
  {
    id: 'animals',
    name: 'Animals & Nature',
    emojis: {
      dog: { char: '🐶', keywords: ['dog', 'pet'] },
    },
  },
  {
    id: 'food',
    name: 'Food & Drink',
    symbolURL: 'https://example.com/food.svg',
    emojis: {
      apple: { char: '🍎', keywords: ['fruit'] },
    },
  },
];

function createMockContext(
  overrides: Partial<CometChatEmojiKeyboardContextValue> = {}
): CometChatEmojiKeyboardContextValue {
  return {
    categories: mockCategories,
    activeCategoryId: 'people',
    setActiveCategory: vi.fn(),
    searchQuery: '',
    setSearchQuery: vi.fn(),
    searchResults: {},
    isSearching: false,
    onEmojiClick: vi.fn(),
    listRef: { current: null },
    ...overrides,
  };
}

function renderWithContext(
  ctx: CometChatEmojiKeyboardContextValue,
  props: Partial<React.ComponentProps<typeof CometChatEmojiKeyboardCategoryTabs>> = {}
) {
  return render(
    <CometChatEmojiKeyboardContext.Provider value={ctx}>
      <CometChatEmojiKeyboardCategoryTabs {...props} />
    </CometChatEmojiKeyboardContext.Provider>
  );
}

describe('CometChatEmojiKeyboardCategoryTabs', () => {
  // --- Rendering ---

  it('renders a tab for each category', () => {
    const ctx = createMockContext();
    renderWithContext(ctx);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('renders a tablist container', () => {
    const ctx = createMockContext();
    renderWithContext(ctx);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('sets aria-label on the tablist', () => {
    const ctx = createMockContext();
    renderWithContext(ctx);
    expect(screen.getByRole('tablist')).toHaveAttribute(
      'aria-label',
      'accessibility_emoji_categories'
    );
  });

  // --- Icon rendering ---

  it('renders an img when category has symbolURL', () => {
    const ctx = createMockContext();
    renderWithContext(ctx);
    const images = screen.getAllByRole('tab')[0]!.querySelectorAll('img');
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute('src', 'https://example.com/smileys.svg');
  });

  it('renders first emoji character when category has no symbolURL', () => {
    const ctx = createMockContext();
    renderWithContext(ctx);
    // The "animals" category (index 1) has no symbolURL, so it shows the first emoji
    const animalsTab = screen.getAllByRole('tab')[1]!;
    expect(animalsTab.textContent).toBe('🐶');
  });

  it('renders img with aria-hidden="true" and empty alt', () => {
    const ctx = createMockContext();
    renderWithContext(ctx);
    const img = screen.getAllByRole('tab')[0]!.querySelector('img')!;
    expect(img).toHaveAttribute('aria-hidden', 'true');
    expect(img).toHaveAttribute('alt', '');
  });

  it('renders img with loading="lazy" and decoding="async"', () => {
    const ctx = createMockContext();
    renderWithContext(ctx);
    const img = screen.getAllByRole('tab')[0]!.querySelector('img')!;
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });

  // --- Active state ---

  it('marks the active category tab with aria-selected="true"', () => {
    const ctx = createMockContext({ activeCategoryId: 'people' });
    renderWithContext(ctx);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
  });

  it('sets tabIndex=0 on the active tab and -1 on others', () => {
    const ctx = createMockContext({ activeCategoryId: 'animals' });
    renderWithContext(ctx);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('tabindex', '-1');
    expect(tabs[1]).toHaveAttribute('tabindex', '0');
    expect(tabs[2]).toHaveAttribute('tabindex', '-1');
  });

  // --- Click ---

  it('calls setActiveCategory when a tab is clicked', () => {
    const setActiveCategory = vi.fn();
    const ctx = createMockContext({ setActiveCategory });
    renderWithContext(ctx);

    fireEvent.click(screen.getAllByRole('tab')[1]!);
    expect(setActiveCategory).toHaveBeenCalledWith('animals');
  });

  // --- ARIA attributes ---

  it('sets aria-label on each tab', () => {
    const ctx = createMockContext();
    renderWithContext(ctx);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-label', 'Smileys & People');
    expect(tabs[1]).toHaveAttribute('aria-label', 'Animals & Nature');
  });

  it('sets aria-controls pointing to the category panel', () => {
    const ctx = createMockContext();
    renderWithContext(ctx);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-controls', 'emoji-panel-people');
    expect(tabs[1]).toHaveAttribute('aria-controls', 'emoji-panel-animals');
  });

  it('sets title attribute on each tab', () => {
    const ctx = createMockContext();
    renderWithContext(ctx);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('title', 'Smileys & People');
  });

  // --- Keyboard navigation ---

  it('moves focus right on ArrowRight', () => {
    const ctx = createMockContext();
    renderWithContext(ctx);
    const tabs = screen.getAllByRole('tab');

    tabs[0]!.focus();
    fireEvent.keyDown(tabs[0]!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(tabs[1]);
  });

  it('wraps focus to first tab on ArrowRight from last tab', () => {
    const ctx = createMockContext({ activeCategoryId: 'food' });
    renderWithContext(ctx);
    const tabs = screen.getAllByRole('tab');

    tabs[2]!.focus();
    fireEvent.keyDown(tabs[2]!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(tabs[0]);
  });

  it('moves focus left on ArrowLeft', () => {
    const ctx = createMockContext();
    renderWithContext(ctx);
    const tabs = screen.getAllByRole('tab');

    tabs[1]!.focus();
    fireEvent.keyDown(tabs[1]!, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(tabs[0]);
  });

  it('wraps focus to last tab on ArrowLeft from first tab', () => {
    const ctx = createMockContext();
    renderWithContext(ctx);
    const tabs = screen.getAllByRole('tab');

    tabs[0]!.focus();
    fireEvent.keyDown(tabs[0]!, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(tabs[2]);
  });

  it('moves focus to first tab on Home', () => {
    const ctx = createMockContext();
    renderWithContext(ctx);
    const tabs = screen.getAllByRole('tab');

    tabs[2]!.focus();
    fireEvent.keyDown(tabs[2]!, { key: 'Home' });
    expect(document.activeElement).toBe(tabs[0]);
  });

  it('moves focus to last tab on End', () => {
    const ctx = createMockContext();
    renderWithContext(ctx);
    const tabs = screen.getAllByRole('tab');

    tabs[0]!.focus();
    fireEvent.keyDown(tabs[0]!, { key: 'End' });
    expect(document.activeElement).toBe(tabs[2]);
  });

  it('calls setActiveCategory on Enter key', () => {
    const setActiveCategory = vi.fn();
    const ctx = createMockContext({ setActiveCategory });
    renderWithContext(ctx);
    const tabs = screen.getAllByRole('tab');

    fireEvent.keyDown(tabs[1]!, { key: 'Enter' });
    expect(setActiveCategory).toHaveBeenCalledWith('animals');
  });

  it('calls setActiveCategory on Space key', () => {
    const setActiveCategory = vi.fn();
    const ctx = createMockContext({ setActiveCategory });
    renderWithContext(ctx);
    const tabs = screen.getAllByRole('tab');

    fireEvent.keyDown(tabs[1]!, { key: ' ' });
    expect(setActiveCategory).toHaveBeenCalledWith('animals');
  });

  // --- className ---

  it('applies custom className', () => {
    const ctx = createMockContext();
    const { container } = renderWithContext(ctx, { className: 'my-tabs' });
    const tablist = container.firstElementChild as HTMLElement;
    expect(tablist.className).toContain('my-tabs');
  });

  // --- Context requirement ---

  it('throws when used outside of context provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(<CometChatEmojiKeyboardCategoryTabs />);
    }).toThrow(
      'useCometChatEmojiKeyboardContext must be used within <CometChatEmojiKeyboard.Root>'
    );
    spy.mockRestore();
  });
});
