import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { CometChatActionSheet } from '../CometChatActionSheet';
import type { CometChatActionSheetItemData } from '../CometChatActionSheet.types';

/** Arbitrary for generating valid CometChatActionSheetItemData arrays. */
const actionItemArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  onClick: fc.constant(vi.fn()),
  disabled: fc.boolean(),
});

describe('CometChatActionSheet property-based tests', () => {
  it('for any array of CometChatActionSheetItemData (0–50 items), all items render without errors', () => {
    fc.assert(
      fc.property(
        fc.array(actionItemArb, { minLength: 0, maxLength: 50 }),
        (items: CometChatActionSheetItemData[]) => {
          const { unmount } = render(
            <CometChatActionSheet.Root isOpen={true} onClose={vi.fn()}>
              <CometChatActionSheet.Layout>
                {items.map(item => (
                  <CometChatActionSheet.Item key={item.id} item={item} />
                ))}
              </CometChatActionSheet.Layout>
            </CometChatActionSheet.Root>
          );
          const buttons = screen.queryAllByRole('button');
          expect(buttons.length).toBe(items.length);
          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('for any layoutMode value in ["list", "grid"], layout renders correctly', () => {
    fc.assert(
      fc.property(fc.constantFrom('list' as const, 'grid' as const), mode => {
        const { unmount } = render(
          <CometChatActionSheet.Root isOpen={true} onClose={vi.fn()} layoutMode={mode}>
            <CometChatActionSheet.Layout mode={mode}>
              <CometChatActionSheet.Item item={{ id: '1', title: 'Test', onClick: vi.fn() }} />
            </CometChatActionSheet.Layout>
          </CometChatActionSheet.Root>
        );
        expect(screen.getByRole('button', { name: 'Test' })).toBeInTheDocument();
        unmount();
      })
    );
  });

  it('for any combination of disabled flags, only enabled items respond to clicks', () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }), disabledFlags => {
        const handlers = disabledFlags.map(() => vi.fn());
        const items: CometChatActionSheetItemData[] = disabledFlags.map((disabled, i) => ({
          id: String(i),
          title: `Item ${String(i)}`,
          onClick: handlers[i]!,
          disabled,
        }));

        const { unmount } = render(
          <CometChatActionSheet.Root isOpen={true} onClose={vi.fn()}>
            <CometChatActionSheet.Layout>
              {items.map(item => (
                <CometChatActionSheet.Item key={item.id} item={item} />
              ))}
            </CometChatActionSheet.Layout>
          </CometChatActionSheet.Root>
        );

        const buttons = screen.getAllByRole('button');
        buttons.forEach((btn, i) => {
          fireEvent.click(btn);
          if (disabledFlags[i]) {
            expect(handlers[i]).not.toHaveBeenCalled();
          } else {
            expect(handlers[i]).toHaveBeenCalledOnce();
          }
        });

        unmount();
      }),
      { numRuns: 20 }
    );
  });

  it('rapid open/close toggling does not cause state inconsistencies', () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: 5, maxLength: 30 }), toggles => {
        const onClose = vi.fn();
        const { rerender, unmount, container } = render(
          <CometChatActionSheet.Root isOpen={false} onClose={onClose}>
            <CometChatActionSheet.Layout>
              <CometChatActionSheet.Item item={{ id: '1', title: 'Action', onClick: vi.fn() }} />
            </CometChatActionSheet.Layout>
          </CometChatActionSheet.Root>
        );

        for (const isOpen of toggles) {
          rerender(
            <CometChatActionSheet.Root isOpen={isOpen} onClose={onClose}>
              <CometChatActionSheet.Layout>
                <CometChatActionSheet.Item item={{ id: '1', title: 'Action', onClick: vi.fn() }} />
              </CometChatActionSheet.Layout>
            </CometChatActionSheet.Root>
          );
        }

        const lastState = toggles[toggles.length - 1];
        const dialog = container.querySelector('[role="dialog"]');
        if (lastState) {
          expect(dialog).not.toBeNull();
        } else {
          expect(dialog).toBeNull();
        }

        unmount();
      }),
      { numRuns: 20 }
    );
  });
});
