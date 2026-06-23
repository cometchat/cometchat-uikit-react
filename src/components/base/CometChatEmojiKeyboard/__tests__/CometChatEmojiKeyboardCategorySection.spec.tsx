import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatEmojiKeyboardCategorySection } from '../CometChatEmojiKeyboardCategorySection';
import type { CometChatEmojiKeyboardCategoryData } from '../CometChatEmojiKeyboard.types';

// Mock useLocale to return a passthrough t()
vi.mock('../../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    language: 'en-us',
  }),
}));

// Mock the EmojiGrid sub-component to isolate CategorySection tests
vi.mock('../CometChatEmojiKeyboardEmojiGrid', () => ({
  CometChatEmojiKeyboardEmojiGrid: ({ emojis }: { emojis: Record<string, unknown> }) => (
    <div data-testid="emoji-grid">{Object.keys(emojis).length} emojis</div>
  ),
}));

const mockCategory: CometChatEmojiKeyboardCategoryData = {
  id: 'people',
  name: 'Smileys & People',
  emojis: {
    grinning: { char: '😀', keywords: ['face', 'smile'] },
    joy: { char: '😂', keywords: ['face', 'cry', 'tears'] },
  },
};

describe('CometChatEmojiKeyboardCategorySection', () => {
  it('renders the category title', () => {
    render(<CometChatEmojiKeyboardCategorySection category={mockCategory} />);
    expect(screen.getByText('Smileys & People')).toBeInTheDocument();
  });

  it('renders the emoji grid with the category emojis', () => {
    render(<CometChatEmojiKeyboardCategorySection category={mockCategory} />);
    expect(screen.getByTestId('emoji-grid')).toBeInTheDocument();
    expect(screen.getByText('2 emojis')).toBeInTheDocument();
  });

  it('sets the correct id on the section container', () => {
    const { container } = render(<CometChatEmojiKeyboardCategorySection category={mockCategory} />);
    const section = container.firstElementChild as HTMLElement;
    expect(section.id).toBe('emoji-panel-people');
  });

  it('sets the correct id on the category title element', () => {
    render(<CometChatEmojiKeyboardCategorySection category={mockCategory} />);
    const title = screen.getByText('Smileys & People');
    expect(title.id).toBe('emoji-cat-people');
  });

  it('sets title attribute on the category title element', () => {
    render(<CometChatEmojiKeyboardCategorySection category={mockCategory} />);
    const title = screen.getByText('Smileys & People');
    expect(title).toHaveAttribute('title', 'Smileys & People');
  });

  it('applies custom className alongside default class', () => {
    const { container } = render(
      <CometChatEmojiKeyboardCategorySection category={mockCategory} className="custom-section" />
    );
    const section = container.firstElementChild as HTMLElement;
    expect(section.className).toContain('custom-section');
  });

  it('does not include undefined in className when no custom class is provided', () => {
    const { container } = render(<CometChatEmojiKeyboardCategorySection category={mockCategory} />);
    const section = container.firstElementChild as HTMLElement;
    expect(section.className).not.toContain('undefined');
  });
});
