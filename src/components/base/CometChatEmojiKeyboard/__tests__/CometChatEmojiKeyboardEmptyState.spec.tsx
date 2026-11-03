import React from 'react';
import { render as rtlRender, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatEmojiKeyboardEmptyState } from '../CometChatEmojiKeyboardEmptyState';
import { CometChatEmojiKeyboardContext } from '../CometChatEmojiKeyboard.context';
import type { CometChatEmojiKeyboardContextValue } from '../CometChatEmojiKeyboard.types';

/** Renders inside the keyboard's context: a search with no results unless overridden. */
function render(ui: React.ReactElement, overrides: Partial<CometChatEmojiKeyboardContextValue> = {}) {
  const ctx: CometChatEmojiKeyboardContextValue = {
    categories: [],
    activeCategoryId: '',
    setActiveCategory: vi.fn(),
    searchQuery: 'zzz',
    setSearchQuery: vi.fn(),
    searchResults: {},
    isSearching: true,
    onEmojiClick: vi.fn(),
    listRef: { current: null },
    ...overrides,
  };
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <CometChatEmojiKeyboardContext.Provider value={ctx}>{children}</CometChatEmojiKeyboardContext.Provider>
    ),
  });
}

describe('CometChatEmojiKeyboardEmptyState', () => {
  it('renders default "No emojis found" text when no children provided', () => {
    render(<CometChatEmojiKeyboardEmptyState />);
    expect(screen.getByText('No emojis found')).toBeInTheDocument();
  });

  it('renders custom children when provided', () => {
    render(
      <CometChatEmojiKeyboardEmptyState>
        <span>Custom empty message</span>
      </CometChatEmojiKeyboardEmptyState>
    );
    expect(screen.getByText('Custom empty message')).toBeInTheDocument();
    expect(screen.queryByText('emoji_keyboard_empty')).not.toBeInTheDocument();
  });

  it('has role="status" for accessibility', () => {
    render(<CometChatEmojiKeyboardEmptyState />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live="polite" for screen reader announcements', () => {
    render(<CometChatEmojiKeyboardEmptyState />);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });

  it('applies custom className alongside default class', () => {
    const { container } = render(<CometChatEmojiKeyboardEmptyState className="my-custom-class" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('my-custom-class');
  });

  it('does not include undefined in className when no custom class is provided', () => {
    const { container } = render(<CometChatEmojiKeyboardEmptyState />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).not.toContain('undefined');
  });

  it('renders nothing when not searching, or when the search found emojis', () => {
    for (const overrides of [
      { isSearching: false },
      { searchResults: { smile: { emoji: '😄', name: 'smile', keywords: [] } } },
    ]) {
      const { container, unmount } = render(
        <CometChatEmojiKeyboardEmptyState />,
        overrides as Partial<CometChatEmojiKeyboardContextValue>
      );
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });
});
