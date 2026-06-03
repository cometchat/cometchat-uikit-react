import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatListItem } from '../CometChatListItem';

function renderRoot(props: Partial<React.ComponentProps<typeof CometChatListItem.Root>> = {}) {
  const defaultProps: React.ComponentProps<typeof CometChatListItem.Root> = {
    children: <CometChatListItem.Title>Test Item</CometChatListItem.Title>,
    ...props,
  };
  return render(<CometChatListItem.Root {...defaultProps} />);
}

describe('CometChatListItemRoot', () => {
  // --- Rendering ---

  it('renders with role="option"', () => {
    renderRoot();
    expect(screen.getByRole('option')).toBeInTheDocument();
  });

  it('renders children inside the component', () => {
    renderRoot();
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  it('applies custom className to the root element', () => {
    renderRoot({ className: 'my-custom-class' });
    const root = screen.getByRole('option');
    expect(root.className).toContain('my-custom-class');
  });

  it('sets the id attribute when provided', () => {
    renderRoot({ id: 'user-42' });
    const root = screen.getByRole('option');
    expect(root).toHaveAttribute('id', 'user-42');
  });

  it('sets aria-label when provided', () => {
    renderRoot({ 'aria-label': 'Chat with Alice' });
    const root = screen.getByRole('option');
    expect(root).toHaveAttribute('aria-label', 'Chat with Alice');
  });

  it('has tabIndex=0 by default', () => {
    renderRoot();
    const root = screen.getByRole('option');
    expect(root).toHaveAttribute('tabindex', '0');
  });

  it('has tabIndex=-1 when disableTabIndex is true', () => {
    renderRoot({ disableTabIndex: true });
    const root = screen.getByRole('option');
    expect(root).toHaveAttribute('tabindex', '-1');
  });

  // --- Active state ---

  it('sets aria-selected=false by default', () => {
    renderRoot();
    const root = screen.getByRole('option');
    expect(root).toHaveAttribute('aria-selected', 'false');
  });

  it('sets aria-selected=true when isActive is true', () => {
    renderRoot({ isActive: true });
    const root = screen.getByRole('option');
    expect(root).toHaveAttribute('aria-selected', 'true');
  });

  it('applies active class when isActive is true', () => {
    renderRoot({ isActive: true });
    const root = screen.getByRole('option');
    // CSS module hashes the class, but the className string should contain the active modifier
    expect(root.className).toMatch(/active/);
  });

  // --- Disabled state ---

  it('does not set aria-disabled by default', () => {
    renderRoot();
    const root = screen.getByRole('option');
    expect(root).not.toHaveAttribute('aria-disabled');
  });

  it('sets aria-disabled=true when disabled', () => {
    renderRoot({ disabled: true });
    const root = screen.getByRole('option');
    expect(root).toHaveAttribute('aria-disabled', 'true');
  });

  it('applies disabled class when disabled is true', () => {
    renderRoot({ disabled: true });
    const root = screen.getByRole('option');
    expect(root.className).toMatch(/disabled/);
  });

  // --- Click handler ---

  it('calls onItemClick when clicked', () => {
    const onItemClick = vi.fn();
    renderRoot({ onItemClick });
    fireEvent.click(screen.getByRole('option'));
    expect(onItemClick).toHaveBeenCalledOnce();
  });

  it('does not call onItemClick when disabled and clicked', () => {
    const onItemClick = vi.fn();
    renderRoot({ onItemClick, disabled: true });
    // disabled sets pointer-events: none in CSS, but we test the JS guard
    const root = screen.getByRole('option');
    // Manually dispatch click (bypasses pointer-events CSS)
    fireEvent.click(root);
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it('does not call onItemClick when clicking an interactive child element', () => {
    const onItemClick = vi.fn();
    render(
      <CometChatListItem.Root onItemClick={onItemClick}>
        <CometChatListItem.Title>Title</CometChatListItem.Title>
        <button data-testid="inner-btn">Click me</button>
      </CometChatListItem.Root>
    );
    fireEvent.click(screen.getByTestId('inner-btn'));
    expect(onItemClick).not.toHaveBeenCalled();
  });

  // --- Keyboard handler ---

  it('calls onItemClick on Enter key', () => {
    const onItemClick = vi.fn();
    renderRoot({ onItemClick });
    const root = screen.getByRole('option');
    fireEvent.keyDown(root, { key: 'Enter' });
    expect(onItemClick).toHaveBeenCalledOnce();
  });

  it('calls onItemClick on Space key', () => {
    const onItemClick = vi.fn();
    renderRoot({ onItemClick });
    const root = screen.getByRole('option');
    fireEvent.keyDown(root, { key: ' ' });
    expect(onItemClick).toHaveBeenCalledOnce();
  });

  it('does not call onItemClick on Enter when disabled', () => {
    const onItemClick = vi.fn();
    renderRoot({ onItemClick, disabled: true });
    const root = screen.getByRole('option');
    fireEvent.keyDown(root, { key: 'Enter' });
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it('does not call onItemClick on Space when disabled', () => {
    const onItemClick = vi.fn();
    renderRoot({ onItemClick, disabled: true });
    const root = screen.getByRole('option');
    fireEvent.keyDown(root, { key: ' ' });
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it('ignores keyDown from a child element (not the root)', () => {
    const onItemClick = vi.fn();
    render(
      <CometChatListItem.Root onItemClick={onItemClick}>
        <CometChatListItem.Title>Title</CometChatListItem.Title>
        <input data-testid="inner-input" />
      </CometChatListItem.Root>
    );
    fireEvent.keyDown(screen.getByTestId('inner-input'), { key: 'Enter' });
    expect(onItemClick).not.toHaveBeenCalled();
  });

  // --- Menu shortcut key ---

  it('toggles menu visibility on default shortcut key "M"', () => {
    render(
      <CometChatListItem.Root>
        <CometChatListItem.Title>Title</CometChatListItem.Title>
        <CometChatListItem.MenuView>
          <button>Menu Action</button>
        </CometChatListItem.MenuView>
      </CometChatListItem.Root>
    );
    const root = screen.getByRole('option');

    // Menu should not be visible initially (no hover, no focus-triggered menu)
    expect(screen.queryByText('Menu Action')).not.toBeInTheDocument();

    // Press 'M' to toggle menu on
    fireEvent.keyDown(root, { key: 'm' });
    expect(screen.getByText('Menu Action')).toBeInTheDocument();

    // Press 'M' again to toggle menu off
    fireEvent.keyDown(root, { key: 'm' });
    expect(screen.queryByText('Menu Action')).not.toBeInTheDocument();
  });

  it('uses custom menuShortcutKey', () => {
    render(
      <CometChatListItem.Root menuShortcutKey="X">
        <CometChatListItem.Title>Title</CometChatListItem.Title>
        <CometChatListItem.MenuView>
          <button>Menu Action</button>
        </CometChatListItem.MenuView>
      </CometChatListItem.Root>
    );
    const root = screen.getByRole('option');

    // 'M' should not toggle menu
    fireEvent.keyDown(root, { key: 'm' });
    expect(screen.queryByText('Menu Action')).not.toBeInTheDocument();

    // 'X' should toggle menu
    fireEvent.keyDown(root, { key: 'x' });
    expect(screen.getByText('Menu Action')).toBeInTheDocument();
  });

  it('does not toggle menu when menuShortcutKey is null', () => {
    render(
      <CometChatListItem.Root menuShortcutKey={null}>
        <CometChatListItem.Title>Title</CometChatListItem.Title>
        <CometChatListItem.MenuView>
          <button>Menu Action</button>
        </CometChatListItem.MenuView>
      </CometChatListItem.Root>
    );
    const root = screen.getByRole('option');
    fireEvent.keyDown(root, { key: 'm' });
    expect(screen.queryByText('Menu Action')).not.toBeInTheDocument();
  });

  // --- Hover state ---

  it('shows menu on mouse enter and hides on mouse leave', () => {
    render(
      <CometChatListItem.Root>
        <CometChatListItem.Title>Title</CometChatListItem.Title>
        <CometChatListItem.MenuView>
          <button>Hover Menu</button>
        </CometChatListItem.MenuView>
      </CometChatListItem.Root>
    );
    const root = screen.getByRole('option');

    expect(screen.queryByText('Hover Menu')).not.toBeInTheDocument();

    fireEvent.mouseEnter(root);
    expect(screen.getByText('Hover Menu')).toBeInTheDocument();

    fireEvent.mouseLeave(root);
    expect(screen.queryByText('Hover Menu')).not.toBeInTheDocument();
  });

  it('does not show menu on hover when disabled', () => {
    render(
      <CometChatListItem.Root disabled>
        <CometChatListItem.Title>Title</CometChatListItem.Title>
        <CometChatListItem.MenuView>
          <button>Hover Menu</button>
        </CometChatListItem.MenuView>
      </CometChatListItem.Root>
    );
    const root = screen.getByRole('option');
    fireEvent.mouseEnter(root);
    expect(screen.queryByText('Hover Menu')).not.toBeInTheDocument();
  });

  // --- Focus state ---

  it('shows menu on focus and hides on blur', () => {
    render(
      <CometChatListItem.Root>
        <CometChatListItem.Title>Title</CometChatListItem.Title>
        <CometChatListItem.MenuView>
          <button>Focus Menu</button>
        </CometChatListItem.MenuView>
      </CometChatListItem.Root>
    );
    const root = screen.getByRole('option');

    expect(screen.queryByText('Focus Menu')).not.toBeInTheDocument();

    fireEvent.focus(root);
    expect(screen.getByText('Focus Menu')).toBeInTheDocument();

    fireEvent.blur(root);
    expect(screen.queryByText('Focus Menu')).not.toBeInTheDocument();
  });

  // --- isFocused prop ---

  it('shows menu when isFocused is true (parent-managed focus)', () => {
    render(
      <CometChatListItem.Root isFocused>
        <CometChatListItem.Title>Title</CometChatListItem.Title>
        <CometChatListItem.MenuView>
          <button>Focused Menu</button>
        </CometChatListItem.MenuView>
      </CometChatListItem.Root>
    );
    expect(screen.getByText('Focused Menu')).toBeInTheDocument();
  });

  // --- Child slot separation ---

  it('separates LeadingView, TrailingView, MenuView, and title children correctly', () => {
    render(
      <CometChatListItem.Root>
        <CometChatListItem.LeadingView>
          <span data-testid="avatar">AV</span>
        </CometChatListItem.LeadingView>
        <CometChatListItem.Title>John Doe</CometChatListItem.Title>
        <CometChatListItem.Subtitle>Online</CometChatListItem.Subtitle>
        <CometChatListItem.TrailingView>
          <span data-testid="badge">3</span>
        </CometChatListItem.TrailingView>
        <CometChatListItem.MenuView>
          <button>⋮</button>
        </CometChatListItem.MenuView>
      </CometChatListItem.Root>
    );

    expect(screen.getByTestId('avatar')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    // TrailingView is visible when menu is not visible (no hover)
    expect(screen.getByTestId('badge')).toBeInTheDocument();
    // MenuView is hidden when not hovered/focused
    expect(screen.queryByText('⋮')).not.toBeInTheDocument();
  });

  // --- TrailingView / MenuView toggle ---

  it('hides TrailingView and shows MenuView on hover', () => {
    render(
      <CometChatListItem.Root>
        <CometChatListItem.Title>Title</CometChatListItem.Title>
        <CometChatListItem.TrailingView>
          <span data-testid="trailing">3:42 PM</span>
        </CometChatListItem.TrailingView>
        <CometChatListItem.MenuView>
          <button data-testid="menu">⋮</button>
        </CometChatListItem.MenuView>
      </CometChatListItem.Root>
    );

    // Before hover: trailing visible, menu hidden
    expect(screen.getByTestId('trailing')).toBeInTheDocument();
    expect(screen.queryByTestId('menu')).not.toBeInTheDocument();

    // Hover: trailing hidden, menu visible
    fireEvent.mouseEnter(screen.getByRole('option'));
    expect(screen.queryByTestId('trailing')).not.toBeInTheDocument();
    expect(screen.getByTestId('menu')).toBeInTheDocument();

    // Leave: trailing visible, menu hidden
    fireEvent.mouseLeave(screen.getByRole('option'));
    expect(screen.getByTestId('trailing')).toBeInTheDocument();
    expect(screen.queryByTestId('menu')).not.toBeInTheDocument();
  });

  // --- Menu keeps visible when focused during hover leave ---

  it('keeps menu visible after mouse leave if list item is focused', () => {
    render(
      <CometChatListItem.Root>
        <CometChatListItem.Title>Title</CometChatListItem.Title>
        <CometChatListItem.MenuView>
          <button>Menu</button>
        </CometChatListItem.MenuView>
      </CometChatListItem.Root>
    );
    const root = screen.getByRole('option');

    // Focus the item first
    fireEvent.focus(root);
    expect(screen.getByText('Menu')).toBeInTheDocument();

    // Hover and then leave — menu should stay because item is focused
    fireEvent.mouseEnter(root);
    fireEvent.mouseLeave(root);
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  // --- Hover keeps menu visible after blur ---

  it('keeps menu visible after blur if list item is hovered', () => {
    render(
      <CometChatListItem.Root>
        <CometChatListItem.Title>Title</CometChatListItem.Title>
        <CometChatListItem.MenuView>
          <button>Menu</button>
        </CometChatListItem.MenuView>
      </CometChatListItem.Root>
    );
    const root = screen.getByRole('option');

    // Hover the item first
    fireEvent.mouseEnter(root);
    expect(screen.getByText('Menu')).toBeInTheDocument();

    // Focus and then blur — menu should stay because item is hovered
    fireEvent.focus(root);
    fireEvent.blur(root);
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  // --- Renders without optional props ---

  it('renders without onItemClick', () => {
    renderRoot();
    const root = screen.getByRole('option');
    // Should not throw when clicked without handler
    fireEvent.click(root);
    fireEvent.keyDown(root, { key: 'Enter' });
    expect(root).toBeInTheDocument();
  });

  it('renders without id', () => {
    renderRoot();
    const root = screen.getByRole('option');
    expect(root).not.toHaveAttribute('id');
  });
});
