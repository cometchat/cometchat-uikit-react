import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatSearchBar } from '../CometChatSearchBar';

function renderFull(rootProps: Partial<React.ComponentProps<typeof CometChatSearchBar.Root>> = {}) {
  return render(
    <CometChatSearchBar.Root {...rootProps}>
      <CometChatSearchBar.Icon />
      <CometChatSearchBar.Input />
      <CometChatSearchBar.ClearButton />
    </CometChatSearchBar.Root>
  );
}

describe('CometChatSearchBar accessibility', () => {
  it('root container has role="search" landmark', () => {
    renderFull();
    const search = screen.getByRole('search');
    expect(search).toBeTruthy();
  });

  it('input has role="searchbox" and aria-label', () => {
    renderFull({ placeholderText: 'Search users' });
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-label', 'Search users');
  });

  it('clear button has aria-label', () => {
    renderFull({ searchText: 'test' });
    const btn = screen.getByRole('button', { name: 'Clear search' });
    expect(btn).toHaveAttribute('aria-label', 'Clear search');
  });

  it('disabled state applies disabled attribute on input', () => {
    renderFull({ disabled: true });
    const input = screen.getByRole('searchbox');
    expect(input).toBeDisabled();
  });

  it('search icon is decorative (aria-hidden="true")', () => {
    const { container } = renderFull();
    const icon = container.querySelector('[class*="cometchat-search-bar__icon"]');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('tab order is logical: icon (not focusable) → input → clear button', () => {
    const { container } = renderFull({ searchText: 'text' });
    const icon = container.querySelector('[class*="cometchat-search-bar__icon"]');
    const input = screen.getByRole('searchbox');
    const clearBtn = screen.getByRole('button', { name: 'Clear search' });

    // Icon should not be focusable.
    expect(icon?.getAttribute('tabindex')).toBeNull();

    // Input should be focusable (no negative tabindex).
    expect(input.tabIndex).toBe(0);

    // Clear button should be focusable when value is present.
    expect(clearBtn.tabIndex).toBe(0);
  });

  it('clear button is not in tab order when input is empty', () => {
    const { container } = renderFull({ searchText: '' });
    const clearBtn = container.querySelector('button[aria-label="Clear search"]');
    expect(clearBtn).toBeTruthy();
    expect(clearBtn!.tabIndex).toBe(-1);
  });
});
