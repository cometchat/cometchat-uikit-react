import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatEmojiKeyboardEmojiGrid } from '../CometChatEmojiKeyboardEmojiGrid';
import type {
  CometChatEmojiKeyboardContextValue,
  CometChatEmojiKeyboardEmojiData,
} from '../CometChatEmojiKeyboard.types';
import { CometChatEmojiKeyboardContext } from '../CometChatEmojiKeyboard.context';

const mockEmojis: Record<string, CometChatEmojiKeyboardEmojiData> = {
  grinning: { char: '😀', keywords: ['face', 'smile'] },
  joy: { char: '😂', keywords: ['face', 'cry'] },
  'heart-eyes': { char: '😍', keywords: ['face', 'love'] },
  dog: { char: '🐶', keywords: ['dog', 'pet'] },
  cat: { char: '🐱', keywords: ['cat', 'pet'] },
};

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
  emojis: Record<string, CometChatEmojiKeyboardEmojiData>,
  ctx: CometChatEmojiKeyboardContextValue,
  props: { className?: string } = {}
) {
  return render(
    <CometChatEmojiKeyboardContext.Provider value={ctx}>
      <CometChatEmojiKeyboardEmojiGrid emojis={emojis} {...props} />
    </CometChatEmojiKeyboardContext.Provider>
  );
}

describe('CometChatEmojiKeyboardEmojiGrid', () => {
  // --- Rendering ---

  it('renders a grid with role="grid"', () => {
    const ctx = createMockContext();
    renderWithContext(mockEmojis, ctx);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('renders a gridcell for each emoji', () => {
    const ctx = createMockContext();
    renderWithContext(mockEmojis, ctx);
    const cells = screen.getAllByRole('gridcell');
    expect(cells).toHaveLength(5);
  });

  it('renders emoji characters in the grid cells', () => {
    const ctx = createMockContext();
    renderWithContext(mockEmojis, ctx);
    expect(screen.getByText('😀')).toBeInTheDocument();
    expect(screen.getByText('😂')).toBeInTheDocument();
    expect(screen.getByText('😍')).toBeInTheDocument();
    expect(screen.getByText('🐶')).toBeInTheDocument();
    expect(screen.getByText('🐱')).toBeInTheDocument();
  });

  it('sets aria-label on each gridcell to the emoji name', () => {
    const ctx = createMockContext();
    renderWithContext(mockEmojis, ctx);
    const cells = screen.getAllByRole('gridcell');
    expect(cells[0]).toHaveAttribute('aria-label', 'grinning');
    expect(cells[1]).toHaveAttribute('aria-label', 'joy');
    expect(cells[3]).toHaveAttribute('aria-label', 'dog');
  });

  it('sets title on each gridcell to the emoji name', () => {
    const ctx = createMockContext();
    renderWithContext(mockEmojis, ctx);
    const cells = screen.getAllByRole('gridcell');
    expect(cells[0]).toHaveAttribute('title', 'grinning');
  });

  it('sets aria-colcount on the grid', () => {
    const ctx = createMockContext();
    renderWithContext(mockEmojis, ctx);
    expect(screen.getByRole('grid')).toHaveAttribute('aria-colcount', '8');
  });

  it('sets aria-colindex on each gridcell', () => {
    const ctx = createMockContext();
    renderWithContext(mockEmojis, ctx);
    const cells = screen.getAllByRole('gridcell');
    // aria-colindex is 1-based: (index % 8) + 1
    expect(cells[0]).toHaveAttribute('aria-colindex', '1');
    expect(cells[4]).toHaveAttribute('aria-colindex', '5');
  });

  // --- Roving tabindex ---

  it('sets tabIndex=0 on the first cell and -1 on others initially', () => {
    const ctx = createMockContext();
    renderWithContext(mockEmojis, ctx);
    const cells = screen.getAllByRole('gridcell');
    expect(cells[0]).toHaveAttribute('tabindex', '0');
    expect(cells[1]).toHaveAttribute('tabindex', '-1');
    expect(cells[2]).toHaveAttribute('tabindex', '-1');
  });

  // --- Click ---

  it('calls onEmojiClick with the emoji character when clicked', () => {
    const onEmojiClick = vi.fn();
    const ctx = createMockContext({ onEmojiClick });
    renderWithContext(mockEmojis, ctx);

    fireEvent.click(screen.getByText('😀'));
    expect(onEmojiClick).toHaveBeenCalledWith('😀');
  });

  it('calls onEmojiClick for different emojis', () => {
    const onEmojiClick = vi.fn();
    const ctx = createMockContext({ onEmojiClick });
    renderWithContext(mockEmojis, ctx);

    fireEvent.click(screen.getByText('🐶'));
    expect(onEmojiClick).toHaveBeenCalledWith('🐶');
  });

  // --- Keyboard navigation ---

  it('moves focus right on ArrowRight', () => {
    const ctx = createMockContext();
    renderWithContext(mockEmojis, ctx);
    const cells = screen.getAllByRole('gridcell');

    cells[0]!.focus();
    fireEvent.keyDown(cells[0]!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(cells[1]);
  });

  it('wraps focus to first cell on ArrowRight from last cell', () => {
    const ctx = createMockContext();
    renderWithContext(mockEmojis, ctx);
    const cells = screen.getAllByRole('gridcell');

    cells[4]!.focus();
    fireEvent.keyDown(cells[4]!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(cells[0]);
  });

  it('moves focus left on ArrowLeft', () => {
    const ctx = createMockContext();
    renderWithContext(mockEmojis, ctx);
    const cells = screen.getAllByRole('gridcell');

    cells[1]!.focus();
    fireEvent.keyDown(cells[1]!, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(cells[0]);
  });

  it('wraps focus to last cell on ArrowLeft from first cell', () => {
    const ctx = createMockContext();
    renderWithContext(mockEmojis, ctx);
    const cells = screen.getAllByRole('gridcell');

    cells[0]!.focus();
    fireEvent.keyDown(cells[0]!, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(cells[4]);
  });

  it('moves focus to first cell on Home', () => {
    const ctx = createMockContext();
    renderWithContext(mockEmojis, ctx);
    const cells = screen.getAllByRole('gridcell');

    cells[3]!.focus();
    fireEvent.keyDown(cells[3]!, { key: 'Home' });
    expect(document.activeElement).toBe(cells[0]);
  });

  it('moves focus to last cell on End', () => {
    const ctx = createMockContext();
    renderWithContext(mockEmojis, ctx);
    const cells = screen.getAllByRole('gridcell');

    cells[0]!.focus();
    fireEvent.keyDown(cells[0]!, { key: 'End' });
    expect(document.activeElement).toBe(cells[4]);
  });

  it('selects emoji on Enter key', () => {
    const onEmojiClick = vi.fn();
    const ctx = createMockContext({ onEmojiClick });
    renderWithContext(mockEmojis, ctx);
    const cells = screen.getAllByRole('gridcell');

    fireEvent.keyDown(cells[0]!, { key: 'Enter' });
    expect(onEmojiClick).toHaveBeenCalledWith('😀');
  });

  it('selects emoji on Space key', () => {
    const onEmojiClick = vi.fn();
    const ctx = createMockContext({ onEmojiClick });
    renderWithContext(mockEmojis, ctx);
    const cells = screen.getAllByRole('gridcell');

    fireEvent.keyDown(cells[2]!, { key: ' ' });
    expect(onEmojiClick).toHaveBeenCalledWith('😍');
  });

  it('does not call onEmojiClick on unrelated keys', () => {
    const onEmojiClick = vi.fn();
    const ctx = createMockContext({ onEmojiClick });
    renderWithContext(mockEmojis, ctx);
    const cells = screen.getAllByRole('gridcell');

    fireEvent.keyDown(cells[0]!, { key: 'a' });
    expect(onEmojiClick).not.toHaveBeenCalled();
  });

  // --- ArrowDown / ArrowUp ---

  it('moves focus down by GRID_COLUMNS (8) on ArrowDown, wrapping to top', () => {
    // With 5 emojis and GRID_COLUMNS=8, ArrowDown from index 0 would go to 8 which is >= 5,
    // so it wraps to index 0 % 8 = 0
    const ctx = createMockContext();
    renderWithContext(mockEmojis, ctx);
    const cells = screen.getAllByRole('gridcell');

    cells[0]!.focus();
    fireEvent.keyDown(cells[0]!, { key: 'ArrowDown' });
    // newIndex = 0 + 8 = 8, >= 5, so wraps to 0 % 8 = 0
    expect(document.activeElement).toBe(cells[0]);
  });

  it('moves focus up by GRID_COLUMNS (8) on ArrowUp, wrapping to bottom', () => {
    const ctx = createMockContext();
    renderWithContext(mockEmojis, ctx);
    const cells = screen.getAllByRole('gridcell');

    cells[0]!.focus();
    fireEvent.keyDown(cells[0]!, { key: 'ArrowUp' });
    // newIndex = 0 - 8 = -8, < 0
    // lastRowStart = floor(4/8)*8 = 0, newIndex = 0 + (0%8) = 0
    // Since 0 < 5, focus stays at 0
    expect(document.activeElement).toBe(cells[0]);
  });

  // --- Focus tracking ---

  it('updates focusedIndex on focus', () => {
    const ctx = createMockContext();
    renderWithContext(mockEmojis, ctx);
    const cells = screen.getAllByRole('gridcell');

    // Focus the third cell
    fireEvent.focus(cells[2]!);
    // Now the third cell should have tabIndex=0
    expect(cells[2]).toHaveAttribute('tabindex', '0');
  });

  // --- Empty grid ---

  it('renders an empty grid when no emojis provided', () => {
    const ctx = createMockContext();
    renderWithContext({}, ctx);
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.queryAllByRole('gridcell')).toHaveLength(0);
  });

  // --- className ---

  it('applies custom className', () => {
    const ctx = createMockContext();
    renderWithContext(mockEmojis, ctx, { className: 'my-grid' });
    const grid = screen.getByRole('grid');
    expect(grid.className).toContain('my-grid');
  });

  // --- Context requirement ---

  it('throws when used outside of context provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(<CometChatEmojiKeyboardEmojiGrid emojis={mockEmojis} />);
    }).toThrow(
      'useCometChatEmojiKeyboardContext must be used within <CometChatEmojiKeyboard.Root>'
    );
    spy.mockRestore();
  });
});
