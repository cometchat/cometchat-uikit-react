import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatAvatarContext } from '../CometChatAvatar.context';
import { CometChatAvatarInitials } from '../CometChatAvatarInitials';
import type { CometChatAvatarContextValue } from '../CometChatAvatar.types';

function createCtx(
  overrides: Partial<CometChatAvatarContextValue> = {}
): CometChatAvatarContextValue {
  return {
    name: 'John Doe',
    image: '',
    size: 'medium',
    imageLoaded: false,
    imageError: false,
    ...overrides,
  };
}

function renderInitials(ctx?: Partial<CometChatAvatarContextValue>, className?: string) {
  return render(
    <CometChatAvatarContext.Provider value={createCtx(ctx)}>
      <CometChatAvatarInitials className={className} />
    </CometChatAvatarContext.Provider>
  );
}

describe('CometChatAvatarInitials', () => {
  it('renders initials from a two-word name', () => {
    renderInitials({ name: 'John Doe' });
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders first 2 characters for a single-word name', () => {
    renderInitials({ name: 'Admin' });
    expect(screen.getByText('AD')).toBeInTheDocument();
  });

  it('renders empty string for empty name', () => {
    const { container } = renderInitials({ name: '' });
    const span = container.querySelector('span');
    expect(span?.textContent).toBe('');
  });

  it('has aria-label with the full name', () => {
    renderInitials({ name: 'John Doe' });
    expect(screen.getByText('JD')).toHaveAttribute('aria-label', 'John Doe');
  });

  it('applies custom className', () => {
    renderInitials({}, 'initials-extra');
    expect(screen.getByText('JD').className).toContain('initials-extra');
  });

  it('hides when image loaded successfully', () => {
    const { container } = renderInitials({
      image: 'https://example.com/avatar.png',
      imageLoaded: true,
      imageError: false,
    });
    expect(container.innerHTML).toBe('');
  });

  it('shows when image failed to load', () => {
    renderInitials({
      name: 'John Doe',
      image: 'https://example.com/avatar.png',
      imageLoaded: false,
      imageError: true,
    });
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});
