import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CometChatDeleteBubble } from '../CometChatDeleteBubble';

describe('CometChatDeleteBubble', () => {
  it('renders default localized text', () => {
    // Without a LocaleProvider, useLocale() returns the default t() which returns the key.
    // The key "message_deleted" is the fallback.
    render(<CometChatDeleteBubble />);
    const bubble = screen.getByRole('status');
    expect(bubble).toBeInTheDocument();
  });

  it('renders custom text when provided', () => {
    render(<CometChatDeleteBubble text="Custom deleted text" />);
    expect(screen.getByText('Custom deleted text')).toBeInTheDocument();
  });

  it('has role="status"', () => {
    render(<CometChatDeleteBubble text="Deleted" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-label matching the display text', () => {
    render(<CometChatDeleteBubble text="This message was deleted" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'This message was deleted');
  });

  it('renders the delete icon with aria-hidden', () => {
    const { container } = render(<CometChatDeleteBubble text="Deleted" />);
    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('applies sender class when isSentByMe is true', () => {
    const { container } = render(<CometChatDeleteBubble isSentByMe text="Deleted" />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('sender');
  });

  it('applies receiver class when isSentByMe is false', () => {
    const { container } = render(<CometChatDeleteBubble isSentByMe={false} text="Deleted" />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('receiver');
  });

  it('applies custom className', () => {
    const { container } = render(<CometChatDeleteBubble text="Deleted" className="custom-class" />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('custom-class');
  });
});
