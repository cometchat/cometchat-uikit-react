import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatContextMenu } from '../CometChatContextMenu';
import type { CometChatContextMenuItemData } from '../CometChatContextMenu.types';

function makeItems(count: number): CometChatContextMenuItemData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${String(i)}`,
    title: `Action ${String(i)}`,
    onClick: vi.fn(),
  }));
}

describe('CometChatContextMenuTrigger', () => {
  it('renders the "more" icon button', () => {
    const items = makeItems(5);
    render(<CometChatContextMenu.Root items={items} topMenuSize={2} />);
    expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
  });

  it('sets aria-haspopup="true" on the button', () => {
    const items = makeItems(5);
    render(<CometChatContextMenu.Root items={items} topMenuSize={2} />);
    expect(screen.getByRole('button', { name: 'More options' })).toHaveAttribute(
      'aria-haspopup',
      'true'
    );
  });

  it('sets aria-expanded based on dropdown open state', () => {
    const items = makeItems(5);
    render(<CometChatContextMenu.Root items={items} topMenuSize={2} />);
    const trigger = screen.getByRole('button', { name: 'More options' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('toggles dropdown on click', () => {
    const items = makeItems(5);
    render(<CometChatContextMenu.Root items={items} topMenuSize={2} />);
    const trigger = screen.getByRole('button', { name: 'More options' });
    fireEvent.click(trigger);
    expect(screen.getByRole('menu', { hidden: true })).toBeInTheDocument();
    fireEvent.click(trigger);
    // After closing, menu items should not be rendered
    expect(screen.queryAllByRole('menuitem', { hidden: true })).toHaveLength(0);
  });

  it('opens dropdown on ArrowDown key', () => {
    const items = makeItems(5);
    render(<CometChatContextMenu.Root items={items} topMenuSize={2} />);
    const trigger = screen.getByRole('button', { name: 'More options' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByRole('menu', { hidden: true })).toBeInTheDocument();
  });

  it('applies tooltip text', () => {
    const items = makeItems(5);
    render(
      <CometChatContextMenu.Root items={items} topMenuSize={2} moreButtonTooltip="Show more" />
    );
    const trigger = screen.getByRole('button', { name: 'Show more' });
    expect(trigger).toHaveAttribute('title', 'Show more');
  });

  it('renders custom children when provided', () => {
    render(
      <CometChatContextMenu.Root items={[]} topMenuSize={0}>
        <CometChatContextMenu.Trigger>
          <span data-testid="custom-trigger">⋯</span>
        </CometChatContextMenu.Trigger>
      </CometChatContextMenu.Root>
    );
    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
  });
});
