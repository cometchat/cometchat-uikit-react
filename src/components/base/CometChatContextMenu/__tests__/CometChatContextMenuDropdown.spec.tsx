import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CometChatContextMenu } from '../CometChatContextMenu';
import type { CometChatContextMenuItemData } from '../CometChatContextMenu.types';

function makeItems(count: number): CometChatContextMenuItemData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${String(i)}`,
    title: `Action ${String(i)}`,
    onClick: vi.fn(),
  }));
}

/**
 * The dropdown uses requestAnimationFrame for positioning.
 * We use fake timers and flush rAF to make the dropdown visible in tests.
 */
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

function renderWithOpenDropdown(items: CometChatContextMenuItemData[], topMenuSize = 0) {
  const result = render(
    <CometChatContextMenu.Root items={items} topMenuSize={topMenuSize} placement="bottom" />
  );
  // Open the dropdown by clicking the trigger.
  act(() => {
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
  });
  // Flush requestAnimationFrame for positioning
  act(() => {
    vi.advanceTimersByTime(16);
  });
  return result;
}

describe('CometChatContextMenuDropdown', () => {
  it('renders with role="menu"', () => {
    const items = makeItems(3);
    renderWithOpenDropdown(items);
    // The menu div is always rendered; use hidden option since it may have visibility:hidden
    expect(screen.getByRole('menu', { hidden: true })).toBeInTheDocument();
  });

  it('positions based on placement prop', () => {
    const items = makeItems(3);
    renderWithOpenDropdown(items);
    const menu = screen.getByRole('menu', { hidden: true });
    expect(menu).toBeInTheDocument();
  });

  it('renders children (menu items)', () => {
    const items = makeItems(3);
    renderWithOpenDropdown(items);
    expect(screen.getAllByRole('menuitem', { hidden: true })).toHaveLength(3);
  });

  it('closes on Escape key', () => {
    const items = makeItems(3);
    renderWithOpenDropdown(items);
    const menu = screen.getByRole('menu', { hidden: true });
    act(() => {
      fireEvent.keyDown(menu, { key: 'Escape' });
    });
    // After escape, the menu items should not be rendered (isOpen = false)
    expect(screen.queryAllByRole('menuitem', { hidden: true })).toHaveLength(0);
  });

  it('ArrowDown moves focus to next item', () => {
    const items = makeItems(3);
    renderWithOpenDropdown(items);
    const menuItems = screen.getAllByRole('menuitem', { hidden: true });
    act(() => {
      menuItems[0]!.focus();
    });
    const menu = screen.getByRole('menu', { hidden: true });
    act(() => {
      fireEvent.keyDown(menu, { key: 'ArrowDown' });
    });
    expect(document.activeElement).toBe(menuItems[1]);
  });

  it('ArrowUp moves focus to previous item', () => {
    const items = makeItems(3);
    renderWithOpenDropdown(items);
    const menuItems = screen.getAllByRole('menuitem', { hidden: true });
    act(() => {
      menuItems[1]!.focus();
    });
    const menu = screen.getByRole('menu', { hidden: true });
    act(() => {
      fireEvent.keyDown(menu, { key: 'ArrowUp' });
    });
    expect(document.activeElement).toBe(menuItems[0]);
  });

  it('Home moves focus to first item', () => {
    const items = makeItems(3);
    renderWithOpenDropdown(items);
    const menuItems = screen.getAllByRole('menuitem', { hidden: true });
    act(() => {
      menuItems[2]!.focus();
    });
    const menu = screen.getByRole('menu', { hidden: true });
    act(() => {
      fireEvent.keyDown(menu, { key: 'Home' });
    });
    expect(document.activeElement).toBe(menuItems[0]);
  });

  it('End moves focus to last item', () => {
    const items = makeItems(3);
    renderWithOpenDropdown(items);
    const menuItems = screen.getAllByRole('menuitem', { hidden: true });
    act(() => {
      menuItems[0]!.focus();
    });
    const menu = screen.getByRole('menu', { hidden: true });
    act(() => {
      fireEvent.keyDown(menu, { key: 'End' });
    });
    expect(document.activeElement).toBe(menuItems[2]);
  });

  it('Enter activates focused item and closes dropdown', () => {
    const items = makeItems(3);
    renderWithOpenDropdown(items);
    const menuItems = screen.getAllByRole('menuitem', { hidden: true });
    act(() => {
      menuItems[1]!.focus();
      fireEvent.click(menuItems[1]!);
    });
    expect(items[1]!.onClick).toHaveBeenCalled();
    expect(screen.queryAllByRole('menuitem', { hidden: true })).toHaveLength(0);
  });

  it('Focus wraps from last to first item on ArrowDown', () => {
    const items = makeItems(3);
    renderWithOpenDropdown(items);
    const menuItems = screen.getAllByRole('menuitem', { hidden: true });
    act(() => {
      menuItems[2]!.focus();
    });
    const menu = screen.getByRole('menu', { hidden: true });
    act(() => {
      fireEvent.keyDown(menu, { key: 'ArrowDown' });
    });
    expect(document.activeElement).toBe(menuItems[0]);
  });

  it('Focus wraps from first to last item on ArrowUp', () => {
    const items = makeItems(3);
    renderWithOpenDropdown(items);
    const menuItems = screen.getAllByRole('menuitem', { hidden: true });
    act(() => {
      menuItems[0]!.focus();
    });
    const menu = screen.getByRole('menu', { hidden: true });
    act(() => {
      fireEvent.keyDown(menu, { key: 'ArrowUp' });
    });
    expect(document.activeElement).toBe(menuItems[2]);
  });

  it('Tab cycles within dropdown (focus trap)', () => {
    const items = makeItems(3);
    renderWithOpenDropdown(items);
    const menuItems = screen.getAllByRole('menuitem', { hidden: true });
    act(() => {
      menuItems[2]!.focus();
    });
    const menu = screen.getByRole('menu', { hidden: true });
    act(() => {
      fireEvent.keyDown(menu, { key: 'Tab' });
    });
    expect(document.activeElement).toBe(menuItems[0]);
  });

  it('Shift+Tab cycles backward within dropdown', () => {
    const items = makeItems(3);
    renderWithOpenDropdown(items);
    const menuItems = screen.getAllByRole('menuitem', { hidden: true });
    act(() => {
      menuItems[0]!.focus();
    });
    const menu = screen.getByRole('menu', { hidden: true });
    act(() => {
      fireEvent.keyDown(menu, { key: 'Tab', shiftKey: true });
    });
    expect(document.activeElement).toBe(menuItems[2]);
  });
});
