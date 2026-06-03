import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CometChatContextMenu } from '../CometChatContextMenu';
import type { CometChatContextMenuItemData } from '../CometChatContextMenu.types';

const itemArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  disabled: fc.boolean(),
});

const placementArb = fc.constantFrom(
  'top' as const,
  'right' as const,
  'bottom' as const,
  'left' as const
);

describe('CometChatContextMenu property-based tests', () => {
  it('renders without errors for any array of items (0–50)', () => {
    fc.assert(
      fc.property(fc.array(itemArb, { minLength: 0, maxLength: 50 }), rawItems => {
        const items: CometChatContextMenuItemData[] = rawItems.map(r => ({
          ...r,
          onClick: vi.fn(),
        }));
        const { unmount } = render(
          React.createElement(CometChatContextMenu.Root, { items, topMenuSize: 2 })
        );
        unmount();
      }),
      { numRuns: 30 }
    );
  });

  it('correctly splits items between top-row and dropdown for any topMenuSize', () => {
    fc.assert(
      fc.property(
        fc.array(itemArb, { minLength: 1, maxLength: 20 }),
        fc.nat(20),
        (rawItems, topMenuSize) => {
          const items: CometChatContextMenuItemData[] = rawItems.map(r => ({
            ...r,
            onClick: vi.fn(),
          }));
          const { unmount } = render(
            React.createElement(CometChatContextMenu.Root, { items, topMenuSize })
          );

          const effectiveTop = Math.min(topMenuSize, items.length);
          const hasOverflow = items.length > effectiveTop;

          if (hasOverflow) {
            expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
          } else {
            expect(screen.queryByRole('button', { name: 'More options' })).not.toBeInTheDocument();
          }

          unmount();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('renders without errors for any placement value', () => {
    fc.assert(
      fc.property(placementArb, placement => {
        const items: CometChatContextMenuItemData[] = [
          { id: '1', title: 'A', onClick: vi.fn() },
          { id: '2', title: 'B', onClick: vi.fn() },
          { id: '3', title: 'C', onClick: vi.fn() },
        ];
        const { unmount } = render(
          React.createElement(CometChatContextMenu.Root, { items, topMenuSize: 1, placement })
        );
        unmount();
      }),
      { numRuns: 10 }
    );
  });

  it('only enabled items respond to clicks for any combination of disabled flags', () => {
    fc.assert(
      fc.property(fc.array(itemArb, { minLength: 1, maxLength: 10 }), rawItems => {
        const items: CometChatContextMenuItemData[] = rawItems.map(r => ({
          ...r,
          onClick: vi.fn(),
        }));
        const { unmount } = render(
          React.createElement(CometChatContextMenu.Root, {
            items,
            topMenuSize: 0,
          })
        );

        // Open dropdown.
        const triggers = screen.queryAllByRole('button', { name: 'More options' });
        const trigger = triggers[0];
        if (trigger) {
          fireEvent.click(trigger);
          const menuItems = screen.getAllByRole('menuitem', { hidden: true });
          menuItems.forEach((el, i) => {
            fireEvent.click(el);
            if (items[i]?.disabled) {
              expect(items[i]!.onClick).not.toHaveBeenCalled();
            }
          });
        }

        unmount();
      }),
      { numRuns: 20 }
    );
  });
});
