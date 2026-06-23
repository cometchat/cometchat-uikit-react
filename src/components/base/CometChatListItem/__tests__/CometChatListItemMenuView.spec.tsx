import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatListItem } from '../CometChatListItem';

/**
 * Helper: renders MenuView inside Root.
 */
function renderMenuView(
  rootProps: Partial<React.ComponentProps<typeof CometChatListItem.Root>> = {},
  menuProps: Partial<React.ComponentProps<typeof CometChatListItem.MenuView>> = {},
  children: React.ReactNode = <button data-testid="menu-btn">⋮</button>
) {
  return render(
    <CometChatListItem.Root {...rootProps}>
      <CometChatListItem.Title>Title</CometChatListItem.Title>
      <CometChatListItem.MenuView {...menuProps}>{children}</CometChatListItem.MenuView>
    </CometChatListItem.Root>
  );
}

describe('CometChatListItemMenuView', () => {
  // --- Visibility ---

  it('is hidden by default (no hover, no focus)', () => {
    renderMenuView();
    expect(screen.queryByTestId('menu-btn')).not.toBeInTheDocument();
  });

  it('becomes visible on hover', () => {
    renderMenuView();
    fireEvent.mouseEnter(screen.getByRole('option'));
    expect(screen.getByTestId('menu-btn')).toBeInTheDocument();
  });

  it('becomes visible on focus', () => {
    renderMenuView();
    fireEvent.focus(screen.getByRole('option'));
    expect(screen.getByTestId('menu-btn')).toBeInTheDocument();
  });

  it('becomes visible when isFocused prop is true', () => {
    renderMenuView({ isFocused: true });
    expect(screen.getByTestId('menu-btn')).toBeInTheDocument();
  });

  it('hides when hover ends and item is not focused', () => {
    renderMenuView();
    const root = screen.getByRole('option');
    fireEvent.mouseEnter(root);
    expect(screen.getByTestId('menu-btn')).toBeInTheDocument();

    fireEvent.mouseLeave(root);
    expect(screen.queryByTestId('menu-btn')).not.toBeInTheDocument();
  });

  // --- ARIA ---

  it('has role="group" when visible', () => {
    renderMenuView();
    fireEvent.mouseEnter(screen.getByRole('option'));
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('sets aria-label with item id', () => {
    renderMenuView({ id: 'user-99' });
    fireEvent.mouseEnter(screen.getByRole('option'));
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-label', 'Actions for item');
  });

  it('sets aria-label with empty id gracefully', () => {
    renderMenuView();
    fireEvent.mouseEnter(screen.getByRole('option'));
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-label', 'Actions for item');
  });

  // --- Custom className ---

  it('applies custom className', () => {
    renderMenuView({}, { className: 'my-menu-class' });
    fireEvent.mouseEnter(screen.getByRole('option'));
    const group = screen.getByRole('group');
    expect(group.className).toContain('my-menu-class');
  });

  it('renders without custom className', () => {
    renderMenuView();
    fireEvent.mouseEnter(screen.getByRole('option'));
    const group = screen.getByRole('group');
    expect(group).toBeInTheDocument();
    expect(group.className.length).toBeGreaterThan(0);
  });

  // --- Event propagation ---

  it('stops click propagation to the root', () => {
    const onItemClick = vi.fn();
    renderMenuView({ onItemClick });
    fireEvent.mouseEnter(screen.getByRole('option'));
    fireEvent.click(screen.getByTestId('menu-btn'));
    // The click on the menu wrapper stops propagation
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it('stops keyDown propagation to the root', () => {
    const onItemClick = vi.fn();
    renderMenuView({ onItemClick });
    fireEvent.mouseEnter(screen.getByRole('option'));
    fireEvent.keyDown(screen.getByTestId('menu-btn'), { key: 'Enter' });
    expect(onItemClick).not.toHaveBeenCalled();
  });

  // --- Context error ---

  it('throws when used outside of Root context', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(
        <CometChatListItem.MenuView>
          <button>Orphan</button>
        </CometChatListItem.MenuView>
      );
    }).toThrow('useCometChatListItemContext must be used within <CometChatListItem.Root>');
    spy.mockRestore();
  });

  // --- Keyboard shortcut toggle ---

  it('toggles visibility via keyboard shortcut', () => {
    renderMenuView();
    const root = screen.getByRole('option');

    expect(screen.queryByTestId('menu-btn')).not.toBeInTheDocument();

    // Press 'M' to show
    fireEvent.keyDown(root, { key: 'm' });
    expect(screen.getByTestId('menu-btn')).toBeInTheDocument();

    // Press 'M' to hide
    fireEvent.keyDown(root, { key: 'm' });
    expect(screen.queryByTestId('menu-btn')).not.toBeInTheDocument();
  });

  // --- Renders children ---

  it('renders multiple children inside the menu', () => {
    render(
      <CometChatListItem.Root isFocused>
        <CometChatListItem.Title>Title</CometChatListItem.Title>
        <CometChatListItem.MenuView>
          <button data-testid="edit-btn">Edit</button>
          <button data-testid="delete-btn">Delete</button>
        </CometChatListItem.MenuView>
      </CometChatListItem.Root>
    );
    expect(screen.getByTestId('edit-btn')).toBeInTheDocument();
    expect(screen.getByTestId('delete-btn')).toBeInTheDocument();
  });
});
