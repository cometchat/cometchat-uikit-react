import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatContextMenu } from '../CometChatContextMenu';
import type { CometChatContextMenuItemData } from '../CometChatContextMenu.types';

function renderItem(
  item: CometChatContextMenuItemData,
  variant: 'icon' | 'full' = 'full',
  className?: string
) {
  return render(
    <CometChatContextMenu.Root items={[]} topMenuSize={0}>
      <CometChatContextMenu.Item item={item} variant={variant} className={className} />
    </CometChatContextMenu.Root>
  );
}

describe('CometChatContextMenuItem', () => {
  it("renders icon-only when variant is 'icon'", () => {
    const item: CometChatContextMenuItemData = {
      id: '1',
      title: 'Edit',
      icon: <span data-testid="icon">✏️</span>,
      onClick: vi.fn(),
    };
    renderItem(item, 'icon');
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    // Title text should not be visible (icon-only).
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it("renders icon + title when variant is 'full'", () => {
    const item: CometChatContextMenuItemData = {
      id: '1',
      title: 'Edit',
      icon: (
        <span data-testid="icon" aria-hidden="true">
          ✏️
        </span>
      ),
      onClick: vi.fn(),
    };
    renderItem(item, 'full');
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('calls item.onClick when clicked', () => {
    const onClick = vi.fn();
    const item: CometChatContextMenuItemData = { id: '1', title: 'Edit', onClick };
    renderItem(item, 'full');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled is true', () => {
    const onClick = vi.fn();
    const item: CometChatContextMenuItemData = { id: '1', title: 'Edit', onClick, disabled: true };
    renderItem(item, 'full');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies aria-disabled="true" when disabled', () => {
    const item: CometChatContextMenuItemData = {
      id: '1',
      title: 'Edit',
      onClick: vi.fn(),
      disabled: true,
    };
    renderItem(item, 'full');
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders as a button with role="menuitem" in full variant', () => {
    const item: CometChatContextMenuItemData = { id: '1', title: 'Edit', onClick: vi.fn() };
    renderItem(item, 'full');
    const btn = screen.getByRole('menuitem', { name: 'Edit' });
    expect(btn.tagName).toBe('BUTTON');
  });

  it('renders aria-label with item title for icon-only variant', () => {
    const item: CometChatContextMenuItemData = { id: '1', title: 'Edit', onClick: vi.fn() };
    renderItem(item, 'icon');
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveAttribute('aria-label', 'Edit');
  });

  it('applies custom className', () => {
    const item: CometChatContextMenuItemData = { id: '1', title: 'Edit', onClick: vi.fn() };
    renderItem(item, 'full', 'my-class');
    expect(screen.getByRole('menuitem', { name: 'Edit' }).className).toContain('my-class');
  });
});
