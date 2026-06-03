import React, { forwardRef, useId, useRef, useState, useCallback } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import type { CometChatCheckboxProps } from './CometChatCheckbox.types';
import './CometChatCheckbox.css';

/**
 * CometChatCheckbox — a controlled/uncontrolled checkbox with support
 * for shift/meta key detection (used for range-select in list components).
 *
 * Usage:
 * ```tsx
 * <CometChatCheckbox
 *   checked={isSelected}
 *   label="Select"
 *   onChange={({ checked, shiftKey }) => handleSelect(checked, shiftKey)}
 * />
 * ```
 */
export const CometChatCheckbox = forwardRef<HTMLInputElement, CometChatCheckboxProps>(
  (
    { checked, defaultChecked = false, label, disabled = false, onChange, className, ...rest },
    ref
  ) => {
    const id = useId();
    const isControlled = checked !== undefined;

    // Internal state for uncontrolled mode only
    const [internalChecked, setInternalChecked] = useState(defaultChecked);
    const currentChecked = isControlled ? checked : internalChecked;

    // Capture shift/meta keys from the click event (fires before onChange)
    const lastClickRef = useRef<{ shiftKey: boolean; metaKey: boolean } | null>(null);

    const handleClick = useCallback((event: MouseEvent<HTMLInputElement>) => {
      lastClickRef.current = {
        shiftKey: event.shiftKey,
        metaKey: event.metaKey,
      };
    }, []);

    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;

        const newChecked = event.target.checked;
        const modifiers = lastClickRef.current;
        lastClickRef.current = null;

        if (!isControlled) {
          setInternalChecked(newChecked);
        }

        onChange?.({
          checked: newChecked,
          label,
          shiftKey: modifiers?.shiftKey,
          metaKey: modifiers?.metaKey,
        });
      },
      [isControlled, onChange, label, disabled]
    );

    const rootClass = [
      'cometchat-checkbox',
      disabled ? 'cometchat-checkbox--disabled' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={rootClass}>
        <label className={'cometchat-checkbox__label'} htmlFor={id}>
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className={'cometchat-checkbox__input'}
            checked={currentChecked}
            disabled={disabled}
            aria-disabled={disabled || undefined}
            aria-label={label ? undefined : 'checkbox'}
            onClick={handleClick}
            onChange={handleChange}
            {...rest}
          />
          <span className={'cometchat-checkbox__checkmark'} aria-hidden="true" />
          {label && <span className={'cometchat-checkbox__text'}>{label}</span>}
        </label>
      </div>
    );
  }
);

CometChatCheckbox.displayName = 'CometChatCheckbox';
