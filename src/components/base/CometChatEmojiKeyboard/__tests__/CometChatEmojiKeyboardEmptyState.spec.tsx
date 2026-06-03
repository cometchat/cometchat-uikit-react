import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatEmojiKeyboardEmptyState } from '../CometChatEmojiKeyboardEmptyState';

describe('CometChatEmojiKeyboardEmptyState', () => {
  it('renders default "No emojis found" text when no children provided', () => {
    render(<CometChatEmojiKeyboardEmptyState />);
    expect(screen.getByText('emoji_keyboard_empty')).toBeInTheDocument();
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
});
