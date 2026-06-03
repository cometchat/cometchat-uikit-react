import React, { forwardRef, useId, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import type { CometChatRadioButtonProps } from './CometChatRadioButton.types';
import './CometChatRadioButton.css';

/**
 * CometChatRadioButton — a controlled/uncontrolled radio button with label,
 * grouping via `name`, and full keyboard accessibility.
 *
 * Radio group behavior (single-selection) is handled natively by the browser
 * when multiple radio inputs share the same `name` attribute.
 *
 * Usage:
 * ```tsx
 * <CometChatRadioButton
 *   name="poll"
 *   value="option-1"
 *   label="Option 1"
 *   checked={selected === 'option-1'}
 *   onChange={({ value }) => setSelected(value)}
 * />
 * ```
 */
export const CometChatRadioButton = forwardRef<HTMLInputElement, CometChatRadioButtonProps>(
  (
    {
      checked,
      defaultChecked = false,
      label,
      disabled = false,
      name,
      value,
      ariaLabel,
      onChange,
      className,
      id: idProp,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const isControlled = checked !== undefined;

    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;

        const newChecked = event.target.checked;
        onChange?.({ checked: newChecked, label, value });
      },
      [onChange, label, value, disabled]
    );

    const rootClass = [
      'cometchat-radio-button',
      disabled ? 'cometchat-radio-button--disabled' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // In controlled mode, use `checked`. In uncontrolled mode, use `defaultChecked`
    // and let the browser handle radio group mutual exclusion natively.
    const inputProps = isControlled ? { checked } : { defaultChecked };

    return (
      <div className={rootClass}>
        <label className={'cometchat-radio-button__label'} htmlFor={id}>
          <input
            ref={ref}
            id={id}
            type="radio"
            className={'cometchat-radio-button__input'}
            name={name}
            value={value}
            {...inputProps}
            disabled={disabled}
            aria-disabled={disabled || undefined}
            aria-label={ariaLabel ?? label ?? undefined}
            onChange={handleChange}
            {...rest}
          />
          <span className={'cometchat-radio-button__custom'} aria-hidden="true" />
          {label && <span className={'cometchat-radio-button__text'}>{label}</span>}
        </label>
      </div>
    );
  }
);

CometChatRadioButton.displayName = 'CometChatRadioButton';
