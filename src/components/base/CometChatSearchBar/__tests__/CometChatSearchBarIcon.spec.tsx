import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatSearchBar } from '../CometChatSearchBar';

function renderIcon(iconProps: Partial<React.ComponentProps<typeof CometChatSearchBar.Icon>> = {}) {
  return render(
    <CometChatSearchBar.Root>
      <CometChatSearchBar.Icon {...iconProps} />
      <CometChatSearchBar.Input />
    </CometChatSearchBar.Root>
  );
}

describe('CometChatSearchBarIcon', () => {
  it('renders the default search icon', () => {
    const { container } = renderIcon();
    const icon = container.querySelector('[class*="cometchat-search-bar__icon"]');
    expect(icon).toBeTruthy();
  });

  it('renders custom icon when icon prop is provided', () => {
    renderIcon({ icon: <span data-testid="custom-search-icon">🔍</span> });
    expect(screen.getByTestId('custom-search-icon')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = renderIcon({ className: 'my-icon' });
    const icon = container.querySelector('[class*="cometchat-search-bar__icon"]');
    expect(icon?.className).toContain('my-icon');
  });

  it('is decorative (not focusable, aria-hidden="true")', () => {
    const { container } = renderIcon();
    const icon = container.querySelector('[class*="cometchat-search-bar__icon"]');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});
