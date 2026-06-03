import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CometChatContextMenu } from '../CometChatContextMenu';
import type { CometChatContextMenuItemData } from '../CometChatContextMenu.types';

expect.extend(toHaveNoViolations);

function makeItems(count: number): CometChatContextMenuItemData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${String(i)}`,
    title: `Action ${String(i)}`,
    icon: <span>🔧</span>,
    onClick: vi.fn(),
  }));
}

describe('CometChatContextMenu a11y', () => {
  it('passes axe audit with dropdown closed', async () => {
    const items = makeItems(5);
    const { container } = render(<CometChatContextMenu.Root items={items} topMenuSize={2} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe audit with dropdown open', async () => {
    const items = makeItems(5);
    const { container } = render(<CometChatContextMenu.Root items={items} topMenuSize={2} />);
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Escape key closes the dropdown', () => {
    const items = makeItems(5);
    render(<CometChatContextMenu.Root items={items} topMenuSize={2} />);
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    expect(screen.getByRole('menu', { hidden: true })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('menu', { hidden: true }), { key: 'Escape' });
    // After escape, menu items should not be rendered
    expect(screen.queryAllByRole('menuitem', { hidden: true })).toHaveLength(0);
  });

  it('Tab key cycles through items without escaping the dropdown', () => {
    const items = makeItems(5);
    render(<CometChatContextMenu.Root items={items} topMenuSize={2} />);
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    const menuItems = screen.getAllByRole('menuitem', { hidden: true });
    menuItems[menuItems.length - 1]!.focus();
    fireEvent.keyDown(screen.getByRole('menu', { hidden: true }), { key: 'Tab' });
    // Should wrap to first item.
    expect(document.activeElement).toBe(menuItems[0]);
  });

  it('all icon-only buttons have aria-label', () => {
    const items = makeItems(5);
    render(<CometChatContextMenu.Root items={items} topMenuSize={3} />);
    // Top-row icon buttons.
    const topButtons = screen.getAllByRole('button', { name: /Action [0-2]/ });
    topButtons.forEach(btn => {
      expect(btn).toHaveAttribute('aria-label');
    });
    // Trigger button.
    expect(screen.getByRole('button', { name: 'More options' })).toHaveAttribute('aria-label');
  });

  it('dropdown items have role="menuitem"', () => {
    const items = makeItems(5);
    render(<CometChatContextMenu.Root items={items} topMenuSize={2} />);
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    const menuItems = screen.getAllByRole('menuitem', { hidden: true });
    expect(menuItems).toHaveLength(3);
  });

  it('trigger has aria-haspopup and aria-expanded', () => {
    const items = makeItems(5);
    render(<CometChatContextMenu.Root items={items} topMenuSize={2} />);
    const trigger = screen.getByRole('button', { name: 'More options' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('dropdown has role="menu" and aria-label', () => {
    const items = makeItems(5);
    render(<CometChatContextMenu.Root items={items} topMenuSize={2} />);
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    const menu = screen.getByRole('menu', { hidden: true });
    expect(menu).toHaveAttribute('aria-label', 'Context menu options');
  });
});
