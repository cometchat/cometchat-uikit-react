import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatListItem } from '../CometChatListItem';

/**
 * Helper: renders TrailingView inside Root.
 */
function renderTrailingView(
  rootProps: Partial<React.ComponentProps<typeof CometChatListItem.Root>> = {},
  trailingProps: Partial<React.ComponentProps<typeof CometChatListItem.TrailingView>> = {},
  children: React.ReactNode = <span data-testid="trailing-content">3:42 PM</span>
) {
  return render(
    <CometChatListItem.Root {...rootProps}>
      <CometChatListItem.Title>Title</CometChatListItem.Title>
      <CometChatListItem.TrailingView {...trailingProps}>{children}</CometChatListItem.TrailingView>
    </CometChatListItem.Root>
  );
}

describe('CometChatListItemTrailingView', () => {
  it('renders children when menu is not visible', () => {
    renderTrailingView();
    expect(screen.getByTestId('trailing-content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    renderTrailingView({}, { className: 'my-trailing-class' });
    const el = screen.getByTestId('trailing-content').parentElement!;
    expect(el.className).toContain('my-trailing-class');
  });

  it('renders without custom className', () => {
    renderTrailingView();
    const el = screen.getByTestId('trailing-content').parentElement!;
    expect(el).toBeInTheDocument();
    expect(el.className.length).toBeGreaterThan(0);
  });

  it('hides when menu becomes visible (on hover) and MenuView exists', () => {
    render(
      <CometChatListItem.Root>
        <CometChatListItem.Title>Title</CometChatListItem.Title>
        <CometChatListItem.TrailingView>
          <span data-testid="trailing-content">3:42 PM</span>
        </CometChatListItem.TrailingView>
        <CometChatListItem.MenuView>
          <button>⋮</button>
        </CometChatListItem.MenuView>
      </CometChatListItem.Root>
    );
    const root = screen.getByRole('option');

    expect(screen.getByTestId('trailing-content')).toBeInTheDocument();

    fireEvent.mouseEnter(root);
    expect(screen.queryByTestId('trailing-content')).not.toBeInTheDocument();
  });

  it('does NOT hide on hover when no MenuView exists', () => {
    renderTrailingView();
    const root = screen.getByRole('option');

    expect(screen.getByTestId('trailing-content')).toBeInTheDocument();

    fireEvent.mouseEnter(root);
    expect(screen.getByTestId('trailing-content')).toBeInTheDocument();
  });

  it('reappears when menu hides (on mouse leave)', () => {
    render(
      <CometChatListItem.Root>
        <CometChatListItem.Title>Title</CometChatListItem.Title>
        <CometChatListItem.TrailingView>
          <span data-testid="trailing-content">3:42 PM</span>
        </CometChatListItem.TrailingView>
        <CometChatListItem.MenuView>
          <button>⋮</button>
        </CometChatListItem.MenuView>
      </CometChatListItem.Root>
    );
    const root = screen.getByRole('option');

    fireEvent.mouseEnter(root);
    expect(screen.queryByTestId('trailing-content')).not.toBeInTheDocument();

    fireEvent.mouseLeave(root);
    expect(screen.getByTestId('trailing-content')).toBeInTheDocument();
  });

  it('hides when isFocused prop is true and MenuView exists', () => {
    render(
      <CometChatListItem.Root isFocused={true}>
        <CometChatListItem.Title>Title</CometChatListItem.Title>
        <CometChatListItem.TrailingView>
          <span data-testid="trailing-content">3:42 PM</span>
        </CometChatListItem.TrailingView>
        <CometChatListItem.MenuView>
          <button>⋮</button>
        </CometChatListItem.MenuView>
      </CometChatListItem.Root>
    );
    expect(screen.queryByTestId('trailing-content')).not.toBeInTheDocument();
  });

  it('does NOT hide when isFocused is true but no MenuView exists', () => {
    renderTrailingView({ isFocused: true });
    expect(screen.getByTestId('trailing-content')).toBeInTheDocument();
  });

  it('stops click propagation to the root', () => {
    const onItemClick = vi.fn();
    render(
      <CometChatListItem.Root onItemClick={onItemClick}>
        <CometChatListItem.Title>Title</CometChatListItem.Title>
        <CometChatListItem.TrailingView>
          <button data-testid="trailing-btn">Badge</button>
        </CometChatListItem.TrailingView>
      </CometChatListItem.Root>
    );
    fireEvent.click(screen.getByTestId('trailing-btn'));
    // The click on the trailing view's wrapper stops propagation,
    // but the button itself is interactive so Root's handleClick skips it anyway
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it('stops keyDown propagation to the root', () => {
    const onItemClick = vi.fn();
    render(
      <CometChatListItem.Root onItemClick={onItemClick}>
        <CometChatListItem.Title>Title</CometChatListItem.Title>
        <CometChatListItem.TrailingView>
          <input data-testid="trailing-input" />
        </CometChatListItem.TrailingView>
      </CometChatListItem.Root>
    );
    fireEvent.keyDown(screen.getByTestId('trailing-input'), { key: 'Enter' });
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it('throws when used outside of Root context', () => {
    // Suppress React error boundary console output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(
        <CometChatListItem.TrailingView>
          <span>Orphan</span>
        </CometChatListItem.TrailingView>
      );
    }).toThrow('useCometChatListItemContext must be used within <CometChatListItem.Root>');
    spy.mockRestore();
  });
});
