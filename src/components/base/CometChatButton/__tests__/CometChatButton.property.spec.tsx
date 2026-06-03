import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { CometChatButton } from '../CometChatButton';
import type { CometChatButtonVariant, CometChatButtonSize } from '../CometChatButton.types';

const variantArb = fc.constantFrom<CometChatButtonVariant>('primary', 'secondary', 'ghost');
const sizeArb = fc.constantFrom<CometChatButtonSize>('sm', 'md', 'lg');

describe('CometChatButton property-based tests', () => {
  it('for any combination of variant and size, the button renders without errors', () => {
    fc.assert(
      fc.property(variantArb, sizeArb, (variant, size) => {
        const { unmount } = render(
          <CometChatButton.Root variant={variant} size={size}>
            <CometChatButton.Text>Test</CometChatButton.Text>
          </CometChatButton.Root>
        );
        expect(screen.getByRole('button')).toBeInTheDocument();
        unmount();
      })
    );
  });

  it('for any string children text, the text is rendered in the DOM', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), text => {
        const { unmount, container } = render(
          <CometChatButton.Root>
            <CometChatButton.Text>{text}</CometChatButton.Text>
          </CometChatButton.Root>
        );
        const span = container.querySelector('[class*="cometchat-button__text"]');
        expect(span).not.toBeNull();
        expect(span!.textContent).toBe(text);
        unmount();
      }),
      { numRuns: 20 }
    );
  });

  it('for any disabled boolean, click handler is called if and only if disabled is false', () => {
    fc.assert(
      fc.property(fc.boolean(), disabled => {
        const onClick = vi.fn();
        const { unmount } = render(
          <CometChatButton.Root disabled={disabled} onClick={onClick}>
            <CometChatButton.Text>Test</CometChatButton.Text>
          </CometChatButton.Root>
        );
        fireEvent.click(screen.getByRole('button'));
        if (disabled) {
          expect(onClick).not.toHaveBeenCalled();
        } else {
          expect(onClick).toHaveBeenCalledOnce();
        }
        unmount();
      })
    );
  });

  it('for any isLoading boolean, aria-busy matches the loading state', () => {
    fc.assert(
      fc.property(fc.boolean(), isLoading => {
        const { unmount } = render(
          <CometChatButton.Root isLoading={isLoading}>
            <CometChatButton.Text>Test</CometChatButton.Text>
          </CometChatButton.Root>
        );
        const btn = screen.getByRole('button');
        if (isLoading) {
          expect(btn).toHaveAttribute('aria-busy', 'true');
        } else {
          expect(btn).not.toHaveAttribute('aria-busy');
        }
        unmount();
      })
    );
  });

  it('rapid toggling of isLoading does not cause state inconsistencies', () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: 5, maxLength: 30 }), toggles => {
        const { rerender, unmount } = render(
          <CometChatButton.Root isLoading={false}>
            <CometChatButton.Text>Test</CometChatButton.Text>
          </CometChatButton.Root>
        );

        for (const isLoading of toggles) {
          rerender(
            <CometChatButton.Root isLoading={isLoading}>
              <CometChatButton.Text>Test</CometChatButton.Text>
            </CometChatButton.Root>
          );
        }

        const lastState = toggles[toggles.length - 1];
        const btn = screen.getByRole('button');
        if (lastState) {
          expect(btn).toHaveAttribute('aria-busy', 'true');
        } else {
          expect(btn).not.toHaveAttribute('aria-busy');
        }
        unmount();
      }),
      { numRuns: 20 }
    );
  });
});
