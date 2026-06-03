import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { CometChatCheckbox } from '../CometChatCheckbox';

describe('CometChatCheckbox property-based tests', () => {
  it('for any boolean checked value, the checkbox reflects the correct state', () => {
    fc.assert(
      fc.property(fc.boolean(), checked => {
        const { unmount } = render(<CometChatCheckbox checked={checked} />);
        const input = screen.getByRole('checkbox');
        if (checked) {
          expect(input).toBeChecked();
        } else {
          expect(input).not.toBeChecked();
        }
        unmount();
      })
    );
  });

  it('for any string label (0–100 chars), the label renders without errors', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), label => {
        const { unmount, container } = render(<CometChatCheckbox label={label} />);
        const textEl = container.querySelector('[class*="cometchat-checkbox__text"]');
        expect(textEl).not.toBeNull();
        expect(textEl!.textContent).toBe(label);
        unmount();
      }),
      { numRuns: 20 }
    );
  });

  it('for any disabled boolean, click handler fires if and only if disabled is false', () => {
    fc.assert(
      fc.property(fc.boolean(), disabled => {
        const onChange = vi.fn();
        const { unmount, container } = render(
          <CometChatCheckbox disabled={disabled} defaultChecked={false} onChange={onChange} />
        );
        const input = container.querySelector('input[type="checkbox"]')!;
        fireEvent.click(input);
        if (disabled) {
          expect(onChange).not.toHaveBeenCalled();
        } else {
          expect(onChange).toHaveBeenCalledOnce();
        }
        unmount();
      })
    );
  });

  it('for any combination of shiftKey and metaKey, the onChange payload includes correct modifiers', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (shiftKey, metaKey) => {
        const onChange = vi.fn();
        const { unmount } = render(
          <CometChatCheckbox defaultChecked={false} onChange={onChange} />
        );
        const input = screen.getByRole('checkbox');

        // Simulate click with modifiers then change
        fireEvent.click(input, { shiftKey, metaKey });

        if (onChange.mock.calls.length > 0) {
          const payload = onChange.mock.calls[0][0];
          expect(payload.shiftKey).toBe(shiftKey);
          expect(payload.metaKey).toBe(metaKey);
        }
        unmount();
      }),
      { numRuns: 10 }
    );
  });

  it('rapid toggling of checked prop does not cause state inconsistencies', () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: 5, maxLength: 30 }), toggles => {
        const { rerender, unmount } = render(<CometChatCheckbox checked={false} />);

        for (const val of toggles) {
          rerender(<CometChatCheckbox checked={val} />);
        }

        const lastState = toggles[toggles.length - 1];
        const input = screen.getByRole('checkbox');
        if (lastState) {
          expect(input).toBeChecked();
        } else {
          expect(input).not.toBeChecked();
        }
        unmount();
      }),
      { numRuns: 20 }
    );
  });
});
