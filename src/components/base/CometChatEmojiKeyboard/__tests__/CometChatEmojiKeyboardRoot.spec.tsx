import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatEmojiKeyboardRoot } from '../CometChatEmojiKeyboardRoot';
import type { CometChatEmojiKeyboardCategoryData } from '../CometChatEmojiKeyboard.types';

// Mock useLocale
vi.mock('../../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    language: 'en-us',
  }),
}));

// Mock the emoji data to avoid loading the full dataset
vi.mock('../CometChatEmojiData', () => ({
  getDefaultEmojiCategories: (): CometChatEmojiKeyboardCategoryData[] => [
    {
      id: 'people',
      name: 'Smileys & People',
      symbolURL: 'https://example.com/smileys.svg',
      emojis: {
        grinning: { char: '😀', keywords: ['face', 'smile', 'happy', 'joy'] },
        joy: { char: '😂', keywords: ['face', 'cry', 'tears', 'happy'] },
        'heart-eyes': { char: '😍', keywords: ['face', 'love', 'heart'] },
      },
    },
    {
      id: 'animals',
      name: 'Animals & Nature',
      emojis: {
        dog: { char: '🐶', keywords: ['dog', 'pet', 'animal'] },
        cat: { char: '🐱', keywords: ['cat', 'pet', 'animal'] },
      },
    },
  ],
}));

// Mock CometChatSearchBar to avoid deep dependency chain
vi.mock('../../CometChatSearchBar', () => ({
  CometChatSearchBar: {
    Root: ({
      children,
      value,
      onChange,
      placeholder,
    }: {
      children: React.ReactNode;
      value: string;
      onChange: (v: string) => void;
      placeholder: string;
    }) => (
      <div data-testid="search-bar-root">
        <input
          data-testid="search-input"
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {children}
      </div>
    ),
    Icon: () => <span data-testid="search-icon" />,
    Input: () => <span data-testid="search-input-component" />,
    ClearButton: () => <button data-testid="search-clear">Clear</button>,
  },
}));

describe('CometChatEmojiKeyboardRoot', () => {
  // --- Rendering ---

  it('renders a dialog with role="dialog"', () => {
    render(<CometChatEmojiKeyboardRoot />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('sets aria-label="Emoji keyboard" on the dialog', () => {
    render(<CometChatEmojiKeyboardRoot />);
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'aria-label',
      'accessibility_emoji_keyboard'
    );
  });

  it('sets aria-modal="true" on the dialog', () => {
    render(<CometChatEmojiKeyboardRoot />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  // --- Default layout ---

  it('renders default layout (search, tabs, categories) when no children provided', () => {
    render(<CometChatEmojiKeyboardRoot />);
    // Should render search bar
    expect(screen.getByTestId('search-bar-root')).toBeInTheDocument();
    // Should render tablist
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    // Should render category sections with titles
    expect(screen.getByText('Smileys & People')).toBeInTheDocument();
    expect(screen.getByText('Animals & Nature')).toBeInTheDocument();
  });

  it('renders all emoji characters in default layout', () => {
    render(<CometChatEmojiKeyboardRoot />);
    // Emojis in the grid have role="gridcell"
    const gridCells = screen.getAllByRole('gridcell');
    expect(gridCells).toHaveLength(5);
    expect(gridCells[0]).toHaveTextContent('😀');
    expect(gridCells[1]).toHaveTextContent('😂');
    expect(gridCells[2]).toHaveTextContent('😍');
    expect(gridCells[3]).toHaveTextContent('🐶');
    expect(gridCells[4]).toHaveTextContent('🐱');
  });

  // --- Custom children ---

  it('renders custom children instead of default layout', () => {
    render(
      <CometChatEmojiKeyboardRoot>
        <div data-testid="custom-child">Custom content</div>
      </CometChatEmojiKeyboardRoot>
    );
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    // Default layout should not be rendered
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  // --- Custom emojiData ---

  it('uses custom emojiData when provided', () => {
    const customData: CometChatEmojiKeyboardCategoryData[] = [
      {
        id: 'custom',
        name: 'Custom Category',
        emojis: {
          star: { char: '⭐', keywords: ['star'] },
        },
      },
    ];
    render(<CometChatEmojiKeyboardRoot emojiData={customData} />);
    expect(screen.getByText('Custom Category')).toBeInTheDocument();
    // ⭐ appears in both the tab and the grid, so use getAllByText
    const stars = screen.getAllByText('⭐');
    expect(stars.length).toBeGreaterThanOrEqual(1);
    // Default categories should not appear
    expect(screen.queryByText('Smileys & People')).not.toBeInTheDocument();
  });

  it('falls back to default data when emojiData is empty array', () => {
    render(<CometChatEmojiKeyboardRoot emojiData={[]} />);
    // Should use default data
    expect(screen.getByText('Smileys & People')).toBeInTheDocument();
  });

  // --- onEmojiClick ---

  it('calls onEmojiClick when an emoji is clicked', () => {
    const onEmojiClick = vi.fn();
    render(<CometChatEmojiKeyboardRoot onEmojiClick={onEmojiClick} />);

    fireEvent.click(screen.getByText('😀'));
    expect(onEmojiClick).toHaveBeenCalledWith('😀');
  });

  it('does not throw when onEmojiClick is not provided', () => {
    render(<CometChatEmojiKeyboardRoot />);
    expect(() => {
      fireEvent.click(screen.getByText('😀'));
    }).not.toThrow();
  });

  // --- className ---

  it('applies custom className to the root element', () => {
    render(<CometChatEmojiKeyboardRoot className="my-keyboard" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('my-keyboard');
  });

  it('does not include undefined in className when no custom class is provided', () => {
    render(<CometChatEmojiKeyboardRoot />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).not.toContain('undefined');
  });

  // --- Escape key ---

  it('calls onClose when Escape is pressed and no search query', () => {
    const onClose = vi.fn();
    render(<CometChatEmojiKeyboardRoot onClose={onClose} />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('clears search query on Escape when searching, does not call onClose', () => {
    const onClose = vi.fn();
    render(<CometChatEmojiKeyboardRoot onClose={onClose} />);

    // Type in the search to set a query
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'smile' } });

    // Now press Escape — should clear search, not close
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not throw when Escape is pressed without onClose', () => {
    render(<CometChatEmojiKeyboardRoot />);
    expect(() => {
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    }).not.toThrow();
  });

  // --- "/" key focuses search ---

  it('focuses search input when "/" is pressed outside of input', () => {
    render(<CometChatEmojiKeyboardRoot />);
    const dialog = screen.getByRole('dialog');
    const input = screen.getByTestId('search-input');

    // Press "/" on the dialog (not on an input)
    fireEvent.keyDown(dialog, { key: '/' });
    expect(document.activeElement).toBe(input);
  });

  // --- Search functionality ---

  it('shows search results when searching', () => {
    render(<CometChatEmojiKeyboardRoot />);
    const input = screen.getByTestId('search-input');

    // Search for "dog"
    fireEvent.change(input, { target: { value: 'dog' } });

    // 🐶 appears in both the tab icon and the search results grid
    const dogEmojis = screen.getAllByText('🐶');
    expect(dogEmojis.length).toBeGreaterThanOrEqual(1);
    // Verify a gridcell with the dog emoji exists in search results
    const gridCells = screen.getAllByRole('gridcell');
    expect(gridCells).toHaveLength(1);
    expect(gridCells[0]).toHaveTextContent('🐶');
  });

  it('shows empty state when search yields no results', () => {
    render(<CometChatEmojiKeyboardRoot />);
    const input = screen.getByTestId('search-input');

    // Search for something that doesn't match
    fireEvent.change(input, { target: { value: 'zzzznonexistent' } });

    expect(screen.getByText('emoji_keyboard_empty')).toBeInTheDocument();
  });

  // --- Context provision ---

  it('provides context to child sub-components (no throw)', () => {
    // If context wasn't provided, sub-components would throw.
    // Rendering the default layout successfully proves context is provided.
    render(<CometChatEmojiKeyboardRoot />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});
