import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { CometChatRadioButton } from '../CometChatRadioButton';

describe('CometChatRadioButton property-based tests', () => {
  it('for any boolean checked value, the radio reflects the correct state', () => {
    fc.assert(
      fc.property(fc.boolean(), checked => {
        const { unmount } = render(
          <CometChatRadioButton label="Option" name="pb-g" value="a" checked={checked} />
        );
        const input = screen.getByRole('radio');
        if (checked) {
          expect(input).toBeChecked();
        } else {
          expect(input).not.toBeChecked();
        }
        unmount();
      })
    );
  });

  it('for any string label (1–100 chars), the label text renders correctly', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), label => {
        const { unmount, container } = render(
          <CometChatRadioButton label={label} name="pb-g" value="a" />
        );
        const textEl = container.querySelector('[class*="cometchat-radio-button__text"]');
        expect(textEl).not.toBeNull();
        expect(textEl!.textContent).toBe(label);
        unmount();
      }),
      { numRuns: 20 }
    );
  });

  it('for any boolean disabled, click handler fires if and only if disabled is false', () => {
    fc.assert(
      fc.property(fc.boolean(), disabled => {
        const onChange = vi.fn();
        const { unmount, container } = render(
          <CometChatRadioButton
            label="Option"
            name="pb-g"
            value="a"
            disabled={disabled}
            defaultChecked={false}
            onChange={onChange}
          />
        );
        const input = container.querySelector('input[type="radio"]')!;
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

  it('for any combination of checked + disabled, the component renders without errors', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (checked, disabled) => {
        const { unmount } = render(
          <CometChatRadioButton
            label="Option"
            name="pb-g"
            value="a"
            checked={checked}
            disabled={disabled}
          />
        );
        const input = screen.getByRole('radio');
        expect(input).toBeInTheDocument();
        if (checked) {
          expect(input).toBeChecked();
        } else {
          expect(input).not.toBeChecked();
        }
        if (disabled) {
          expect(input).toBeDisabled();
        } else {
          expect(input).not.toBeDisabled();
        }
        unmount();
      }),
      { numRuns: 10 }
    );
  });

  it('for any string name and value, attributes are correctly set on the input', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (name, value) => {
          const { unmount } = render(
            <CometChatRadioButton label="Option" name={name} value={value} />
          );
          const input = screen.getByRole('radio');
          expect(input).toHaveAttribute('name', name);
          expect(input).toHaveAttribute('value', value);
          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('rapid toggling of checked prop does not cause state inconsistencies', () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: 5, maxLength: 30 }), toggles => {
        const { rerender, unmount } = render(
          <CometChatRadioButton label="Option" name="pb-g" value="a" checked={false} />
        );

        for (const val of toggles) {
          rerender(<CometChatRadioButton label="Option" name="pb-g" value="a" checked={val} />);
        }

        const lastState = toggles[toggles.length - 1];
        const input = screen.getByRole('radio');
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
