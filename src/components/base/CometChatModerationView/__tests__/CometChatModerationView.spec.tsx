import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatModerationView } from '../CometChatModerationView';

import { vi } from 'vitest';

vi.mock('../../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    language: 'en-us',
  }),
}));

describe('CometChatModerationView', () => {
  it('renders with role="status"', () => {
    render(<CometChatModerationView />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live="polite"', () => {
    render(<CometChatModerationView />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('renders the default localized message when no message prop', () => {
    render(<CometChatModerationView />);
    expect(screen.getByText('moderation_block_message')).toBeInTheDocument();
  });

  it('renders custom message when provided', () => {
    render(<CometChatModerationView message="This content was blocked" />);
    expect(screen.getByText('This content was blocked')).toBeInTheDocument();
  });

  it('renders an icon with aria-hidden="true"', () => {
    const { container } = render(<CometChatModerationView />);
    const icon = container.querySelector('.cometchat-moderation-view__icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies custom className', () => {
    const { container } = render(<CometChatModerationView className="my-class" />);
    expect(container.firstChild).toHaveClass('my-class');
  });

  it('always includes the base class', () => {
    const { container } = render(<CometChatModerationView />);
    expect(container.firstChild).toHaveClass('cometchat-moderation-view');
  });

  it('renders the message in a paragraph element', () => {
    render(<CometChatModerationView message="Blocked" />);
    const p = screen.getByText('Blocked');
    expect(p.tagName).toBe('P');
  });
});
