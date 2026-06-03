import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChatEmojiKeyboardSearchBar } from '../CometChatEmojiKeyboardSearchBar';
import type { CometChatEmojiKeyboardContextValue } from '../CometChatEmojiKeyboard.types';
import { CometChatEmojiKeyboardContext } from '../CometChatEmojiKeyboard.context';

// Mock useLocale
vi.mock('../../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        emoji_search_placeholder: 'Search emoji...',
      };
      return translations[key] ?? key;
    },
    language: 'en-us',
  }),
}));

// Track CometChatSearchBar.Root props
let capturedSearchBarProps: Record<string, unknown> = {};

vi.mock('../../CometChatSearchBar', () => ({
  CometChatSearchBar: {
    Root: (props: Record<string, unknown>) => {
      capturedSearchBarProps = props;
      return (
        <div data-testid="search-bar-root">
          <input
            data-testid="search-input"
            type="text"
            value={typeof props.value === 'string' ? props.value : ''}
            onChange={e => {
              const onChange = props.onChange as ((v: string) => void) | undefined;
              onChange?.(e.target.value);
            }}
            placeholder={props.placeholder as string}
          />
          {props.children as React.ReactNode}
        </div>
      );
    },
    Icon: () => <span data-testid="search-icon" />,
    Input: () => <span data-testid="search-input-component" />,
    ClearButton: () => <button data-testid="search-clear">Clear</button>,
  },
}));

function createMockContext(
  overrides: Partial<CometChatEmojiKeyboardContextValue> = {}
): CometChatEmojiKeyboardContextValue {
  return {
    categories: [],
    activeCategoryId: '',
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
  props: Partial<React.ComponentProps<typeof CometChatEmojiKeyboardSearchBar>> = {}
) {
  return render(
    <CometChatEmojiKeyboardContext.Provider value={ctx}>
      <CometChatEmojiKeyboardSearchBar {...props} />
    </CometChatEmojiKeyboardContext.Provider>
  );
}

describe('CometChatEmojiKeyboardSearchBar', () => {
  beforeEach(() => {
    capturedSearchBarProps = {};
  });

  // --- Rendering ---

  it('renders the search bar', () => {
    const ctx = createMockContext();
    renderWithContext(ctx);
    expect(screen.getByTestId('search-bar-root')).toBeInTheDocument();
  });

  it('renders search icon, input, and clear button sub-components', () => {
    const ctx = createMockContext();
    renderWithContext(ctx);
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    expect(screen.getByTestId('search-input-component')).toBeInTheDocument();
    expect(screen.getByTestId('search-clear')).toBeInTheDocument();
  });

  // --- Placeholder ---

  it('uses default localized placeholder when none provided', () => {
    const ctx = createMockContext();
    renderWithContext(ctx);
    expect(capturedSearchBarProps.placeholder).toBe('Search emoji...');
  });

  it('uses custom placeholder when provided', () => {
    const ctx = createMockContext();
    renderWithContext(ctx, { placeholder: 'Find an emoji' });
    expect(capturedSearchBarProps.placeholder).toBe('Find an emoji');
  });

  // --- Value binding ---

  it('passes searchQuery from context as value', () => {
    const ctx = createMockContext({ searchQuery: 'smile' });
    renderWithContext(ctx);
    expect(capturedSearchBarProps.value).toBe('smile');
  });

  // --- onChange ---

  it('calls setSearchQuery when input changes', () => {
    const setSearchQuery = vi.fn();
    const ctx = createMockContext({ setSearchQuery });
    renderWithContext(ctx);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'cat' } });
    expect(setSearchQuery).toHaveBeenCalledWith('cat');
  });

  it('calls setSearchQuery with empty string to clear', () => {
    const setSearchQuery = vi.fn();
    const ctx = createMockContext({ searchQuery: 'dog', setSearchQuery });
    renderWithContext(ctx);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: '' } });
    expect(setSearchQuery).toHaveBeenCalledWith('');
  });

  // --- className ---

  it('applies custom className', () => {
    const ctx = createMockContext();
    const { container } = renderWithContext(ctx, { className: 'my-search' });
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('my-search');
  });

  it('does not include undefined in className when no custom class is provided', () => {
    const ctx = createMockContext();
    const { container } = renderWithContext(ctx);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).not.toContain('undefined');
  });

  // --- Context requirement ---

  it('throws when used outside of context provider', () => {
    // Suppress React error boundary console output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(<CometChatEmojiKeyboardSearchBar />);
    }).toThrow(
      'useCometChatEmojiKeyboardContext must be used within <CometChatEmojiKeyboard.Root>'
    );
    spy.mockRestore();
  });
});
