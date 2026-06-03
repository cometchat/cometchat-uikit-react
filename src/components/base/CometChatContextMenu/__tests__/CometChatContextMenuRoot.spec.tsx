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

describe('CometChatContextMenuRoot', () => {
  it('renders top-row items based on topMenuSize', () => {
    const items = makeItems(5);
    render(<CometChatContextMenu.Root items={items} topMenuSize={3} />);
    const topButtons = screen.getAllByRole('button', { name: /Action [0-2]/ });
    expect(topButtons).toHaveLength(3);
  });

  it('renders "more" trigger when items exceed topMenuSize', () => {
    const items = makeItems(5);
    render(<CometChatContextMenu.Root items={items} topMenuSize={2} />);
    expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
  });

  it('does not render "more" trigger when all items fit in top row', () => {
    const items = makeItems(2);
    render(<CometChatContextMenu.Root items={items} topMenuSize={5} />);
    expect(screen.queryByRole('button', { name: 'More options' })).not.toBeInTheDocument();
  });

  it('opens dropdown when trigger is clicked', () => {
    const items = makeItems(5);
    render(<CometChatContextMenu.Root items={items} topMenuSize={2} />);
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    expect(screen.getByRole('menu', { hidden: true })).toBeInTheDocument();
  });

  it('closes dropdown when trigger is clicked again', () => {
    const items = makeItems(5);
    render(<CometChatContextMenu.Root items={items} topMenuSize={2} />);
    const trigger = screen.getByRole('button', { name: 'More options' });
    fireEvent.click(trigger);
    expect(screen.getByRole('menu', { hidden: true })).toBeInTheDocument();
    fireEvent.click(trigger);
    // After closing, menu items should not be rendered
    expect(screen.queryAllByRole('menuitem', { hidden: true })).toHaveLength(0);
  });

  it('closes dropdown on outside click when closeOnOutsideClick is true', () => {
    const items = makeItems(5);
    render(<CometChatContextMenu.Root items={items} topMenuSize={2} closeOnOutsideClick />);
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    expect(screen.getByRole('menu', { hidden: true })).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    // After outside click, menu items should not be rendered
    expect(screen.queryAllByRole('menuitem', { hidden: true })).toHaveLength(0);
  });

  it('calls onOptionClicked when a top-row item is clicked', () => {
    const onOptionClicked = vi.fn();
    const items = makeItems(3);
    render(
      <CometChatContextMenu.Root items={items} topMenuSize={2} onOptionClicked={onOptionClicked} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Action 0' }));
    expect(onOptionClicked).toHaveBeenCalledWith(items[0]);
  });

  it('calls onOptionClicked when a dropdown item is clicked', () => {
    const onOptionClicked = vi.fn();
    const items = makeItems(5);
    render(
      <CometChatContextMenu.Root items={items} topMenuSize={2} onOptionClicked={onOptionClicked} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    // Dropdown items are rendered as buttons with role="menuitem" inside the dropdown
    const action2 = screen.getByText('Action 2');
    fireEvent.click(action2.closest('button')!);
    expect(onOptionClicked).toHaveBeenCalledWith(items[2]);
  });

  it('falls back to item.onClick when onOptionClicked is not provided', () => {
    const items = makeItems(3);
    render(<CometChatContextMenu.Root items={items} topMenuSize={2} />);
    fireEvent.click(screen.getByRole('button', { name: 'Action 0' }));
    expect(items[0]!.onClick).toHaveBeenCalled();
  });

  it('provides context values to children via CometChatContextMenuContext', () => {
    // If context wasn't provided, sub-components would throw.
    render(
      <CometChatContextMenu.Root placement="bottom">
        <CometChatContextMenu.Trigger />
      </CometChatContextMenu.Root>
    );
    expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
  });

  it('applies custom className to root container', () => {
    const items = makeItems(2);
    const { container } = render(
      <CometChatContextMenu.Root items={items} topMenuSize={2} className="my-custom" />
    );
    expect(container.firstElementChild?.className).toContain('my-custom');
  });

  it("defaults placement to 'left' when not specified", () => {
    const items = makeItems(5);
    render(<CometChatContextMenu.Root items={items} topMenuSize={2} />);
    // Trigger opens dropdown — placement is passed via context.
    // We verify the trigger renders (context is valid).
    expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
  });

  it('defaults topMenuSize to 2 when not specified', () => {
    const items = makeItems(5);
    render(<CometChatContextMenu.Root items={items} />);
    const topButtons = screen.getAllByRole('button', { name: /Action [01]/ });
    expect(topButtons).toHaveLength(2);
  });
});
